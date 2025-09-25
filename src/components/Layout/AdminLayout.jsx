import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BarChart3, Users, Store, ShoppingBag, FileText, Settings } from 'lucide-react';

const adminNavLinks = [
  { to: '/admin/dashboard', icon: BarChart3, text: 'Dashboard' },
  { to: '/admin/users', icon: Users, text: 'Users' },
  { to: '/admin/vendors', icon: Store, text: 'Vendors' },
  { to: '/admin/products', icon: ShoppingBag, text: 'Products' },
  { to: '/admin/orders', icon: ShoppingBag, text: 'Orders' },
  { to: '/admin/reports', icon: FileText, text: 'Reports' },
];

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="mt-4">
          {adminNavLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 ${
                  isActive ? 'bg-blue-100 text-blue-700 font-semibold border-r-4 border-blue-600' : ''
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

export default AdminLayout;
