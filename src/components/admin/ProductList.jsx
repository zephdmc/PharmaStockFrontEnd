// frontend/src/components/admin/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  SortAsc,
  SortDesc,
  Layers,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from '../common/Modal';
import Loader, { TableSkeleton } from '../common/Loader';
import api from '../../services/api';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    lowStock: false,
    expiring: false,
    prescription: false
  });

  const itemsPerPage = 10;

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categoriesData.length > 0 || selectedCategory === 'all') {
      fetchProducts();
    }
  }, [currentPage, debouncedSearchTerm, selectedCategory, sortBy, sortOrder, filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success && Array.isArray(response.data.categories)) {
        setCategoriesData(response.data.categories);
        const categoryNames = ['all', ...response.data.categories.map(cat => cat.name)];
        setCategories(categoryNames);
      } else {
        setCategories(['all']);
        setCategoriesData([]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories(['all']);
      setCategoriesData([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
      };
      
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (selectedCategory !== 'all') {
        const categoryObj = categoriesData.find(c => c.name === selectedCategory);
        if (categoryObj) params.category = categoryObj._id;
      }
      if (filters.lowStock) params.lowStock = 'true';
      if (filters.expiring) params.expiring = 'true';
      if (filters.prescription) params.requiresPrescription = 'true';
      
      const response = await api.get('/products', { params });
      if (response.data.success) {
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalProducts(response.data.total || 0);
      } else {
        toast.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/products/${deleteConfirm._id}`);
      toast.success('Product deleted successfully');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilters({ lowStock: false, expiring: false, prescription: false });
    setCurrentPage(1);
  };

  const getStockStatus = (product) => {
    const totalUnits = (product.currentStock?.packs || 0) * (product.packSize || 1) + (product.currentStock?.units || 0);
    const reorderLevel = product.reorderLevel || 20;
    if (totalUnits === 0) return { label: 'Out of Stock', color: 'red', icon: AlertTriangle };
    if (totalUnits < reorderLevel) return { label: 'Low Stock', color: 'yellow', icon: AlertTriangle };
    if (totalUnits < reorderLevel * 2) return { label: 'Moderate Stock', color: 'blue', icon: Package };
    return { label: 'In Stock', color: 'green', icon: Package };
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'No Expiry', color: 'gray' };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return { label: 'Expired', color: 'red' };
    if (daysUntilExpiry < 30) return { label: 'Expiring Soon', color: 'orange' };
    if (daysUntilExpiry < 90) return { label: 'Near Expiry', color: 'yellow' };
    return { label: 'Valid', color: 'green' };
  };

  const getColorClass = (color) => {
    const map = { red: 'red', yellow: 'yellow', green: 'green', blue: 'blue', orange: 'orange', gray: 'gray' };
    return map[color] || 'gray';
  };

  const activeFiltersCount = [filters.lowStock, filters.expiring, filters.prescription].filter(Boolean).length + 
    (selectedCategory !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);

  if (loading && products.length === 0) {
    return <div className="p-4 sm:p-6"><TableSkeleton rows={10} columns={6} /></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your pharmacy inventory</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {/* Export */}} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
              <Download className="h-4 w-4 mr-2" /> Export
            </button>
            <button onClick={() => navigate('/admin/products/new')} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#2F6BFF] to-[#5A3FFF] text-white rounded-xl hover:shadow-md transition text-sm font-medium">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </button>
          </div>
        </div>

        {/* Search & Filters Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input type="text" placeholder="Search by name or generic name..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]" />
            </div>
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white">
              {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${showFilters ? 'bg-[#2F6BFF] text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Filter className="h-4 w-4 mr-2" /> Filters {activeFiltersCount > 0 && <span className="ml-2 bg-white text-[#2F6BFF] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeFiltersCount}</span>}
            </button>
          </div>
          {showFilters && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-5 mb-4">
                <label className="flex items-center cursor-pointer"><input type="checkbox" checked={filters.lowStock} onChange={(e) => { setFilters({...filters, lowStock: e.target.checked}); setCurrentPage(1); }} className="h-4 w-4 text-[#2F6BFF] rounded" /><span className="ml-2 text-sm text-gray-700">Low Stock Only</span></label>
                <label className="flex items-center cursor-pointer"><input type="checkbox" checked={filters.expiring} onChange={(e) => { setFilters({...filters, expiring: e.target.checked}); setCurrentPage(1); }} className="h-4 w-4 text-[#2F6BFF] rounded" /><span className="ml-2 text-sm text-gray-700">Expiring Soon (90 days)</span></label>
                <label className="flex items-center cursor-pointer"><input type="checkbox" checked={filters.prescription} onChange={(e) => { setFilters({...filters, prescription: e.target.checked}); setCurrentPage(1); }} className="h-4 w-4 text-[#2F6BFF] rounded" /><span className="ml-2 text-sm text-gray-700">Requires Prescription</span></label>
              </div>
              {activeFiltersCount > 0 && <button onClick={clearAllFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center"><X className="h-4 w-4 mr-1" /> Clear all filters</button>}
            </div>
          )}
        </div>

        {/* Sorting Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600">Found {totalProducts} product(s)</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            {[{ key: 'name', label: 'Name' }, { key: 'pricePerUnit', label: 'Price' }, { key: 'currentStock.packs', label: 'Stock' }, { key: 'createdAt', label: 'Date' }].map(({ key, label }) => (
              <button key={key} onClick={() => handleSort(key)} className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${sortBy === key ? 'bg-[#2F6BFF]/10 text-[#2F6BFF]' : 'hover:bg-gray-100 text-gray-700'}`}>
                {label} {sortBy === key && (sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5 ml-1" /> : <SortDesc className="h-3.5 w-3.5 ml-1" />)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid (Cards) */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
            <button onClick={() => navigate('/admin/products/new')} className="mt-3 text-[#2F6BFF] hover:underline text-sm">Add your first product</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              const expiryStatus = getExpiryStatus(product.expiryDate);
              const StockIcon = stockStatus.icon;
              const stockColor = getColorClass(stockStatus.color);
              const expiryColor = getColorClass(expiryStatus.color);
              return (
                <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">{product.name}</h3>
                          {product.genericName && <p className="text-xs text-gray-500">{product.genericName}</p>}
                          {product.requiresPrescription && <span className="inline-block mt-1 text-[10px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Rx</span>}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${stockColor}-50 text-${stockColor}-700 border border-${stockColor}-100`}>
                        <StockIcon className="h-3 w-3 mr-1" /> {stockStatus.label}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-secondary">Category:</span>
                        <span className="font-medium text-gray-800">{product.category?.name || 'Uncategorized'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Stock:</span>
                        <span className="font-medium">{product.currentStock?.packs || 0} packs + {product.currentStock?.units || 0} units</span>
                      </div>
                      <div className="flex justify-between text-xs text-secondary">
                        <span>Total units:</span>
                        <span>{((product.currentStock?.packs || 0) * (product.packSize || 1)) + (product.currentStock?.units || 0)} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Price:</span>
                        <div className="text-right">
                          <div>₦{product.pricePerUnit?.toLocaleString() || 0}/unit</div>
                          <div className="text-xs">₦{product.pricePerPack?.toLocaleString() || 0}/pack</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary">Expiry:</span>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-${expiryColor}-50 text-${expiryColor}-700 border border-${expiryColor}-100`}>
                            {expiryStatus.label}
                          </span>
                          {product.expiryDate && <div className="text-xs text-gray-500 mt-1">{new Date(product.expiryDate).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                      <button onClick={() => navigate(`/admin/products/${product._id}`)} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(product)} className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-gray-600">Showing {(currentPage-1)*itemsPerPage+1} to {Math.min(currentPage*itemsPerPage, totalProducts)} of {totalProducts} results</div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-4 py-2 bg-[#2F6BFF] text-white rounded-xl text-sm font-medium">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        <ConfirmModal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Product" message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`} confirmText="Delete" />
      </div>
    </div>
  );
};

export default ProductList;