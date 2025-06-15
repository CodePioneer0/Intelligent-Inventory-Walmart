import React, { useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Package, Activity } from 'lucide-react';
import { ChartContainer } from '../components/ui/ChartContainer';
import { useInventoryStore } from '../store/useInventoryStore';
import { mockAnalyticsData } from '../data/mockData';

export const Analytics: React.FC = () => {
  const { analyticsData, setAnalyticsData } = useInventoryStore();

  useEffect(() => {
    setAnalyticsData(mockAnalyticsData);
  }, [setAnalyticsData]);

  if (!analyticsData) {
    return <div>Loading...</div>;
  }

  const performanceCards = [
    {
      title: 'Forecast Accuracy',
      value: `${analyticsData.performanceScores.accuracy}%`,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Operational Efficiency',
      value: `${analyticsData.performanceScores.efficiency}%`,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Cost Optimization',
      value: `${analyticsData.performanceScores.costOptimization}%`,
      icon: DollarSign,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'Service Level',
      value: `${analyticsData.performanceScores.serviceLevel}%`,
      icon: Package,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Last Year</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Performance Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceCards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <ChartContainer title="Inventory Distribution by Category">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analyticsData.categoryDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analyticsData.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Turnover Metrics */}
        <ChartContainer title="Revenue & Profit Analysis">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.turnoverMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="period" 
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
                formatter={(value) => [`$${value.toLocaleString()}`, '']}
              />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              <Bar dataKey="cost" fill="#EF4444" name="Cost" />
              <Bar dataKey="profit" fill="#10B981" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Performing Products
          </h3>
          
          <div className="space-y-4">
            {[
              { name: 'Wireless Bluetooth Headphones', revenue: '$125,400', growth: '+18%' },
              { name: 'Smart Fitness Tracker', revenue: '$89,200', growth: '+12%' },
              { name: 'Organic Cotton T-Shirt', revenue: '$67,800', growth: '+8%' },
              { name: 'Professional Kitchen Knife Set', revenue: '$45,600', growth: '+5%' },
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {product.revenue}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    {product.growth}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Inventory Health
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Stock Coverage
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  42 days
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Turnover Rate
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  8.7x/year
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Fill Rate
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  96.3%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Obsolete Stock
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  2.1%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-amber-600 h-2 rounded-full" style={{ width: '21%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cost Analysis
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Holding Costs
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  $24,500
                </div>
              </div>
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                +12%
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ordering Costs
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  $8,200
                </div>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                -5%
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Stockout Costs
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  $3,400
                </div>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                -18%
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Cost
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  $36,100
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};