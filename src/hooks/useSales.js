// frontend/src/hooks/useSales.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTransactions, 
  fetchTransactionById, 
  createTransaction, 
  refundTransaction,
  fetchTodaySales,
  fetchSalesReport,
  setTransactionFilters,
  clearTransactionFilters,
  setCurrentPage,
  clearError
} from '../redux/slices/transactionSlice';
import { clearCart } from '../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

export const useSales = (initialFilters = {}) => {
  const dispatch = useDispatch();
  const { 
    transactions, 
    selectedTransaction, 
    todaySales, 
    report, 
    totalTransactions, 
    currentPage, 
    totalPages, 
    isLoading, 
    error,
    filters 
  } = useSelector((state) => state.transactions);
  
  // Fetch all transactions
  const loadTransactions = useCallback(async (page = currentPage, newFilters = {}) => {
    const allFilters = { ...filters, ...newFilters };
    const result = await dispatch(fetchTransactions({ page, ...allFilters }));
    
    if (fetchTransactions.fulfilled.match(result)) {
      return { success: true, data: result.payload };
    } else {
      toast.error(result.payload || 'Failed to load transactions');
      return { success: false, message: result.payload };
    }
  }, [dispatch, filters, currentPage]);
  
  // Load single transaction
  const loadTransaction = useCallback(async (id) => {
    const result = await dispatch(fetchTransactionById(id));
    
    if (fetchTransactionById.fulfilled.match(result)) {
      return { success: true, transaction: result.payload };
    } else {
      toast.error(result.payload || 'Transaction not found');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Process a new sale
  const processSale = useCallback(async (saleData, onSuccess) => {
    const result = await dispatch(createTransaction(saleData));
    
    if (createTransaction.fulfilled.match(result)) {
      toast.success('Sale completed successfully!');
      dispatch(clearCart());
      if (onSuccess) onSuccess(result.payload);
      return { success: true, transaction: result.payload };
    } else {
      toast.error(result.payload || 'Sale failed');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Refund a transaction
  const processRefund = useCallback(async (id, reason, items = null) => {
    const confirmed = window.confirm('Are you sure you want to refund this transaction?');
    if (!confirmed) return { success: false, cancelled: true };
    
    const result = await dispatch(refundTransaction({ id, reason, items }));
    
    if (refundTransaction.fulfilled.match(result)) {
      toast.success('Transaction refunded successfully');
      return { success: true, refund: result.payload };
    } else {
      toast.error(result.payload || 'Refund failed');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Load today's sales
  const loadTodaySales = useCallback(async () => {
    const result = await dispatch(fetchTodaySales());
    
    if (fetchTodaySales.fulfilled.match(result)) {
      return { success: true, sales: result.payload };
    } else {
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Load sales report for date range
  const loadSalesReport = useCallback(async (startDate, endDate, groupBy = 'day') => {
    const result = await dispatch(fetchSalesReport({ startDate, endDate, groupBy }));
    
    if (fetchSalesReport.fulfilled.match(result)) {
      return { success: true, report: result.payload };
    } else {
      toast.error(result.payload || 'Failed to load report');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Update filters
  const updateFilters = useCallback((newFilters) => {
    dispatch(setTransactionFilters(newFilters));
  }, [dispatch]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    dispatch(clearTransactionFilters());
  }, [dispatch]);
  
  // Change page
  const changePage = useCallback((page) => {
    dispatch(setCurrentPage(page));
    loadTransactions(page);
  }, [dispatch, loadTransactions]);
  
  // Clear error
  const clearSalesError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // Get transaction by ID from current list
  const getTransactionById = useCallback((id) => {
    return transactions.find(t => t._id === id);
  }, [transactions]);
  
  // Get today's sales summary
  const todaySummary = useMemo(() => ({
    total: todaySales.total,
    count: todaySales.count,
    average: todaySales.average,
    formattedTotal: formatCurrency(todaySales.total),
    formattedAverage: formatCurrency(todaySales.average),
  }), [todaySales]);
  
  // Get sales by status
  const getSalesByStatus = useCallback((status) => {
    return transactions.filter(t => t.status === status);
  }, [transactions]);
  
  // Get sales by payment method
  const getSalesByPaymentMethod = useCallback((method) => {
    return transactions.filter(t => t.paymentMethod === method);
  }, [transactions]);
  
  // Get total revenue from transactions
  const totalRevenue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  }, [transactions]);
  
  // Get sales summary statistics
  const salesSummary = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const refunded = transactions.filter(t => t.status === 'refunded');
    
    return {
      total: totalRevenue,
      completedCount: completed.length,
      refundedCount: refunded.length,
      completedTotal: completed.reduce((sum, t) => sum + t.totalAmount, 0),
      refundedTotal: refunded.reduce((sum, t) => sum + t.totalAmount, 0),
      averageTransaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
    };
  }, [transactions, totalRevenue]);
  
  // Get top selling products
  const getTopProducts = useCallback((limit = 10) => {
    const productSales = new Map();
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const existing = productSales.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += (item.quantityPacks * item.packSize) + item.quantityUnits;
        existing.revenue += item.totalPrice;
        productSales.set(item.productId, existing);
      });
    });
    
    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }, [transactions]);
  
  // Get sales by hour (for charts)
  const getSalesByHour = useCallback((date = new Date()) => {
    const hourlyData = Array(24).fill().map((_, i) => ({ hour: i, sales: 0, count: 0 }));
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      if (transactionDate.toDateString() === date.toDateString()) {
        const hour = transactionDate.getHours();
        hourlyData[hour].sales += transaction.totalAmount;
        hourlyData[hour].count += 1;
      }
    });
    
    return hourlyData;
  }, [transactions]);
  
  // Get sales by day of week
  const getSalesByDayOfWeek = useCallback(() => {
    const weeklyData = Array(7).fill().map((_, i) => ({ day: i, sales: 0, count: 0 }));
    
    transactions.forEach(transaction => {
      const day = new Date(transaction.createdAt).getDay();
      weeklyData[day].sales += transaction.totalAmount;
      weeklyData[day].count += 1;
    });
    
    return weeklyData;
  }, [transactions]);
  
  // Initial load
  useEffect(() => {
    loadTransactions(1, initialFilters);
    loadTodaySales();
  }, []);
  
  return {
    // State
    transactions,
    selectedTransaction,
    todaySales: todaySummary,
    report,
    totalTransactions,
    currentPage,
    totalPages,
    isLoading,
    error,
    filters,
    totalRevenue,
    salesSummary,
    
    // Actions
    loadTransactions,
    loadTransaction,
    processSale,
    processRefund,
    loadTodaySales,
    loadSalesReport,
    updateFilters,
    resetFilters,
    changePage,
    clearError: clearSalesError,
    getTransactionById,
    getSalesByStatus,
    getSalesByPaymentMethod,
    getTopProducts,
    getSalesByHour,
    getSalesByDayOfWeek,
  };
};

// Hook for checkout/payment processing
export const useCheckout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState(null);
  
  const { processSale } = useSales();
  const { user } = useSelector((state) => state.auth);
  const { items, subtotal, vat, total } = useSelector((state) => state.cart);
  
  const handleCheckout = useCallback(() => {
    if (items.length === 0) {
      setError('Cart is empty');
      return false;
    }
    setShowPinModal(true);
    return true;
  }, [items]);
  
  const handlePayment = useCallback(async (pinCode) => {
    setIsProcessing(true);
    setError(null);
    
    const saleData = {
      items: items.map(item => ({
        productId: item.productId,
        quantityPacks: item.quantityPacks,
        quantityUnits: item.quantityUnits,
      })),
      paymentMethod,
      pinCode,
      posAgentId: user?._id,
      subtotal,
      vat,
      total: total + vat,
    };
    
    const result = await processSale(saleData);
    
    setIsProcessing(false);
    setShowPinModal(false);
    
    return result;
  }, [items, paymentMethod, user, subtotal, vat, total, processSale]);
  
  const resetCheckout = useCallback(() => {
    setError(null);
    setShowPinModal(false);
    setIsProcessing(false);
  }, []);
  
  return {
    isProcessing,
    showPinModal,
    paymentMethod,
    error,
    setPaymentMethod,
    setShowPinModal,
    handleCheckout,
    handlePayment,
    resetCheckout,
  };
};

// Hook for receipt generation
export const useReceipt = () => {
  const [receiptData, setReceiptData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateReceipt = useCallback(async (transaction) => {
    setIsGenerating(true);
    
    try {
      // Format receipt data
      const receipt = {
        ...transaction,
        formattedDate: new Date(transaction.createdAt).toLocaleDateString('en-NG', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        formattedTime: new Date(transaction.createdAt).toLocaleTimeString('en-NG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        items: transaction.items.map(item => ({
          ...item,
          formattedQuantity: `${item.quantityPacks > 0 ? `${item.quantityPacks} pack(s)` : ''}${item.quantityPacks > 0 && item.quantityUnits > 0 ? ' + ' : ''}${item.quantityUnits > 0 ? `${item.quantityUnits} unit(s)` : ''}`,
        })),
      };
      
      setReceiptData(receipt);
      return { success: true, receipt };
    } catch (error) {
      toast.error('Failed to generate receipt');
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  const printReceipt = useCallback(() => {
    if (!receiptData) return;
    
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt ${receiptData.receiptNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; margin: 0; }
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }, [receiptData]);
  
  return {
    receiptData,
    isGenerating,
    generateReceipt,
    printReceipt,
  };
};

export default useSales;