import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, Users, FileText, Settings, Menu, ChevronLeft, Home, CreditCard, Bell, Car, UserCircle } from 'lucide-react';
import clsx from 'clsx';
import { useProfile } from '../context/ProfileContext';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { adminProfile, societySettings } = useProfile();

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Flat Management', icon: Building2, path: '/flats' },
    { name: 'Charge & Expense', icon: CreditCard, path: '/expenses' },
    { name: 'Ledger', icon: FileText, path: '/ledger' },
    { name: 'Notice Management', icon: Bell, path: '/notices' },
    { name: 'Parking Management', icon: Car, path: '/parking' },
    { name: 'Reports', icon: FileText, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const currentRouteName = navItems.find(item => location.pathname.startsWith(item.path) && item.path !== '/')?.name || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              {societySettings?.logoUrl ? (
                <img src={societySettings.logoUrl} alt="Logo" className="w-8 h-8 rounded object-contain shrink-0" />
              ) : (
                <Building2 size={24} className="text-indigo-600 shrink-0" />
              )}
              <span className="font-bold text-sm text-gray-900 truncate" title={societySettings?.name}>
                {societySettings?.name || 'Loading...'}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 focus:outline-none shrink-0"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
              title={!isSidebarOpen ? item.name : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">{currentRouteName}</h1>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{adminProfile?.fullName || 'Loading...'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="h-9 w-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <UserCircle size={24} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
