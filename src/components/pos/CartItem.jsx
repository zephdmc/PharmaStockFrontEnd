// frontend/src/components/pos/CartItem.jsx
import React from 'react';
import { Trash2, Plus, Minus, Package, Tablet } from 'lucide-react';

const CartItem = ({ item, index, onQuantityChange, onRemove }) => {
  const totalUnits = (item.quantityPacks * item.packSize) + item.quantityUnits;
  
  return (
    <div className="p-4 hover:bg-gray-50 transition">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-900">{item.productName}</h4>
          <p className="text-xs text-gray-500">
            {item.packSize} units per pack
          </p>
        </div>
        <button
          onClick={onRemove}
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
            onClick={() => onQuantityChange(index, 'packs', -1)}
            className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center font-medium">{item.quantityPacks}</span>
          <button
            onClick={() => onQuantityChange(index, 'packs', 1)}
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
          <Tablet className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Units:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onQuantityChange(index, 'units', -1)}
            className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center font-medium">{item.quantityUnits}</span>
          <button
            onClick={() => onQuantityChange(index, 'units', 1)}
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
          Total units: {totalUnits}
        </div>
        <div className="font-bold text-blue-600">
          ₦{item.totalPrice.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default CartItem;