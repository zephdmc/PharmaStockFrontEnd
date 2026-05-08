// frontend/src/components/admin/StockAdjustment.jsx
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Hash,
  FileText,
  Clock,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import api from '../../services/api';

const StockAdjustment = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentData, setAdjustmentData] = useState({
    packs: 0,
    units: 0,
    reason: '',
    batchNumber: '',
    expiryDate: ''
  });
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentHistory, setAdjustmentHistory] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchAdjustmentHistory();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', { params: { limit: 100 } });
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        toast.error('Failed to load products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error(error.response?.data?.message || 'Error loading products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustmentHistory = async () => {
    try {
      const response = await api.get('/inventory/movements', { params: { limit: 50 } });
      if (response.data.success) {
        setAdjustmentHistory(response.data.movements || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setAdjustmentHistory([]);
    }
  };

  const handleAdjustment = async () => {
    if (!selectedProduct) {
      toast.error('No product selected');
      return;
    }
    if (adjustmentData.packs === 0 && adjustmentData.units === 0) {
      toast.error('Please specify quantity to adjust');
      return;
    }
    if (!adjustmentData.reason) {
      toast.error('Please provide a reason for adjustment');
      return;
    }
    if (adjustmentType === 'remove') {
      const totalUnitsToRemove = (adjustmentData.packs * selectedProduct.packSize) + adjustmentData.units;
      const currentTotalUnits = ((selectedProduct.currentStock?.packs || 0) * selectedProduct.packSize) + (selectedProduct.currentStock?.units || 0);
      if (totalUnitsToRemove > currentTotalUnits) {
        toast.error(`Cannot remove more than current stock. Available: ${currentTotalUnits} units`);
        return;
      }
    }
    try {
      let response;
      if (adjustmentType === 'add') {
        response = await api.post('/inventory/add-stock', {
          productId: selectedProduct._id,
          packs: adjustmentData.packs,
          units: adjustmentData.units,
          batchNumber: adjustmentData.batchNumber,
          expiryDate: adjustmentData.expiryDate,
          note: adjustmentData.reason
        });
      } else {
        response = await api.post('/inventory/remove-stock', {
          productId: selectedProduct._id,
          packs: adjustmentData.packs,
          units: adjustmentData.units,
          reason: adjustmentData.reason,
          note: adjustmentData.reason
        });
      }
      if (response.data.success) {
        toast.success(`Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`);
        fetchProducts();
        fetchAdjustmentHistory();
        setShowAdjustmentModal(false);
        resetAdjustmentForm();
      } else {
        toast.error(response.data.message || 'Adjustment failed');
      }
    } catch (error) {
      console.error('Adjustment error:', error);
      toast.error(error.response?.data?.message || 'Failed to process adjustment');
    }
  };

  const resetAdjustmentForm = () => {
    setSelectedProduct(null);
    setAdjustmentData({
      packs: 0,
      units: 0,
      reason: '',
      batchNumber: '',
      expiryDate: ''
    });
  };

  const getTotalUnits = (product) => {
    if (!product || !product.currentStock) return 0;
    return (product.currentStock.packs || 0) * (product.packSize || 1) + (product.currentStock.units || 0);
  };

  const filteredProducts = products.filter(product =>
    product && product.name && product.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Adjustment</h1>
            <p className="text-sm text-gray-600 mt-1">Manage inventory levels and track adjustments</p>
          </div>
          <div className="text-sm text-secondary bg-white px-3 py-1.5 rounded-full shadow-sm w-fit">
            {products.length} products total
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products to adjust stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF] focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Products Found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or add a new product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base md:text-lg">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{product.genericName || 'No generic name'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-full px-2.5 py-1">
                    <span className="text-xs font-medium text-blue-700">{product.packSize || 1} units/pack</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Current Stock:</span>
                    <span className="font-medium text-gray-900">{product.currentStock?.packs || 0} packs + {product.currentStock?.units || 0} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Total Units:</span>
                    <span className="font-semibold text-blue-600">{getTotalUnits(product)} units</span>
                  </div>
                  {product.batchNumber && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Batch No:</span>
                      <span className="text-gray-900 font-mono text-xs">{product.batchNumber}</span>
                    </div>
                  )}
                  {product.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Expiry:</span>
                      <span className="text-gray-700">{format(new Date(product.expiryDate), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => { setSelectedProduct(product); setAdjustmentType('add'); setShowAdjustmentModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add Stock
                  </button>
                  <button
                    onClick={() => { setSelectedProduct(product); setAdjustmentType('remove'); setShowAdjustmentModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 rounded-xl text-sm font-medium hover:shadow-md transition"
                  >
                    <Minus className="h-4 w-4" />
                    Remove Stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Adjustment History - Card Grid (replaces table) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Adjustment History</h2>
            <span className="text-xs text-secondary bg-gray-100 px-2 py-1 rounded-full">{adjustmentHistory.length} records</span>
          </div>
          {adjustmentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No adjustment history found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adjustmentHistory.map((adj) => (
                <div key={adj._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(adj.createdAt), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      adj.movementType === 'restock' || adj.movementType === 'add' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {adj.movementType === 'restock' || adj.movementType === 'add' ? 'Addition' : 'Removal'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="font-semibold text-gray-900">{adj.productId?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-secondary mt-0.5">
                      Quantity: {adj.quantityPacks > 0 && `${adj.quantityPacks} packs`}
                      {adj.quantityPacks > 0 && adj.quantityUnits > 0 && ' + '}
                      {adj.quantityUnits > 0 && `${adj.quantityUnits} units`}
                    </p>
                    <p className="text-sm text-secondary mt-1 line-clamp-2">{adj.notes || adj.reason || '-'}</p>
                    <div className="flex items-center gap-1 text-xs text-secondary mt-2">
                      <User className="h-3 w-3" />
                      <span>{adj.performedBy?.name || 'System'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adjustment Modal (modernized) */}
        <Modal
          isOpen={showAdjustmentModal}
          onClose={() => { setShowAdjustmentModal(false); resetAdjustmentForm(); }}
          title={`${adjustmentType === 'add' ? 'Add' : 'Remove'} Stock - ${selectedProduct?.name || ''}`}
          size="md"
        >
          <div className="space-y-5">
            <div className="bg-blue-50 rounded-xl p-4 text-sm">
              <p className="text-secondary">Current Stock:</p>
              <p className="font-semibold text-gray-900">
                {selectedProduct?.currentStock?.packs || 0} packs + {selectedProduct?.currentStock?.units || 0} units
                <span className="text-xs text-gray-500 ml-2">(Total: {getTotalUnits(selectedProduct)} units)</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Packs</label>
              <input
                type="number"
                min="0"
                value={adjustmentData.packs}
                onChange={(e) => setAdjustmentData({...adjustmentData, packs: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F6BFF]"
              />
              <p className="text-xs text-gray-500 mt-1">Each pack contains {selectedProduct?.packSize || 1} units</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Individual Units</label>
              <input
                type="number"
                min="0"
                value={adjustmentData.units}
                onChange={(e) => setAdjustmentData({...adjustmentData, units: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F6BFF]"
              />
            </div>
            {adjustmentType === 'add' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number (Optional)</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={adjustmentData.batchNumber}
                      onChange={(e) => setAdjustmentData({...adjustmentData, batchNumber: e.target.value})}
                      className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                      placeholder="Enter batch number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      value={adjustmentData.expiryDate}
                      onChange={(e) => setAdjustmentData({...adjustmentData, expiryDate: e.target.value})}
                      className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Adjustment *</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                  rows="3"
                  className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2 text-sm"
                  placeholder="e.g., Restock from supplier, damaged goods, expired items, etc."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowAdjustmentModal(false); resetAdjustmentForm(); }} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={handleAdjustment} className={`px-5 py-2.5 rounded-xl text-white text-sm font-medium ${adjustmentType === 'add' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-md' : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-md'}`}>
                {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default StockAdjustment;