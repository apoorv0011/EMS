import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../components/UI/PageHeader';
import Spinner from '../components/UI/Spinner';
import { CreditCard, Lock } from 'lucide-react';

const Checkout = () => {
  const { cartItems, getTotalPrice, fetchCartItems } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: profile?.full_name || '',
      email: user?.email || '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const shippingDetails = {
      fullName: data.fullName,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
    };

    try {
      const { data: orderId, error } = await db.createOrderFromCart(shippingDetails);
      if (error) throw error;
      if (!orderId) throw new Error("Checkout failed. Your cart might be empty.");

      toast.success('Order placed successfully!');
      await fetchCartItems(); // Re-fetch cart to confirm it's empty
      navigate('/orders');
    } catch (error) {
      toast.error(error.message || 'There was an issue placing your order.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !isSubmitting) {
    return <Navigate to="/products" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Checkout" subtitle="Complete your purchase" />
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping & Payment Details */}
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Shipping & Payment</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Shipping Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input {...register('fullName', { required: 'Full name is required' })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" {...register('email', { required: 'Email is required' })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input {...register('address', { required: 'Address is required' })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input {...register('city', { required: 'City is required' })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input {...register('postalCode', { required: 'Postal code is required' })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input {...register('country', { required: 'Country is required' })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-medium text-gray-800">Payment Details</h3>
            <div className="mt-4 bg-gray-100 p-4 rounded-lg">
              <p className="text-center text-gray-600">
                This is a demo. No real payment will be processed.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-8 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-semibold border-b pb-4 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{item.products.name} x {item.quantity}</span>
                <span className="font-medium">${(item.products.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? <Spinner size="h-5 w-5" color="border-white" /> : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Place Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
