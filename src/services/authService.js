// frontend/src/services/authService.js
import api from './api';
import { setAuthToken, removeAuthToken } from './api';

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Store token and user data
      setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user, token };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  }
  
  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
      localStorage.removeItem('user');
    }
  }
  
  // Verify PIN for POS transactions
  async verifyPin(pinCode, userId = null) {
    try {
      const response = await api.post('/auth/verify-pin', { 
        pin: pinCode,
        userId: userId || JSON.parse(localStorage.getItem('user'))?._id 
      });
      return { success: true, verified: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        verified: false,
        message: error.response?.data?.message || 'Invalid PIN',
        attemptsRemaining: error.response?.data?.attemptsRemaining
      };
    }
  }
  
  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  }
  
  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed' 
      };
    }
  }
  
  // Forgot password - request reset
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password reset request failed' 
      };
    }
  }
  
  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password reset failed' 
      };
    }
  }
  
  // Get current user data
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }
  
  // Check if user has specific role
  hasRole(roles) {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
  }
  
  // Refresh token
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token');
      const { token } = response.data;
      setAuthToken(token);
      return { success: true, token };
    } catch (error) {
      this.logout();
      return { success: false };
    }
  }
}

export default new AuthService();