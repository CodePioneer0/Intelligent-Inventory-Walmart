import React, { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Target, Calendar, Download } from 'lucide-react';
import { ChartContainer } from '../components/ui/ChartContainer';
import { useInventoryStore } from '../store/useInventoryStore';
import { mockForecastData } from '../data/mockData';

export const Forecasting: React.FC = () => {
  const { forecastData, setForecastData } = useInventoryStore();

  useEffect(() => {
    setForecastData(mockForecastData);
  }, [setForecastData]);

  const accuracyMetrics = [
    { label: 'Overall Accuracy', value: '94.2%', change: '+2.1%', trend: 'up' as const },
    { label: 'Mean Absolute Error', value: '3.8%', change: '-0.5%', trend: 'down' as const },
    { label: 'Forecast Bias', value: '1.2%', change: '+0.3%', trend: 'up' as const },
    { label: 'Seasonal Index', value: '1.15', change: '+0.05', trend: 'up' as const },
  ];

  const aiRecommendations = [
    {
      id: '1',
      type: 'optimization',
      title: 'Stock Level Optimization',
      description: 'Reduce Wireless Bluetooth Headphones inventory by 15% to improve turnover',
      impact: 'Cost savings: $4,200',
      confidence: 94,
    },
    {
      id: '2',
      type: 'reorder',
      title: 'Reorder Point Adjustment',
      description: 'Increase Smart Fitness Tracker reorder point from 25 to 35 units',
      impact: 'Service level: +5.2%',
      confidence: 89,
    },
    {
      id: '3',
      type: 'seasonal',
      title: 'Seasonal Demand Pattern',
      description: 'Prepare for 40% increase in Organic Cotton T-Shirt demand next month',
      impact: 'Revenue opportunity: $12,800',
      confidence: 96,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Demand Forecasting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered predictions and optimization recommendations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Accuracy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accuracyMetrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {metric.value}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.trend === 'up' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <TrendingUp className={`w-4 h-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                <span>{metric.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Demand Forecast Chart */}
      <ChartContainer
        title="Demand Forecast Analysis"
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
            <select className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>All Products</option>
              <option>Electronics</option>
              <option>Clothing</option>
              <option>Home & Garden</option>
            </select>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
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
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10B981"
              strokeWidth={2}
              name="Actual Demand"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Predicted Demand"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="optimized"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Optimized Stock"
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* AI Recommendations and Seasonal Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Recommendations
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Target className="w-4 h-4" />
              <span>Updated 1h ago</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {aiRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {recommendation.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {recommendation.confidence}%
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {recommendation.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {recommendation.impact}
                  </span>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Seasonal Analysis
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Upcoming Seasonal Trends
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Electronics
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Black Friday preparation
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      +65%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Nov 2024
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Clothing
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Winter season demand
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      +25%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Dec 2024
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Historical Patterns
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    Q4
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Peak Season
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    +45%
                  </div>
                </div>
                <div className="text-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    Q1
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Low Season
                  </div>
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">
                    -20%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};