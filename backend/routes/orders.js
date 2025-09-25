const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateOrder, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Create order and payment intent
router.post('/create', authenticateToken, validateOrder, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    // Validate cart items
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate items and calculate totals
    const orderItems = [];
    let subtotal = 0;
    const validationErrors = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product || !product.isActive) {
        validationErrors.push({
          productId: item.productId,
          message: 'Product not found or unavailable'
        });
        continue;
      }

      // Check stock
      const isInStock = product.isInStock(item.size, item.color);
      if (!isInStock) {
        validationErrors.push({
          productId: item.productId,
          message: 'Product is out of stock'
        });
        continue;
      }

      const availableStock = product.getVariantStock(item.size, item.color);
      if (item.quantity > availableStock) {
        validationErrors.push({
          productId: item.productId,
          message: `Only ${availableStock} items available in stock`
        });
        continue;
      }

      orderItems.push({
        product: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: product.price,
        title: product.title,
        image: product.image
      });

      subtotal += product.price * item.quantity;
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Order validation failed',
        errors: validationErrors
      });
    }

    // Calculate totals
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: {
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        brand: paymentMethod.brand
      },
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending'
    });

    await order.save();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        clientSecret: paymentIntent.client_secret
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Confirm payment and update order
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Find order
    const order = await Order.findOne({ 
      paymentIntentId,
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    order.status = 'confirmed';
    order.paymentStatus = 'paid';
    await order.save();

    // Update product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        await product.updateStock(item.size, item.color, item.quantity);
      }
    }

    // Clear user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.clearCart();
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: order
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment'
    });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.product', 'title image brand'),
      Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title image brand description')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Cancel payment intent if exists
    if (order.paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(order.paymentIntentId);
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
      }
    }

    // Update order status
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// Admin routes
// Get all orders (admin)
router.get('/admin/all', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.product', 'title image brand')
        .populate('user', 'name email phone'),
      Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all orders (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Update order status (admin)
router.put('/:id/status', authenticateToken, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.updateStatus(status);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Process refund (admin)
router.post('/:id/refund', authenticateToken, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is not paid'
      });
    }

    // Process refund with Stripe
    if (order.paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          amount: Math.round(amount * 100), // Convert to cents
          reason: 'requested_by_customer'
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(400).json({
          success: false,
          message: 'Failed to process refund'
        });
      }
    }

    // Update order
    await order.processRefund(amount, reason);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: order
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      
      // Update order status
      try {
        const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
        if (order) {
          order.status = 'confirmed';
          order.paymentStatus = 'paid';
          await order.save();
        }
      } catch (error) {
        console.error('Error updating order after payment:', error);
      }
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed!', failedPayment.id);
      
      // Update order status
      try {
        const order = await Order.findOne({ paymentIntentId: failedPayment.id });
        if (order) {
          order.status = 'cancelled';
          order.paymentStatus = 'failed';
          await order.save();
        }
      } catch (error) {
        console.error('Error updating order after failed payment:', error);
      }
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
