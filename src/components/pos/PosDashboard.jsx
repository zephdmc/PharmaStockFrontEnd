// frontend/src/components/pos/PosDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ShoppingCart, 
  CreditCard, 
  User, 
  Clock, 
  LogOut,
  Printer,
  Package,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProductSearch from './ProductSearch';
import Cart from './Cart';
import CheckoutModal from './CheckoutModal';
import Receipt from './Receipt';
import { clearCart } from '../../redux/slices/cartSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import { getTodaySales } from '../../services/salesService';

const PosDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, total } = useSelector((state) => state.cart);
  const [showCheckout, setShowCheckout] = useState(false);
  const [todaySales, setTodaySales] = useState({ count: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [showMobileCart, setShowMobileCart] = useState(false); // mobile cart drawer/modal

  useEffect(() => {
    dispatch(fetchProducts());
    fetchTodaySales();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodaySales = async () => {
    try {
      const data = await getTodaySales();
      setTodaySales({
        total: data.total || 0,
        count: data.count || 0
      });
    } catch (error) {
      console.error('Failed to fetch today sales');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty. Add some products first.');
      return;
    }
    // close mobile cart if open
    if (showMobileCart) setShowMobileCart(false);
    setShowCheckout(true);
  };

  const handleSaleComplete = (transaction) => {
    setLastTransaction(transaction);
    setShowReceipt(true);
    dispatch(clearCart());
    fetchTodaySales();
    toast.success('Sale completed successfully!');
    // close any open modals
    setShowMobileCart(false);
  };

  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              @media print { body { margin: 0; padding: 0; } }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-NG', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar - responsive padding */}
      <div className="bg-white shadow-md px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">POS Terminal</h1>
            <p className="text-xs text-gray-500">Point of Sale System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'POS Agent'}</p>
          </div>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      
      {/* Main Content – stacked on mobile, side‑by‑side on desktop */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side - Product Search (full width on mobile, flex‑1 on desktop) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Products Catalog</h2>
                <p className="text-xs text-gray-500">Search and select products to sell</p>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-xs sm:text-sm">{formatTime(currentTime)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-xs sm:text-sm hidden sm:inline">{user?.name}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ProductSearch />
          </div>
        </div>
        
        {/* Right Side - Cart (hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex md:w-96 bg-white shadow-lg flex-col mt-4 md:mt-0">
          {/* Cart Header */}
          <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                Current Sale
              </h2>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {items.length} item(s)
              </span>
            </div>
            
            {/* Today's Sales Summary */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-green-50 p-2 rounded-lg">
                <p className="text-xs text-green-600">Today's Sales</p>
                <p className="font-bold text-green-700 text-sm sm:text-base">₦{todaySales.total.toLocaleString()}</p>
                <p className="text-xs text-green-600">{todaySales.count} transactions</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="text-xs text-blue-600">Current Total</p>
                <p className="font-bold text-blue-700 text-sm sm:text-base">₦{total.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto max-h-[40vh] md:max-h-none">
            <Cart />
          </div>
          
          {/* Cart Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (7.5%):</span>
                <span className="font-medium">₦{(total * 0.075).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-blue-600">₦{(total * 1.075).toLocaleString()}</span>
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:from-gray-400 disabled:to-gray-500 shadow-md"
            >
              <CreditCard className="inline-block h-5 w-5 mr-2" />
              Checkout & Pay
            </button>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                PIN verification required for all transactions
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Cart Button (only visible on mobile) */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="fixed bottom-5 right-5 md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition z-20"
      >
        <ShoppingCart className="h-6 w-6" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>
      
      {/* Mobile Cart Modal (slide-up or centered) */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Your Cart ({items.length} items)
              </h3>
              <button onClick={() => setShowMobileCart(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Cart content */}
            <div className="flex-1 overflow-y-auto p-4">
              <Cart />
            </div>
            
            {/* Totals and checkout button */}
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (7.5%):</span>
                  <span className="font-medium">₦{(total * 0.075).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-600">₦{(total * 1.075).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50"
              >
                <CreditCard className="inline-block h-5 w-5 mr-2" />
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSaleComplete}
          total={total}
        />
      )}
      
      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div id="receipt-content">
              <Receipt transaction={lastTransaction} />
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosDashboard;