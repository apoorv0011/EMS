import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PageHeader from '../../components/UI/PageHeader';
import Spinner from '../../components/UI/Spinner';
import { Package, ChevronDown, ChevronUp, User, Mail } from 'lucide-react';

const OrderStatusBadge = ({ status }) => {
  const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const VendorOrderItem = ({ order, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setIsUpdating(true);
    try {
      await db.updateOrderStatus(order.id, newStatus);
      onStatusChange(order.id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status.');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg border">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
          <div>
            <div className="text-xs text-gray-500">ORDER DATE</div>
            <div className="text-sm font-medium">{format(new Date(order.created_at), 'PPP')}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">CUSTOMER</div>
            <div className="text-sm font-medium">{order.customer.full_name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">TOTAL</div>
            <div className="text-sm font-medium">${order.vendor_total.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">STATUS</div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-4 hidden md:inline">#{order.id.split('-')[0]}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      {isOpen && (
        <div className="border-t p-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Items in this order:</h4>
            <ul className="list-disc list-inside space-y-1">
              {order.items.map((item, index) => (
                <li key={index} className="text-sm text-gray-700">
                  {item.product_name} (x{item.quantity}) - ${item.price.toFixed(2)} each
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Customer Details:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="flex items-center"><User className="w-4 h-4 mr-2" /> {order.customer.full_name}</p>
              <p className="flex items-center"><Mail className="w-4 h-4 mr-2" /> {order.customer.email}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Shipping Address:</h4>
            <div className="text-sm text-gray-700">
              <p>{order.shipping_details.address}</p>
              <p>{order.shipping_details.city}, {order.shipping_details.postalCode}</p>
              <p>{order.shipping_details.country}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Update Order Status</label>
            <select
              value={order.status}
              onChange={handleStatusChange}
              disabled={isUpdating}
              className="mt-1 block w-full md:w-1/3 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

const VendorOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVendorOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: vendorData, error: vendorError } = await db.getVendor(user.id);
      if (vendorError) throw vendorError;
      
      if (vendorData) {
        const { data, error } = await db.getVendorOrders(vendorData.id);
        if (error) throw error;
        setOrders(data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch your orders.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVendorOrders();
  }, [fetchVendorOrders]);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Orders" subtitle="View and manage orders for your products" />
      <div className="bg-white p-6 rounded-lg shadow-md">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400" />
            <h2 className="text-2xl font-semibold mt-4">No orders yet</h2>
            <p className="text-gray-500 mt-2">When a customer purchases your products, their order will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <VendorOrderItem key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOrders;
