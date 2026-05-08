// frontend/src/components/pos/ProductSearch.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Package, AlertCircle, ChevronRight, X } from 'lucide-react';
import { addToCart } from '../../redux/slices/cartSlice';
import { toast } from 'react-hot-toast';

const ProductSearch = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityPacks, setQuantityPacks] = useState(0);
  const [quantityUnits, setQuantityUnits] = useState(0);
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Extract unique categories from products
    if (products && products.length > 0) {
      const uniqueCategories = ['all', ...new Set(products.map(p => p.category?.name || p.category || 'Uncategorized').filter(Boolean))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  const filteredProducts = products?.filter(product => {
    if (!product) return false;
    const productName = product.name || '';
    const genericName = product.genericName || '';
    const batchNumber = product.batchNumber || '';
    const productCategory = product.category?.name || product.category || 'Uncategorized';
    
    const matchesSearch = productName.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         genericName.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         batchNumber.toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = category === 'all' || productCategory === category;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    if (quantityPacks === 0 && quantityUnits === 0) {
      toast.error('Please enter quantity');
      return;
    }
    
    // Check stock availability
    const availablePacks = selectedProduct.currentStock?.packs || 0;
    const availableUnits = selectedProduct.currentStock?.units || 0;
    const packSize = selectedProduct.packSize || 1;
    const totalUnitsRequested = (quantityPacks * packSize) + quantityUnits;
    const totalUnitsAvailable = (availablePacks * packSize) + availableUnits;
    
    if (totalUnitsRequested > totalUnitsAvailable) {
      toast.error(`Insufficient stock! Available: ${availablePacks} packs & ${availableUnits} units`);
      return;
    }
    
    dispatch(addToCart({
      product: selectedProduct,
      quantityPacks,
      quantityUnits,
    }));
    
    toast.success(`Added: ${quantityPacks > 0 ? `${quantityPacks} pack(s)` : ''}${quantityPacks > 0 && quantityUnits > 0 ? ' & ' : ''}${quantityUnits > 0 ? `${quantityUnits} unit(s)` : ''} of ${selectedProduct.name}`);
    
    // Reset form
    setSelectedProduct(null);
    setQuantityPacks(0);
    setQuantityUnits(0);
    setSearchTerm('');
  };

  const getStockDisplay = (product) => {
    if (!product) return null;
    const packs = product.currentStock?.packs || 0;
    const units = product.currentStock?.units || 0;
    const packSize = product.packSize || 1;
    const totalUnits = (packs * packSize) + units;
    const isLowStock = totalUnits < (product.reorderLevel || 20);
    
    return (
      <div className="flex items-center space-x-1">
        <span className={`text-xs ${isLowStock ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          Stock: {packs} pack(s) + {units} unit(s)
        </span>
        {isLowStock && (
          <AlertCircle className="h-3 w-3 text-red-500" />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by product name, generic name, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>
        
        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition ${
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Product Grid or Quantity Selector */}
      {!selectedProduct ? (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all hover:border-blue-300 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {product.name || 'Unknown Product'}
                    </h3>
                    {product.requiresPrescription && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Rx
                      </span>
                    )}
                  </div>
                  
                  {product.genericName && (
                    <p className="text-sm text-gray-500 mb-2">{product.genericName}</p>
                  )}
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Per unit:</span>
                      <span className="font-medium text-green-600">₦{(product.pricePerUnit || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Per pack:</span>
                      <span className="font-medium text-blue-600">₦{(product.pricePerPack || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {(product.packSize || 1)} units/pack
                    </div>
                  </div>
                  
                  {getStockDisplay(product)}
                  
                  <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition">
                    <ChevronRight className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Quantity Selector
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 flex items-center text-sm mb-2"
              >
                ← Back to products
              </button>
              <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name || 'Unknown Product'}</h2>
              {selectedProduct.genericName && (
                <p className="text-gray-500 mt-1">{selectedProduct.genericName}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Info */}
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Product Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pack Size:</span>
                    <span className="font-medium">{selectedProduct.packSize || 1} units/pack</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per unit:</span>
                    <span className="font-medium text-green-600">₦{(selectedProduct.pricePerUnit || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per pack:</span>
                    <span className="font-medium text-blue-600">₦{(selectedProduct.pricePerPack || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Stock:</span>
                    <span className="font-medium">
                      {selectedProduct.currentStock?.packs || 0} packs + {selectedProduct.currentStock?.units || 0} units
                    </span>
                  </div>
                  {selectedProduct.batchNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Batch No:</span>
                      <span className="font-mono text-sm">{selectedProduct.batchNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quantity Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Packs
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantityPacks(Math.max(0, quantityPacks - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quantityPacks}
                    onChange={(e) => setQuantityPacks(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 text-center border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setQuantityPacks(quantityPacks + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pack total: ₦{((selectedProduct.pricePerPack || 0) * quantityPacks).toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Individual Units
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantityUnits(Math.max(0, quantityUnits - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quantityUnits}
                    onChange={(e) => setQuantityUnits(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 text-center border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setQuantityUnits(quantityUnits + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Units total: ₦{((selectedProduct.pricePerUnit || 0) * quantityUnits).toLocaleString()}
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700">Total Price:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₦{(((selectedProduct.pricePerPack || 0) * quantityPacks) + ((selectedProduct.pricePerUnit || 0) * quantityUnits)).toLocaleString()}
                  </span>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;