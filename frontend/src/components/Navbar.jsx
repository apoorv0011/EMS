import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LogOut, Menu, X, Package, LayoutDashboard, ShoppingCart } from 'lucide-react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'vendor':
        return '/vendor/dashboard';
      default:
        return '/user/dashboard';
    }
  };

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-800">
                EventHub
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/events" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
              Events
            </Link>
            
            {user ? (
              <>
                <Link to={getDashboardLink()} className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <div className="flex items-center space-x-4">
                  <Link to="/cart" className="relative text-gray-700 hover:text-indigo-600">
                    <ShoppingCart className="h-6 w-6" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                  <span className="font-medium text-gray-700">{profile?.full_name || 'Profile'}</span>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                  Login
                </Link>
                <Link to="/signup" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <Link to="/events" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 rounded-lg">
              Events
            </Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 rounded-lg">
                  Dashboard
                </Link>
                <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 rounded-lg">
                  Cart ({cartItemCount})
                </Link>
                <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 rounded-lg">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
