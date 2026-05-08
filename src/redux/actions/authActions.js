// frontend/src/redux/actions/authActions.js
import { login, logout, verifyPin, changePassword, updateProfile } from '../slices/authSlice';

export const authActions = {
  login,
  logout,
  verifyPin,
  changePassword,
  updateProfile,
};

// Helper to check if user is authenticated
export const isAuthenticated = (state) => state.auth.isAuthenticated;

// Helper to get current user
export const getCurrentUser = (state) => state.auth.user;

// Helper to check if user has specific role
export const hasRole = (state, roles) => {
  const userRole = state.auth.user?.role;
  return roles.includes(userRole);
};