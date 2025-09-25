import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Store, ShoppingBag, DollarSign, BarChart3 } from 'lucide-react';
import { db } from '../../lib/supabase';
import PageHeader from '../../components/UI/PageHeader';
import Spinner from '../../components/UI/Spinner';

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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await db.adminGetDashboardStats();
        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Users', value: stats?.total_users || 0 },
    { name: 'Vendors', value: stats?.total_vendors || 0 },
    { name: 'Products', value: stats?.total_products || 0 },
    { name: 'Orders', value: stats?.total_orders || 0 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Overview of the system" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users} title="Total Users" value={stats?.total_users || 0} color="bg-blue-500" />
        <StatCard icon={Store} title="Total Vendors" value={stats?.total_vendors || 0} color="bg-purple-500" />
        <StatCard icon={ShoppingBag} title="Total Products" value={stats?.total_products || 0} color="bg-green-500" />
        <StatCard icon={DollarSign} title="Total Sales" value={`$${(stats?.total_sales || 0).toLocaleString()}`} color="bg-yellow-500" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          System Overview
        </h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip wrapperStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
