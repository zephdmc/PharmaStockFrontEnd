// frontend/src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, ArrowLeft, Search, Package } from 'lucide-react';
import { logout } from '../redux/slices/authSlice';

const NotFound = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleGoHome = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.role === 'pos_agent') {
        navigate('/pos');
      } else {
        navigate('/');
      }
    } else {
      navigate('/login');
    }
  };
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const suggestions = [
    { path: '/admin', label: 'Admin Dashboard', roles: ['admin'] },
    { path: '/pos', label: 'POS Terminal', roles: ['admin', 'pos_agent'] },
    { path: '/admin/products', label: 'Product Management', roles: ['admin'] },
    { path: '/login', label: 'Login Page', roles: [] },
  ];
  
  const availableSuggestions = suggestions.filter(suggestion => 
    !suggestion.roles.length || (user && suggestion.roles.includes(user.role))
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Main Content */}
        <div className="text-center mb-8">
          {/* Animated 404 */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="text-9xl font-bold text-gray-200 select-none">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="h-20 w-20 text-blue-500 animate-bounce" />
              </div>
            </div>
          </div>
          
          {/* Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for products, sales, or inventory..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    toast.info('Search functionality coming soon');
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Home className="h-5 w-5" />
            <span>Homepage</span>
          </button>
          
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          )}
        </div>
        
        {/* Suggestions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            You might be looking for:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => navigate(suggestion.path)}
                className="text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition group"
              >
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                  {suggestion.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {suggestion.path}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            If you continue to experience issues, please contact support at{' '}
            <a href="mailto:support@pharmainventory.com" className="text-blue-600 hover:underline">
              support@pharmainventory.com
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Error Reference: 404 - Resource Not Found
          </p>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
      </div>
    </div>
  );
};

export default NotFound;