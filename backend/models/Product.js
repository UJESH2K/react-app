const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  images: [String], // Additional product images
  tags: [String],
  category: {
    type: String,
    required: true,
    enum: ['casual', 'formal', 'streetwear', 'seasonal', 'special']
  },
  priceTier: {
    type: String,
    required: true,
    enum: ['low', 'mid', 'high']
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  sizes: [String],
  colors: [String],
  variants: [{
    size: String,
    color: String,
    sku: String,
    stock: { type: Number, default: 0 },
    price: Number
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  specifications: {
    material: String,
    care: String,
    origin: String,
    weight: String,
    dimensions: String
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ category: 1 });
productSchema.index({ priceTier: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for product ID
productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

productSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Method to check if product is in stock
productSchema.methods.isInStock = function(size, color) {
  if (this.variants.length > 0) {
    const variant = this.variants.find(v => 
      v.size === size && v.color === color
    );
    return variant ? variant.stock > 0 : false;
  }
  return this.stock > 0;
};

// Method to get variant stock
productSchema.methods.getVariantStock = function(size, color) {
  if (this.variants.length > 0) {
    const variant = this.variants.find(v => 
      v.size === size && v.color === color
    );
    return variant ? variant.stock : 0;
  }
  return this.stock;
};

// Method to update stock
productSchema.methods.updateStock = function(size, color, quantity) {
  if (this.variants.length > 0) {
    const variant = this.variants.find(v => 
      v.size === size && v.color === color
    );
    if (variant) {
      variant.stock = Math.max(0, variant.stock - quantity);
    }
  } else {
    this.stock = Math.max(0, this.stock - quantity);
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
