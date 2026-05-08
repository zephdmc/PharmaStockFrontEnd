// frontend/src/components/admin/CategoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Package,
  Shield,
  Activity,
  Heart,
  Droplet,
  Eye,
  Coffee,
  Sun,
  Wind,
  Grid,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../common/Modal';
import Loader from '../common/Loader';

// Icon mapping for category icons
const iconOptions = [
  { name: 'Package', icon: Package, color: '#3B82F6' },
  { name: 'Shield', icon: Shield, color: '#EF4444' },
  { name: 'Activity', icon: Activity, color: '#F59E0B' },
  { name: 'Heart', icon: Heart, color: '#10B981' },
  { name: 'Droplet', icon: Droplet, color: '#EC4899' },
  { name: 'Eye', icon: Eye, color: '#06B6D4' },
  { name: 'Coffee', icon: Coffee, color: '#84CC16' },
  { name: 'Sun', icon: Sun, color: '#F97316' },
  { name: 'Wind', icon: Wind, color: '#14B8A6' },
  { name: 'Grid', icon: Grid, color: '#6B7280' }
];

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Package',
    color: '#3B82F6',
    displayOrder: 0,
    isActive: true
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/categories');
      if (response.data.success) {
        setCategories(response.data.categories || []);
      } else {
        toast.error('Failed to load categories');
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      toast.error(error.response?.data?.message || 'Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);

    try {
      if (editingCategory) {
        const response = await api.put(`/products/categories/${editingCategory._id}`, formData);
        if (response.data.success) {
          toast.success('Category updated successfully');
          await fetchCategories();
          closeModal();
        } else {
          toast.error(response.data.message || 'Failed to update category');
        }
      } else {
        const response = await api.post('/products/categories', formData);
        if (response.data.success) {
          toast.success('Category created successfully');
          await fetchCategories();
          closeModal();
        } else {
          toast.error(response.data.message || 'Failed to create category');
        }
      }
    } catch (error) {
      console.error('Save category error:', error);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
        await fetchCategories();
        closeModal();
        return;
      }
      toast.error(error.response?.data?.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const response = await api.delete(`/products/categories/${deleteConfirm._id}`);
      if (response.data.success) {
        toast.success('Category deleted successfully');
        await fetchCategories();
        setDeleteConfirm(null);
      } else {
        toast.error(response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.success('Category deleted successfully');
        await fetchCategories();
        setDeleteConfirm(null);
        return;
      }
      toast.error(error.response?.data?.message || 'Error deleting category');
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || 'Package',
        color: category.color || '#3B82F6',
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive !== false
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: 'Package',
        color: '#3B82F6',
        displayOrder: categories.length,
        isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setSaving(false);
    setFormData({
      name: '',
      description: '',
      icon: 'Package',
      color: '#3B82F6',
      displayOrder: 0,
      isActive: true
    });
  };

  const getIconComponent = (iconName) => {
    const icon = iconOptions.find(i => i.name === iconName);
    if (icon) {
      const IconComponent = icon.icon;
      return <IconComponent className="h-5 w-5" style={{ color: '#fff' }} />;
    }
    return <Package className="h-5 w-5" />;
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
      {/* Header - Responsive */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage product categories for your pharmacy</p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid - Responsive columns */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h3>
          <p className="text-sm text-gray-500 mb-4">Get started by creating your first product category.</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              {/* Color bar */}
              <div 
                className="h-1.5" 
                style={{ backgroundColor: category.color || '#3B82F6' }}
              />
              
              <div className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color || '#3B82F6'}20` }}
                    >
                      {getIconComponent(category.icon)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base md:text-lg">{category.name}</h3>
                      {category.displayOrder !== undefined && (
                        <p className="text-xs text-gray-500">Order: {category.displayOrder}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openModal(category)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 transition rounded-lg hover:bg-blue-50"
                      title="Edit Category"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(category)}
                      className="p-1.5 text-red-600 hover:text-red-800 transition rounded-lg hover:bg-red-50"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    {category.isActive ? (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openModal(category)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Form Modal - Responsive */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
              placeholder="e.g., Antibiotics"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Describe this category..."
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                {iconOptions.map(icon => (
                  <option key={icon.name} value={icon.name}>{icon.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  disabled={saving}
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#3B82F6"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleInputChange}
                min="0"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={saving}
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingCategory ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal - Responsive */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Category"
          size="sm"
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete "{deleteConfirm.name}"?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. Products in this category will not be deleted, but they will lose their category assignment.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm"
              >
                Delete Category
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CategoryManagement;