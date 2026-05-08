// frontend/src/services/productService.js
import api from './api';

class ProductService {
  // Get all products with pagination and filters
  async getProducts(page = 1, limit = 20, filters = {}) {
    try {
      const params = { page, limit, ...filters };
      const response = await api.get('/products', { params });
      return {
        success: true,
        products: response.data.products,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch products',
        products: [],
      };
    }
  }
  
  // Get single product by ID
  async getProductById(id) {
    try {
      const response = await api.get(`/products/${id}`);
      return { success: true, product: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Product not found',
      };
    }
  }
  
  // Create new product
  async createProduct(productData) {
    try {
      const response = await api.post('/products', productData);
      return { success: true, product: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create product',
      };
    }
  }
  
  // Update product
  async updateProduct(id, productData) {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return { success: true, product: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product',
      };
    }
  }
  
  // Delete product
  async deleteProduct(id) {
    try {
      await api.delete(`/products/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete product',
      };
    }
  }
  
  // Search products
  async searchProducts(query, filters = {}) {
    try {
      const response = await api.get('/products/search', { 
        params: { q: query, ...filters } 
      });
      return { success: true, products: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Search failed',
        products: [],
      };
    }
  }
  
  // Get products by category
  async getProductsByCategory(categoryId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/products/category/${categoryId}`, {
        params: { page, limit }
      });
      return { success: true, products: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch category products',
        products: [],
      };
    }
  }
  
  // Get low stock products
  async getLowStockProducts() {
    try {
      const response = await api.get('/products/low-stock');
      return { success: true, products: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch low stock products',
        products: [],
      };
    }
  }
  
  // Get expiring products
  async getExpiringProducts(days = 90) {
    try {
      const response = await api.get('/products/expiring', { params: { days } });
      return { success: true, products: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch expiring products',
        products: [],
      };
    }
  }
  
  // Update product stock
  async updateStock(productId, packs, units, type = 'adjust') {
    try {
      const response = await api.put(`/products/${productId}/stock`, {
        packs,
        units,
        type
      });
      return { success: true, product: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update stock',
      };
    }
  }
  
  // Bulk import products
  async bulkImportProducts(productsData) {
    try {
      const response = await api.post('/products/bulk-import', { products: productsData });
      return { 
        success: true, 
        imported: response.data.imported,
        failed: response.data.failed,
        errors: response.data.errors
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Bulk import failed',
      };
    }
  }
  
  // Export products to CSV
  async exportProducts(filters = {}) {
    try {
      const response = await api.get('/products/export', { 
        params: filters,
        responseType: 'blob' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: 'Export failed',
      };
    }
  }
  
  // Get product categories
  async getCategories() {
    try {
      const response = await api.get('/products/categories');
      return { success: true, categories: response.data };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch categories',
        categories: [],
      };
    }
  }
  
  // Create category
  async createCategory(categoryData) {
    try {
      const response = await api.post('/products/categories', categoryData);
      return { success: true, category: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create category',
      };
    }
  }
}

export default new ProductService();