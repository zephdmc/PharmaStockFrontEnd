// frontend/src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.common['Authorization'];
  return null;
});

// Async thunk for PIN verification
export const verifyPin = createAsyncThunk(
  'auth/verifyPin',
  async (pin, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.post('/auth/verify-pin', { 
        pin, 
        userId: auth.user?._id 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'PIN verification failed');
    }
  }
);

// Async thunk for changing password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed');
    }
  }
);

// Async thunk for updating profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);

// Check token on app load
const initializeAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return {
      token,
      user: JSON.parse(user),
      isAuthenticated: true,
    };
  }
  
  return {
    token: null,
    user: null,
    isAuthenticated: false,
  };
};

const initialState = {
  ...initializeAuth(),
  isLoading: false,
  error: null,
  pinVerified: false,
  loginAttempts: 0,
  isLocked: false,
  lockUntil: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPinVerified: (state, action) => {
      state.pinVerified = action.payload;
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      if (state.loginAttempts >= 5) {
        state.isLocked = true;
        state.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lock
      }
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.isLocked = false;
      state.lockUntil = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.pinVerified = false;
        state.loginAttempts = 0;
        state.isLocked = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.loginAttempts += 1;
        if (state.loginAttempts >= 5) {
          state.isLocked = true;
          state.lockUntil = Date.now() + 15 * 60 * 1000;
        }
      })
      
      // Logout case
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.pinVerified = false;
        state.error = null;
        state.loginAttempts = 0;
        state.isLocked = false;
        state.lockUntil = null;
      })
      
      // PIN verification cases
      .addCase(verifyPin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPin.fulfilled, (state) => {
        state.isLoading = false;
        state.pinVerified = true;
      })
      .addCase(verifyPin.rejected, (state, action) => {
        state.isLoading = false;
        state.pinVerified = false;
        state.error = action.payload;
      })
      
      // Update profile cases
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  setPinVerified, 
  incrementLoginAttempts, 
  resetLoginAttempts 
} = authSlice.actions;

export default authSlice.reducer;