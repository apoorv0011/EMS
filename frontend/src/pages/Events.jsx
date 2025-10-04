import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useCart } from '../context/CartContext';
import { Calendar, DollarSign, ShoppingCart, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedEventId, setAddedEventId] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles(business_name)')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const handleAddToCart = (event) => {
    addToCart(event);
    setAddedEventId(event.id);
    setTimeout(() => setAddedEventId(null), 2000); // Hide message after 2 seconds
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h1>
          <p className="text-lg text-gray-600">Browse our collection of amazing events from various vendors.</p>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300">
                <div className="p-6">
                  <p className="text-sm text-indigo-600 font-semibold mb-1">{event.profiles?.business_name || 'Event'}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <p className="text-gray-600 mb-4 h-20 overflow-hidden">{event.description}</p>
                </div>
                <div className="p-6 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center text-green-600">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-2xl font-bold">{event.price.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(event)}
                    className={`px-4 py-2 rounded-lg font-semibold flex items-center justify-center transition-colors w-36 ${
                      addedEventId === event.id
                        ? 'bg-green-500 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {addedEventId === event.id ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-xl shadow-md p-12">
            <Calendar className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Events Yet</h2>
            <p className="text-gray-600">
              Our vendors are busy preparing their events. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
