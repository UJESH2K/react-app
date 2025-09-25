// API service for Casa E-commerce App
const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Auth endpoints
  async sendOTP(emailOrPhone: string) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone }),
    });
  }

  async loginWithEmail(email: string, otp: string) {
    return this.request('/auth/login-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async loginWithPhone(phone: string, otp: string) {
    return this.request('/auth/login-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async loginWithGoogle(idToken: string) {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(updates: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Product endpoints
  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    priceTier?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isFeatured?: boolean;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request(`/products?${queryParams.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async getFeaturedProducts() {
    return this.request('/products/featured');
  }

  async getProductsByCategory(category: string, params: any = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request(`/products/category/${category}?${queryParams.toString()}`);
  }

  async searchProducts(query: string, params: any = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request(`/products/search/${encodeURIComponent(query)}?${queryParams.toString()}`);
  }

  async addProductReview(productId: string, rating: number, comment?: string) {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  // Cart endpoints
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId: string, quantity: number, size?: string, color?: string) {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, size, color }),
    });
  }

  async updateCartItem(productId: string, size: string, color: string, quantity: number) {
    return this.request('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, size, color, quantity }),
    });
  }

  async removeFromCart(productId: string, size?: string, color?: string) {
    return this.request('/cart/remove', {
      method: 'DELETE',
      body: JSON.stringify({ productId, size, color }),
    });
  }

  async clearCart() {
    return this.request('/cart/clear', {
      method: 'DELETE',
    });
  }

  async getCartCount() {
    return this.request('/cart/count');
  }

  async validateCart() {
    return this.request('/cart/validate', {
      method: 'POST',
    });
  }

  // Wishlist endpoints
  async getWishlist() {
    return this.request('/wishlist');
  }

  async addToWishlist(productId: string, size?: string, color?: string) {
    return this.request('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ productId, size, color }),
    });
  }

  async removeFromWishlist(productId: string, size?: string, color?: string) {
    return this.request('/wishlist/remove', {
      method: 'DELETE',
      body: JSON.stringify({ productId, size, color }),
    });
  }

  async clearWishlist() {
    return this.request('/wishlist/clear', {
      method: 'DELETE',
    });
  }

  async checkWishlistItem(productId: string, size?: string, color?: string) {
    const params = new URLSearchParams();
    if (size) params.append('size', size);
    if (color) params.append('color', color);
    
    return this.request(`/wishlist/check/${productId}?${params.toString()}`);
  }

  async getWishlistCount() {
    return this.request('/wishlist/count');
  }

  async moveToCart(productId: string, size?: string, color?: string, quantity: number = 1) {
    return this.request('/wishlist/move-to-cart', {
      method: 'POST',
      body: JSON.stringify({ productId, size, color, quantity }),
    });
  }

  // Order endpoints
  async createOrder(orderData: {
    items: Array<{
      productId: string;
      quantity: number;
      size?: string;
      color?: string;
    }>;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string;
    };
    paymentMethod: {
      type: string;
      last4?: string;
      brand?: string;
    };
  }) {
    return this.request('/orders/create', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return this.request('/orders/confirm-payment', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }

  async getMyOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request(`/orders/my-orders?${queryParams.toString()}`);
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async cancelOrder(id: string) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }
}

// Create and export API instance
export const api = new ApiService(API_BASE_URL);

// Helper function to set auth token
export const setAuthToken = (token: string | null) => {
  api.setToken(token);
};

export default api;
