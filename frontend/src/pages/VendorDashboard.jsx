import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { Calendar, Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EventForm from './EventForm';

const VendorDashboard = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const fetchVendorData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const [eventsResponse, ordersResponse] = await Promise.all([
      supabase.from('events').select('*').eq('vendor_id', profile.id).order('date', { ascending: false }),
      supabase.from('order_items').select('*, orders!inner(created_at, profiles(full_name)), events!inner(name)').eq('events.vendor_id', profile.id)
    ]);

    if (eventsResponse.error) console.error('Error fetching events:', eventsResponse.error);
    else setEvents(eventsResponse.data);

    if (ordersResponse.error) console.error('Error fetching orders:', ordersResponse.error);
    else setOrders(ordersResponse.data);
    
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const handleSaveEvent = async (eventData) => {
    if (!profile?.id) {
      alert("Could not save event: user profile not found. Please try logging out and in again.");
      return;
    }

    const price = parseFloat(eventData.price);
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price for the event.');
      return;
    }

    const dataToSave = {
      name: eventData.name,
      description: eventData.description,
      date: eventData.date,
      price: price,
    };

    let result;
    if (editingEvent) {
      result = await supabase
        .from('events')
        .update(dataToSave)
        .eq('id', editingEvent.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('events')
        .insert([{ ...dataToSave, vendor_id: profile.id }])
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      console.error('Error saving event:', error);
      alert(`There was an error saving the event: ${error.message}`);
    } else if (!data) {
      // This handles the specific case where RLS fails silently
      console.error('Save operation returned no data and no error. This is likely an RLS policy issue.');
      alert('Failed to save the event. You may not have the required permissions. Please contact support.');
    } else {
      if (editingEvent) {
        // Update the event in the local state
        setEvents(prevEvents => prevEvents.map(e => e.id === data.id ? data : e));
      } else {
        // Add the new event to the top of the local state
        setEvents(prevEvents => [data, ...prevEvents]);
      }
      setShowForm(false);
      setEditingEvent(null);
    }
  };
  
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      
      if (error) {
        console.error('Error deleting event:', error);
        alert(`Failed to delete the event: ${error.message}`);
      } else {
        setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your events for {profile?.business_name}</p>
          </div>
          <button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus className="h-5 w-5" />
            Add Event
          </button>
        </div>

        {showForm && <EventForm event={editingEvent} onSave={handleSaveEvent} onCancel={() => { setShowForm(false); setEditingEvent(null); }} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md">
            <div className="p-6"><h2 className="text-2xl font-bold text-gray-900">Your Events</h2></div>
            {events.length > 0 ? (
              <div className="overflow-x-auto"><table className="w-full text-sm text-left">
                <thead className="bg-gray-50"><tr>
                  <th className="px-6 py-3 font-medium text-gray-600">Name</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Price</th>
                  <th className="px-6 py-3 font-medium text-gray-600 text-right">Actions</th>
                </tr></thead>
                <tbody>{events.map((event) => (<tr key={event.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{event.name}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(event.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-600">${event.price.toFixed(2)}</td>
                  <td className="px-6 py-4 flex justify-end space-x-2">
                    <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="h-5 w-5" /></button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="h-5 w-5" /></button>
                  </td>
                </tr>))}</tbody>
              </table></div>
            ) : (
              <div className="text-center py-16"><Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-600">You haven&apos;t added any events yet.</p><button onClick={() => setShowForm(true)} className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium">Add your first event</button></div>
            )}
          </div>
          
          <div className="lg:col-span-1 bg-white rounded-xl shadow-md">
            <div className="p-6"><h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2></div>
            {orders.length > 0 ? (
              <div className="overflow-y-auto max-h-[600px]">
                <ul className="divide-y divide-gray-200">
                  {orders.map(order => (
                    <li key={order.id} className="p-4 hover:bg-gray-50">
                      <p className="font-semibold text-gray-800">{order.events.name}</p>
                      <p className="text-sm text-gray-600">Customer: {order.orders.profiles.full_name}</p>
                      <p className="text-sm text-gray-500">Quantity: {order.quantity} @ ${order.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">On: {new Date(order.orders.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-16"><ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-600">No orders for your events yet.</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
