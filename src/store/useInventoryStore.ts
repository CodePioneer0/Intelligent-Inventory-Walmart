import { create } from 'zustand';
import { Product, Alert, ForecastData, ActivityFeedItem, AnalyticsData } from '../types';

interface InventoryState {
  products: Product[];
  alerts: Alert[];
  forecastData: ForecastData[];
  activityFeed: ActivityFeedItem[];
  analyticsData: AnalyticsData | null;
  darkMode: boolean;
  sidebarCollapsed: boolean;
  selectedProducts: string[];
  filterOptions: {
    category: string;
    velocity: string;
    riskLevel: string;
    supplier: string;
  };
  
  // Actions
  setProducts: (products: Product[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  setAlerts: (alerts: Alert[]) => void;
  dismissAlert: (id: string) => void;
  setForecastData: (data: ForecastData[]) => void;
  setActivityFeed: (feed: ActivityFeedItem[]) => void;
  setAnalyticsData: (data: AnalyticsData) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSelectedProducts: (ids: string[]) => void;
  updateFilterOptions: (filters: Partial<InventoryState['filterOptions']>) => void;
  resetFilters: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  alerts: [],
  forecastData: [],
  activityFeed: [],
  analyticsData: null,
  darkMode: false,
  sidebarCollapsed: false,
  selectedProducts: [],
  filterOptions: {
    category: '',
    velocity: '',
    riskLevel: '',
    supplier: '',
  },

  setProducts: (products) => set({ products }),
  
  updateProduct: (id, updates) => set((state) => ({
    products: state.products.map(product => 
      product.id === id ? { ...product, ...updates } : product
    )
  })),

  setAlerts: (alerts) => set({ alerts }),
  
  dismissAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(alert => alert.id !== id)
  })),

  setForecastData: (forecastData) => set({ forecastData }),
  setActivityFeed: (activityFeed) => set({ activityFeed }),
  setAnalyticsData: (analyticsData) => set({ analyticsData }),
  
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setSelectedProducts: (selectedProducts) => set({ selectedProducts }),
  
  updateFilterOptions: (filters) => set((state) => ({
    filterOptions: { ...state.filterOptions, ...filters }
  })),
  
  resetFilters: () => set({
    filterOptions: {
      category: '',
      velocity: '',
      riskLevel: '',
      supplier: '',
    }
  }),
}));