import React from 'react';
import { Bell, Search, Sun, Moon, User } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, alerts } = useInventoryStore();
  const unreadAlerts = alerts.filter(alert => alert.type === 'critical').length;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search inventory, suppliers, or locations..."
              className="
                block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600
                rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400
              "
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Admin User
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                administrator
              </div>
            </div>
            <button className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};