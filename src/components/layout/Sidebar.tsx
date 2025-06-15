import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  PieChart, 
  Settings, 
  ChevronLeft,
  Home
} from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Forecasting', href: '/forecasting', icon: TrendingUp },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, darkMode } = useInventoryStore();

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 flex flex-col
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
      bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300 ease-in-out
    `}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              IIMS
            </span>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
            sidebarCollapsed ? 'rotate-180' : ''
          }`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => `
              flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
              ${sidebarCollapsed ? 'justify-center' : 'gap-3'}
            `}
            title={sidebarCollapsed ? item.name : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="truncate">{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            v1.0.0 • {new Date().getFullYear()}
          </div>
        </div>
      )}
    </div>
  );
};