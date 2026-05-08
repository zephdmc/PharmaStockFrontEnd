// frontend/src/redux/actions/cartActions.js
import { 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    applyDiscount,
    removeDiscount,
    updateItemQuantity
  } from '../slices/cartSlice';
  
  export const cartActions = {
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyDiscount,
    removeDiscount,
    updateItemQuantity,
  };
  
  // Helper to get cart summary
  export const getCartSummary = (state) => ({
    items: state.cart.items,
    subtotal: state.cart.subtotal,
    vat: state.cart.vat,
    total: state.cart.total,
    totalItems: state.cart.totalItems,
    discount: state.cart.discount,
    couponCode: state.cart.couponCode,
  });
  
  // Helper to check if cart is empty
  export const isCartEmpty = (state) => state.cart.items.length === 0;
  
  // Helper to get item count
  export const getCartItemCount = (state) => state.cart.totalItems;