import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem('eventhub_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('eventhub_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (event, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === event.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === event.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prevCart, { ...event, quantity }];
      }
    });
  };

  const removeFromCart = (eventId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== eventId));
  };

  const updateQuantity = (eventId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(eventId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === eventId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkout = async () => {
    if (!user || cart.length === 0) {
      throw new Error("User not logged in or cart is empty.");
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 1. Create an order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id: user.id, total_price: total })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create order items
    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      event_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // If items fail, try to delete the order to avoid orphaned records
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw itemsError;
    }

    // 3. Clear cart
    clearCart();

    return orderData;
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
