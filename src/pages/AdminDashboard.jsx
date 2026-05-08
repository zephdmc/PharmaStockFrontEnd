// frontend/src/pages/AdminDashboard.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Dashboard from '../components/admin/Dashboard';
import UserManagement from '../components/admin/UserManagement';
import ProductForm from '../components/admin/ProductForm';
import ProductList from '../components/admin/ProductList';
import StockAdjustment from '../components/admin/StockAdjustment';
import InventoryReport from '../components/admin/InventoryReport';
import SalesHistory from '../components/admin/SalesHistory';
import Unauthorized from './Unauthorized';
import CategoryManagement from '../components/admin/CategoryManagement'; // Add this import

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Check if user has admin access
  if (user?.role !== 'admin') {
    return <Unauthorized />;
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="inventory" element={<StockAdjustment />} />
            <Route path="categories" element={<CategoryManagement />} /> {/* Add this route */}
            <Route path="stock-adjustment" element={<StockAdjustment />} />
            <Route path="inventory-report" element={<InventoryReport />} />
            <Route path="reports" element={<InventoryReport />} />
            <Route path="sales-history" element={<SalesHistory />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<div className="p-6">Settings Page (Coming Soon)</div>} />
            <Route path="*" element={<div className="p-6 text-center text-gray-500">Page not found</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;