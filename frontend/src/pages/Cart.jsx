import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, AlertCircle, CheckCircle } from 'lucide-react';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, checkout, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await checkout();
      setSuccess('Order placed successfully! You will be redirected shortly.');
      setTimeout(() => {
        navigate('/user/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {cart.length === 0 && !success ? (
          <div className="text-center bg-white rounded-xl shadow-md p-12">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven&apos;t added any events to your cart yet.</p>
            <Link to="/events" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md">
            <ul className="divide-y divide-gray-200">
              {cart.map(item => (
                <li key={item.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <p className="font-bold text-lg text-gray-900">{item.name}</p>
                      <p className="text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="w-16 text-center border-gray-300 rounded-md"
                    />
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-6 bg-gray-50 rounded-b-xl">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xl font-bold text-gray-900">Subtotal</p>
                <p className="text-2xl font-bold text-gray-900">${subtotal.toFixed(2)}</p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading || success}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
