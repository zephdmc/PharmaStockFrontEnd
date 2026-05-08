// frontend/src/components/pos/Cart.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Plus, Minus, ShoppingCart, Package, Pill } from 'lucide-react';
import { updateCartItem, removeFromCart } from '../../redux/slices/cartSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  
  const handleQuantityChange = (index, type, delta) => {
    const item = items[index];
    let newPacks = item.quantityPacks;
    let newUnits = item.quantityUnits;
    
    if (type === 'packs') {
      newPacks = Math.max(0, item.quantityPacks + delta);
    } else if (type === 'units') {
      newUnits = Math.max(0, item.quantityUnits + delta);
    }
    
    // Check stock availability
    const availablePacks = item.currentStock?.packs || 0;
    const availableUnits = item.currentStock?.units || 0;
    const totalUnitsRequested = (newPacks * item.packSize) + newUnits;
    const totalUnitsAvailable = (availablePacks * item.packSize) + availableUnits;
    
    if (totalUnitsRequested > totalUnitsAvailable) {
      // Show error but don't update
      return;
    }
    
    dispatch(updateCartItem({ index, quantityPacks: newPacks, quantityUnits: newUnits }));
  };
  
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
        <ShoppingCart className="h-16 w-16 mb-4" />
        <p className="text-center">Your cart is empty</p>
        <p className="text-sm text-center mt-1">Add products to continue</p>
      </div>
    );
  }
  
  return (
    <div className="divide-y">
      {items.map((item, index) => (
        <div key={index} className="p-4 hover:bg-gray-50 transition">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{item.productName}</h4>
              <p className="text-xs text-gray-500">
                {item.packSize} units per pack
              </p>
            </div>
            <button
              onClick={() => dispatch(removeFromCart(index))}
              className="text-red-500 hover:text-red-700 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          {/* Packs Quantity */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Packs:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(index, 'packs', -1)}
                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantityPacks}</span>
              <button
                onClick={() => handleQuantityChange(index, 'packs', 1)}
                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-sm font-medium">
              ₦{(item.pricePerPack * item.quantityPacks).toLocaleString()}
            </span>
          </div>
          
          {/* Units Quantity */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Pill className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Units:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(index, 'units', -1)}
                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantityUnits}</span>
              <button
                onClick={() => handleQuantityChange(index, 'units', 1)}
                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-sm font-medium">
              ₦{(item.pricePerUnit * item.quantityUnits).toLocaleString()}
            </span>
          </div>
          
          {/* Total for item */}
          <div className="flex justify-between items-center pt-2 mt-2 border-t">
            <div className="text-xs text-gray-500">
              Total units: {(item.quantityPacks * item.packSize) + item.quantityUnits}
            </div>
            <div className="font-bold text-blue-600">
              ₦{item.totalPrice.toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cart;