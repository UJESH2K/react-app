import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { useCartStore } from '../src/state/cart'
import { useWishlistStore } from '../src/state/wishlist'
import { useInteractionStore } from '../src/state/interactions'
import { useAuthStore } from '../src/state/auth'
import type { Item } from '../src/data/items'
import { ITEMS } from '../src/data/items'
import {
  getInitialItems,
  initRecommender,
  onItemViewed,
  rankItems,
  updateModel,
} from '../src/lib/recommender'
import { CartBadge } from '../src/components/CartBadge'
import { WishlistBadge } from '../src/components/WishlistBadge'
import { ProfileBadge } from '../src/components/ProfileBadge'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

type LastAction = { action: 'like' | 'dislike' | 'cart'; item: Item; index: number } | null

export default function Deck() {
  const router = useRouter()

  // Stores
  const addToCart = useCartStore((s) => s.addToCart)
  const addToWishlist = useWishlistStore((s) => s.addToWishlist)
  const pushInteraction = useInteractionStore((s) => s.pushInteraction)
  const { loadUser } = useAuthStore()

  // State
  const [items, setItems] = useState<Item[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [lastAction, setLastAction] = useState<LastAction>(null)
  const [showFilter, setShowFilter] = useState(false)

  // Safe area and top-right counts
  const insets = useSafeAreaInsets()
  const wishlistItems = useWishlistStore((s) => s.items)
  const getCartTotal = useCartStore((s) => s.getTotalItems)
  const cartCount = getCartTotal()

  // Animations
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const opacity = useRef(new Animated.Value(1)).current
  const scale = useRef(new Animated.Value(1)).current

  // Refs to avoid stale closures in timers
  const loadingRef = useRef(loading)
  const itemsRef = useRef(items)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { loadingRef.current = loading }, [loading])
  useEffect(() => { itemsRef.current = items }, [items])

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  })

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })
  // Hint becomes more visible as user drags upward (position.y is negative when moving up)
  const upHintOpacity = position.y.interpolate({
    inputRange: [-140, -60, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  })

  // Load initial recommendations
  useEffect(() => {
    loadUser()
    initRecommender()
    loadRecommendations()

    // Use refs to read latest values when timer fires to avoid hook-order errors and stale state
    loadingTimeoutRef.current = setTimeout(() => {
      if (loadingRef.current && (itemsRef.current?.length || 0) === 0) {
        setLoading(false)
        Alert.alert(
          'Loading Issue',
          'Having trouble loading items. Would you like to retry?',
          [
            { text: 'Retry', onPress: () => setTimeout(loadRecommendations, 100) },
            { text: 'Continue Anyway' },
          ],
        )
      }
    }, Platform.OS === 'android' ? 6000 : 8000)

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      // Fast path with timeout; fallback to bundled ITEMS to avoid empty deck
      const timeoutPromise = new Promise<Item[]>((resolve) =>
        setTimeout(() => resolve(ITEMS), 3500),
      )
      const loadPromise = getInitialItems().catch(() => ITEMS)
      const initialItems = await Promise.race([loadPromise, timeoutPromise])
      setItems(initialItems && initialItems.length ? initialItems : ITEMS)
    } catch (error) {
      setItems(ITEMS)
    } finally {
      setLoading(false)
      // Clear any pending timeout once we finish an attempt
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evt, { dx, dy }) => Math.abs(dx) > 2 || Math.abs(dy) > 2,
    onPanResponderGrant: () => {
      if (isAnimating) return
      position.stopAnimation()
      scale.stopAnimation()
    },
    onPanResponderMove: (_evt, { dx, dy }) => {
      if (isAnimating || currentIndex >= items.length) return
      requestAnimationFrame(() => {
        // Allow smooth upward drag (only negative Y), keep horizontal for left/right
        const newY = dy < 0 ? dy : 0
        position.setValue({ x: dx, y: newY })
        const displacement = Math.max(Math.abs(dx) / SCREEN_WIDTH, Math.min(Math.abs(newY) / SCREEN_HEIGHT, 1))
        const scaleValue = 1 + displacement * 0.03
        scale.setValue(Math.min(scaleValue, 1.08))
      })
    },
    onPanResponderRelease: (_evt, { dx, vx, dy, vy }) => {
      if (isAnimating || currentIndex >= items.length) return
      const H_VELOCITY = 0.25
      const H_DISTANCE = 60
      const V_VELOCITY = 0.35
      const V_DISTANCE = 90
      const isSwipeRight = dx > H_DISTANCE || vx > H_VELOCITY
      const isSwipeLeft = dx < -H_DISTANCE || vx < -H_VELOCITY
      const isSwipeUp = dy < -V_DISTANCE || vy < -V_VELOCITY
      if (isSwipeUp) onDecision('cart')
      else if (isSwipeRight) onDecision('like')
      else if (isSwipeLeft) onDecision('dislike')
      else {
        Animated.parallel([
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, tension: 150, friction: 10 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 150, friction: 10 }),
        ]).start()
      }
    },
    onPanResponderTerminate: () => {
      if (!isAnimating) {
        Animated.parallel([
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start()
      }
    },
  })

  const onDecision = async (decision: 'like' | 'dislike' | 'cart') => {
    if (isAnimating || currentIndex >= items.length) return
    try {
      setIsAnimating(true)
      const currentItem = items[currentIndex]
      if (!currentItem) return

      try {
        pushInteraction({ itemId: currentItem.id, action: decision, at: Date.now(), tags: currentItem.tags, priceTier: currentItem.priceTier })
      } catch {}

      try {
        if (decision === 'like') addToWishlist(currentItem)
        else if (decision === 'cart')
          addToCart({ id: currentItem.id, title: currentItem.title, price: currentItem.price, image: currentItem.image, brand: currentItem.brand, quantity: 1 })
      } catch {}

      try {
        updateModel(decision, currentItem)
        const rest = items.slice(currentIndex + 1)
        const reranked = rankItems(rest)
        setItems([...items.slice(0, currentIndex + 1), ...reranked])
      } catch {}

      const direction = decision === 'like' ? 1 : decision === 'dislike' ? -1 : 0
      const exitY = decision === 'cart' ? -SCREEN_HEIGHT : 0
      const exitX = decision === 'cart' ? 0 : direction * SCREEN_WIDTH * 1.15
      await new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(position, { toValue: { x: exitX, y: exitY }, duration: 220, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        ]).start(() => resolve())
      })

      setLastAction({ action: decision, item: currentItem, index: currentIndex })
    } finally {
      position.setValue({ x: 0, y: 0 })
      opacity.setValue(1)
      scale.setValue(1)
      setCurrentIndex((p) => p + 1)
      setIsAnimating(false)
    }
  }

  const undoLastAction = () => {
    if (!lastAction || isAnimating) return
    try {
      if (lastAction.action === 'like') {
        const { removeFromWishlist } = useWishlistStore.getState()
        removeFromWishlist(lastAction.item.id)
      } else if (lastAction.action === 'cart') {
        const { removeFromCart } = useCartStore.getState()
        removeFromCart(lastAction.item.id)
      }
      setCurrentIndex(lastAction.index)
      position.setValue({ x: 0, y: 0 })
      opacity.setValue(1)
      scale.setValue(1)
      setLastAction(null)
    } catch {
      Alert.alert('Error', 'Could not undo the last action')
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

  // Compute current and next items up-front so hooks below can use them
  const currentItem = items[currentIndex]
  const nextItem = items[currentIndex + 1]

  // Important: call hooks before any early returns to keep hook order stable
  useEffect(() => {
    try {
      if (currentItem) onItemViewed(currentItem)
    } catch {}
  }, [currentItem?.id])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonBarWide} />
            <View style={styles.skeletonBar} />
            <View style={styles.skeletonBar} />
          </View>
          <Text style={styles.loadingText}>Finding great styles for you…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (currentIndex >= items.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.endContainer}>
          <Text style={styles.endTitle}>✨ All caught up!</Text>
          <Text style={styles.endSubtitle}>Check back soon for more personalized recommendations</Text>
          <Text style={styles.endAction} onPress={() => router.push('/cart')}>
            Review your selected items →
          </Text>
        </View>
        <CartBadge />
        <WishlistBadge />
        <ProfileBadge />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Styl</Text>
        <Text style={styles.headerSubtitle}>Discover your style</Text>
        <Pressable onPress={() => router.push('/onboarding')} style={styles.prefsButton}>
          <Text style={styles.prefsText}>⚙︎ Prefs</Text>
        </Pressable>
        {lastAction && (
          <Pressable
            onPress={undoLastAction}
            style={[
              styles.undoButton,
              { top: (insets.top || 12) + 8 + 48 + 10 } // place below Profile (48px) with 10px gap
            ]}
          >
            <Text style={styles.undoText}>↶ Undo</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.cardStack}>
        {nextItem && (
          <View style={[styles.card, styles.nextCard]} pointerEvents="none">
            <Image source={{ uri: nextItem.image }} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{nextItem.title}</Text>
                <Text style={styles.cardSubtitle}>{nextItem.subtitle}</Text>
                <Text style={styles.cardPrice}>{formatPrice(nextItem.price)}</Text>
              </View>
            </View>
          </View>
        )}

        <Animated.View
          style={[
            styles.card,
            styles.currentCard,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }, { scale }], opacity },
            ]}
            {...panResponder.panHandlers}
        >
          <Pressable
            style={styles.touchArea}
            onPress={() => {}}
              delayLongPress={300}
            onLongPress={() => {
              try {
                if (!isAnimating && currentIndex < items.length) setShowProductDetail(true)
              } catch {}
            }}
          >
            <Image source={{ uri: currentItem.image }} style={styles.cardImage} />

            <Animated.View style={[styles.choiceOverlay, styles.likeOverlay, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>LOVE</Text>
            </Animated.View>

            <Animated.View style={[styles.choiceOverlay, styles.dislikeOverlay, { opacity: nopeOpacity }]}> 
              <Text style={styles.dislikeText}>PASS</Text>
            </Animated.View>

            {/* Upward hint for Add to Cart */}
            <Animated.View pointerEvents="none" style={[styles.upHint, { opacity: upHintOpacity }]}>
              <Text style={styles.upHintArrow}>↑</Text>
              <Text style={styles.upHintText}>Add to cart</Text>
            </Animated.View>

            <View style={styles.cardOverlay}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>{currentItem.brand}</Text>
                <Text style={styles.cardTitle}>{currentItem.title}</Text>
                <Text style={styles.cardSubtitle}>{currentItem.subtitle}</Text>
                <Text style={styles.cardPrice}>{formatPrice(currentItem.price)}</Text>
                <View style={styles.tagsContainer}>
                  {currentItem.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Top controls overlay (Filters only to avoid overlapping header buttons) */}
      <View pointerEvents="box-none" style={styles.topOverlay}>
        <Pressable onPress={() => setShowFilter(true)} style={styles.filterPill}>
          <Text style={styles.filterPillText}>Filters</Text>
        </Pressable>
      </View>

      {/* Wishlist beside Prefs (top-left) */}
      <View style={[styles.wishlistNearPrefs, { marginTop: (insets.top || 0) }]} pointerEvents="box-none">
        <Pressable onPress={() => router.push('/wishlist')} style={styles.smallTopBadge}>
          <Text style={styles.smallTopIcon}>♡</Text>
          <Text style={styles.smallTopText}>{wishlistItems.length}</Text>
        </Pressable>
      </View>

      {/* Cart moved down to avoid overlapping header buttons */}
      <View style={[styles.cartFloating, { bottom: 110 + (insets.bottom || 0) }]} pointerEvents="box-none">
        <Pressable onPress={() => router.push('/cart')} style={styles.smallTopBadge}>
          <Text style={styles.smallTopIcon}>🛒</Text>
          <Text style={styles.smallTopText}>{cartCount}</Text>
        </Pressable>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Swipe right to love • Swipe left to pass • Swipe up to add to cart
        </Text>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {items.length} • {items.length - currentIndex - 1} remaining
        </Text>
      </View>

      <ProfileBadge />

      {/* Lightweight Filters Modal */}
      {showFilter && (
        <Modal animationType="slide" transparent visible={showFilter} onRequestClose={() => setShowFilter(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <Pressable onPress={() => setShowFilter(false)}>
                  <Text style={styles.modalClose}>Done</Text>
                </Pressable>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 16, marginBottom: 12 }}>Price</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                  {['$', '$$', '$$$'].map((p) => (
                    <View key={p} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f5f5f5', borderRadius: 20 }}>
                      <Text>{p}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: 16, marginBottom: 12 }}>Tags</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['casual', 'formal', 'denim', 'street', 'summer', 'winter'].map((t) => (
                    <View key={t} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f5f5f5', borderRadius: 20 }}>
                      <Text>#{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showProductDetail && currentIndex < items.length && (
        <Modal animationType="slide" transparent visible={showProductDetail} onRequestClose={() => setShowProductDetail(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Product Details</Text>
                  <Pressable onPress={() => setShowProductDetail(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </Pressable>
                </View>
                {items[currentIndex] ? (
                  <>
                    <Image source={{ uri: items[currentIndex].image }} style={styles.modalImage} />
                    <View style={styles.modalDetails}>
                      <Text style={styles.modalBrand}>{items[currentIndex].brand || ''}</Text>
                      <Text style={styles.modalProductTitle}>{items[currentIndex].title || ''}</Text>
                      <Text style={styles.modalPrice}>{formatPrice(items[currentIndex].price || 0)}</Text>
                      <Text style={styles.modalDescription}>{items[currentIndex].description || ''}</Text>
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Available Sizes</Text>
                        <View style={styles.sizesContainer}>
                          {(items[currentIndex].sizes || []).map((size, index) => (
                            <View key={index} style={styles.sizeChip}>
                              <Text style={styles.sizeText}>{size}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Available Colors</Text>
                        <View style={styles.colorsContainer}>
                          {(items[currentIndex].colors || []).map((color, index) => (
                            <View key={index} style={styles.colorChip}>
                              <Text style={styles.colorText}>{color}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={styles.modalActions}>
                        <Pressable
                          onPress={() => {
                            try {
                              setShowProductDetail(false)
                              onDecision('cart')
                            } catch {}
                          }}
                          style={styles.modalAddToCart}
                        >
                          <Text style={styles.modalActionText}>Add to Cart</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            try {
                              setShowProductDetail(false)
                              onDecision('like')
                            } catch {}
                          }}
                          style={styles.modalLike}
                        >
                          <Text style={styles.modalActionText}>♡ Like</Text>
                        </Pressable>
                      </View>
                    </View>
                  </>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  skeletonCard: {
    width: '86%',
    height: 420,
    backgroundColor: '#e9e9e9',
    borderRadius: 20,
    marginTop: 16,
    padding: 16,
    alignItems: 'stretch',
  },
  skeletonImage: {
    flex: 1,
    backgroundColor: '#dcdcdc',
    borderRadius: 16,
    marginBottom: 12,
  },
  skeletonBarWide: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonBar: {
    height: 10,
    backgroundColor: '#eaeaea',
    borderRadius: 8,
    marginBottom: 8,
    width: '70%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 20, android: 10 }),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
    fontWeight: '400',
  },
  prefsButton: {
    position: 'absolute',
    top: 10,
    left: 20,
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 26,
  },
  prefsText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '600',
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  nextCard: {
    opacity: 0.8,
    zIndex: 1,
    transform: [{ scale: 0.95 }],
  },
  currentCard: {
    zIndex: 2,
    elevation: 5,
  },
  touchArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardImage: {
    width: '100%',
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 26,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
  },
  choiceOverlay: {
    position: 'absolute',
    top: 50,
    padding: 20,
    borderRadius: 12,
    zIndex: 10,
  },
  likeOverlay: {
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    transform: [{ rotate: '15deg' }],
  },
  dislikeOverlay: {
    left: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    transform: [{ rotate: '-15deg' }],
  },
  likeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  dislikeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  // Upward hint styles (centered near bottom of image)
  upHint: {
    position: 'absolute',
    bottom: '34%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upHintArrow: {
    fontSize: 28,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    marginBottom: 2,
  },
  upHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
    textAlign: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#bbbbbb',
    fontWeight: '400',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  endContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  endTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  endSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  endAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Top overlay controls
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: Platform.select({ ios: 8, android: 4 }),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    zIndex: 20,
  },
  filterPill: {
    marginTop: 6,
    marginLeft: 4,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  topRightControls: {
    display: 'none',
  },
  smallTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  smallTopIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  smallTopText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  wishlistNearPrefs: {
    position: 'absolute',
    top: 10,
    left: 90, // ensure a visible gap from Prefs
    zIndex: 25,
  },
  cartFloating: {
    position: 'absolute',
    right: 20,
    zIndex: 25,
  },
  undoButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 30,
  },
  undoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  modalClose: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '600',
  },
  modalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  modalDetails: {
    padding: 20,
  },
  modalBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  modalProductTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  colorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalAddToCart: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalLike: {
    flex: 1,
    backgroundColor: '#FF8A80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})