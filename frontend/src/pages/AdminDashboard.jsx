import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Users, Calendar, ShoppingCart, DollarSign } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, events: 0, orders: 0 });
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [
        { data: usersData, error: usersError },
        { data: eventsData, error: eventsError },
        { data: ordersData, error: ordersError }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('events').select('*, profiles(business_name)'),
        supabase.from('orders').select('*, profiles(full_name), order_items(count)').order('created_at', { ascending: false })
      ]);

      if (usersError) console.error('Error fetching users:', usersError);
      else {
        setUsers(usersData);
        setStats(prev => ({ ...prev, users: usersData.length }));
      }

      if (eventsError) console.error('Error fetching events:', eventsError);
      else {
        setEvents(eventsData);
        setStats(prev => ({ ...prev, events: eventsData.length }));
      }

      if (ordersError) console.error('Error fetching orders:', ordersError);
      else {
        setOrders(ordersData);
        setStats(prev => ({ ...prev, orders: ordersData.length }));
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Platform overview and management.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <Users className="h-10 w-10 text-indigo-600" />
            <div>
              <p className="text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <Calendar className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <ShoppingCart className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Users List */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-6"><h2 className="text-2xl font-bold text-gray-900">Users</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 font-medium text-gray-600">Email</th>
                <th className="px-6 py-3 font-medium text-gray-600">Role</th>
              </tr></thead>
              <tbody>{users.map((user) => (<tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{user.full_name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></td>
              </tr>))}</tbody>
            </table></div>
          </div>

          {/* Events List */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-6"><h2 className="text-2xl font-bold text-gray-900">Events</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="px-6 py-3 font-medium text-gray-600">Vendor</th>
                <th className="px-6 py-3 font-medium text-gray-600">Price</th>
              </tr></thead>
              <tbody>{events.map((event) => (<tr key={event.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{event.name}</td>
                <td className="px-6 py-4 text-gray-600">{event.profiles?.business_name || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600">${event.price.toFixed(2)}</td>
              </tr>))}</tbody>
            </table></div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-xl shadow-md xl:col-span-2">
            <div className="p-6"><h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 font-medium text-gray-600">Order ID</th>
                <th className="px-6 py-3 font-medium text-gray-600">Customer</th>
                <th className="px-6 py-3 font-medium text-gray-600">Date</th>
                <th className="px-6 py-3 font-medium text-gray-600">Total</th>
              </tr></thead>
              <tbody>{orders.map((order) => (<tr key={order.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.id.substring(0, 8)}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{order.profiles?.full_name || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-gray-600">${order.total_price.toFixed(2)}</td>
              </tr>))}</tbody>
            </table></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
