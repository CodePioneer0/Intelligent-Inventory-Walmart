import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Alert } from '../../types';
import { useInventoryStore } from '../../store/useInventoryStore';

interface AlertPanelProps {
  alerts: Alert[];
  maxItems?: number;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, maxItems = 5 }) => {
  const { dismissAlert } = useInventoryStore();

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
    }
  };

  const displayAlerts = alerts.slice(0, maxItems);

  if (displayAlerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Priority Alerts
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No active alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Priority Alerts ({alerts.length})
      </h3>
      
      <div className="space-y-3">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertBgColor(alert.type)} relative group`}
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {alert.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {alert.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {alert.timestamp.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            View all {alerts.length} alerts
          </button>
        </div>
      )}
    </div>
  );
};