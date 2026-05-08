// frontend/src/components/reports/SalesReport.jsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Printer,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  FileText,
  AlertCircle
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Loader from '../common/Loader';
import api from '../../services/api';

const SalesReport = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [reportType, setReportType] = useState('daily');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgents();
    fetchCategories();
    fetchReportData();
  }, [dateRange, reportType, selectedCategory, selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/users/agents');
      if (response.data.success) {
        const agentList = ['All', ...response.data.agents.map(a => a.name)];
        setAgents(agentList);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents(['All']);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success && response.data.categories) {
        const categoryList = ['All', ...response.data.categories.map(c => c.name)];
        setCategories(categoryList);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(['All']);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      
      // Fetch sales report from API
      const response = await api.get('/sales/report', {
        params: { startDate, endDate, groupBy: reportType === 'daily' ? 'day' : 'month' }
      });
      
      if (response.data.success && response.data.report) {
        const salesReport = response.data.report;
        
        // Process summary data
        const summary = salesReport.summary || {
          totalSales: 0,
          totalTransactions: 0,
          averageTransaction: 0,
          totalItemsSold: 0,
          uniqueCustomers: 0,
          growthRate: 0
        };
        
        // Process daily/weekly data
        let dailyData = [];
        if (salesReport.breakdown) {
          dailyData = salesReport.breakdown.map(item => ({
            date: item._id?.toString() || 'N/A',
            sales: item.totalSales || 0,
            transactions: item.transactionCount || 0
          }));
        } else {
          // Generate empty date range
          const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
          for (let i = 0; i <= daysDiff; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            dailyData.push({
              date: format(date, 'dd/MM'),
              sales: 0,
              transactions: 0
            });
          }
        }
        
        // Process category data (from product sales)
        let categoryData = [];
        if (salesReport.topProducts) {
          // Group products by category (would need category mapping)
          const categoryMap = new Map();
          const products = salesReport.topProducts || [];
          
          products.forEach(product => {
            const categoryName = product.category || 'Others';
            if (!categoryMap.has(categoryName)) {
              categoryMap.set(categoryName, { name: categoryName, sales: 0, items: 0 });
            }
            const cat = categoryMap.get(categoryName);
            cat.sales += product.revenue || 0;
            cat.items += product.quantity || 0;
          });
          
          const totalSales = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.sales, 0);
          categoryData = Array.from(categoryMap.values()).map(cat => ({
            ...cat,
            percentage: totalSales > 0 ? (cat.sales / totalSales) * 100 : 0
          }));
        }
        
        // If no category data, show default
        if (categoryData.length === 0) {
          categoryData = [{ name: 'No Data', sales: 0, percentage: 100, items: 0 }];
        }
        
        // Process top products
        const topProducts = (salesReport.topProducts || []).slice(0, 5).map(p => ({
          name: p.productName || 'Unknown',
          sales: p.revenue || 0,
          quantity: p.quantity || 0,
          price: p.revenue > 0 && p.quantity > 0 ? p.revenue / p.quantity : 0
        }));
        
        // Process agent performance
        let agentPerformance = [];
        if (selectedAgent === 'All' || selectedAgent === 'all') {
          const agentResponse = await api.get('/sales/agent-performance', {
            params: { startDate, endDate }
          });
          if (agentResponse.data.success) {
            agentPerformance = agentResponse.data.agents || [];
          }
        } else if (selectedAgent !== 'All' && selectedAgent !== 'all') {
          // Filter for specific agent
          const agentId = agents.find(a => a === selectedAgent)?._id;
          if (agentId) {
            const agentResponse = await api.get(`/sales/agent/${agentId}`, {
              params: { startDate, endDate }
            });
            if (agentResponse.data.success) {
              agentPerformance = [{
                name: selectedAgent,
                sales: agentResponse.data.total || 0,
                transactions: agentResponse.data.count || 0,
                average: agentResponse.data.total > 0 && agentResponse.data.count > 0 
                  ? agentResponse.data.total / agentResponse.data.count : 0
              }];
            }
          }
        }
        
        // Generate hourly data (simplified - would need separate API endpoint)
        const hourlyData = generateEmptyHourlyData();
        
        // Generate weekday data (simplified - would need separate API endpoint)
        const weekdayData = generateEmptyWeekdayData();
        
        setReportData({
          summary,
          dailyData,
          categoryData,
          topProducts,
          agentPerformance,
          hourlyData,
          weekdayData
        });
      } else {
        setReportData(null);
      }
    } catch (error) {
      console.error('Fetch sales report error:', error);
      setError(error.response?.data?.message || 'Failed to load sales report');
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };
  
  const generateEmptyHourlyData = () => {
    const hours = [];
    for (let i = 8; i <= 20; i++) {
      hours.push({
        hour: `${i}:00`,
        sales: 0,
        transactions: 0
      });
    }
    return hours;
  };
  
  const generateEmptyWeekdayData = () => {
    return [
      { day: 'Mon', sales: 0, transactions: 0 },
      { day: 'Tue', sales: 0, transactions: 0 },
      { day: 'Wed', sales: 0, transactions: 0 },
      { day: 'Thu', sales: 0, transactions: 0 },
      { day: 'Fri', sales: 0, transactions: 0 },
      { day: 'Sat', sales: 0, transactions: 0 },
      { day: 'Sun', sales: 0, transactions: 0 }
    ];
  };

  const handleExport = (format) => {
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const StatCard = ({ title, value, icon: Icon, color, trend, prefix = '₦' }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {prefix}{value !== undefined && value !== null ? 
              (typeof value === 'number' ? value.toLocaleString() : value) : 
              'N/A'}
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

  const NoDataMessage = () => (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">No sales data available for the selected period</p>
      <p className="text-sm text-gray-400 mt-2">Try adjusting your date range or check back later</p>
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
            onClick={fetchReportData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasData = reportData?.summary?.totalSales > 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
            <p className="text-gray-600 mt-1">Comprehensive sales analytics and performance metrics</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <Download className="h-5 w-5 mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <FileText className="h-5 w-5 mr-2" />
              Export Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">POS Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {agents.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!hasData ? (
        <NoDataMessage />
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <StatCard 
              title="Total Sales" 
              value={reportData?.summary?.totalSales || 0} 
              icon={DollarSign} 
              color="green" 
              trend={reportData?.summary?.growthRate}
            />
            <StatCard 
              title="Transactions" 
              value={reportData?.summary?.totalTransactions || 0} 
              icon={ShoppingCart} 
              color="blue" 
              prefix=""
            />
            <StatCard 
              title="Average Transaction" 
              value={reportData?.summary?.averageTransaction || 0} 
              icon={TrendingUp} 
              color="purple" 
            />
            <StatCard 
              title="Items Sold" 
              value={reportData?.summary?.totalItemsSold || 0} 
              icon={Package} 
              color="orange" 
              prefix=""
            />
            <StatCard 
              title="Unique Customers" 
              value={reportData?.summary?.uniqueCustomers || 0} 
              icon={Users} 
              color="red" 
              prefix=""
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Sales Trend */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(dateRange.startDate), 'dd MMM')} - {format(new Date(dateRange.endDate), 'dd MMM yyyy')}
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₦${value?.toLocaleString() || 0}`, 'Sales']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                      name="Sales (₦)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData?.categoryData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1) || 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                    >
                      {(reportData?.categoryData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₦${value?.toLocaleString() || 0}`, 'Sales']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Sales Pattern */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Sales Pattern</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData?.hourlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₦${value?.toLocaleString() || 0}`, 'Sales']} />
                    <Legend />
                    <Bar dataKey="sales" fill="#10B981" name="Sales (₦)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekday Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekday Performance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData?.weekdayData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" name="Sales (₦)" />
                    <Bar yAxisId="right" dataKey="transactions" fill="#F59E0B" name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(reportData?.topProducts || []).map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {product.quantity || 0} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₦{product.price?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        ₦{product.sales?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 rounded-full h-2"
                            style={{ width: `${Math.min((product.sales / (reportData?.topProducts?.[0]?.sales || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent Performance */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">POS Agent Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Average Sale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(reportData?.agentPerformance || []).map((agent, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {agent.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        ₦{agent.sales?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {agent.transactions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₦{agent.average?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 rounded-full h-2"
                                style={{ width: `${Math.min((agent.sales / (reportData?.agentPerformance?.[0]?.sales || 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {Math.round((agent.sales / (reportData?.agentPerformance?.[0]?.sales || 1)) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesReport;