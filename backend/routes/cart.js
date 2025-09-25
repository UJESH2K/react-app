const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const { validateCartItem } = require('../middleware/validation');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'title image price brand sizes colors stock variants');

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, validateCartItem, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check stock availability
    const isInStock = product.isInStock(size, color);
    if (!isInStock) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check stock limit
      const availableStock = product.getVariantStock(size, color);
      if (newQuantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        size,
        color,
        price: product.price
      });
    }

    // Calculate totals
    cart.calculateTotals();
    await cart.save();

    // Populate product details
    await cart.populate('items.product', 'title image price brand sizes colors stock variants');

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
});

// Update cart item quantity
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { productId, size, color, quantity } = req.body;

    if (!productId || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and valid quantity are required'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check stock if increasing quantity
    if (quantity > 0) {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or unavailable'
        });
      }

      const availableStock = product.getVariantStock(size, color);
      if (quantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`
        });
      }
    }

    // Update item quantity
    cart.updateItemQuantity(productId, size, color, quantity);
    await cart.save();

    // Populate product details
    await cart.populate('items.product', 'title image price brand sizes colors stock variants');

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: cart
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
});

// Remove item from cart
router.delete('/remove', authenticateToken, async (req, res) => {
  try {
    const { productId, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item
    cart.removeItem(productId, size, color);
    await cart.save();

    // Populate product details
    await cart.populate('items.product', 'title image price brand sizes colors stock variants');

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
});

// Clear cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.clearCart();
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
});

// Get cart count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    const count = cart ? cart.itemCount : 0;

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart count'
    });
  }
});

// Validate cart before checkout
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const validationErrors = [];
    let total = 0;

    for (const item of cart.items) {
      const product = item.product;
      
      // Check if product is still active
      if (!product || !product.isActive) {
        validationErrors.push({
          itemId: item._id,
          message: `${product?.title || 'Product'} is no longer available`
        });
        continue;
      }

      // Check stock availability
      const isInStock = product.isInStock(item.size, item.color);
      if (!isInStock) {
        validationErrors.push({
          itemId: item._id,
          message: `${product.title} is out of stock`
        });
        continue;
      }

      // Check quantity vs stock
      const availableStock = product.getVariantStock(item.size, item.color);
      if (item.quantity > availableStock) {
        validationErrors.push({
          itemId: item._id,
          message: `Only ${availableStock} ${product.title} available in stock`
        });
        continue;
      }

      // Calculate total
      total += item.price * item.quantity;
    }

    // Update cart total
    cart.total = total;
    cart.calculateTotals();
    await cart.save();

    res.json({
      success: true,
      data: {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
        total: cart.total,
        itemCount: cart.itemCount
      }
    });

  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart'
    });
  }
});

module.exports = router;
