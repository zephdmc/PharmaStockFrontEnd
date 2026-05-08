// frontend/src/services/salesService.js
import api from './api';
import { format } from 'date-fns';

class SalesService {
  // Process a new sale (POS transaction)
  async processSale(saleData) {
    try {
      const response = await api.post('/sales', saleData);
      return { 
        success: true, 
        transaction: response.data.transaction,
        receipt: response.data.receipt 
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Sale processing failed',
      };
    }
  }
  
  // Get all sales with pagination and filters
  async getSales(page = 1, limit = 20, filters = {}) {
    try {
      const params = { page, limit, ...filters };
      const response = await api.get('/sales', { params });
      return {
        success: true,
        transactions: response.data.transactions,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
        summary: response.data.summary,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch sales',
        transactions: [],
      };
    }
  }
  
  // Get single sale by ID
  async getSaleById(id) {
    try {
      const response = await api.get(`/sales/${id}`);
      return { success: true, transaction: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Sale not found',
      };
    }
  }
  
  // Get today's sales
  async getTodaySales() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get('/sales/today');
      return {
        success: true,
        total: response.data.total || 0,
        count: response.data.count || 0,
        average: response.data.average || 0,
        sales: response.data.sales || []
      };
    } catch (error) {
      console.error('Get today sales error:', error);
      return {
        success: false,
        sales: [],
        total: 0,
        count: 0,
        average: 0,
      };
    }
  }
  
  // Get sales by date range
  async getSalesByDateRange(startDate, endDate, groupBy = 'day') {
    try {
      const response = await api.get('/sales/range', {
        params: { startDate, endDate, groupBy }
      });
      return {
        success: true,
        data: response.data,
        total: response.data.total,
        summary: response.data.summary,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch sales data',
        data: [],
      };
    }
  }
  
  // Refund a sale
  async refundSale(transactionId, items = null, reason = '') {
    try {
      const response = await api.post(`/sales/${transactionId}/refund`, {
        items,
        reason
      });
      return { success: true, refund: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Refund failed',
      };
    }
  }
  
  // Generate receipt for a sale
  async generateReceipt(transactionId, format = 'html') {
    try {
      const response = await api.get(`/sales/${transactionId}/receipt`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'json'
      });
      
      if (format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt_${transactionId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return { success: true };
      }
      
      return { success: true, receipt: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate receipt',
      };
    }
  }
  
  // Get sales summary for dashboard
  async getSalesSummary(period = 'week') {
    try {
      const response = await api.get('/sales/summary', { params: { period } });
      return {
        success: true,
        summary: response.data,
        chart: response.data.chart,
        topProducts: response.data.topProducts,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch sales summary',
      };
    }
  }
  
  // Get agent performance
  async getAgentPerformance(startDate, endDate) {
    try {
      const response = await api.get('/sales/agent-performance', {
        params: { startDate, endDate }
      });
      return { success: true, agents: response.data };
    } catch (error) {
      return {
        success: false,
        agents: [],
      };
    }
  }
  
  // Get hourly sales distribution
  async getHourlySales(date = null) {
    try {
      const response = await api.get('/sales/hourly', { params: { date } });
      return { success: true, hourly: response.data };
    } catch (error) {
      return {
        success: false,
        hourly: [],
      };
    }
  }
  
  // Print receipt directly
  async printReceipt(transactionId) {
    const receipt = await this.generateReceipt(transactionId, 'html');
    if (receipt.success) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receipt.receipt);
      printWindow.print();
      printWindow.close();
      return { success: true };
    }
    return { success: false };
  }
  
  // Send receipt via email
  async emailReceipt(transactionId, email) {
    try {
      const response = await api.post(`/sales/${transactionId}/email-receipt`, { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send email receipt',
      };
    }
  }
}

// Create an instance of the service
const salesService = new SalesService();

// Export both the instance (default) and individual methods (named exports)
export default salesService;
export const processSale = (saleData) => salesService.processSale(saleData);
export const getSales = (page, limit, filters) => salesService.getSales(page, limit, filters);
export const getSaleById = (id) => salesService.getSaleById(id);
export const getTodaySales = () => salesService.getTodaySales();
export const getSalesByDateRange = (startDate, endDate, groupBy) => salesService.getSalesByDateRange(startDate, endDate, groupBy);
export const refundSale = (transactionId, items, reason) => salesService.refundSale(transactionId, items, reason);
export const generateReceipt = (transactionId, format) => salesService.generateReceipt(transactionId, format);
export const getSalesSummary = (period) => salesService.getSalesSummary(period);
export const getAgentPerformance = (startDate, endDate) => salesService.getAgentPerformance(startDate, endDate);
export const getHourlySales = (date) => salesService.getHourlySales(date);
export const printReceipt = (transactionId) => salesService.printReceipt(transactionId);
export const emailReceipt = (transactionId, email) => salesService.emailReceipt(transactionId, email);