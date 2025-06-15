import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Forecasting } from './pages/Forecasting';
import { Analytics } from './pages/Analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="forecasting" element={<Forecasting />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports - Coming Soon</h1></div>} />
              <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings - Coming Soon</h1></div>} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;