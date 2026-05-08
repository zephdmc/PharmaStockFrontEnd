// frontend/src/redux/actions/productActions.js
import { 
    fetchProducts, 
    fetchProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    searchProducts,
    setFilters,
    clearFilters,
    setCurrentPage
  } from '../slices/productSlice';
  
  export const productActions = {
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    setFilters,
    clearFilters,
    setCurrentPage,
  };
  
  // Helper to get products by category
  export const getProductsByCategory = (state, category) => {
    return state.products.products.filter(p => p.category === category);
  };
  
  // Helper to get low stock products
  export const getLowStockProducts = (state) => {
    return state.products.products.filter(p => {
      const totalUnits = (p.currentStock.packs * p.packSize) + p.currentStock.units;
      return totalUnits < (p.reorderLevel || 20);
    });
  };
  
  // Helper to get expiring products
  export const getExpiringProducts = (state, days = 90) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return state.products.products.filter(p => {
      const expiryDate = new Date(p.expiryDate);
      return expiryDate <= futureDate && expiryDate >= today;
    });
  };