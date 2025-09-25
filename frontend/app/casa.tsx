import React, { useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { router } from 'expo-router'

import { ITEMS } from '../src/data/items'
import { useCartStore } from '../src/state/cart'
import { useWishlistStore } from '../src/state/wishlist'

// THEME — minimalist neutrals + accessible accent for key CTAs
const COLOR = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7',
  text: '#111111',
  subtext: '#6B7280',
  border: '#E5E7EB',
  overlay: 'rgba(17,17,17,0.06)',
  shadow: 'rgba(0,0,0,0.12)',
  accent: '#0A84FF', // iOS blue — accessible on white
  success: '#10B981',
}

// Simple scaling pressable for micro-interactions
function PressableScale({ children, onPress, style, accessibilityLabel }: any) {
  const scale = useRef(new Animated.Value(1)).current
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => Animated.timing(scale, { toValue: 0.97, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()}
        onPress={onPress}
        android_ripple={{ color: COLOR.overlay }}
        style={{ borderRadius: 9999 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

function IconFilter({ size = 22, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M6 12h12M10 18h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}
function IconChevronDown({ size = 18, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function IconSearch({ size = 18, color = COLOR.subtext }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke={color} strokeWidth={1.8} />
      <Path d="M21 21l-3.5-3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}
function IconBell({ size = 20, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}
function IconCart({ size = 22, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6h15l-1.5 8.5a2 2 0 01-2 1.7H9.2a2 2 0 01-2-1.6L5 3H2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="9" cy="20" r="1.6" fill={color} />
      <Circle cx="18" cy="20" r="1.6" fill={color} />
    </Svg>
  )
}
function IconHeart({ size = 22, color = COLOR.text, filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {filled ? (
        <Path d="M12 21s-8-5.5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 5.5-8 11-8 11z" fill={color} />
      ) : (
        <Path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a4.5 4.5 0 018-3 4.5 4.5 0 018 3z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  )
}
function IconHome({ size = 22, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth={1.6} />
    </Svg>
  )
}
function IconUser({ size = 22, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.6} />
      <Path d="M4 21a8 8 0 0116 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}
function IconBookmark({ size = 22, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h12a1 1 0 011 1v16l-7-3-7 3V5a1 1 0 011-1z" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}
function IconShare({ size = 22, color = COLOR.text }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" stroke={color} strokeWidth={1.6} />
      <Path d="M12 16V4" stroke={color} strokeWidth={1.6} />
      <Path d="M8 8l4-4 4 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

function Chip({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <PressableScale accessibilityLabel={`${label} filter`} onPress={onPress}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>{label}</Text>
        <IconChevronDown color={COLOR.text} />
      </View>
    </PressableScale>
  )
}

function BottomNav({ onCart, onWishlist, onProfile }: any) {
  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      <PressableScale accessibilityLabel="Home" onPress={() => router.push('/deck')}>
        <View style={styles.navItem}><IconHome /><Text style={styles.navText}>Home</Text></View>
      </PressableScale>
      <PressableScale accessibilityLabel="Search" onPress={() => {}}>
        <View style={styles.navItem}><IconSearch color={COLOR.text} /><Text style={styles.navText}>Search</Text></View>
      </PressableScale>
      <PressableScale accessibilityLabel="Cart" onPress={onCart}>
        <View style={styles.navItem}><IconCart /><Text style={styles.navText}>Cart</Text></View>
      </PressableScale>
      <PressableScale accessibilityLabel="Wishlist" onPress={onWishlist}>
        <View style={styles.navItem}><IconHeart /><Text style={styles.navText}>Saved</Text></View>
      </PressableScale>
      <PressableScale accessibilityLabel="Profile" onPress={onProfile}>
        <View style={styles.navItem}><IconUser /><Text style={styles.navText}>You</Text></View>
      </PressableScale>
    </View>
  )
}

function FiltersModal({ visible, onClose }: { visible: boolean; onClose: (applied?: boolean) => void }) {
  const [brands, setBrands] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const toggle = (state: string[], set: (v: string[]) => void, v: string) => {
    set(state.includes(v) ? state.filter((x) => x !== v) : [...state, v])
  }
  const clearAll = () => { setBrands([]); setTypes([]); setColors([]) }
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={() => onClose(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLOR.background }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter & Sort</Text>
          <Pressable onPress={() => onClose(false)} accessibilityLabel="Close filters"><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.sectionTitle}>Brand</Text>
          <View style={styles.chipsRowWrap}>
            {['DANHOP', 'CASA', 'UrbanFit', 'Classic'].map((b) => (
              <Pressable key={b} onPress={() => toggle(brands, setBrands, b)} style={[styles.selectChip, brands.includes(b) && styles.selectChipActive]} accessibilityLabel={`Brand ${b}`}>
                <Text style={[styles.selectChipText, brands.includes(b) && styles.selectChipTextActive]}>{b}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Product</Text>
          <View style={styles.chipsRowWrap}>
            {['Pants', 'Tops', 'Shoes', 'Accessories'].map((t) => (
              <Pressable key={t} onPress={() => toggle(types, setTypes, t)} style={[styles.selectChip, types.includes(t) && styles.selectChipActive]} accessibilityLabel={`Product ${t}`}>
                <Text style={[styles.selectChipText, types.includes(t) && styles.selectChipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.chipsRowWrap}>
            {['Black', 'Blue', 'Grey', 'White'].map((c) => (
              <Pressable key={c} onPress={() => toggle(colors, setColors, c)} style={[styles.selectChip, styles.colorChip, colors.includes(c) && styles.selectChipActive]} accessibilityLabel={`Color ${c}`}>
                <Text style={[styles.selectChipText, colors.includes(c) && styles.selectChipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <PressableScale accessibilityLabel="Clear all" onPress={clearAll}>
            <View style={[styles.footerBtn, { backgroundColor: COLOR.surfaceAlt }]}> 
              <Text style={[styles.footerBtnText, { color: COLOR.text }]}>Clear</Text>
            </View>
          </PressableScale>
          <PressableScale accessibilityLabel="Apply filters" onPress={() => onClose(true)}>
            <View style={[styles.footerBtn, { backgroundColor: COLOR.accent }]}> 
              <Text style={[styles.footerBtnText, { color: '#fff' }]}>Apply</Text>
            </View>
          </PressableScale>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

function ProductQuickModal({ visible, onClose, onAddToCart }: { visible: boolean; onClose: () => void; onAddToCart: () => void }) {
  const [size, setSize] = useState<string>('M')
  const [color, setColor] = useState<string>('Blue')
  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLOR.background }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Quick Select</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close"><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>
        <View style={{ padding: 20, gap: 16 }}>
          <Text style={styles.sectionTitle}>Size</Text>
          <View style={styles.chipsRowWrap}>
            {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
              <Pressable key={s} onPress={() => setSize(s)} style={[styles.selectChip, size === s && styles.selectChipActive]} accessibilityLabel={`Size ${s}`}>
                <Text style={[styles.selectChipText, size === s && styles.selectChipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.chipsRowWrap}>
            {['Blue', 'Black', 'Grey'].map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={[styles.selectChip, styles.colorChip, color === c && styles.selectChipActive]} accessibilityLabel={`Color ${c}`}>
                <Text style={[styles.selectChipText, color === c && styles.selectChipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.modalFooter}>
          <PressableScale accessibilityLabel="Add to cart" onPress={onAddToCart}>
            <View style={[styles.footerBtn, { backgroundColor: COLOR.text, flex: 1 }]}> 
              <Text style={[styles.footerBtnText, { color: '#fff' }]}>Add to cart</Text>
            </View>
          </PressableScale>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

export default function CasaMock() {
  const product = useMemo(() => ITEMS[0], [])
  const { addToCart } = useCartStore()
  const { addToWishlist } = useWishlistStore()

  const [liked, setLiked] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showQuick, setShowQuick] = useState(false)

  const pulse = useRef(new Animated.Value(1)).current
  const doPulse = () => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true }),
    ]).start()
  }

  const handleWishlist = () => {
    setLiked((p) => !p)
    doPulse()
    try { addToWishlist(product) } catch {}
  }

  const handleBuyNow = () => {
    // Simulate one-tap buy: add to cart and go to checkout
    try { addToCart({ id: product.id, title: product.title, price: product.price, image: product.image, brand: product.brand, quantity: 1 }) } catch {}
    router.push('/checkout')
  }

  const handleAddToCart = () => {
    try { addToCart({ id: product.id, title: product.title, price: product.price, image: product.image, brand: product.brand, quantity: 1 }) } catch {}
    setShowQuick(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'} backgroundColor={COLOR.background} />

      {/* Top brand + search */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>CASA</Text>
        <View style={styles.searchBar} accessibilityLabel="Search bar">
          <IconSearch />
          <TextInput
            placeholder="Search for something…"
            placeholderTextColor={COLOR.subtext}
            style={styles.searchInput}
            accessibilityLabel="Search input"
          />
        </View>
        <PressableScale accessibilityLabel="Notifications" onPress={() => {}}>
          <View style={styles.iconBtn}><IconBell /></View>
        </PressableScale>
      </View>

      {/* Filters row */}
      <View style={styles.filtersRow}>
        <PressableScale accessibilityLabel="Open filters" onPress={() => setShowFilters(true)}>
          <View style={[styles.iconPill, { paddingHorizontal: 12 }]}>
            <IconFilter />
          </View>
        </PressableScale>
        <Chip label="Brand" onPress={() => setShowFilters(true)} />
        <Chip label="Product" onPress={() => setShowFilters(true)} />
        <Chip label="Color" onPress={() => setShowFilters(true)} />
      </View>

      {/* Product card */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.rotLeft} />
          <View style={styles.rotRight} />

          <View style={styles.cardHeader}>
            <PressableScale accessibilityLabel="Go back" onPress={() => router.back()}>
              <View style={styles.circleBtn}><Text style={{ fontSize: 18 }}>↺</Text></View>
            </PressableScale>
          </View>

          <Image source={{ uri: product.image }} style={styles.cardImage} resizeMode="cover" accessibilityLabel={product.title} />

          {/* Right side quick actions */}
          <View style={styles.verticalActions}>
            <PressableScale accessibilityLabel="Add to cart" onPress={() => setShowQuick(true)}>
              <View style={styles.fab}><IconCart size={20} /></View>
            </PressableScale>
            <PressableScale accessibilityLabel="Save to wishlist" onPress={handleWishlist}>
              <Animated.View style={[styles.fab, { transform: [{ scale: pulse }] }]}> 
                <IconBookmark size={20} />
              </Animated.View>
            </PressableScale>
            <PressableScale accessibilityLabel="Share" onPress={() => {}}>
              <View style={styles.fab}><IconShare size={20} /></View>
            </PressableScale>
          </View>

          {/* Bottom overlay info */}
          <View style={styles.cardOverlay}>
            <View style={styles.brandBadge}>
              <View style={styles.brandLogo}><Text style={styles.brandLogoText}>D</Text></View>
              <Text style={styles.productTitle}>{product.title}</Text>
            </View>
            <Text style={styles.priceText}>₹ {(product.price * 84).toFixed(0)}.0</Text>
          </View>

          {/* Buy now CTA */}
          <PressableScale accessibilityLabel="Buy now" onPress={handleBuyNow}>
            <View style={styles.buyNow}>
              <Text style={styles.buyNowText}>Buy now</Text>
            </View>
          </PressableScale>
        </View>
      </ScrollView>

      <BottomNav onCart={() => router.push('/cart')} onWishlist={() => router.push('/wishlist')} onProfile={() => router.push('/profile')} />

      <FiltersModal visible={showFilters} onClose={() => setShowFilters(false)} />
      <ProductQuickModal visible={showQuick} onClose={() => setShowQuick(false)} onAddToCart={handleAddToCart} />
    </SafeAreaView>
  )
}

const RADIUS = 20

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.background },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  brand: { fontSize: 22, fontWeight: '800', color: COLOR.text, letterSpacing: 0.4 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: COLOR.border,
  },
  searchInput: { flex: 1, color: COLOR.text, fontSize: 14, paddingVertical: 0 },
  iconBtn: { padding: 8, borderRadius: 999, backgroundColor: COLOR.surfaceAlt, borderWidth: 1, borderColor: COLOR.border },

  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR.surface,
    borderWidth: 1,
    borderColor: COLOR.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: { color: COLOR.text, fontSize: 14, fontWeight: '600' },
  iconPill: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    borderRadius: RADIUS,
    backgroundColor: COLOR.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginTop: 8,
  },
  rotLeft: { position: 'absolute', left: -80, top: -80, width: 160, height: 160, backgroundColor: COLOR.overlay, borderRadius: 80 },
  rotRight: { position: 'absolute', right: -60, bottom: -60, width: 120, height: 120, backgroundColor: COLOR.overlay, borderRadius: 60 },

  cardHeader: { position: 'absolute', left: 12, top: 12, zIndex: 2 },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLOR.border },

  cardImage: { width: '100%', height: 560, backgroundColor: '#f2f2f2' },

  verticalActions: {
    position: 'absolute',
    right: 12,
    top: 120,
    zIndex: 2,
    gap: 12,
    alignItems: 'center',
  },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 1, borderColor: COLOR.border, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },

  cardOverlay: { position: 'absolute', left: 12, right: 12, bottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  brandBadge: { flexDirection: 'column', gap: 8 },
  brandLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: COLOR.text, alignItems: 'center', justifyContent: 'center' },
  brandLogoText: { color: COLOR.text, fontSize: 16, fontWeight: '800' },
  productTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 6, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  priceText: { color: '#fff', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },

  buyNow: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#ffffff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: COLOR.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  buyNowText: { color: COLOR.text, fontSize: 15, fontWeight: '700' },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4 },
  navText: { fontSize: 11, color: COLOR.text, fontWeight: '600' },

  // Modal styles
  modalHeader: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLOR.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLOR.text },
  modalClose: { fontSize: 20, color: COLOR.subtext },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLOR.text, marginTop: 8, marginBottom: 8 },
  chipsRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: COLOR.border, backgroundColor: COLOR.surface },
  selectChipActive: { borderColor: COLOR.text, backgroundColor: '#111111', },
  selectChipText: { color: COLOR.text, fontWeight: '600' },
  selectChipTextActive: { color: '#ffffff' },
  colorChip: {},
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: COLOR.border },
  footerBtn: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12 },
  footerBtnText: { fontSize: 16, fontWeight: '700' },
})