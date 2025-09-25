import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import PageHeader from '../../components/UI/PageHeader';
import Spinner from '../../components/UI/Spinner';
import { Store, FileText } from 'lucide-react';

const VendorProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchVendorProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await db.getVendor(user.id);
      if (error) throw error;
      setVendor(data);
      reset(data); // Populate form with fetched data
    } catch (error) {
      toast.error('Failed to load vendor profile.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, reset]);

  useEffect(() => {
    if (!authLoading) {
      fetchVendorProfile();
    }
  }, [authLoading, fetchVendorProfile]);

  const onSubmit = async (data) => {
    if (!vendor) return;
    setIsSubmitting(true);
    try {
      const { error } = await db.updateVendor(vendor.id, {
        business_name: data.business_name,
        business_description: data.business_description,
      });
      if (error) throw error;
      toast.success('Vendor profile updated successfully!');
      fetchVendorProfile(); // Re-fetch to confirm update
    } catch (error) {
      toast.error('Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div>
        <PageHeader title="Vendor Profile" />
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold">Vendor profile not found.</h2>
          <p className="text-gray-600 mt-2">There might be an issue with your vendor account.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Vendor Profile" subtitle="Manage your business information" />
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Business Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Store className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="business_name"
                {...register('business_name', { required: 'Business name is required' })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>}
          </div>
          <div>
            <label htmlFor="business_description" className="block text-sm font-medium text-gray-700">Business Description</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <textarea
                id="business_description"
                rows="4"
                {...register('business_description')}
                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="Tell customers about your business..."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? <Spinner size="h-5 w-5" color="border-white" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorProfile;
