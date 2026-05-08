// frontend/src/hooks/useProducts.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchProducts, 
  fetchProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  searchProducts,
  setFilters,
  clearFilters,
  setCurrentPage,
  clearError
} from '../redux/slices/productSlice';
import { toast } from 'react-hot-toast';

export const useProducts = (initialFilters = {}) => {
  const dispatch = useDispatch();
  const { 
    products, 
    selectedProduct, 
    totalProducts, 
    currentPage, 
    totalPages, 
    isLoading, 
    error,
    filters 
  } = useSelector((state) => state.products);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Fetch products with current filters
  const loadProducts = useCallback(async (page = currentPage, newFilters = {}) => {
    const allFilters = { ...filters, ...newFilters, search: debouncedSearch };
    const result = await dispatch(fetchProducts({ page, ...allFilters }));
    
    if (fetchProducts.fulfilled.match(result)) {
      return { success: true, data: result.payload };
    } else {
      toast.error(result.payload || 'Failed to load products');
      return { success: false, message: result.payload };
    }
  }, [dispatch, filters, currentPage, debouncedSearch]);
  
  // Load single product
  const loadProduct = useCallback(async (id) => {
    const result = await dispatch(fetchProductById(id));
    
    if (fetchProductById.fulfilled.match(result)) {
      return { success: true, product: result.payload };
    } else {
      toast.error(result.payload || 'Product not found');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Create new product
  const addProduct = useCallback(async (productData) => {
    const result = await dispatch(createProduct(productData));
    
    if (createProduct.fulfilled.match(result)) {
      toast.success('Product created successfully');
      return { success: true, product: result.payload };
    } else {
      toast.error(result.payload || 'Failed to create product');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Update existing product
  const editProduct = useCallback(async (id, productData) => {
    const result = await dispatch(updateProduct({ id, productData }));
    
    if (updateProduct.fulfilled.match(result)) {
      toast.success('Product updated successfully');
      return { success: true, product: result.payload };
    } else {
      toast.error(result.payload || 'Failed to update product');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Delete product
  const removeProduct = useCallback(async (id, onSuccess) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return { success: false, cancelled: true };
    
    const result = await dispatch(deleteProduct(id));
    
    if (deleteProduct.fulfilled.match(result)) {
      toast.success('Product deleted successfully');
      if (onSuccess) onSuccess();
      return { success: true };
    } else {
      toast.error(result.payload || 'Failed to delete product');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Search products
  const search = useCallback(async (query, filterOptions = {}) => {
    const result = await dispatch(searchProducts({ q: query, ...filterOptions }));
    
    if (searchProducts.fulfilled.match(result)) {
      return { success: true, products: result.payload };
    } else {
      toast.error(result.payload || 'Search failed');
      return { success: false, message: result.payload };
    }
  }, [dispatch]);
  
  // Update filters
  const updateFilters = useCallback((newFilters) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);
  
  // Reset all filters
  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
    setSearchTerm('');
  }, [dispatch]);
  
  // Change page
  const changePage = useCallback((page) => {
    dispatch(setCurrentPage(page));
    loadProducts(page);
  }, [dispatch, loadProducts]);
  
  // Clear error
  const clearProductError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // Get product by ID from current list
  const getProductById = useCallback((id) => {
    return products.find(p => p._id === id);
  }, [products]);
  
  // Get low stock products
  const getLowStockProducts = useCallback(() => {
    return products.filter(product => {
      const totalUnits = (product.currentStock.packs * product.packSize) + product.currentStock.units;
      return totalUnits < (product.reorderLevel || 20);
    });
  }, [products]);
  
  // Get expiring products
  const getExpiringProducts = useCallback((days = 90) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return products.filter(product => {
      if (!product.expiryDate) return false;
      const expiryDate = new Date(product.expiryDate);
      return expiryDate <= futureDate && expiryDate >= today;
    });
  }, [products]);
  
  // Get products by category
  const getProductsByCategory = useCallback((category) => {
    return products.filter(product => product.category === category);
  }, [products]);
  
  // Get categories from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return ['All', ...uniqueCategories];
  }, [products]);
  
  // Get stock summary
  const stockSummary = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = getLowStockProducts().length;
    const outOfStock = products.filter(p => {
      const totalUnits = (p.currentStock.packs * p.packSize) + p.currentStock.units;
      return totalUnits === 0;
    }).length;
    const expiring = getExpiringProducts(90).length;
    const totalValue = products.reduce((sum, p) => {
      const totalUnits = (p.currentStock.packs * p.packSize) + p.currentStock.units;
      return sum + (totalUnits * (p.pricePerUnit || (p.pricePerPack / p.packSize)));
    }, 0);
    
    return { totalProducts, lowStock, outOfStock, expiring, totalValue };
  }, [products, getLowStockProducts, getExpiringProducts]);
  
  // Initial load
  useEffect(() => {
    loadProducts(1, initialFilters);
  }, []);
  
  // Reload when search term changes
  useEffect(() => {
    loadProducts(1);
  }, [debouncedSearch]);
  
  return {
    // State
    products,
    selectedProduct,
    totalProducts,
    currentPage,
    totalPages,
    isLoading,
    error,
    filters,
    searchTerm,
    categories,
    stockSummary,
    
    // Actions
    loadProducts,
    loadProduct,
    addProduct,
    editProduct,
    removeProduct,
    search,
    setSearchTerm,
    updateFilters,
    resetFilters,
    changePage,
    clearError: clearProductError,
    getProductById,
    getLowStockProducts,
    getExpiringProducts,
    getProductsByCategory,
  };
};

// Hook for product form management
export const useProductForm = (initialData = null) => {
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
    reorderLevel: 20,
    reorderQuantity: 50,
    expiryDate: '',
    batchNumber: '',
    nafdacNumber: '',
    description: '',
    requiresPrescription: false,
    ...initialData
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = useCallback((e) => {
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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);
  
  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.pricePerUnit <= 0 && formData.pricePerPack <= 0) {
      newErrors.price = 'At least one price must be set';
    }
    if (formData.packSize <= 0 && formData.unitType === 'pack') {
      newErrors.packSize = 'Pack size must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  const reset = useCallback(() => {
    setFormData({
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      unitType: 'tablet',
      packSize: 10,
      currentStock: { packs: 0, units: 0 },
      pricePerUnit: 0,
      pricePerPack: 0,
      reorderLevel: 20,
      reorderQuantity: 50,
      expiryDate: '',
      batchNumber: '',
      nafdacNumber: '',
      description: '',
      requiresPrescription: false,
    });
    setErrors({});
  }, []);
  
  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validate,
    reset,
    setFormData,
  };
};

export default useProducts;