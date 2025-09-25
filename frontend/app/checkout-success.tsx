import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/state/auth';
import { useCartStore } from '../src/state/cart';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { clearCart } = useCartStore();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart on successful checkout
    clearCart();
    
    // In a real app, you would fetch order details from the backend
    // For now, we'll simulate it
    setTimeout(() => {
      setOrderDetails({
        orderNumber: `CASA-${Date.now()}`,
        total: 199.99,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleViewOrders = () => {
    router.push('/profile');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600">Processing your order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6">
        {/* Success Header */}
        <View className="items-center py-8">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">✅</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </Text>
          <Text className="text-gray-600 text-center">
            Thank you for your purchase. We've received your order and will process it shortly.
          </Text>
        </View>

        {/* Order Details */}
        {orderDetails && (
          <View className="bg-gray-50 rounded-xl p-6 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Order Details
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Order Number</Text>
                <Text className="font-medium text-gray-900">
                  {orderDetails.orderNumber}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Amount</Text>
                <Text className="font-medium text-gray-900">
                  ${orderDetails.total.toFixed(2)}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Estimated Delivery</Text>
                <Text className="font-medium text-gray-900">
                  {orderDetails.estimatedDelivery.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* What's Next */}
        <View className="bg-blue-50 rounded-xl p-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            What's Next?
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-start">
              <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Order Processing</Text>
                <Text className="text-gray-600 text-sm">
                  We'll prepare your items for shipment
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Shipping</Text>
                <Text className="text-gray-600 text-sm">
                  Your order will be shipped within 1-2 business days
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">Delivery</Text>
                <Text className="text-gray-600 text-sm">
                  Track your package and receive delivery updates
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Support */}
        <View className="bg-gray-50 rounded-xl p-6 mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Need Help?
          </Text>
          <Text className="text-gray-600 mb-4">
            If you have any questions about your order, our customer service team is here to help.
          </Text>
          <TouchableOpacity 
            className="bg-gray-900 py-3 px-6 rounded-lg"
            onPress={() => Alert.alert('Contact Support', 'Customer service: support@casa.com')}
          >
            <Text className="text-white font-medium text-center">
              Contact Support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 pb-6 pt-4 bg-white border-t border-gray-200">
        <View className="flex-row space-x-3">
          <TouchableOpacity 
            className="flex-1 bg-gray-100 py-4 rounded-lg"
            onPress={handleContinueShopping}
          >
            <Text className="text-gray-900 font-medium text-center">
              Continue Shopping
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-gray-900 py-4 rounded-lg"
            onPress={handleViewOrders}
          >
            <Text className="text-white font-medium text-center">
              View Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
