import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/UI/PageHeader';
import Spinner from '../../components/UI/Spinner';
import { ShoppingBag, DollarSign, ClipboardList } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, color }) => (
  <motion.div 
    className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4"
    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
  >
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </motion.div>
);

const VendorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: vendorData, error: vendorError } = await db.getVendor(user.id);
      if (vendorError) throw vendorError;
      if (!vendorData) {
        toast.error("Could not find vendor details.");
        return;
      }
      
      const { data, error } = await db.vendorGetDashboardStats(vendorData.id);
      if (error) throw error;
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Vendor Dashboard" subtitle="Your business at a glance" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={ShoppingBag} title="Total Products" value={stats?.total_products || 0} color="bg-blue-500" />
        <StatCard icon={ClipboardList} title="Total Orders" value={stats?.total_orders || 0} color="bg-purple-500" />
        <StatCard icon={DollarSign} title="Total Revenue" value={`$${(stats?.total_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="bg-green-500" />
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold">Welcome to your Vendor Dashboard!</h2>
        <p className="text-gray-600 mt-2">Here's a quick overview of your store's performance. Use the sidebar to manage your products and orders.</p>
      </div>
    </div>
  );
};

export default VendorDashboard;
