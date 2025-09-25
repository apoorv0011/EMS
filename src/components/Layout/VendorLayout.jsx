import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ClipboardList, UserCog } from 'lucide-react';

const vendorNavLinks = [
  { to: '/vendor/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
  { to: '/vendor/products', icon: ShoppingBag, text: 'My Products' },
  { to: '/vendor/orders', icon: ClipboardList, text: 'My Orders' },
  { to: '/vendor/profile', icon: UserCog, text: 'My Profile' },
];

const VendorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">Vendor Portal</h2>
        </div>
        <nav className="mt-4">
          {vendorNavLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-200 ${
                  isActive ? 'bg-purple-100 text-purple-700 font-semibold border-r-4 border-purple-600' : ''
                }`
              }
            >
              <link.icon className="w-5 h-5 mr-3" />
              <span>{link.text}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
