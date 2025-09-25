import { Text, Pressable, StyleSheet } from 'react-native'
import { useCartStore } from '../state/cart'
import { useRouter } from 'expo-router'

export function CartBadge() {
  const getTotalItems = useCartStore((s) => s.getTotalItems)
  const count = getTotalItems()
  const router = useRouter()

  if (count === 0) return null

  return (
    <Pressable
      onPress={() => router.push('/cart')}
      style={styles.badge}
      accessibilityRole="button"
      accessibilityLabel={`Open cart, ${count} items`}
    >
      <Text style={styles.text}>Cart · {count}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  text: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
})