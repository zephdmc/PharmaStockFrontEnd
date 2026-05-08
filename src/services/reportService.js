// frontend/src/services/reportService.js
import api from './api';
import { format } from 'date-fns';

class ReportService {
  // Generate inventory report
  async getInventoryReport(type = 'full', filters = {}) {
    try {
      const response = await api.get('/reports/inventory', {
        params: { type, ...filters }
      });
      return {
        success: true,
        report: response.data,
        summary: response.data.summary,
        details: response.data.details,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate inventory report',
      };
    }
  }
  
  // Generate sales report
  async getSalesReport(startDate, endDate, groupBy = 'day', filters = {}) {
    try {
      const params = {
        startDate,
        endDate,
        groupBy,
        ...filters
      };
      
      const response = await api.get('/reports/sales', { params });
      return {
        success: true,
        report: response.data,
        summary: response.data.summary,
        chart: response.data.chart,
        breakdown: response.data.breakdown,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate sales report',
      };
    }
  }
  
  // Generate profit & loss report
  async getProfitLossReport(startDate, endDate) {
    try {
      const response = await api.get('/reports/profit-loss', {
        params: { startDate, endDate }
      });
      return {
        success: true,
        report: response.data,
        revenue: response.data.revenue,
        expenses: response.data.expenses,
        profit: response.data.profit,
        margin: response.data.margin,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate profit & loss report',
      };
    }
  }
  
  // Generate tax report (VAT)
  async getTaxReport(startDate, endDate) {
    try {
      const response = await api.get('/reports/tax', {
        params: { startDate, endDate }
      });
      return {
        success: true,
        report: response.data,
        totalSales: response.data.totalSales,
        vatAmount: response.data.vatAmount,
        transactions: response.data.transactions,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate tax report',
      };
    }
  }
  
  // Get low stock report
  async getLowStockReport(threshold = null) {
    try {
      const response = await api.get('/reports/low-stock', {
        params: { threshold }
      });
      return {
        success: true,
        items: response.data,
        count: response.data.length,
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        count: 0,
      };
    }
  }
  
  // Get expiring products report
  async getExpiringReport(days = 90) {
    try {
      const response = await api.get('/reports/expiring', {
        params: { days }
      });
      return {
        success: true,
        items: response.data,
        count: response.data.length,
        summary: response.data.summary,
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        count: 0,
      };
    }
  }
  
  // Get inventory valuation report
  async getValuationReport() {
    try {
      const response = await api.get('/reports/valuation');
      return {
        success: true,
        report: response.data,
        totalValue: response.data.totalValue,
        byCategory: response.data.byCategory,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate valuation report',
      };
    }
  }
  
  // Get sales by category report
  async getCategorySalesReport(startDate, endDate) {
    try {
      const response = await api.get('/reports/category-sales', {
        params: { startDate, endDate }
      });
      return {
        success: true,
        categories: response.data,
        total: response.data.total,
      };
    } catch (error) {
      return {
        success: false,
        categories: [],
      };
    }
  }
  
  // Get product performance report
  async getProductPerformanceReport(startDate, endDate, limit = 10) {
    try {
      const response = await api.get('/reports/product-performance', {
        params: { startDate, endDate, limit }
      });
      return {
        success: true,
        topProducts: response.data.topProducts,
        bottomProducts: response.data.bottomProducts,
        summary: response.data.summary,
      };
    } catch (error) {
      return {
        success: false,
        topProducts: [],
        bottomProducts: [],
      };
    }
  }
  
  // Get daily sales report
  async getDailySalesReport(date = null) {
    try {
      const reportDate = date || format(new Date(), 'yyyy-MM-dd');
      const response = await api.get('/reports/daily-sales', {
        params: { date: reportDate }
      });
      return {
        success: true,
        report: response.data,
        transactions: response.data.transactions,
        total: response.data.total,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate daily sales report',
      };
    }
  }
  
  // Get monthly summary report
  async getMonthlySummaryReport(year, month) {
    try {
      const response = await api.get('/reports/monthly-summary', {
        params: { year, month }
      });
      return {
        success: true,
        report: response.data,
        daily: response.data.daily,
        summary: response.data.summary,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate monthly summary',
      };
    }
  }
  
  // Export report to PDF
  async exportToPDF(reportType, params) {
    try {
      const response = await api.post('/reports/export-pdf', {
        reportType,
        params
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export PDF',
      };
    }
  }
  
  // Export report to Excel
  async exportToExcel(reportType, params) {
    try {
      const response = await api.post('/reports/export-excel', {
        reportType,
        params
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export Excel',
      };
    }
  }
  
  // Schedule report (for automated reports)
  async scheduleReport(reportConfig) {
    try {
      const response = await api.post('/reports/schedule', reportConfig);
      return { success: true, schedule: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to schedule report',
      };
    }
  }
  
  // Get scheduled reports
  async getScheduledReports() {
    try {
      const response = await api.get('/reports/scheduled');
      return { success: true, schedules: response.data };
    } catch (error) {
      return {
        success: false,
        schedules: [],
      };
    }
  }
  
  // Delete scheduled report
  async deleteScheduledReport(scheduleId) {
    try {
      await api.delete(`/reports/scheduled/${scheduleId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete schedule',
      };
    }
  }
}

export default new ReportService();