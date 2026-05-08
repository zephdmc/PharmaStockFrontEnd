// frontend/src/components/pos/CheckoutModal.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, CreditCard, Smartphone, Building, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PinModal from './PinModal';
import { clearCart } from '../../redux/slices/cartSlice';
import salesService from '../../services/salesService';

const CheckoutModal = ({ onClose, onSuccess, total }) => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const subtotal = total;
  const vat = total * 0.075;
  const grandTotal = total + vat;
  
  const handleProceedToPayment = () => {
    setShowPinModal(true);
  };
  
  const handlePinVerification = async (pinCode) => {
    setIsProcessing(true);
    
    try {
      const saleData = {
        items: items.map(item => ({
          productId: item.productId,
          quantityPacks: item.quantityPacks,
          quantityUnits: item.quantityUnits,
        })),
        paymentMethod: paymentMethod,
        pinCode: pinCode,
        posAgentId: user._id,
        subtotal: subtotal,
        vat: vat,
        total: grandTotal
      };
      
      const result = await salesService.processSale(saleData);
      
      if (result.success) {
        onSuccess(result.transaction);
        onClose();
      } else {
        toast.error(result.message || 'Sale failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Transaction failed');
      throw error;
    } finally {
      setIsProcessing(false);
      setShowPinModal(false);
    }
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-900">Complete Sale</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({items.length}):</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (7.5%):</span>
                  <span>₦{vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600 text-lg">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-1 transition ${
                    paymentMethod === 'cash'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">Cash</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-1 transition ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className={`h-5 w-5 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">Card</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center space-y-1 transition ${
                    paymentMethod === 'transfer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building className={`h-5 w-5 ${paymentMethod === 'transfer' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">Transfer</span>
                </button>
              </div>
            </div>
            
            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Lock className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-xs text-yellow-800">
                    PIN verification required for all transactions. Your PIN is secure and encrypted.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleProceedToPayment}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Proceed to Payment
            </button>
            <button
              onClick={onClose}
              className="w-full mt-2 text-gray-600 text-sm hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      {/* PIN Modal */}
      {showPinModal && (
        <PinModal
          onVerify={handlePinVerification}
          onCancel={() => {
            setShowPinModal(false);
            setIsProcessing(false);
          }}
          isProcessing={isProcessing}
          amount={grandTotal}
        />
      )}
    </>
  );
};

export default CheckoutModal;