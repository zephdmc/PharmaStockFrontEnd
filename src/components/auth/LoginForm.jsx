// frontend/src/components/auth/LoginForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Package, AlertCircle } from 'lucide-react';
import { login, clearError } from '../../redux/slices/authSlice';
import Loader, { ButtonLoader } from '../common/Loader';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  useEffect(() => {
    // Clear error when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'pos_agent') {
        navigate('/pos');
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific error when user starts typing
    if (error && touched[name]) {
      dispatch(clearError());
    }
  };
  
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Set all fields as touched to show errors
      setTouched({
        email: true,
        password: true
      });
      return;
    }
    
    // Track login attempts for security
    setLoginAttempts(prev => prev + 1);
    
    const result = await dispatch(login({
      email: formData.email,
      password: formData.password
    }));
    
    if (login.fulfilled.match(result)) {
      // Reset login attempts on success
      setLoginAttempts(0);
      
      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem('rememberEmail', formData.email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
    }
  };
  
  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);
  
  const errors = validateForm();
  const isLocked = loginAttempts >= 5; // Lock after 5 failed attempts
  
  return (
    <div className=" flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-full">
              <Package className="h-12 w-12 text-white" />
            </div>
          </div>
         
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your pharmacy management dashboard
          </p>
        </div>
        
        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Login Failed
                  </h3>
                  <div className="mt-1 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Security Lock Alert */}
          {isLocked && (
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Too many failed attempts. Please wait 15 minutes before trying again.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Email Field */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  disabled={isLocked || isLoading}
                  className={`
                    appearance-none rounded-lg relative block w-full px-3 py-2 pl-10
                    border ${touched.email && errors.email ? 'border-red-300' : 'border-gray-300'}
                    placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    focus:z-10 sm:text-sm
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                  `}
                  placeholder="Enter your email address"
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  disabled={isLocked || isLoading}
                  className={`
                    appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 pr-10
                    border ${touched.password && errors.password ? 'border-red-300' : 'border-gray-300'}
                    placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    focus:z-10 sm:text-sm
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                  `}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>
          </div>
          
          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>
          </div>
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLocked || isLoading}
              className={`
                group relative w-full flex justify-center py-2 px-4 border border-transparent
                text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2
                focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isLoading ? (
                <>
                  <ButtonLoader />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
          
          {/* Demo Credentials (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p><span className="font-medium">Admin:</span> admin@pharmacy.com / admin123</p>
                <p><span className="font-medium">POS Agent:</span> pos@pharmacy.com / pos123</p>
              </div>
            </div>
          )}
        </form>
        
        {/* Footer */}
        {/* <div className="text-center text-xs text-gray-500">
          <p>© 2024 PharmaInventory System. All rights reserved.</p>
          <p className="mt-1">Secure login protected by 256-bit SSL encryption</p>
        </div> */}
      </div>
    </div>
  );
};

export default LoginForm;