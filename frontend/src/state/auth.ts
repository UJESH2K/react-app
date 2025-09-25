import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Backend API base URL
const API_BASE_URL = 'http://localhost:5000/api';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  picture?: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    brands: string[];
  };
  createdAt: string;
  token?: string; // JWT from backend
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  sendOTP: (emailOrPhone: string) => Promise<boolean>;
  login: (email: string, otp: string) => Promise<boolean>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  sendOTP: async (emailOrPhone: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });
      const data = await res.json();
      return data.success;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, otp: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!data.success) return false;
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error("Error logging in:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithPhone: async (phone: string, otp: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.success) return false;
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error("Error logging in with phone:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: "948047525047-2j18q6nme6furh2t06sl5hv69i70ppt0.apps.googleusercontent.com",
      });

      if (!request) return false;

      const result = await promptAsync();
      if (result?.type !== "success" || !result.params.id_token) return false;

      // Send token to backend
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: result.params.id_token }),
      });

      const data = await res.json();
      if (!data.success) return false;
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error("Error logging in with Google:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem("user");
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  },

  updateUser: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
