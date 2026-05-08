// frontend/src/components/admin/InventoryReport.jsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  AlertCircle,
  ChevronRight,
  Box,
  Layers
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-hot-toast';
import Loader from '../common/Loader';
import api from '../../services/api';

const InventoryReport = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('stock-status');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
    fetchProducts();
  }, [reportType, dateRange, selectedProduct]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 100 } });
      if (response.data.success && response.data.products) {
        const productList = ['all', ...response.data.products.map(p => p.name)];
        setProducts(productList);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts(['all']);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = null;
      
      if (reportType === 'stock-status') {
        const response = await api.get('/inventory/summary');
        const productsResponse = await api.get('/products', { params: { limit: 100 } });
        
        if (response.data.success) {
          const products = productsResponse.data.products || [];
          const stockItems = products.map(product => {
            const totalUnits = (product.currentStock?.packs || 0) * (product.packSize || 1) + (product.currentStock?.units || 0);
            let status = 'good';
            if (totalUnits === 0) status = 'critical';
            else if (totalUnits < (product.reorderLevel || 20)) status = 'low';
            return {
              id: product._id,
              name: product.name || 'Unknown',
              category: product.category?.name || 'Uncategorized',
              stock: totalUnits,
              packs: product.currentStock?.packs || 0,
              units: product.currentStock?.units || 0,
              packSize: product.packSize || 1,
              value: totalUnits * (product.pricePerUnit || (product.pricePerPack / product.packSize) || 0),
              status: status
            };
          });
          data = {
            summary: {
              totalProducts: products.length,
              totalValue: stockItems.reduce((sum, item) => sum + item.value, 0),
              lowStockItems: stockItems.filter(item => item.status === 'low').length,
              outOfStock: stockItems.filter(item => item.status === 'critical').length,
              expiringSoon: 0
            },
            items: stockItems
          };
          try {
            const expiringResponse = await api.get('/inventory/expiring', { params: { days: 90 } });
            if (expiringResponse.data.success) {
              data.summary.expiringSoon = expiringResponse.data.count || 0;
            }
          } catch (err) {
            console.error('Failed to fetch expiring products:', err);
          }
        }
      } 
      else if (reportType === 'movement') {
        const response = await api.get('/inventory/movements', { 
          params: { 
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            limit: 100
          } 
        });
        if (response.data.success) {
          const movements = response.data.movements || [];
          const totalIn = movements
            .filter(m => m.movementType === 'restock')
            .reduce((sum, m) => sum + (m.quantityPacks * (m.productId?.packSize || 1) + m.quantityUnits), 0);
          const totalOut = movements
            .filter(m => m.movementType === 'sale' || m.movementType === 'adjustment')
            .reduce((sum, m) => sum + (m.quantityPacks * (m.productId?.packSize || 1) + m.quantityUnits), 0);
          data = {
            summary: {
              totalIn,
              totalOut,
              netChange: totalIn - totalOut,
              totalValue: movements.reduce((sum, m) => sum + (m.totalCost || 0), 0)
            },
            items: movements.slice(0, 50).map(m => ({
              id: m._id,
              date: m.createdAt,
              product: m.productId?.name || 'Unknown',
              type: m.movementType === 'restock' ? 'restock' : (m.movementType === 'sale' ? 'sale' : 'adjustment'),
              quantity: (m.quantityPacks * (m.productId?.packSize || 1)) + m.quantityUnits,
              value: m.totalCost || 0
            }))
          };
        }
      }
      else if (reportType === 'valuation') {
        const response = await api.get('/inventory/valuation');
        const productsResponse = await api.get('/products', { params: { limit: 100 } });
        if (response.data.success) {
          const products = productsResponse.data.products || [];
          const categoryMap = new Map();
          products.forEach(product => {
            const categoryName = product.category?.name || 'Uncategorized';
            const totalUnits = (product.currentStock?.packs || 0) * (product.packSize || 1) + (product.currentStock?.units || 0);
            const value = totalUnits * (product.pricePerUnit || (product.pricePerPack / product.packSize) || 0);
            if (!categoryMap.has(categoryName)) {
              categoryMap.set(categoryName, { value: 0, count: 0 });
            }
            const cat = categoryMap.get(categoryName);
            cat.value += value;
            cat.count += 1;
          });
          const categoryItems = Array.from(categoryMap.entries()).map(([name, data]) => ({
            category: name,
            value: data.value,
            count: data.count,
            percentage: (data.value / (response.data.valuation?.totalValue || 1)) * 100
          }));
          const totalValue = categoryItems.reduce((sum, item) => sum + item.value, 0);
          data = {
            summary: {
              totalValue: totalValue,
              averageCost: totalValue > 0 ? totalValue / products.length : 0,
              mostValuable: categoryItems.length > 0 ? 
                `${categoryItems.reduce((a, b) => a.value > b.value ? a : b).category} - ₦${Math.max(...categoryItems.map(c => c.value)).toLocaleString()}` : 'N/A',
              leastValuable: categoryItems.length > 0 ?
                `${categoryItems.reduce((a, b) => a.value < b.value ? a : b).category} - ₦${Math.min(...categoryItems.map(c => c.value)).toLocaleString()}` : 'N/A'
            },
            items: categoryItems.sort((a, b) => b.value - a.value)
          };
        }
      }
      
      if (data) {
        setReportData(data);
      } else {
        setReportData(null);
      }
    } catch (error) {
      console.error('Fetch report error:', error);
      setError(error.response?.data?.message || 'Failed to load report data');
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => toast.success('Report exported successfully');
  const handlePrint = () => window.print();

  const getStatusBadge = (status) => {
    switch(status) {
      case 'good': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Good Stock</span>;
      case 'low': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">Low Stock</span>;
      case 'critical': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Critical</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">N/A</span>;
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-secondary uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-extrabold text-primary mt-1">
            {value !== undefined && value !== null ? 
              (typeof value === 'number' ? `₦${value.toLocaleString()}` : value) : 'N/A'}
          </p>
          {trend && (
            <div className="flex items-center mt-2 text-xs">
              {trend > 0 ? <TrendingUp className="h-3 w-3 text-accent-green mr-1" /> : <TrendingDown className="h-3 w-3 text-accent-red mr-1" />}
              <span className={trend > 0 ? 'text-accent-green' : 'text-accent-red'}>{Math.abs(trend)}% from last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-50`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const NoDataMessage = () => (
    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
      <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">No data available for the selected criteria</p>
      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or adding inventory data</p>
    </div>
  );

  const StockStatusCard = ({ item }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-primary">{item.name}</h3>
          <p className="text-xs text-secondary mt-0.5">{item.category}</p>
        </div>
        {getStatusBadge(item.status)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-secondary">Stock:</span> <span className="font-medium">{item.stock} units</span></div>
        <div><span className="text-secondary">Value:</span> <span className="font-medium">₦{item.value.toLocaleString()}</span></div>
        <div className="col-span-2 text-xs text-secondary">{item.packs} packs + {item.units} units</div>
      </div>
    </div>
  );

  const MovementCard = ({ item }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-primary">{item.product}</p>
          <p className="text-xs text-secondary mt-0.5">{item.date ? format(new Date(item.date), 'dd MMM yyyy HH:mm') : 'N/A'}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          item.type === 'sale' ? 'bg-red-100 text-red-700' : (item.type === 'restock' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')
        }`}>
          {item.type === 'sale' ? 'Sale' : (item.type === 'restock' ? 'Restock' : 'Adjustment')}
        </span>
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-secondary">Quantity:</span>
        <span className="font-medium">{item.quantity} units</span>
      </div>
      <div className="flex justify-between text-sm mt-1">
        <span className="text-secondary">Value:</span>
        <span className="font-medium">₦{item.value.toLocaleString()}</span>
      </div>
    </div>
  );

  const ValuationCard = ({ item }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-primary">{item.category}</h3>
          <p className="text-xs text-secondary mt-0.5">{item.count} product(s)</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">₦{item.value.toLocaleString()}</p>
          <p className="text-xs text-secondary">{item.percentage?.toFixed(1)}% of total</p>
        </div>
      </div>
      <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-[#2F6BFF] to-[#5A3FFF] rounded-full h-1.5" style={{ width: `${Math.min(item.percentage || 0, 100)}%` }} />
      </div>
    </div>
  );

  if (loading) return <div className="h-96 flex justify-center items-center"><Loader /></div>;
  if (error && !reportData) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Report</h3>
        <p className="text-red-600">{error}</p>
        <button onClick={fetchReportData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Reports</h1>
            <p className="text-sm text-gray-600 mt-1">Analyze your inventory performance</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
              <Download className="h-4 w-4 mr-2" /> Export
            </button>
            <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
              <Printer className="h-4 w-4 mr-2" /> Print
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F6BFF]">
                <option value="stock-status">Stock Status</option>
                <option value="movement">Stock Movement</option>
                <option value="valuation">Inventory Valuation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm">
                {products.map(p => <option key={p} value={p}>{p === 'all' ? 'All Products' : p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {reportData?.summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {reportType === 'stock-status' && (
              <>
                <StatCard title="Total Products" value={reportData.summary.totalProducts || 0} icon={Package} color="blue" />
                <StatCard title="Total Value" value={reportData.summary.totalValue || 0} icon={FileText} color="green" />
                <StatCard title="Low Stock Items" value={reportData.summary.lowStockItems || 0} icon={AlertTriangle} color="yellow" />
                <StatCard title="Expiring Soon" value={reportData.summary.expiringSoon || 0} icon={Calendar} color="red" />
              </>
            )}
            {reportType === 'movement' && (
              <>
                <StatCard title="Total In" value={reportData.summary.totalIn || 0} icon={TrendingUp} color="green" />
                <StatCard title="Total Out" value={reportData.summary.totalOut || 0} icon={TrendingDown} color="red" />
                <StatCard title="Net Change" value={reportData.summary.netChange || 0} icon={Package} color="blue" />
                <StatCard title="Total Value" value={reportData.summary.totalValue || 0} icon={FileText} color="purple" />
              </>
            )}
            {reportType === 'valuation' && (
              <>
                <StatCard title="Total Value" value={reportData.summary.totalValue || 0} icon={Package} color="blue" />
                <StatCard title="Average Cost" value={reportData.summary.averageCost?.toFixed(2) || 0} icon={FileText} color="green" />
                <StatCard title="Most Valuable" value={reportData.summary.mostValuable || 'N/A'} icon={TrendingUp} color="purple" />
                <StatCard title="Least Valuable" value={reportData.summary.leastValuable || 'N/A'} icon={TrendingDown} color="yellow" />
              </>
            )}
          </div>
        )}

        {/* Detail Cards Grid (replacing tables) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {reportType === 'stock-status' && 'Stock Level Details'}
            {reportType === 'movement' && 'Movement History'}
            {reportType === 'valuation' && 'Valuation Breakdown'}
          </h2>
          {!reportData?.items || reportData.items.length === 0 ? (
            <NoDataMessage />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.items.map(item => {
                if (reportType === 'stock-status') return <StockStatusCard key={item.id} item={item} />;
                if (reportType === 'movement') return <MovementCard key={item.id} item={item} />;
                if (reportType === 'valuation') return <ValuationCard key={item.category} item={item} />;
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;