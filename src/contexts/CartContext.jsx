import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../lib/supabase'
import toast from 'react-hot-toast'

const CartContext = createContext({})

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      setCartItems([])
    }
  }, [user])

  const fetchCartItems = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await db.getCartItems(user.id)
      if (error) throw error
      setCartItems(data || [])
    } catch (error) {
      console.error('Error fetching cart items:', error)
      toast.error('Failed to load cart items')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to cart')
      return
    }

    try {
      const { data, error } = await db.addToCart(user.id, productId, quantity)
      if (error) throw error
      
      await fetchCartItems()
      toast.success('Item added to cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart')
    }
  }

  const updateCartItem = async (itemId, quantity) => {
    try {
      const { data, error } = await db.updateCartItem(itemId, quantity)
      if (error) throw error
      
      await fetchCartItems()
    } catch (error) {
      console.error('Error updating cart item:', error)
      toast.error('Failed to update cart item')
    }
  }

  const removeFromCart = async (itemId) => {
    try {
      const { data, error } = await db.removeFromCart(itemId)
      if (error) throw error
      
      await fetchCartItems()
      toast.success('Item removed from cart')
    } catch (error) {
      console.error('Error removing from cart:', error)
      toast.error('Failed to remove item from cart')
    }
  }

  const clearCart = async () => {
    if (!user) return

    try {
      const { data, error } = await db.clearCart(user.id)
      if (error) throw error
      
      setCartItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Failed to clear cart')
    }
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.products.price * item.quantity)
    }, 0)
  }

  const value = {
    cartItems,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCartItems,
    getTotalItems,
    getTotalPrice
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
