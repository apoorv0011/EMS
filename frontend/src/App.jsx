import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Events from './pages/Events';
import Cart from './pages/Cart';
import Unauthorized from './pages/Unauthorized';
import LoadingSpinner from './components/LoadingSpinner';

const DashboardRouter = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  switch (profile.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'vendor':
      return <Navigate to="/vendor/dashboard" replace />;
    default:
      return <Navigate to="/user/dashboard" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/events" element={<Events />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              <Route
                path="/user/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/vendor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                    <VendorDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cart"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <Cart />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<DashboardRouter />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
