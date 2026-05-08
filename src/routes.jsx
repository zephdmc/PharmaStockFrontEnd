// frontend/src/routes.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Import all pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PosDashboard from './pages/PosDashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

// Route configuration object
export const routes = {
  public: [
    { path: '/login', element: <LoginPage />, name: 'Login' },
    { path: '/unauthorized', element: <Unauthorized />, name: 'Unauthorized' },
  ],
  protected: [
    { 
      path: '/admin/*', 
      element: <AdminDashboard />, 
      roles: ['admin'], 
      name: 'Admin Dashboard' 
    },
    { 
      path: '/pos/*', 
      element: <PosDashboard />, 
      roles: ['admin', 'pos_agent'], 
      name: 'POS Terminal' 
    },
  ],
  fallback: [
    { path: '/', redirect: '/login', name: 'Home' },
    { path: '*', element: <NotFound />, name: 'Not Found' },
  ],
};

// Protected route wrapper component
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Public route wrapper (redirects to dashboard if authenticated)
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'pos_agent') {
      return <Navigate to="/pos" replace />;
    }
  }
  
  return children;
};

// Helper to generate route elements
export const generateRoutes = () => {
  const allRoutes = [];
  
  // Add public routes
  routes.public.forEach(route => {
    allRoutes.push({
      ...route,
      element: <PublicRoute>{route.element}</PublicRoute>,
    });
  });
  
  // Add protected routes
  routes.protected.forEach(route => {
    allRoutes.push({
      ...route,
      element: (
        <ProtectedRoute allowedRoles={route.roles}>
          {route.element}
        </ProtectedRoute>
      ),
    });
  });
  
  // Add fallback routes
  routes.fallback.forEach(route => {
    if (route.redirect) {
      allRoutes.push({
        path: route.path,
        element: <Navigate to={route.redirect} replace />,
      });
    } else {
      allRoutes.push(route);
    }
  });
  
  return allRoutes;
};

// Navigation items configuration
export const navigationItems = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', exact: true },
    { to: '/admin/products', label: 'Products', icon: 'Package' },
    { to: '/admin/inventory', label: 'Inventory', icon: 'Boxes' },
    { to: '/admin/stock-adjustment', label: 'Stock Adjustment', icon: 'AlertTriangle' },
    { to: '/admin/sales-history', label: 'Sales History', icon: 'ClipboardList' },
    { to: '/admin/users', label: 'User Management', icon: 'Users' },
    { to: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
    { to: '/admin/settings', label: 'Settings', icon: 'Settings' },
  ],
  pos: [
    { to: '/pos', label: 'POS Terminal', icon: 'ShoppingCart', exact: true },
    { to: '/pos/history', label: 'Sales History', icon: 'ClipboardList' },
    { to: '/pos/products', label: 'Products', icon: 'Package' },
  ],
};

// Breadcrumb configuration
export const breadcrumbMap = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/products/new': 'Add Product',
  '/admin/inventory': 'Inventory',
  '/admin/stock-adjustment': 'Stock Adjustment',
  '/admin/sales-history': 'Sales History',
  '/admin/users': 'Users',
  '/admin/reports': 'Reports',
  '/pos': 'POS Terminal',
  '/pos/history': 'Sales History',
  '/pos/products': 'Products',
};

// Generate breadcrumbs from path
export const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(p => p);
  const breadcrumbs = [];
  let currentPath = '';
  
  for (const path of paths) {
    currentPath += `/${path}`;
    const label = breadcrumbMap[currentPath] || path.charAt(0).toUpperCase() + path.slice(1);
    breadcrumbs.push({ path: currentPath, label });
  }
  
  return breadcrumbs;
};

// Check if route is active
export const isRouteActive = (currentPath, routePath, exact = false) => {
  if (exact) {
    return currentPath === routePath;
  }
  return currentPath.startsWith(routePath);
};

// Get page title from route
export const getPageTitle = (pathname) => {
  const defaultTitle = 'PharmaInventory';
  const titles = {
    '/login': 'Login - PharmaInventory',
    '/admin': 'Admin Dashboard - PharmaInventory',
    '/admin/products': 'Products - PharmaInventory',
    '/admin/inventory': 'Inventory - PharmaInventory',
    '/admin/users': 'User Management - PharmaInventory',
    '/pos': 'POS Terminal - PharmaInventory',
    '/unauthorized': 'Unauthorized Access - PharmaInventory',
    '/404': 'Page Not Found - PharmaInventory',
  };
  
  return titles[pathname] || defaultTitle;
};

// Update document title when route changes
export const updateDocumentTitle = (pathname) => {
  document.title = getPageTitle(pathname);
};

// Export all routes as default
export default {
  routes,
  ProtectedRoute,
  PublicRoute,
  generateRoutes,
  navigationItems,
  getBreadcrumbs,
  isRouteActive,
  getPageTitle,
  updateDocumentTitle,
};