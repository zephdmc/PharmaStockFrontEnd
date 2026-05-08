// frontend/src/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Shield, AlertCircle, Home, LogOut } from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

const Unauthorized = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const handleLogout = () => {
    dispatch(logout());
    toast.info('Please login with appropriate credentials');
    navigate('/login');
  };
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Access Denied</span>
          </div>
        </div>
        
        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator 
          if you believe this is a mistake.
        </p>
        
        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Home className="h-5 w-5" />
            <span>Go to Homepage</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout & Try Again</span>
          </button>
        </div>
        
        {/* Support Info */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            Need help? Contact your system administrator or support team.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Error Code: 403 - Forbidden Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;