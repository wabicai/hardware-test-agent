import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SDKProvider } from './contexts/SDKContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TestRunner } from './pages/TestRunner';
import { Results } from './pages/Results';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <SDKProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="test" element={<TestRunner />} />
            <Route path="results" element={<Results />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </SDKProvider>
  );
}
