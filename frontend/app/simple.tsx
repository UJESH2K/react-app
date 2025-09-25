import { useState, useEffect } from 'react'
import { View, Text, Image, StyleSheet, Pressable } from 'react-native'
import { ITEMS } from '../src/data/items'

export default function SimpleDeck() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [items] = useState(ITEMS)
  
  const current = items[currentIndex]
  
  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No items found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Casa Fashion App</Text>
      
      <View style={styles.card}>
        <Image 
          source={{ uri: current.image }} 
          style={styles.image} 
          resizeMode="cover" 
        />
        <View style={styles.info}>
          <Text style={styles.itemTitle}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
        </View>
      </View>
      
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={nextItem}>
          <Text style={styles.buttonText}>Next Item</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 20,
  },
  image: {
    width: '100%',
    height: '70%',
  },
  info: {
    padding: 20,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
  buttons: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
})