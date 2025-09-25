import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCartStore } from '../src/state/cart';
import { useAuthStore } from '../src/state/auth';

type CheckoutFlow = 'affiliate' | 'aggregator' | 'marketplace';

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CheckoutScreen() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [checkoutFlow, setCheckoutFlow] = useState<CheckoutFlow>('marketplace');
  const [isExpressCheckout, setIsExpressCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: user?.name || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'apple_pay'>('card');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 75 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCompleteCheckout = () => {
    if (!shippingAddress.name || !shippingAddress.street) {
      Alert.alert('Error', 'Please fill in all required shipping information');
      return;
    }

    Alert.alert(
      'Order Confirmation',
      `Order placed successfully!\n\nFlow: ${checkoutFlow.toUpperCase()}\nTotal: ${formatPrice(total)}\n\nItems will be processed according to the ${checkoutFlow} model.`,
      [
        { 
          text: 'OK', 
          onPress: () => {
            clearCart();
            router.replace('/deck');
          }
        }
      ]
    );
  };

  const renderCheckoutFlowSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Checkout Method</Text>
      
      <Pressable 
        style={[styles.flowOption, checkoutFlow === 'marketplace' && styles.flowOptionActive]}
        onPress={() => setCheckoutFlow('marketplace')}
      >
        <View style={styles.flowOptionContent}>
          <Text style={[styles.flowOptionTitle, checkoutFlow === 'marketplace' && styles.flowOptionTitleActive]}>
            🏪 Marketplace
          </Text>
          <Text style={styles.flowOptionDescription}>
            Direct purchase from Styl. Best prices, unified experience.
          </Text>
        </View>
        <View style={[styles.radioButton, checkoutFlow === 'marketplace' && styles.radioButtonActive]} />
      </Pressable>

      <Pressable 
        style={[styles.flowOption, checkoutFlow === 'affiliate' && styles.flowOptionActive]}
        onPress={() => setCheckoutFlow('affiliate')}
      >
        <View style={styles.flowOptionContent}>
          <Text style={[styles.flowOptionTitle, checkoutFlow === 'affiliate' && styles.flowOptionTitleActive]}>
            🔗 Brand Direct
          </Text>
          <Text style={styles.flowOptionDescription}>
            Redirect to brand websites. Support brands directly.
          </Text>
        </View>
        <View style={[styles.radioButton, checkoutFlow === 'affiliate' && styles.radioButtonActive]} />
      </Pressable>

      <Pressable 
        style={[styles.flowOption, checkoutFlow === 'aggregator' && styles.flowOptionActive]}
        onPress={() => setCheckoutFlow('aggregator')}
      >
        <View style={styles.flowOptionContent}>
          <Text style={[styles.flowOptionTitle, checkoutFlow === 'aggregator' && styles.flowOptionTitleActive]}>
            📦 Multi-Retailer
          </Text>
          <Text style={styles.flowOptionDescription}>
            Compare prices across retailers. Find best deals.
          </Text>
        </View>
        <View style={[styles.radioButton, checkoutFlow === 'aggregator' && styles.radioButtonActive]} />
      </Pressable>
    </View>
  );

  const renderShippingForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shipping Address</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={shippingAddress.name}
        onChangeText={(text) => setShippingAddress(prev => ({ ...prev, name: text }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Street Address"
        value={shippingAddress.street}
        onChangeText={(text) => setShippingAddress(prev => ({ ...prev, street: text }))}
      />
      
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="City"
          value={shippingAddress.city}
          onChangeText={(text) => setShippingAddress(prev => ({ ...prev, city: text }))}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="State"
          value={shippingAddress.state}
          onChangeText={(text) => setShippingAddress(prev => ({ ...prev, state: text }))}
        />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="ZIP Code"
        value={shippingAddress.zipCode}
        onChangeText={(text) => setShippingAddress(prev => ({ ...prev, zipCode: text }))}
      />
    </View>
  );

  const renderExpressOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Express Options</Text>
      
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Express Checkout</Text>
        <Switch
          value={isExpressCheckout}
          onValueChange={setIsExpressCheckout}
          trackColor={{ false: '#f0f0f0', true: '#FF6B6B' }}
          thumbColor={isExpressCheckout ? '#ffffff' : '#cccccc'}
        />
      </View>
      
      {isExpressCheckout && (
        <Text style={styles.expressNote}>
          Skip address verification and use saved information for faster checkout
        </Text>
      )}
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Items ({getTotalItems()})</Text>
        <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping</Text>
        <Text style={styles.summaryValue}>
          {shipping === 0 ? 'FREE' : formatPrice(shipping)}
        </Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tax</Text>
        <Text style={styles.summaryValue}>{formatPrice(tax)}</Text>
      </View>
      
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
      
      {shipping > 0 && (
        <Text style={styles.freeShippingNote}>
          Add {formatPrice(75 - subtotal)} more for free shipping
        </Text>
      )}
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Checkout</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Pressable 
            style={styles.continueShoppingButton} 
            onPress={() => router.push('/deck')}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCheckoutFlowSelector()}
        {renderExpressOptions()}
        {!isExpressCheckout && renderShippingForm()}
        {renderOrderSummary()}
        
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.paymentNote}>
            This is a demo app. No actual payment will be processed.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.checkoutButton} onPress={handleCompleteCheckout}>
          <Text style={styles.checkoutButtonText}>
            Complete Order • {formatPrice(total)}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  flowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
  },
  flowOptionActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#fff5f5',
  },
  flowOptionContent: {
    flex: 1,
  },
  flowOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  flowOptionTitleActive: {
    color: '#FF6B6B',
  },
  flowOptionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginLeft: 12,
  },
  radioButtonActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  expressNote: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  freeShippingNote: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 8,
  },
  paymentSection: {
    padding: 20,
  },
  paymentNote: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  checkoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#666666',
    marginBottom: 24,
  },
  continueShoppingButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  continueShoppingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});