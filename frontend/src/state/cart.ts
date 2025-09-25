import { create } from 'zustand'
import { api } from '../lib/api'

export type CartItem = {
  _id: string
  product: {
    _id: string
    title: string
    price: number
    image: string
    brand: string
    sizes: string[]
    colors: string[]
    stock: number
    variants?: Array<{
      size: string
      color: string
      stock: number
    }>
  }
  quantity: number
  size?: string
  color?: string
  price: number
}

type CartState = {
  items: CartItem[]
  total: number
  itemCount: number
  isLoading: boolean
  
  // Actions
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantity: number, size?: string, color?: string) => Promise<boolean>
  removeFromCart: (productId: string, size?: string, color?: string) => Promise<boolean>
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<boolean>
  clearCart: () => Promise<boolean>
  validateCart: () => Promise<boolean>
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await api.getCart();
      if (response.success && response.data) {
        set({
          items: response.data.items || [],
          total: response.data.total || 0,
          itemCount: response.data.itemCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  addToCart: async (productId, quantity, size, color) => {
    set({ isLoading: true });
    try {
      const response = await api.addToCart(productId, quantity, size, color);
      if (response.success && response.data) {
        set({
          items: response.data.items || [],
          total: response.data.total || 0,
          itemCount: response.data.itemCount || 0
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  removeFromCart: async (productId, size, color) => {
    set({ isLoading: true });
    try {
      const response = await api.removeFromCart(productId, size, color);
      if (response.success && response.data) {
        set({
          items: response.data.items || [],
          total: response.data.total || 0,
          itemCount: response.data.itemCount || 0
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateQuantity: async (productId, size, color, quantity) => {
    set({ isLoading: true });
    try {
      const response = await api.updateCartItem(productId, size, color, quantity);
      if (response.success && response.data) {
        set({
          items: response.data.items || [],
          total: response.data.total || 0,
          itemCount: response.data.itemCount || 0
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating cart:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearCart: async () => {
    set({ isLoading: true });
    try {
      const response = await api.clearCart();
      if (response.success) {
        set({
          items: [],
          total: 0,
          itemCount: 0
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  validateCart: async () => {
    try {
      const response = await api.validateCart();
      return response.success && response.data?.isValid;
    } catch (error) {
      console.error('Error validating cart:', error);
      return false;
    }
  },
  
  getTotalPrice: () => {
    const { total } = get();
    return total;
  },
  
  getTotalItems: () => {
    const { itemCount } = get();
    return itemCount;
  }
}))