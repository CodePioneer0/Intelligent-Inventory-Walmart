export interface Product {
  id: string;
  name: string;
  category: Category;
  currentStock: number;
  predictedDemand: number;
  reorderPoint: number;
  optimalStock: number;
  supplier: Supplier;
  location: Location;
  velocity: 'HIGH' | 'MEDIUM' | 'LOW';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  lastUpdated: Date;
  unitPrice: number;
  totalValue: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string;
  rating: number;
}

export interface Location {
  id: string;
  name: string;
  warehouse: string;
  zone: string;
}

export interface KPIMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  productId?: string;
}

export interface ForecastData {
  date: string;
  actual: number;
  predicted: number;
  optimized: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'reorder' | 'stockout' | 'delivery' | 'adjustment';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface AnalyticsData {
  categoryDistribution: Array<{ name: string; value: number; color: string }>;
  turnoverMetrics: Array<{ period: string; revenue: number; cost: number; profit: number }>;
  performanceScores: {
    accuracy: number;
    efficiency: number;
    costOptimization: number;
    serviceLevel: number;
  };
}