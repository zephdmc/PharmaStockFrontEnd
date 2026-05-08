// frontend/src/redux/actions/transactionActions.js
import {
    fetchTransactions,
    fetchTransactionById,
    createTransaction,
    refundTransaction,
    fetchTodaySales,
    fetchSalesReport,
    setTransactionFilters,
    clearTransactionFilters,
    setCurrentPage as setTransactionPage
  } from '../slices/transactionSlice';
  
  export const transactionActions = {
    fetchTransactions,
    fetchTransactionById,
    createTransaction,
    refundTransaction,
    fetchTodaySales,
    fetchSalesReport,
    setTransactionFilters,
    clearTransactionFilters,
    setTransactionPage,
  };
  
  // Helper to get today's sales
  export const getTodaySales = (state) => state.transactions.todaySales;
  
  // Helper to get transactions by status
  export const getTransactionsByStatus = (state, status) => {
    return state.transactions.transactions.filter(t => t.status === status);
  };
  
  // Helper to get total revenue for period
  export const getTotalRevenue = (transactions) => {
    return transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  };