// frontend/src/components/common/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, ClipboardList, Settings, AlertTriangle,
  FileText, TrendingUp, Boxes, CreditCard, Grid,
  LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Actual width for desktop (expanded or icon-only)
  const desktopWidth = isDesktopCollapsed ? 'w-20' : 'w-64';
  
  // For mobile, the sidebar uses isOpen to toggle overlay
  const showMobileSidebar = isMobile && isOpen;
  const showDesktopSidebar = !isMobile;

  const adminMenus = [
    { path: '/admin', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', name: 'Products', icon: Package },
    { path: '/admin/categories', name: 'Categories', icon: Grid },
    { path: '/admin/inventory', name: 'Inventory', icon: Boxes },
    { path: '/admin/sales-history', name: 'Sales History', icon: ClipboardList },
    { path: '/admin/users', name: 'User Management', icon: Users },
    { path: '/admin/reports', name: 'Reports', icon: BarChart3 },
  ];
  
  const posMenus = [
    { path: '/pos', name: 'POS Terminal', icon: ShoppingCart },
    { path: '/pos/history', name: 'Today\'s Sales', icon: ClipboardList },
    { path: '/pos/products', name: 'Product Catalog', icon: Package },
    { path: '/pos/receipts', name: 'Receipts', icon: FileText },
  ];
  
  const menus = user?.role === 'admin' ? adminMenus : posMenus;

  // Sidebar content (reused)
  const SidebarContent = () => (
    <>
      {/* Logo area */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-gray-700">
        {(!isMobile && !isDesktopCollapsed) || (isMobile && isOpen) ? (
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            PharmaStock
          </span>
        ) : (
          <Package className="h-8 w-8 text-blue-400 mx-auto" />
        )}
        {/* Desktop collapse button */}
        {!isMobile && (
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="text-gray-400 hover:text-white transition"
          >
            {isDesktopCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>
      
      {/* User info */}
      {((!isMobile && !isDesktopCollapsed) || (isMobile && isOpen)) && user && (
        <div className="p-4 border-b border-gray-700">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-gray-400 mt-1">{user.email}</p>
          <span className="inline-block mt-2 text-xs bg-gray-700 px-2 py-1 rounded">
            {user.role === 'admin' ? 'Administrator' : 'POS Agent'}
          </span>
        </div>
      )}
      
      {/* Navigation menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menus.map((menu) => {
            const Icon = menu.icon;
            const showLabel = (!isMobile && !isDesktopCollapsed) || (isMobile && isOpen);
            return (
              <li key={menu.path}>
                <NavLink
                  to={menu.path}
                  onClick={() => { if (isMobile) setIsOpen(false); }}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2 rounded-lg transition-colors
                    ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    ${!showLabel ? 'justify-center' : ''}
                  `}
                  title={!showLabel ? menu.name : ''}
                >
                  <Icon size={20} />
                  {showLabel && <span className="ml-3">{menu.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Logout button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className={`
            flex items-center w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors
            ${((!isMobile && !isDesktopCollapsed) || (isMobile && isOpen)) ? '' : 'justify-center'}
          `}
        >
          <LogOut size={20} />
          {((!isMobile && !isDesktopCollapsed) || (isMobile && isOpen)) && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay background */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white z-30
          transition-all duration-300 ease-in-out
          ${showMobileSidebar ? 'translate-x-0 w-64' : isMobile ? '-translate-x-full w-64' : desktopWidth}
        `}
        style={{ boxShadow: isMobile && showMobileSidebar ? '0 0 15px rgba(0,0,0,0.2)' : 'none' }}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;