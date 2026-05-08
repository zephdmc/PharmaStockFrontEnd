// frontend/src/components/admin/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  Save, 
  X, 
  DollarSign, 
  AlertCircle,
  Box,
  Calendar,
  Hash,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Loader from '../common/Loader';
import productService from '../../services/productService';
import api from '../../services/api';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    unitType: 'tablet',
    packSize: 10,
    currentStock: { packs: 0, units: 0 },
    pricePerUnit: 0,
    pricePerPack: 0,
    costPrice: 0,
    reorderLevel: 20,
    reorderQuantity: 50,
    expiryDate: '',
    batchNumber: '',
    nafdacNumber: '',
    description: '',
    requiresPrescription: false
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const result = await productService.getProductById(id);
      if (result.success) {
        const product = result.product;
        setFormData({
          name: product.name || '',
          genericName: product.genericName || '',
          category: product.category?._id || product.category || '',
          manufacturer: product.manufacturer || '',
          unitType: product.unitType || 'tablet',
          packSize: product.packSize || 10,
          currentStock: {
            packs: product.currentStock?.packs || 0,
            units: product.currentStock?.units || 0
          },
          pricePerUnit: product.pricePerUnit || 0,
          pricePerPack: product.pricePerPack || 0,
          costPrice: product.costPrice || 0,
          reorderLevel: product.reorderLevel || 20,
          reorderQuantity: product.reorderQuantity || 50,
          expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
          batchNumber: product.batchNumber || '',
          nafdacNumber: product.nafdacNumber || '',
          description: product.description || '',
          requiresPrescription: product.requiresPrescription || false
        });
      } else {
        toast.error(result.message || 'Failed to load product');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Fetch product error:', error);
      toast.error('Failed to load product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
      }));
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Product name is required');
    if (!formData.category) errors.push('Category is required');
    if (formData.pricePerUnit <= 0 && formData.pricePerPack <= 0) {
      errors.push('At least one price (unit or pack) must be set');
    }
    if (formData.packSize <= 0) errors.push('Pack size must be greater than 0');
    if (formData.expiryDate && new Date(formData.expiryDate) < new Date()) {
      errors.push('Expiry date cannot be in the past');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    setSaving(true);
    try {
      const productData = {
        name: formData.name,
        genericName: formData.genericName,
        category: formData.category,
        manufacturer: formData.manufacturer,
        unitType: formData.unitType,
        packSize: Number(formData.packSize),
        currentStock: {
          packs: Number(formData.currentStock.packs),
          units: Number(formData.currentStock.units)
        },
        pricePerUnit: Number(formData.pricePerUnit),
        pricePerPack: Number(formData.pricePerPack),
        costPrice: Number(formData.costPrice) || 0,
        reorderLevel: Number(formData.reorderLevel),
        reorderQuantity: Number(formData.reorderQuantity),
        expiryDate: formData.expiryDate || null,
        batchNumber: formData.batchNumber,
        nafdacNumber: formData.nafdacNumber,
        description: formData.description,
        requiresPrescription: formData.requiresPrescription
      };
      let result;
      if (isEdit) result = await productService.updateProduct(id, productData);
      else result = await productService.createProduct(productData);
      if (result.success) {
        toast.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
        setTimeout(() => navigate('/admin/products'), 1500);
      } else {
        if (result.errors) result.errors.forEach(err => toast.error(err.message || err));
        else toast.error(result.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Save product error:', error);
      toast.error(error.response?.data?.message || 'An error occurred while saving the product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      {/* Header - responsive */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEdit ? 'Update product information' : 'Enter product details'}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/products')}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-5">
            <Package className="h-5 w-5 mr-2 text-blue-500" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Unit & Pricing Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-5">
            <Layers className="h-5 w-5 mr-2 text-green-500" />
            Unit & Pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
              <select
                name="unitType"
                value={formData.unitType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="sachet">Sachet</option>
                <option value="bottle">Bottle</option>
                <option value="pack">Pack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size (units/pack)</label>
              <input
                type="number"
                name="packSize"
                value={formData.packSize}
                onChange={handleInputChange}
                min="1"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., 10 tablets per pack</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (₦)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="number"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Pack (₦)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="number"
                  name="pricePerPack"
                  value={formData.pricePerPack}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stock Information Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-5">
            <Box className="h-5 w-5 mr-2 text-purple-500" />
            Stock Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock (Packs)</label>
              <input
                type="number"
                name="currentStock.packs"
                value={formData.currentStock.packs}
                onChange={handleInputChange}
                min="0"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock (Units)</label>
              <input
                type="number"
                name="currentStock.units"
                value={formData.currentStock.units}
                onChange={handleInputChange}
                min="0"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level (units)</label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleInputChange}
                min="0"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity (units)</label>
              <input
                type="number"
                name="reorderQuantity"
                value={formData.reorderQuantity}
                onChange={handleInputChange}
                min="0"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Regulatory Information Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-5">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            Regulatory & Tracking
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NAFDAC Number</label>
              <input
                type="text"
                name="nafdacNumber"
                value={formData.nafdacNumber}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NAFDAC-XXXXX"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="requiresPrescription"
                  checked={formData.requiresPrescription}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Requires Prescription</span>
              </label>
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product description, usage instructions, etc."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 pb-8">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center text-sm font-medium disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEdit ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Product' : 'Save Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;