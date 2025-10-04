import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const UserDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-md p-12">
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {profile?.full_name}!</h1>
          <p className="mt-4 text-lg text-gray-600">
            You are logged in as a customer. You can browse all available events from our vendors.
          </p>
          <Link
            to="/events"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
          >
            <Calendar className="h-6 w-6" />
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
