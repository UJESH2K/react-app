import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../src/state/auth';

export default function LoginScreen() {
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const { login, loginWithPhone, sendOTP, isLoading } = useAuthStore();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    return /^\+?[1-9]\d{1,14}$/.test(phone);
  };

  const handleSendOTP = async () => {
    if (!emailOrPhone) {
      Alert.alert('Error', `Please enter your ${method}`);
      return;
    }

    if (method === 'email' && !isValidEmail(emailOrPhone)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (method === 'phone' && !isValidPhone(emailOrPhone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const success = await sendOTP(emailOrPhone);
    if (success) {
      setStep('otp');
      Alert.alert('OTP Sent', `Verification code sent to your ${method}. Use 123456 for testing.`);
    } else {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    const success = method === 'email' 
      ? await login(emailOrPhone, otp)
      : await loginWithPhone(emailOrPhone, otp);

    if (success) {
      Alert.alert('Success', 'Logged in successfully!', [
        { text: 'OK', onPress: () => router.replace('/deck') }
      ]);
    } else {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  const handleSkip = () => {
    router.replace('/deck');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Styl</Text>
          <Text style={styles.subtitle}>
            {step === 'input' 
              ? `Enter your ${method} to get started`
              : `Enter the code sent to your ${method}`
            }
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'input' ? (
            <>
              <View style={styles.methodToggle}>
                <Pressable
                  style={[styles.methodButton, method === 'email' && styles.methodButtonActive]}
                  onPress={() => setMethod('email')}
                >
                  <Text style={[styles.methodButtonText, method === 'email' && styles.methodButtonTextActive]}>
                    Email
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.methodButton, method === 'phone' && styles.methodButtonActive]}
                  onPress={() => setMethod('phone')}
                >
                  <Text style={[styles.methodButtonText, method === 'phone' && styles.methodButtonTextActive]}>
                    Phone
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.input}
                placeholder={method === 'email' ? 'your@email.com' : '+1234567890'}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable 
                style={styles.primaryButton} 
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Code</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.otpInfo}>
                Code sent to {emailOrPhone}
              </Text>
              
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <Pressable 
                style={styles.primaryButton} 
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                )}
              </Pressable>

              <Pressable onPress={() => setStep('input')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Continue as Guest</Text>
          </Pressable>
          
          <Text style={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  otpInfo: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    backgroundColor: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  footer: {
    paddingBottom: 40,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  terms: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
});