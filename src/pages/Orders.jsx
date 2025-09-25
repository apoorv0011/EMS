import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { format } from 'date-fns';
import PageHeader from '../components/UI/PageHeader';
import Spinner from '../components/UI/Spinner';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

const OrderItem = ({ order }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg border">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
          <div>
            <div className="text-xs text-gray-500">ORDER PLACED</div>
            <div className="text-sm font-medium">{format(new Date(order.created_at), 'PPP')}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">TOTAL</div>
            <div className="text-sm font-medium">${order.total_amount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">STATUS</div>
            <div className="text-sm font-medium capitalize">{order.status}</div>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-4 hidden md:inline">#{order.id.split('-')[0]}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      {isOpen && (
        <div className="border-t p-4">
          <h4 className="font-semibold mb-2">Items in this order:</h4>
          {order.order_items.map(item => (
            <div key={item.id} className="flex items-center py-2">
              <img src={item.products.image_url} alt={item.products.name} className="w-16 h-16 object-cover rounded-md mr-4" />
              <div>
                <p className="font-medium">{item.products.name}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity} @ ${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await db.getOrders(user.id);
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="My Orders" subtitle="Track your past and current orders" />
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400" />
            <h2 className="text-2xl font-semibold mt-4">No orders yet</h2>
            <p className="text-gray-500 mt-2">You haven't placed any orders. Let's change that!</p>
            <Link to="/products" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderItem key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
