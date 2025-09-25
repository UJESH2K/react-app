import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item } from '../data/items';

export interface WishlistItem {
  id: string;
  title: string;
  brand: string;
  price: number;
  image: string;
  addedAt: number;
}

interface WishlistState {
  items: WishlistItem[];
  addToWishlist: (item: Item) => void;
  removeFromWishlist: (itemId: string) => void;
  isInWishlist: (itemId: string) => boolean;
  clearWishlist: () => void;
  loadWishlist: () => Promise<void>;
  saveWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],

  addToWishlist: (item: Item) => {
    const wishlistItem: WishlistItem = {
      id: item.id,
      title: item.title,
      brand: item.brand,
      price: item.price,
      image: item.image,
      addedAt: Date.now(),
    };

    set((state) => {
      if (state.items.find((i) => i.id === item.id)) {
        console.log('Item already in wishlist:', item.title);
        return state;
      }
      
      const newItems = [...state.items, wishlistItem];
      console.log('Added to wishlist:', item.title);
      
      // Save to AsyncStorage
      AsyncStorage.setItem('wishlist:items', JSON.stringify(newItems)).catch(error =>
        console.error('Failed to save wishlist:', error)
      );
      
      return { items: newItems };
    });
  },

  removeFromWishlist: (itemId: string) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== itemId);
      console.log('Removed from wishlist:', itemId);
      
      // Save to AsyncStorage
      AsyncStorage.setItem('wishlist:items', JSON.stringify(newItems)).catch(error =>
        console.error('Failed to save wishlist:', error)
      );
      
      return { items: newItems };
    });
  },

  isInWishlist: (itemId: string) => {
    return get().items.some((item) => item.id === itemId);
  },

  clearWishlist: () => {
    set({ items: [] });
    AsyncStorage.removeItem('wishlist:items').catch(error =>
      console.error('Failed to clear wishlist:', error)
    );
  },

  loadWishlist: async () => {
    try {
      const stored = await AsyncStorage.getItem('wishlist:items');
      if (stored) {
        const items = JSON.parse(stored) as WishlistItem[];
        set({ items });
        console.log('Loaded wishlist:', items.length, 'items');
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  },

  saveWishlist: async () => {
    try {
      const items = get().items;
      await AsyncStorage.setItem('wishlist:items', JSON.stringify(items));
      console.log('Wishlist saved successfully');
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  },
}));