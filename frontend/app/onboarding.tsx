import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  FlatList, 
  StyleSheet, 
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES } from '../src/data/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Onboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('Onboarding screen mounted');
    // Add a small delay to ensure everything is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, Platform.OS === 'android' ? 500 : 100);

    return () => clearTimeout(timer);
  }, []);

  // Preload previously saved categories so user can edit preferences
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('categories:selected');
        if (saved && mounted) {
          const arr = JSON.parse(saved) as string[];
          if (Array.isArray(arr) && arr.length) setSelected(arr);
        }
      } catch (e) {
        // ignore and keep default empty selection
      }
    })();
    return () => { mounted = false };
  }, []);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const continueNext = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Selected categories before saving:', selected);
      
      // Add timeout for AsyncStorage operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timeout')), 5000)
      );
      
      const savePromise = AsyncStorage.setItem('categories:selected', JSON.stringify(selected));
      await Promise.race([savePromise, timeoutPromise]);
      
      console.log('Categories saved successfully');
      console.log('Navigating to deck...');
      
      // Add small delay before navigation for Android
      setTimeout(() => {
        router.replace('/deck');
      }, Platform.OS === 'android' ? 200 : 0);
      
    } catch (error) {
      console.error('Error saving categories:', error);
      setIsLoading(false);
      
      // Show alert but allow navigation anyway
      Alert.alert(
        'Warning', 
        'Could not save preferences, but you can continue.',
        [
          {
            text: 'Continue Anyway',
            onPress: () => {
              setTimeout(() => {
                router.replace('/deck');
              }, 100);
            }
          }
        ]
      );
    }
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Setting up...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderCategoryItem = ({ item }: { item: { key: string; label: string } }) => (
    <Pressable
      onPress={() => toggle(item.key)}
      style={[
        styles.categoryItem,
        selected.includes(item.key) ? styles.selected : styles.unselected
      ]}
    >
      <View style={styles.categoryContent}>
        <Text style={[
          styles.categoryText,
          selected.includes(item.key) ? styles.selectedText : styles.unselectedText
        ]}>
          {item.label}
        </Text>
        {selected.includes(item.key) && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Casa</Text>
        <Text style={styles.subtitle}>
          Choose your style preferences to get personalized recommendations
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {selected.length} of {CATEGORIES.length} selected
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(selected.length / CATEGORIES.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        renderItem={renderCategoryItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <Pressable
          onPress={continueNext}
          style={[
            styles.continueButton,
            selected.length ? styles.continueEnabled : styles.continueDisabled
          ]}
          disabled={!selected.length}
        >
          <Text style={[
            styles.continueText,
            selected.length ? styles.continueEnabledText : styles.continueDisabledText
          ]}>
            {selected.length ? 'Start Discovering' : 'Select at least one category'}
          </Text>
        </Pressable>
        
        {selected.length > 0 && (
          <Text style={styles.hintText}>
            You can always change your preferences later
          </Text>
        )}
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  categoryItem: {
    width: (SCREEN_WIDTH - 48) / 2,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  selected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  unselected: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
  },
  categoryContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    flexDirection: 'row',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  selectedText: {
    color: '#ffffff',
  },
  unselectedText: {
    color: '#000000',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueEnabled: {
    backgroundColor: '#000000',
  },
  continueDisabled: {
    backgroundColor: '#f5f5f5',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  continueEnabledText: {
    color: '#ffffff',
  },
  continueDisabledText: {
    color: '#999999',
  },
  hintText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    textAlign: 'center',
  },
});