const express = require('express');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product', 'title image price brand sizes colors stock variants isActive');

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
      await wishlist.save();
    }

    // Filter out inactive products
    wishlist.items = wishlist.items.filter(item => 
      item.product && item.product.isActive
    );

    res.json({
      success: true,
      data: wishlist
    });

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    });
  }
});

// Add item to wishlist
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }

    // Check if item already exists in wishlist
    const existingItem = wishlist.items.find(item => 
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item already in wishlist'
      });
    }

    // Add item to wishlist
    wishlist.addItem(productId, size, color);
    await wishlist.save();

    // Populate product details
    await wishlist.populate('items.product', 'title image price brand sizes colors stock variants isActive');

    res.json({
      success: true,
      message: 'Item added to wishlist successfully',
      data: wishlist
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to wishlist'
    });
  }
});

// Remove item from wishlist
router.delete('/remove', authenticateToken, async (req, res) => {
  try {
    const { productId, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Remove item
    wishlist.removeItem(productId, size, color);
    await wishlist.save();

    // Populate product details
    await wishlist.populate('items.product', 'title image price brand sizes colors stock variants isActive');

    res.json({
      success: true,
      message: 'Item removed from wishlist successfully',
      data: wishlist
    });

  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from wishlist'
    });
  }
});

// Clear wishlist
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.clearWishlist();
    await wishlist.save();

    res.json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: wishlist
    });

  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist'
    });
  }
});

// Check if item is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color } = req.query;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.json({
        success: true,
        data: { isInWishlist: false }
      });
    }

    const isInWishlist = wishlist.hasItem(productId, size, color);

    res.json({
      success: true,
      data: { isInWishlist }
    });

  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist'
    });
  }
});

// Get wishlist count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const count = wishlist ? wishlist.itemCount : 0;

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get wishlist count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wishlist count'
    });
  }
});

// Move item from wishlist to cart
router.post('/move-to-cart', authenticateToken, async (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

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

    // Get wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Check if item exists in wishlist
    const wishlistItem = wishlist.items.find(item => 
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
    );

    if (!wishlistItem) {
      return res.status(400).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    // Import Cart model
    const Cart = require('../models/Cart');

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingCartItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
    );

    if (existingCartItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingCartItemIndex].quantity + quantity;
      
      // Check stock limit
      const availableStock = product.getVariantStock(size, color);
      if (newQuantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`
        });
      }

      cart.items[existingCartItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity,
        size,
        color,
        price: product.price
      });
    }

    // Remove from wishlist
    wishlist.removeItem(productId, size, color);

    // Save both
    await Promise.all([
      cart.save(),
      wishlist.save()
    ]);

    // Populate cart details
    await cart.populate('items.product', 'title image price brand sizes colors stock variants');

    res.json({
      success: true,
      message: 'Item moved to cart successfully',
      data: {
        cart,
        wishlist
      }
    });

  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move item to cart'
    });
  }
});

module.exports = router;
