import React, { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../components/ui/MetricCard';
import { AlertPanel } from '../components/ui/AlertPanel';
import { ActivityFeed } from '../components/ui/ActivityFeed';
import { ChartContainer } from '../components/ui/ChartContainer';
import { useInventoryStore } from '../store/useInventoryStore';
import { mockKPIMetrics, mockAlerts, mockActivityFeed } from '../data/mockData';

// Mock KPI data for the chart
const kpiChartData = [
  { time: '00:00', value: 85 },
  { time: '04:00', value: 78 },
  { time: '08:00', value: 92 },
  { time: '12:00', value: 88 },
  { time: '16:00', value: 95 },
  { time: '20:00', value: 91 },
  { time: '24:00', value: 89 },
];

export const Dashboard: React.FC = () => {
  const { setAlerts, setActivityFeed, alerts, activityFeed } = useInventoryStore();

  useEffect(() => {
    // Load initial data
    setAlerts(mockAlerts);
    setActivityFeed(mockActivityFeed);
  }, [setAlerts, setActivityFeed]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Real-time overview of your inventory management system
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockKPIMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            icon={metric.icon}
            className="hover:scale-105 transition-transform duration-200"
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Chart */}
        <ChartContainer
          title="Performance Overview (Last 24 Hours)"
          actions={
            <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kpiChartData}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="time" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Generate Reorder Report
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                34 items below threshold
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Update Forecast Model
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last updated 2h ago
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Export Weekly Summary
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                PDF & Excel formats
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Review Supplier Performance
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                3 suppliers pending review
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertPanel alerts={alerts} />
        <ActivityFeed activities={activityFeed} />
      </div>
    </div>
  );
};