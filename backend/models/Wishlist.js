const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  size: String,
  color: String
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema],
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
wishlistSchema.index({ user: 1 });

// Virtual for wishlist ID
wishlistSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

wishlistSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Method to calculate item count
wishlistSchema.methods.calculateItemCount = function() {
  this.itemCount = this.items.length;
  this.lastUpdated = new Date();
  return this;
};

// Method to add item to wishlist
wishlistSchema.methods.addItem = function(productId, size, color) {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString() && 
    item.size === size && 
    item.color === color
  );

  if (!existingItem) {
    this.items.push({
      product: productId,
      size,
      color
    });
    return this.calculateItemCount();
  }
  return this;
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId, size, color) {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId.toString() && 
      item.size === size && 
      item.color === color)
  );
  return this.calculateItemCount();
};

// Method to check if item is in wishlist
wishlistSchema.methods.hasItem = function(productId, size, color) {
  return this.items.some(item => 
    item.product.toString() === productId.toString() && 
    item.size === size && 
    item.color === color
  );
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  return this.calculateItemCount();
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
