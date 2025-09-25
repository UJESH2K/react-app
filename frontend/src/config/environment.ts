// Environment configuration for the frontend
const config = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
  
  // App Configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Casa E-commerce',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Development vs Production
  IS_DEVELOPMENT: __DEV__,
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/auth',
    PRODUCTS: '/products',
    CART: '/cart',
    WISHLIST: '/wishlist',
    ORDERS: '/orders',
  },
  
  // Default settings
  DEFAULT_PAGE_SIZE: 20,
  MAX_CART_ITEMS: 10,
  OTP_EXPIRY_MINUTES: 10,
};

export default config;
