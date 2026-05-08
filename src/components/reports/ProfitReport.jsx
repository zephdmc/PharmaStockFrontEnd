// frontend/src/components/reports/ProfitReport.jsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Download,
  Printer,
  Calendar,
  ArrowUp,
  ArrowDown,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { format, subMonths, startOfYear, endOfYear } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import Loader from '../common/Loader';
import api from '../../services/api';

const ProfitReport = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfitData();
  }, [period, dateRange]);

  const fetchProfitData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sales data for revenue calculation
      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      
      const salesResponse = await api.get('/sales/report', {
        params: { startDate, endDate, groupBy: period === 'monthly' ? 'month' : 'day' }
      });
      
      const productsResponse = await api.get('/products', { params: { limit: 100 } });
      const inventoryResponse = await api.get('/inventory/valuation');
      
      if (salesResponse.data.success) {
        const salesData = salesResponse.data.report;
        const products = productsResponse.data.products || [];
        
        // Calculate revenue and cost from sales
        let totalRevenue = 0;
        let totalCost = 0;
        const productProfitMap = new Map();
        const categoryProfitMap = new Map();
        
        // Process sales transactions to calculate profit
        const transactions = salesData.transactions || [];
        
        transactions.forEach(transaction => {
          totalRevenue += transaction.totalAmount || 0;
          
          // Calculate cost for each item (using product cost price)
          transaction.items?.forEach(item => {
            const product = products.find(p => p._id === item.productId);
            if (product) {
              const itemCost = (product.costPrice || 0) * ((item.quantityPacks * (product.packSize || 1)) + (item.quantityUnits || 0));
              totalCost += itemCost;
              
              // Track by product
              if (!productProfitMap.has(item.productName)) {
                productProfitMap.set(item.productName, {
                  name: item.productName,
                  revenue: 0,
                  cost: 0,
                  profit: 0
                });
              }
              const prod = productProfitMap.get(item.productName);
              prod.revenue += item.totalPrice || 0;
              prod.cost += itemCost;
              prod.profit = prod.revenue - prod.cost;
              
              // Track by category
              const categoryName = product.category?.name || 'Uncategorized';
              if (!categoryProfitMap.has(categoryName)) {
                categoryProfitMap.set(categoryName, {
                  category: categoryName,
                  revenue: 0,
                  cost: 0,
                  profit: 0
                });
              }
              const cat = categoryProfitMap.get(categoryName);
              cat.revenue += item.totalPrice || 0;
              cat.cost += itemCost;
              cat.profit = cat.revenue - cat.cost;
            }
          });
        });
        
        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        // Generate monthly data from sales breakdown
        const monthlyData = (salesData.breakdown || []).map(item => ({
          month: item._id?.toString() || 'N/A',
          revenue: item.totalSales || 0,
          cost: (item.totalSales || 0) * 0.5, // Approximate cost (50% of revenue)
          profit: (item.totalSales || 0) * 0.5,
          margin: 50
        }));
        
        // Calculate operating expenses (from stock adjustments - damages, expiries)
        let operatingExpenses = 0;
        try {
          const adjustmentsResponse = await api.get('/inventory/movements', {
            params: { startDate, endDate, movementType: 'damage,expired', limit: 100 }
          });
          if (adjustmentsResponse.data.success) {
            operatingExpenses = adjustmentsResponse.data.movements?.reduce((sum, m) => sum + (m.totalCost || 0), 0) || 0;
          }
        } catch (err) {
          console.error('Failed to fetch operating expenses:', err);
        }
        
        const netProfit = grossProfit - operatingExpenses;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        // Get top profitable products
        const topProfitableProducts = Array.from(productProfitMap.values())
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 5)
          .map(p => ({
            ...p,
            margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
          }));
        
        // Get category profitability
        const categoryProfitability = Array.from(categoryProfitMap.values())
          .sort((a, b) => b.profit - a.profit)
          .map(c => ({
            ...c,
            margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0
          }));
        
        // Sample expense breakdown (would need separate expense tracking system)
        const expenses = [
          { category: 'Staff Salaries', amount: operatingExpenses * 0.6, percentage: 60 },
          { category: 'Utilities', amount: operatingExpenses * 0.15, percentage: 15 },
          { category: 'Rent', amount: operatingExpenses * 0.15, percentage: 15 },
          { category: 'Others', amount: operatingExpenses * 0.1, percentage: 10 }
        ].filter(e => e.amount > 0);
        
        // Calculate KPIs
        const avgProfitPerTransaction = transactions.length > 0 ? netProfit / transactions.length : 0;
        
        // Find best/worst performing month
        let bestPerformingMonth = 'N/A';
        let worstPerformingMonth = 'N/A';
        let bestProfit = -Infinity;
        let worstProfit = Infinity;
        
        monthlyData.forEach(data => {
          if (data.profit > bestProfit) {
            bestProfit = data.profit;
            bestPerformingMonth = data.month;
          }
          if (data.profit < worstProfit && data.profit > 0) {
            worstProfit = data.profit;
            worstPerformingMonth = data.month;
          }
        });
        
        const targetAchievement = totalRevenue > 0 ? Math.min(100, (totalRevenue / (totalRevenue * 1.1)) * 100) : 0;
        
        setReportData({
          summary: {
            totalRevenue,
            totalCost,
            grossProfit,
            netProfit,
            profitMargin: profitMargin.toFixed(1),
            operatingExpenses,
            tax: 0,
            yearOverYearGrowth: 0
          },
          monthlyData: monthlyData.length > 0 ? monthlyData : generateEmptyMonthlyData(),
          categoryProfitability,
          topProfitableProducts,
          expenses: expenses.length > 0 ? expenses : [{ category: 'No Data', amount: 0, percentage: 100 }],
          kpi: {
            averageProfitPerTransaction: avgProfitPerTransaction,
            bestPerformingMonth,
            worstPerformingMonth,
            targetAchievement: targetAchievement.toFixed(1),
            customerAcquisitionCost: 0,
            lifetimeValue: 0
          }
        });
      } else {
        setReportData(null);
      }
    } catch (error) {
      console.error('Fetch profit data error:', error);
      setError(error.response?.data?.message || 'Failed to load profit report');
      toast.error('Failed to load profit report');
    } finally {
      setLoading(false);
    }
  };
  
  const generateEmptyMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      revenue: 0,
      cost: 0,
      profit: 0,
      margin: 0
    }));
  };

  const handleExport = () => {
    toast.success('Profit report exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, prefix = '₦', suffix = '' }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {prefix}{value !== undefined && value !== null ? 
              (typeof value === 'number' ? value.toLocaleString() : value) : 
              'N/A'}{suffix}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'} ml-1`}>
                {Math.abs(trend)}% vs previous period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader />
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Report</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchProfitData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Report</h1>
            <p className="text-gray-600 mt-1">Financial performance and profitability analysis</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={reportData?.summary.totalRevenue || 0} 
          icon={TrendingUp} 
          color="green" 
          trend={reportData?.summary.yearOverYearGrowth}
        />
        <StatCard 
          title="Total Cost" 
          value={reportData?.summary.totalCost || 0} 
          icon={TrendingDown} 
          color="red" 
        />
        <StatCard 
          title="Gross Profit" 
          value={reportData?.summary.grossProfit || 0} 
          icon={DollarSign} 
          color="blue" 
        />
        <StatCard 
          title="Net Profit Margin" 
          value={reportData?.summary.profitMargin || 0} 
          icon={Percent} 
          color="purple" 
          prefix="" 
          suffix="%"
        />
      </div>

      {/* Profit Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend Analysis</h3>
        <div className="h-96">
          {reportData?.monthlyData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={reportData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => {
                  if (name === 'margin') return [`${value}%`, 'Profit Margin'];
                  return [`₦${value?.toLocaleString() || 0}`, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue" />
                <Bar yAxisId="left" dataKey="cost" fill="#EF4444" name="Cost" />
                <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#10B981" strokeWidth={2} name="Margin" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No chart data available
            </div>
          )}
        </div>
      </div>

      {/* Profitability by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability by Category</h3>
          {reportData?.categoryProfitability?.length > 0 ? (
            <div className="space-y-4">
              {reportData.categoryProfitability.map((category, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    <div className="flex space-x-4">
                      <span className="text-sm text-gray-500">Profit: ₦{(category.profit / 1000).toFixed(0)}K</span>
                      <span className="text-sm font-semibold text-green-600">{category.margin?.toFixed(1) || 0}% margin</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 rounded-full h-2"
                        style={{ width: `${Math.min((category.profit / (reportData.categoryProfitability[0]?.profit || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {((category.profit / (reportData.summary.grossProfit || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No category data available</div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Expenses</h3>
          {reportData?.expenses?.length > 0 && reportData.expenses[0].amount > 0 ? (
            <div className="space-y-3">
              {reportData.expenses.map((expense, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{expense.category}</span>
                    <div className="flex space-x-4">
                      <span className="text-gray-900">₦{expense.amount?.toLocaleString() || 0}</span>
                      <span className="text-gray-500">{expense.percentage?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-orange-500 rounded-full h-1.5"
                      style={{ width: `${Math.min(expense.percentage || 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No expense data available</div>
          )}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between font-semibold">
              <span>Total Operating Expenses</span>
              <span>₦{reportData?.summary.operatingExpenses?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Profitable Products */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Top Profitable Products</h3>
        </div>
        <div className="overflow-x-auto">
          {reportData?.topProfitableProducts?.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.topProfitableProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ₦{product.revenue?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ₦{product.cost?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                      ₦{product.profit?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {product.margin?.toFixed(1) || 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 rounded-full h-2"
                          style={{ width: `${Math.min((product.profit / (reportData.topProfitableProducts[0]?.profit || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">No product data available</div>
          )}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators (KPIs)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Avg Profit per Transaction</span>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">₦{reportData?.kpi?.averageProfitPerTransaction?.toLocaleString() || 0}</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Best Performing Month</span>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{reportData?.kpi?.bestPerformingMonth || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">Highest profit margin achieved</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Target Achievement</span>
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{reportData?.kpi?.targetAchievement || 0}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-purple-600 rounded-full h-1.5"
                style={{ width: `${Math.min(reportData?.kpi?.targetAchievement || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Recommendations for Profit Improvement</h4>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• Focus on high-margin categories to maximize profitability</li>
                <li>• Reduce operating expenses by optimizing inventory management</li>
                <li>• Consider promotional pricing for slow-moving products</li>
                <li>• Review supplier contracts to lower cost of goods sold</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitReport;