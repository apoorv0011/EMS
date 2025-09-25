import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import PageHeader from '../components/UI/PageHeader';
import Spinner from '../components/UI/Spinner';
import { Trash2, Plus, Minus } from 'lucide-react';

const Cart = () => {
  const { cartItems, loading, updateCartItem, removeFromCart, getTotalPrice, getTotalItems } = useCart();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Your Shopping Cart" subtitle={`You have ${getTotalItems()} items in your cart`} />
      
      {cartItems.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <Link to="/products" className="text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center border-b py-4 last:border-b-0">
                <img src={item.products.image_url} alt={item.products.name} className="w-24 h-24 object-cover rounded-lg mr-4"/>
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.products.name}</h3>
                  <p className="text-sm text-gray-500">Price: ${item.products.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => updateCartItem(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="mx-4 font-semibold">{item.quantity}</span>
                  <button onClick={() => updateCartItem(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="ml-8 text-lg font-semibold">
                  ${(item.products.price * item.quantity).toFixed(2)}
                </div>
                <button onClick={() => removeFromCart(item.id)} className="ml-8 text-red-500 hover:text-red-700">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-semibold border-b pb-4 mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-4">
              <span>Total</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <Link to="/checkout">
              <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
