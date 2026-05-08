// frontend/src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, Package, ShoppingCart, Menu, X, ChevronDown } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  const getRoleBadge = () => {
    switch(user?.role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Admin</span>;
      case 'pos_agent':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">POS Agent</span>;
      default:
        return null;
    }
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section - Menu button and logo */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none lg:hidden"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex-shrink-0 flex items-center ml-4">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800 hidden sm:inline">
                PharmaInventory
              </span>
            </div>
          </div>
          
          {/* Center section - Page title (optional) */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <h1 className="text-gray-600 font-medium">
              Pharmacy Inventory Management System
            </h1>
          </div>
          
          {/* Right section - User menu */}
          <div className="flex items-center space-x-4">
            {/* Quick actions based on role */}
            {user?.role === 'pos_agent' && (
              <button
                onClick={() => navigate('/pos')}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="POS Terminal"
              >
                <ShoppingCart size={20} />
              </button>
            )}
            
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="Dashboard"
              >
                <Settings size={20} />
              </button>
            )}
            
            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
                <ChevronDown size={16} className="hidden md:inline text-gray-500" />
              </button>
              
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-1">{getRoleBadge()}</div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User size={16} className="mr-2" />
                      Profile Settings
                    </button>
                    
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Settings size={16} className="mr-2" />
                        System Settings
                      </button>
                    )}
                    
                    <hr className="my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;