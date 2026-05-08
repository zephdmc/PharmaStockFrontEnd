// frontend/src/redux/rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import transactionReducer from './slices/transactionSlice';
import inventoryReducer from './slices/inventorySlice';

const rootReducer = combineReducers({
  auth: authReducer,
  products: productReducer,
  cart: cartReducer,
  transactions: transactionReducer,
  inventory: inventoryReducer,
});

export default rootReducer;