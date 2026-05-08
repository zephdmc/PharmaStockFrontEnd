// frontend/src/redux/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Helper function to calculate cart totals
const calculateCartTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const vat = subtotal * 0.075; // 7.5% VAT for Nigeria
  const total = subtotal + vat;
  const totalItems = items.reduce((sum, item) => {
    return sum + (item.quantityPacks * item.packSize) + item.quantityUnits;
  }, 0);
  
  return { subtotal, vat, total, totalItems };
};

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      const { subtotal, vat, total, totalItems } = calculateCartTotals(parsed.items);
      return { ...parsed, subtotal, vat, total, totalItems };
    }
  } catch (error) {
    console.error('Failed to load cart from storage:', error);
  }
  return {
    items: [],
    subtotal: 0,
    vat: 0,
    total: 0,
    totalItems: 0,
    discount: 0,
    couponCode: null,
  };
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart
    addToCart: (state, action) => {
      const { product, quantityPacks = 0, quantityUnits = 0 } = action.payload;
      
      // Calculate price based on packs and units
      const packPrice = quantityPacks * product.pricePerPack;
      const unitPrice = quantityUnits * product.pricePerUnit;
      const totalPrice = packPrice + unitPrice;
      
      // Check if item already exists with same pack/unit configuration
      const existingItemIndex = state.items.findIndex(
        item => item.productId === product._id && 
        item.quantityPacks === quantityPacks && 
        item.quantityUnits === quantityUnits
      );
      
      if (existingItemIndex !== -1) {
        // Update existing item
        state.items[existingItemIndex].quantityPacks += quantityPacks;
        state.items[existingItemIndex].quantityUnits += quantityUnits;
        state.items[existingItemIndex].totalPrice += totalPrice;
      } else {
        // Add new item
        state.items.push({
          productId: product._id,
          productName: product.name,
          genericName: product.genericName,
          pricePerPack: product.pricePerPack,
          pricePerUnit: product.pricePerUnit,
          packSize: product.packSize,
          quantityPacks,
          quantityUnits,
          totalPrice,
          currentStock: product.currentStock,
          requiresPrescription: product.requiresPrescription,
        });
      }
      
      // Recalculate totals
      const { subtotal, vat, total, totalItems } = calculateCartTotals(state.items);
      state.subtotal = subtotal;
      state.vat = vat;
      state.total = total - state.discount;
      state.totalItems = totalItems;
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify({
        items: state.items,
        discount: state.discount,
        couponCode: state.couponCode,
      }));
    },
    
    // Update cart item quantity
    updateCartItem: (state, action) => {
      const { index, quantityPacks, quantityUnits } = action.payload;
      const item = state.items[index];
      
      if (item) {
        const packPrice = quantityPacks * item.pricePerPack;
        const unitPrice = quantityUnits * item.pricePerUnit;
        item.quantityPacks = quantityPacks;
        item.quantityUnits = quantityUnits;
        item.totalPrice = packPrice + unitPrice;
        
        // Recalculate totals
        const { subtotal, vat, total, totalItems } = calculateCartTotals(state.items);
        state.subtotal = subtotal;
        state.vat = vat;
        state.total = total - state.discount;
        state.totalItems = totalItems;
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify({
          items: state.items,
          discount: state.discount,
          couponCode: state.couponCode,
        }));
      }
    },
    
    // Remove item from cart
    removeFromCart: (state, action) => {
      state.items.splice(action.payload, 1);
      
      // Recalculate totals
      const { subtotal, vat, total, totalItems } = calculateCartTotals(state.items);
      state.subtotal = subtotal;
      state.vat = vat;
      state.total = total - state.discount;
      state.totalItems = totalItems;
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify({
        items: state.items,
        discount: state.discount,
        couponCode: state.couponCode,
      }));
    },
    
    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.vat = 0;
      state.total = 0;
      state.totalItems = 0;
      state.discount = 0;
      state.couponCode = null;
      
      localStorage.removeItem('cart');
    },
    
    // Apply discount coupon
    applyDiscount: (state, action) => {
      const { discountAmount, couponCode } = action.payload;
      state.discount = discountAmount;
      state.couponCode = couponCode;
      state.total = state.subtotal + state.vat - discountAmount;
      
      localStorage.setItem('cart', JSON.stringify({
        items: state.items,
        discount: state.discount,
        couponCode: state.couponCode,
      }));
    },
    
    // Remove discount
    removeDiscount: (state) => {
      state.discount = 0;
      state.couponCode = null;
      state.total = state.subtotal + state.vat;
      
      localStorage.setItem('cart', JSON.stringify({
        items: state.items,
        discount: state.discount,
        couponCode: state.couponCode,
      }));
    },
    
    // Update item quantity by product ID
    updateItemQuantity: (state, action) => {
      const { productId, quantityPacks, quantityUnits } = action.payload;
      const itemIndex = state.items.findIndex(item => item.productId === productId);
      
      if (itemIndex !== -1) {
        const item = state.items[itemIndex];
        const packPrice = quantityPacks * item.pricePerPack;
        const unitPrice = quantityUnits * item.pricePerUnit;
        item.quantityPacks = quantityPacks;
        item.quantityUnits = quantityUnits;
        item.totalPrice = packPrice + unitPrice;
        
        // Recalculate totals
        const { subtotal, vat, total, totalItems } = calculateCartTotals(state.items);
        state.subtotal = subtotal;
        state.vat = vat;
        state.total = total - state.discount;
        state.totalItems = totalItems;
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify({
          items: state.items,
          discount: state.discount,
          couponCode: state.couponCode,
        }));
      }
    },
  },
});

export const { 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  applyDiscount,
  removeDiscount,
  updateItemQuantity
} = cartSlice.actions;

export default cartSlice.reducer;