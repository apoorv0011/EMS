import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
