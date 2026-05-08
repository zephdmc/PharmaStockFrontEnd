// frontend/src/redux/slices/transactionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch all transactions
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

// Fetch single transaction
export const fetchTransactionById = createAsyncThunk(
  'transactions/fetchTransactionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transaction');
    }
  }
);

// Create new transaction (sale)
export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create transaction');
    }
  }
);

// Refund transaction
export const refundTransaction = createAsyncThunk(
  'transactions/refundTransaction',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/transactions/${id}/refund`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refund transaction');
    }
  }
);

// Fetch today's sales
export const fetchTodaySales = createAsyncThunk(
  'transactions/fetchTodaySales',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/today');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch today\'s sales');
    }
  }
);

// Fetch sales report
export const fetchSalesReport = createAsyncThunk(
  'transactions/fetchSalesReport',
  async ({ startDate, endDate, groupBy }, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/report', {
        params: { startDate, endDate, groupBy }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales report');
    }
  }
);

const initialState = {
  transactions: [],
  selectedTransaction: null,
  todaySales: {
    count: 0,
    total: 0,
    average: 0,
  },
  report: null,
  currentPage: 1,
  totalPages: 1,
  totalTransactions: 0,
  isLoading: false,
  error: null,
  filters: {
    startDate: null,
    endDate: null,
    status: 'all',
    paymentMethod: 'all',
    posAgent: 'all',
  },
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearSelectedTransaction: (state) => {
      state.selectedTransaction = null;
    },
    setTransactionFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearTransactionFilters: (state) => {
      state.filters = {
        startDate: null,
        endDate: null,
        status: 'all',
        paymentMethod: 'all',
        posAgent: 'all',
      };
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions cases
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.totalTransactions = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch single transaction cases
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.selectedTransaction = action.payload;
      })
      
      // Create transaction cases
      .addCase(createTransaction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
        state.totalTransactions += 1;
        // Update today's sales if transaction is from today
        const today = new Date().toDateString();
        const transactionDate = new Date(action.payload.createdAt).toDateString();
        if (today === transactionDate) {
          state.todaySales.count += 1;
          state.todaySales.total += action.payload.totalAmount;
          state.todaySales.average = state.todaySales.total / state.todaySales.count;
        }
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Refund transaction cases
      .addCase(refundTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
        if (state.selectedTransaction?._id === action.payload._id) {
          state.selectedTransaction = action.payload;
        }
        // Update today's sales if refunded transaction is from today
        const today = new Date().toDateString();
        const transactionDate = new Date(action.payload.createdAt).toDateString();
        if (today === transactionDate) {
          state.todaySales.count -= 1;
          state.todaySales.total -= action.payload.totalAmount;
          state.todaySales.average = state.todaySales.count > 0 
            ? state.todaySales.total / state.todaySales.count 
            : 0;
        }
      })
      
      // Fetch today's sales cases
      .addCase(fetchTodaySales.fulfilled, (state, action) => {
        state.todaySales = action.payload;
      })
      
      // Fetch sales report cases
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.report = action.payload;
      });
  },
});

export const { 
  clearSelectedTransaction, 
  setTransactionFilters, 
  clearTransactionFilters,
  setCurrentPage,
  clearError
} = transactionSlice.actions;

export default transactionSlice.reducer;