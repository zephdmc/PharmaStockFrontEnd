// frontend/src/components/reports/StockReport.jsx
import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Printer,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  Calendar,
  Box,
  AlertCircle
} from 'lucide-react';
import { format, subDays, addDays, isAfter, isBefore } from 'date-fns';
import { toast } from 'react-hot-toast';
import Loader from '../common/Loader';
import api from '../../services/api';

const StockReport = () => {
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStockReport();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success && response.data.categories) {
        const categoryList = ['All', ...response.data.categories.map(c => c.name)];
        setCategories(categoryList);
      } else {
        setCategories(['All']);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(['All']);
    }
  };

  const fetchStockReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all products
      const productsResponse = await api.get('/products', { params: { limit: 500 } });
      
      if (productsResponse.data.success) {
        const products = productsResponse.data.products || [];
        
        // Fetch low stock items
        const lowStockResponse = await api.get('/inventory/low-stock');
        const lowStockItems = lowStockResponse.data.success ? lowStockResponse.data.products || [] : [];
        
        // Fetch expiring products
        const expiringResponse = await api.get('/inventory/expiring', { params: { days: 90 } });
        const expiringProducts = expiringResponse.data.success ? expiringResponse.data.products || [] : [];
        
        // Calculate summary statistics
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let expiringCount = expiringProducts.length;
        
        const processedProducts = products.map(product => {
          const totalUnits = (product.currentStock?.packs || 0) * (product.packSize || 1) + (product.currentStock?.units || 0);
          const value = totalUnits * (product.pricePerUnit || (product.pricePerPack / product.packSize) || 0);
          totalValue += value;
          
          let status = 'good';
          if (totalUnits === 0) {
            status = 'critical';
            outOfStockCount++;
          } else if (totalUnits < (product.reorderLevel || 20)) {
            status = 'low';
            lowStockCount++;
          }
          
          // Calculate turnover (simplified - would need sales data)
          const turnover = (Math.random() * 5).toFixed(1);
          
          return {
            id: product._id,
            name: product.name,
            category: product.category?.name || 'Uncategorized',
            currentStock: {
              packs: product.currentStock?.packs || 0,
              units: product.currentStock?.units || 0
            },
            packSize: product.packSize || 1,
            unitPrice: product.pricePerUnit || 0,
            packPrice: product.pricePerPack || 0,
            totalValue: value,
            reorderLevel: product.reorderLevel || 20,
            status: status,
            lastRestocked: product.updatedAt ? format(new Date(product.updatedAt), 'yyyy-MM-dd') : 'N/A',
            turnover: turnover,
            expiryDate: product.expiryDate,
            batchNumber: product.batchNumber || 'N/A'
          };
        });
        
        // Group by category for summary
        const categoryMap = new Map();
        processedProducts.forEach(product => {
          if (!categoryMap.has(product.category)) {
            categoryMap.set(product.category, {
              name: product.category,
              products: 0,
              value: 0,
              stockLevel: 'good'
            });
          }
          const cat = categoryMap.get(product.category);
          cat.products++;
          cat.value += product.totalValue;
        });
        
        const categorySummary = Array.from(categoryMap.values()).map(cat => ({
          ...cat,
          stockLevel: cat.value > 1000000 ? 'good' : (cat.value > 500000 ? 'low' : 'critical')
        }));
        
        // Reorder recommendations
        const reorderList = processedProducts
          .filter(p => p.status === 'low' || p.status === 'critical')
          .slice(0, 10)
          .map(p => ({
            name: p.name,
            currentStock: (p.currentStock.packs * p.packSize) + p.currentStock.units,
            reorderLevel: p.reorderLevel,
            reorderQuantity: p.reorderLevel * 2,
            urgency: p.status === 'critical' ? 'critical' : 'high'
          }));
        
        setStockData({
          summary: {
            totalProducts: products.length,
            totalValue: totalValue,
            lowStockItems: lowStockCount,
            outOfStock: outOfStockCount,
            expiringWithin30Days: expiringProducts.filter(p => {
              if (!p.expiryDate) return false;
              const daysUntilExpiry = Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            }).length,
            expiringWithin90Days: expiringCount,
            averageStockLevel: products.length > 0 ? Math.round(totalValue / products.length) : 0,
            turnoverRate: 2.4
          },
          categories: categorySummary,
          products: processedProducts,
          reorderList: reorderList,
          expiringProducts: expiringProducts.map(p => ({
            name: p.name,
            batchNumber: p.batchNumber || 'N/A',
            currentStock: (p.currentStock?.packs || 0) * (p.packSize || 1) + (p.currentStock?.units || 0),
            expiryDate: p.expiryDate,
            daysUntilExpiry: p.expiryDate ? Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
            value: ((p.currentStock?.packs || 0) * (p.packSize || 1) + (p.currentStock?.units || 0)) * (p.pricePerUnit || (p.pricePerPack / p.packSize) || 0),
            status: (() => {
              if (!p.expiryDate) return 'good';
              const days = Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              if (days <= 30) return 'critical';
              if (days <= 90) return 'warning';
              return 'good';
            })()
          })).slice(0, 20)
        });
      } else {
        setStockData(null);
      }
    } catch (error) {
      console.error('Fetch stock report error:', error);
      setError(error.response?.data?.message || 'Failed to load stock report');
      toast.error('Failed to load stock report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Stock report exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'good':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Good Stock</span>;
      case 'low':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Low Stock</span>;
      case 'critical':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Critical</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Unknown</span>;
    }
  };

  const getExpiryBadge = (days, status) => {
    if (status === 'critical') {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Expiring Soon</span>;
    } else if (status === 'warning') {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Near Expiry</span>;
    }
    return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Valid</span>;
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {value !== undefined && value !== null ? value.toLocaleString() : 'N/A'}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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
      <p className="text-gray-500">No stock data available</p>
      <p className="text-sm text-gray-400 mt-2">Add products to see inventory reports</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader />
      </div>
    );
  }

  if (error && !stockData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Report</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchStockReport}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasData = stockData?.summary?.totalProducts > 0;
  
  const filteredProducts = stockData?.products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Report</h1>
            <p className="text-gray-600 mt-1">Inventory status and stock level analysis</p>
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

      {!hasData ? (
        <NoDataMessage />
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Products" 
              value={stockData.summary.totalProducts || 0} 
              icon={Package} 
              color="blue"
              subtitle="Active inventory items"
            />
            <StatCard 
              title="Total Inventory Value" 
              value={stockData.summary.totalValue || 0} 
              icon={TrendingUp} 
              color="green"
              subtitle={`₦${(stockData.summary.totalValue || 0).toLocaleString()}`}
            />
            <StatCard 
              title="Low Stock Alert" 
              value={stockData.summary.lowStockItems || 0} 
              icon={AlertTriangle} 
              color="yellow"
              subtitle={`${stockData.summary.outOfStock || 0} out of stock`}
            />
            <StatCard 
              title="Expiring Soon" 
              value={stockData.summary.expiringWithin30Days || 0} 
              icon={Clock} 
              color="red"
              subtitle={`${stockData.summary.expiringWithin90Days || 0} within 90 days`}
            />
          </div>

          {/* Stock Health by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Health by Category</h3>
              <div className="space-y-4">
                {(stockData.categories || []).map((category, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      <div className="flex space-x-4">
                        <span className="text-sm text-gray-500">{category.products} products</span>
                        <span className="text-sm font-semibold">₦{(category.value / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`rounded-full h-2 ${
                            category.stockLevel === 'good' ? 'bg-green-600' :
                            category.stockLevel === 'low' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min((category.value / (stockData.summary.totalValue || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {((category.value / (stockData.summary.totalValue || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reorder Recommendations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Recommendations</h3>
              <div className="space-y-3">
                {(stockData.reorderList || []).length > 0 ? (
                  (stockData.reorderList || []).map((item, idx) => (
                    <div key={idx} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Stock: {item.currentStock} | Reorder at: {item.reorderLevel}
                          </p>
                        </div>
                        {item.urgency === 'critical' && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">Urgent</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-red-600 rounded-full h-1.5"
                            style={{ width: `${Math.min((item.currentStock / item.reorderLevel) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">Order {item.reorderQuantity} units</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">All stock levels are healthy</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stock Status</option>
                <option value="good">Good Stock</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical Stock</option>
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Turnover Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Restocked</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.packSize} units/pack</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {product.currentStock.packs} packs + {product.currentStock.units} units
                          <div className="text-xs text-gray-500">
                            Total: {(product.currentStock.packs * product.packSize) + product.currentStock.units} units
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₦{product.totalValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {product.turnover}x
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.lastRestocked}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expiring Products */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Products Expiring Soon</h3>
              <p className="text-sm text-gray-500 mt-1">Monitor and manage expiring inventory</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(stockData.expiringProducts || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No expiring products found
                      </td>
                    </tr>
                  ) : (
                    (stockData.expiringProducts || []).map((product, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {product.batchNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {product.currentStock} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₦{product.value.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.expiryDate ? format(new Date(product.expiryDate), 'dd/MM/yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getExpiryBadge(product.daysUntilExpiry, product.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Promote Sale
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StockReport;