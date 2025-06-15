import React from 'react';
import { Package, Truck, AlertTriangle, Settings } from 'lucide-react';
import { ActivityFeedItem } from '../../types';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, maxItems = 5 }) => {
  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'reorder':
        return <Package className="w-4 h-4" />;
      case 'delivery':
        return <Truck className="w-4 h-4" />;
      case 'stockout':
        return <AlertTriangle className="w-4 h-4" />;
      case 'adjustment':
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ActivityFeedItem['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      
      <div className="space-y-4">
        {displayActivities.map((activity, index) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(activity.status)}`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};