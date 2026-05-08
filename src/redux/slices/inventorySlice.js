// frontend/src/redux/slices/inventorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch inventory movements
export const fetchInventoryMovements = createAsyncThunk(
  'inventory/fetchMovements',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/movements', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory movements');
    }
  }
);

// Add stock (restock)
export const addStock = createAsyncThunk(
  'inventory/addStock',
  async ({ productId, packs, units, batchNumber, expiryDate, cost, note }, { rejectWithValue }) => {
    try {
      const response = await api.post('/inventory/add-stock', {
        productId,
        packs,
        units,
        batchNumber,
        expiryDate,
        cost,
        note
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add stock');
    }
  }
);

// Remove stock (adjustment)
export const removeStock = createAsyncThunk(
  'inventory/removeStock',
  async ({ productId, packs, units, reason, note }, { rejectWithValue }) => {
    try {
      const response = await api.post('/inventory/remove-stock', {
        productId,
        packs,
        units,
        reason,
        note
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove stock');
    }
  }
);

// Get low stock items
export const fetchLowStockItems = createAsyncThunk(
  'inventory/fetchLowStock',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/low-stock');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch low stock items');
    }
  }
);

// Get expiring items
export const fetchExpiringItems = createAsyncThunk(
  'inventory/fetchExpiring',
  async (days = 90, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/expiring', { params: { days } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expiring items');
    }
  }
);

// Get inventory valuation
export const fetchInventoryValuation = createAsyncThunk(
  'inventory/fetchValuation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/valuation');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory valuation');
    }
  }
);

// Get stock turnover rate
export const fetchStockTurnover = createAsyncThunk(
  'inventory/fetchTurnover',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get('/inventory/turnover', { params: { startDate, endDate } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stock turnover');
    }
  }
);

const initialState = {
  movements: [],
  lowStockItems: [],
  expiringItems: [],
  valuation: null,
  turnover: null,
  totalMovements: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  filters: {
    movementType: 'all',
    startDate: null,
    endDate: null,
    productId: null,
  },
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventoryFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearInventoryFilters: (state) => {
      state.filters = {
        movementType: 'all',
        startDate: null,
        endDate: null,
        productId: null,
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
      // Fetch movements cases
      .addCase(fetchInventoryMovements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInventoryMovements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movements = action.payload.movements;
        state.totalMovements = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchInventoryMovements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add stock cases
      .addCase(addStock.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addStock.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movements.unshift(action.payload.movement);
        state.totalMovements += 1;
        // Update low stock items if needed
        if (action.payload.lowStockUpdated) {
          const index = state.lowStockItems.findIndex(i => i._id === action.payload.productId);
          if (index !== -1) {
            state.lowStockItems.splice(index, 1);
          }
        }
      })
      .addCase(addStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove stock cases
      .addCase(removeStock.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeStock.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movements.unshift(action.payload.movement);
        state.totalMovements += 1;
        // Add to low stock items if needed
        if (action.payload.isLowStock) {
          state.lowStockItems.push(action.payload.product);
        }
      })
      .addCase(removeStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch low stock cases
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.lowStockItems = action.payload;
      })
      
      // Fetch expiring items cases
      .addCase(fetchExpiringItems.fulfilled, (state, action) => {
        state.expiringItems = action.payload;
      })
      
      // Fetch valuation cases
      .addCase(fetchInventoryValuation.fulfilled, (state, action) => {
        state.valuation = action.payload;
      })
      
      // Fetch turnover cases
      .addCase(fetchStockTurnover.fulfilled, (state, action) => {
        state.turnover = action.payload;
      });
  },
});

export const { 
  setInventoryFilters, 
  clearInventoryFilters, 
  setCurrentPage,
  clearError
} = inventorySlice.actions;

export default inventorySlice.reducer;