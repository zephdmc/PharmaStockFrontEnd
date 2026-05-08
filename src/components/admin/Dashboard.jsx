// frontend/src/components/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  CreditCard,
  Wallet,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// -----------------------------
// Skeleton Loaders
// -----------------------------
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
    <div className="flex justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
    <Skeleton className="mt-3 h-3 w-28" />
  </div>
);

const TransactionSkeleton = () => (
  <div className="p-4 flex justify-between items-center">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-4 w-20" />
  </div>
);

const ProductSkeleton = () => (
  <div className="p-4 flex items-center space-x-3">
    <Skeleton className="w-8 h-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="h-4 w-16" />
  </div>
);

// -----------------------------
// Fintech Stat Card
// -----------------------------
const StatCard = ({ title, value, icon: Icon, colorGradient, prefix = '', loading, trend = null }) => {
  if (loading) return <StatCardSkeleton />;
  const isPositive = trend !== null && trend > 0;
  const isNegative = trend !== null && trend < 0;
  return (
    <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-secondary uppercase tracking-wide">{title}</p>
          <p className="text-2xl md:text-3xl font-extrabold text-primary mt-2 tracking-tight">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorGradient} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {trend !== null && (
        <div className="mt-3 flex items-center text-xs font-medium">
          {isPositive && <ArrowUp className="h-3 w-3 text-accent-green mr-1" />}
          {isNegative && <ArrowDown className="h-3 w-3 text-accent-red mr-1" />}
          <span className={isPositive ? 'text-accent-green' : isNegative ? 'text-accent-red' : 'text-secondary'}>
            {Math.abs(trend)}% vs previous period
          </span>
        </div>
      )}
    </div>
  );
};

// -----------------------------
// Main Dashboard Component
// -----------------------------
const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  const [todayStats, setTodayStats] = useState({ total: 0, count: 0 });
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [periodRevenue, setPeriodRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [salesChartData, setSalesChartData] = useState(null);
  const [paymentChartData, setPaymentChartData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Simulated trends for UI (no logic change)
  const trends = {
    totalProducts: +3,
    lowStock: -5,
    todaySales: +12,
    periodRevenue: +8,
    users: +2,
    expiring: -2,
  };

  const getDateParams = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case 'day':
        return { startDate: format(now, 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd'), groupBy: 'day' };
      case 'week':
        return { startDate: format(subDays(now, 6), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd'), groupBy: 'day' };
      case 'month':
        return { startDate: format(subDays(now, 29), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd'), groupBy: 'day' };
      case 'year':
        return { startDate: format(subDays(now, 364), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd'), groupBy: 'month' };
      default:
        return { startDate: format(subDays(now, 6), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd'), groupBy: 'day' };
    }
  }, [dateRange]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate, groupBy } = getDateParams();

    try {
      const [
        todayRes,
        productsRes,
        lowStockRes,
        expiringRes,
        salesReportRes,
        recentSalesRes,
        dailySummaryRes,
        usersRes,
      ] = await Promise.allSettled([
        api.get('/sales/today'),
        api.get('/products', { params: { page: 1, limit: 1 } }),
        api.get('/products/low-stock'),
        api.get('/products/expiring', { params: { days: 90 } }),
        api.get('/sales/report', { params: { startDate, endDate, groupBy } }),
        api.get('/sales', { params: { page: 1, limit: 5 } }),
        api.get('/reports/daily-summary'),
        api.get('/users', { params: { page: 1, limit: 1 } }),
      ]);

      if (todayRes.status === 'fulfilled') {
        const d = todayRes.value.data;
        setTodayStats({ total: d.total || 0, count: d.count || 0 });
      }
      if (productsRes.status === 'fulfilled') {
        setTotalProducts(productsRes.value.data.total || 0);
      }
      if (lowStockRes.status === 'fulfilled') {
        const d = lowStockRes.value.data;
        setLowStockCount(d.count ?? d.products?.length ?? 0);
      }
      if (expiringRes.status === 'fulfilled') {
        const d = expiringRes.value.data;
        setExpiringCount(d.count ?? d.products?.length ?? 0);
      }
      if (salesReportRes.status === 'fulfilled') {
        const report = salesReportRes.value.data?.report;
        if (report) {
          setPeriodRevenue(report.summary?.totalSales || 0);
          if (report.topProducts?.length > 0) {
            setTopProducts(
              report.topProducts.map(p => ({
                name: p.productName || p.name,
                quantity: p.quantity || 0,
                revenue: p.revenue || 0,
              }))
            );
          }
          const points = report.breakdown || [];
          if (points.length > 0) {
            const labelFmt = groupBy === 'month' ? 'MMM yy' : 'dd MMM';
            setSalesChartData({
              labels: points.map(p => {
                try {
                  return format(new Date(p._id), labelFmt);
                } catch {
                  return p._id || '—';
                }
              }),
              datasets: [
                {
                  label: 'Revenue (₦)',
                  data: points.map(p => p.totalSales || 0),
                  borderColor: '#2F6BFF',
                  backgroundColor: 'rgba(47, 107, 255, 0.05)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#5A3FFF',
                  pointBorderColor: '#fff',
                  pointRadius: 3,
                  pointHoverRadius: 5,
                },
              ],
            });
          } else {
            setSalesChartData(null);
          }
        }
      }
      if (recentSalesRes.status === 'fulfilled') {
        setRecentTransactions(recentSalesRes.value.data?.transactions || []);
      }
      if (dailySummaryRes.status === 'fulfilled') {
        const report = dailySummaryRes.value.data?.report || {};
        if (topProducts.length === 0 && report.topProducts?.length > 0) {
          setTopProducts(report.topProducts);
        }
        const pm = report.paymentMethods || {};
        const pmTotal = (pm.cash || 0) + (pm.card || 0) + (pm.transfer || 0);
        if (pmTotal > 0) {
          setPaymentChartData({
            labels: ['Cash', 'Card', 'Transfer'],
            datasets: [
              {
                data: [pm.cash || 0, pm.card || 0, pm.transfer || 0],
                backgroundColor: ['#00C853', '#2F6BFF', '#F5A623'],
                borderRadius: 8,
              },
            ],
          });
        }
      }
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data;
        setTotalUsers(d.total || d.users?.length || 0);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, getDateParams, topProducts.length]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Chart Options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter' } } },
      tooltip: { callbacks: { label: (ctx) => `₦${ctx.raw.toLocaleString()}` }, backgroundColor: '#101828', titleColor: '#fff', bodyColor: '#ddd' },
    },
    scales: {
      y: { ticks: { callback: v => `₦${v / 1000}k`, stepSize: 50000, font: { family: 'Inter' } }, grid: { borderDash: [4, 4], color: '#eef2f6' } },
      x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Inter' } } }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ₦${ctx.raw.toLocaleString()}` } } },
    cutout: '65%',
  };

  const emptyLine = {
    labels: ['No data'],
    datasets: [{ label: 'Revenue (₦)', data: [0], borderColor: '#2F6BFF', backgroundColor: 'rgba(47,107,255,0.05)', fill: true, tension: 0.4 }],
  };

  const emptyDoughnut = {
    labels: ['No data'],
    datasets: [{ data: [1], backgroundColor: ['#eef2f6'] }],
  };

  const rangeLabel = dateRange.charAt(0).toUpperCase() + dateRange.slice(1);

  return (
    <div className="bg-dashboard-bg min-h-screen pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Hero Section with Gradient */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2F6BFF] to-[#5A3FFF] p-6 md:p-8 mb-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Welcome back, {user?.name} 👋</h1>
                <p className="text-white/80 text-sm mt-1">Here's what's happening with your pharmacy today.</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex space-x-3">
                  <button
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all rounded-xl px-4 py-2 text-sm font-medium flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Today's Sales</p>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24 bg-white/20" /> : `₦${todayStats.total.toLocaleString()}`}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Transactions</p>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16 bg-white/20" /> : todayStats.count}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">{rangeLabel} Revenue</p>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24 bg-white/20" /> : `₦${periodRevenue.toLocaleString()}`}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Active Users</p>
                <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16 bg-white/20" /> : totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        </div>

        {/* Range Selector (Pill style) */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-primary-gradient text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-secondary border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
          <StatCard title="Total Products" value={totalProducts} icon={Package} colorGradient="from-blue-500 to-blue-600" loading={loading} trend={trends.totalProducts} />
          <StatCard title="Low Stock Alert" value={lowStockCount} icon={AlertTriangle} colorGradient="from-red-500 to-red-600" loading={loading} trend={trends.lowStock} />
          <StatCard title="Today's Sales" value={todayStats.total} icon={ShoppingCart} colorGradient="from-green-500 to-green-600" prefix="₦" loading={loading} trend={trends.todaySales} />
          <StatCard title={`${rangeLabel} Revenue`} value={periodRevenue} icon={TrendingUp} colorGradient="from-purple-500 to-purple-600" prefix="₦" loading={loading} trend={trends.periodRevenue} />
          <StatCard title="Active Users" value={totalUsers} icon={Users} colorGradient="from-orange-500 to-orange-600" loading={loading} trend={trends.users} />
          <StatCard title="Expiring Soon" value={expiringCount} icon={Calendar} colorGradient="from-yellow-500 to-yellow-600" loading={loading} trend={trends.expiring} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary">Revenue Trend</h3>
              <span className="text-xs text-secondary bg-gray-100 px-3 py-1 rounded-full capitalize">{dateRange} view</span>
            </div>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F6BFF]" />
                </div>
              ) : (
                <Line data={salesChartData || emptyLine} options={lineOptions} />
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Payment Methods (Today)</h3>
              <CreditCard className="h-4 w-4 text-secondary" />
            </div>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F6BFF]" />
                </div>
              ) : (
                <Doughnut data={paymentChartData || emptyDoughnut} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-primary">Recent Transactions</h3>
              <button className="text-sm text-[#2F6BFF] hover:text-[#5A3FFF] font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {loading
                ? Array(4).fill(0).map((_, i) => <TransactionSkeleton key={i} />)
                : recentTransactions.length === 0 ? (
                    <div className="p-8 text-center text-secondary">No transactions yet</div>
                  ) : (
                    recentTransactions.map((tx) => (
                      <div key={tx._id} className="p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${tx.status === 'completed' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {tx.status === 'completed' ? <CheckCircle className="h-4 w-4 text-accent-green" /> : <XCircle className="h-4 w-4 text-accent-red" />}
                            </div>
                            <div>
                              <p className="font-medium text-primary">{tx.customer?.name || 'Walk-in Customer'}</p>
                              <div className="flex items-center text-xs text-secondary mt-0.5">
                                <Clock className="h-3 w-3 mr-1" />
                                {tx.createdAt ? format(new Date(tx.createdAt), 'dd MMM yyyy, hh:mm a') : '—'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">₦{(tx.totalAmount || 0).toLocaleString()}</p>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                                tx.status === 'completed' ? 'bg-green-100 text-accent-green' : 'bg-red-100 text-accent-red'
                              }`}
                            >
                              {tx.status || 'completed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
            </div>
          </div>

          {/* Top Products Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-primary">Best Selling Products</h3>
              <span className="text-xs text-secondary bg-gray-100 px-2 py-1 rounded-full capitalize">{dateRange}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {loading
                ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
                : topProducts.length === 0 ? (
                    <div className="p-8 text-center text-secondary">No sales data for this period</div>
                  ) : (
                    topProducts.map((product, index) => (
                      <div key={product.name || index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2F6BFF] to-[#5A3FFF] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-primary">{product.name}</p>
                              <p className="text-xs text-secondary">{product.quantity?.toLocaleString() || 0} units sold</p>
                            </div>
                          </div>
                          <p className="font-semibold text-primary">₦{(product.revenue || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 rounded-xl p-3 text-gray-700 hover:border-[#2F6BFF] hover:shadow-sm transition-all group">
            <Package className="h-5 w-5 text-[#2F6BFF] group-hover:scale-105 transition-transform" />
            <span className="text-sm font-medium">Add Product</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 rounded-xl p-3 text-gray-700 hover:border-[#00C853] hover:shadow-sm transition-all group">
            <ShoppingCart className="h-5 w-5 text-[#00C853] group-hover:scale-105 transition-transform" />
            <span className="text-sm font-medium">Restock</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 rounded-xl p-3 text-gray-700 hover:border-[#5A3FFF] hover:shadow-sm transition-all group">
            <Users className="h-5 w-5 text-[#5A3FFF] group-hover:scale-105 transition-transform" />
            <span className="text-sm font-medium">Manage Users</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 rounded-xl p-3 text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all group">
            <Download className="h-5 w-5 text-gray-500 group-hover:scale-105 transition-transform" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;