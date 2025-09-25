const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  size: String,
  color: String,
  price: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
cartSchema.index({ user: 1 });

// Virtual for cart ID
cartSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

cartSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Method to calculate totals
cartSchema.methods.calculateTotals = function() {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.lastUpdated = new Date();
  return this;
};

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, size, color, price) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() && 
    item.size === size && 
    item.color === color
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      size,
      color,
      price
    });
  }

  return this.calculateTotals();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, size, color) {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId.toString() && 
      item.size === size && 
      item.color === color)
  );
  return this.calculateTotals();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, size, color, quantity) {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString() && 
    item.size === size && 
    item.color === color
  );

  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId, size, color);
    } else {
      item.quantity = quantity;
      return this.calculateTotals();
    }
  }
  return this;
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.calculateTotals();
};

module.exports = mongoose.model('Cart', cartSchema);
