// frontend/src/redux/actions/inventoryActions.js
import {
    fetchInventoryMovements,
    addStock,
    removeStock,
    fetchLowStockItems,
    fetchExpiringItems,
    fetchInventoryValuation,
    fetchStockTurnover,
    setInventoryFilters,
    clearInventoryFilters,
    setCurrentPage as setInventoryPage
  } from '../slices/inventorySlice';
  
  export const inventoryActions = {
    fetchInventoryMovements,
    addStock,
    removeStock,
    fetchLowStockItems,
    fetchExpiringItems,
    fetchInventoryValuation,
    fetchStockTurnover,
    setInventoryFilters,
    clearInventoryFilters,
    setInventoryPage,
  };
  
  // Helper to get total inventory value
  export const getTotalInventoryValue = (state) => {
    return state.inventory.valuation?.totalValue || 0;
  };
  
  // Helper to get movement summary
  export const getMovementSummary = (movements) => {
    const additions = movements.filter(m => m.type === 'add');
    const removals = movements.filter(m => m.type === 'remove');
    
    return {
      totalAdditions: additions.reduce((sum, m) => sum + m.quantity, 0),
      totalRemovals: removals.reduce((sum, m) => sum + m.quantity, 0),
      totalAdditionsValue: additions.reduce((sum, m) => sum + m.value, 0),
      totalRemovalsValue: removals.reduce((sum, m) => sum + m.value, 0),
    };
  };