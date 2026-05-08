// frontend/src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, logout, verifyPin, changePassword, updateProfile, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error, pinVerified, isLocked, lockUntil } = useSelector((state) => state.auth);
  
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [remainingLockTime, setRemainingLockTime] = useState(0);
  
  // Check lock status
  useEffect(() => {
    if (isLocked && lockUntil) {
      const updateLockTime = () => {
        const remaining = Math.max(0, Math.floor((lockUntil - Date.now()) / 1000));
        setRemainingLockTime(remaining);
        
        if (remaining === 0) {
          // Lock expired
          window.location.reload();
        }
      };
      
      updateLockTime();
      const interval = setInterval(updateLockTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, lockUntil]);
  
  // Handle login
  const handleLogin = useCallback(async (email, password, rememberMe = false) => {
    if (isLocked) {
      const minutes = Math.ceil(remainingLockTime / 60);
      toast.error(`Too many failed attempts. Please wait ${minutes} minutes.`);
      return { success: false, message: `Account locked. Try again in ${minutes} minutes.` };
    }
    
    const result = await dispatch(login({ email, password }));
    
    if (login.fulfilled.match(result)) {
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      
      const userRole = result.payload.user.role;
      
      // Redirect based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'pos_agent') {
        navigate('/pos');
      }
      
      toast.success(`Welcome back, ${result.payload.user.name}!`);
      return { success: true, user: result.payload.user };
    } else {
      const errorMessage = result.payload || 'Login failed';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [dispatch, navigate, isLocked, remainingLockTime]);
  
  // Handle logout
  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  }, [dispatch, navigate]);
  
  // Handle PIN verification
  const handleVerifyPin = useCallback(async (pin) => {
    try {
      const result = await dispatch(verifyPin(pin)).unwrap();
      toast.success('PIN verified successfully');
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error || 'Invalid PIN';
      const attemptsRemaining = error.attemptsRemaining;
      
      if (attemptsRemaining !== undefined) {
        toast.error(`${errorMessage}. ${attemptsRemaining} attempts remaining.`);
      } else {
        toast.error(errorMessage);
      }
      
      return { success: false, message: errorMessage };
    }
  }, [dispatch]);
  
  // Handle password change
  const handleChangePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const result = await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      toast.success('Password changed successfully');
      return { success: true, message: result.message };
    } catch (error) {
      toast.error(error || 'Failed to change password');
      return { success: false, message: error };
    }
  }, [dispatch]);
  
  // Handle profile update
  const handleUpdateProfile = useCallback(async (profileData) => {
    try {
      const result = await dispatch(updateProfile(profileData)).unwrap();
      toast.success('Profile updated successfully');
      return { success: true, user: result };
    } catch (error) {
      toast.error(error || 'Failed to update profile');
      return { success: false, message: error };
    }
  }, [dispatch]);
  
  // Clear auth error
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  }, [user]);
  
  // Get redirect path based on user role
  const getRedirectPath = useCallback(() => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'pos_agent') return '/pos';
    return '/login';
  }, [user]);
  
  // Auto redirect based on role
  const redirectToDashboard = useCallback(() => {
    const path = getRedirectPath();
    if (path !== '/login' && window.location.pathname === '/') {
      navigate(path);
    }
  }, [navigate, getRedirectPath]);
  
  // Format lock time remaining
  const getLockTimeRemaining = useCallback(() => {
    if (!isLocked || !lockUntil) return null;
    const minutes = Math.floor(remainingLockTime / 60);
    const seconds = remainingLockTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [isLocked, lockUntil, remainingLockTime]);
  
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    pinVerified,
    isLocked,
    remainingLockTime: getLockTimeRemaining(),
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    verifyPin: handleVerifyPin,
    changePassword: handleChangePassword,
    updateProfile: handleUpdateProfile,
    clearError: clearAuthError,
    hasRole,
    getRedirectPath,
    redirectToDashboard,
  };
};

// Additional hook for protected routes
export const useRequireAuth = (allowedRoles = null) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!isLoading && isAuthenticated && allowedRoles) {
      const hasRequiredRole = allowedRoles.includes(user?.role);
      if (!hasRequiredRole) {
        navigate('/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, navigate, allowedRoles]);
  
  return { isAuthenticated, user, isLoading };
};

// Hook for remembering email
export const useRememberedEmail = () => {
  const [rememberedEmail, setRememberedEmail] = useState('');
  
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail) {
      setRememberedEmail(savedEmail);
    }
  }, []);
  
  const saveEmail = useCallback((email, remember) => {
    if (remember) {
      localStorage.setItem('rememberEmail', email);
      setRememberedEmail(email);
    } else {
      localStorage.removeItem('rememberEmail');
      setRememberedEmail('');
    }
  }, []);
  
  return { rememberedEmail, saveEmail };
};

export default useAuth;