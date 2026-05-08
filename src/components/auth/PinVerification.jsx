// frontend/src/components/auth/PinVerification.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Shield, AlertCircle, Fingerprint, Keypad, X } from 'lucide-react';
import { ButtonLoader } from '../common/Loader';

const PinVerification = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  title = "Authorize Transaction",
  message = "Enter your 4-digit PIN to authorize this transaction",
  isLoading = false 
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showNumpad, setShowNumpad] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setPin(['', '', '', '']);
      setError('');
      // Focus first input
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  const handlePinChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;
    
    // Take only the last character if multiple are pasted
    const newValue = value.slice(-1);
    
    const newPin = [...pin];
    newPin[index] = newValue;
    setPin(newPin);
    
    // Clear error when typing
    if (error) setError('');
    
    // Auto-focus next input
    if (newValue && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    
    // Auto-submit when all digits are entered
    if (index === 3 && newValue && newPin.every(digit => digit !== '')) {
      setTimeout(() => handleSubmit(newPin.join('')), 100);
    }
  };
  
  const handleKeyDown = (index, e) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    
    // Handle left arrow key
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    
    // Handle right arrow key
    if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    
    // Handle Enter key
    if (e.key === 'Enter' && pin.every(digit => digit !== '')) {
      handleSubmit(pin.join(''));
    }
  };
  
  const handleSubmit = async (pinCode) => {
    if (pinCode.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }
    
    try {
      await onVerify(pinCode);
      // Success - modal will be closed by parent
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setError(`Too many attempts. Please contact administrator.`);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(`Invalid PIN. ${3 - newAttempts} attempt(s) remaining`);
        // Clear PIN on error
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 4);
    
    if (digits.length === 4) {
      const newPin = digits.split('');
      setPin(newPin);
      
      // Fill inputs and submit
      newPin.forEach((digit, idx) => {
        if (inputRefs[idx].current) {
          inputRefs[idx].current.value = digit;
        }
      });
      
      setTimeout(() => handleSubmit(digits), 100);
    }
  };
  
  const handleNumpadInput = (digit) => {
    const firstEmptyIndex = pin.findIndex(d => d === '');
    if (firstEmptyIndex !== -1) {
      handlePinChange(firstEmptyIndex, digit);
    }
  };
  
  const handleNumpadDelete = () => {
    const lastFilledIndex = pin.findLastIndex(d => d !== '');
    if (lastFilledIndex !== -1) {
      handlePinChange(lastFilledIndex, '');
      inputRefs[lastFilledIndex].current?.focus();
    }
  };
  
  const handleClearAll = () => {
    setPin(['', '', '', '']);
    inputRefs[0].current?.focus();
    setError('');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-white">
                    {title}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="bg-white px-6 pt-5 pb-4">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              
              {/* Message */}
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
              
              {/* PIN Input Fields */}
              <div className="mt-6" onPaste={handlePaste}>
                <div className="flex justify-center space-x-3">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="password"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`
                        w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all duration-200
                        ${error 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500'
                        }
                        ${digit ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                      `}
                      autoFocus={index === 0}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="mt-3 flex items-center justify-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                  </div>
                )}
                
                {/* Attempts remaining indicator */}
                {attempts > 0 && !error && (
                  <div className="mt-3 text-xs text-gray-500">
                    Attempts: {attempts}/3
                  </div>
                )}
                
                {/* Security tip */}
                <div className="mt-4 text-xs text-gray-400 flex items-center justify-center">
                  <Fingerprint className="h-3 w-3 mr-1" />
                  Secure PIN verification
                </div>
              </div>
              
              {/* Virtual Numpad Toggle */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowNumpad(!showNumpad)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                >
                  <Keypad className="h-4 w-4 mr-1" />
                  {showNumpad ? 'Hide' : 'Show'} Number Pad
                </button>
              </div>
              
              {/* Virtual Numpad */}
              {showNumpad && (
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        onClick={() => handleNumpadInput(num.toString())}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition text-lg"
                        disabled={isLoading}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={handleClearAll}
                      className="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-3 rounded-lg transition text-sm"
                      disabled={isLoading}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => handleNumpadInput('0')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition text-lg"
                      disabled={isLoading}
                    >
                      0
                    </button>
                    <button
                      onClick={handleNumpadDelete}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-3 rounded-lg transition text-sm"
                      disabled={isLoading}
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              disabled={isLoading}
            >
              Clear All
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(pin.join(''))}
                disabled={pin.some(d => d === '') || isLoading}
                className={`
                  inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium
                  text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all
                `}
              >
                {isLoading ? (
                  <>
                    <ButtonLoader />
                    <span className="ml-2">Verifying...</span>
                  </>
                ) : (
                  'Verify PIN'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for using PIN verification in components
export const usePinVerification = () => {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const verifyPin = async (action) => {
    return new Promise((resolve, reject) => {
      setPendingAction({ resolve, reject });
      setIsPinModalOpen(true);
    });
  };
  
  const handlePinVerify = async (pin) => {
    try {
      // Here you would typically verify the PIN with your backend
      const response = await verifyPinWithBackend(pin);
      if (response.verified) {
        pendingAction?.resolve(true);
        setIsPinModalOpen(false);
        return true;
      } else {
        throw new Error('Invalid PIN');
      }
    } catch (error) {
      pendingAction?.reject(error);
      throw error;
    }
  };
  
  const PinModalComponent = () => (
    <PinVerification
      isOpen={isPinModalOpen}
      onClose={() => {
        setIsPinModalOpen(false);
        pendingAction?.reject(new Error('Verification cancelled'));
      }}
      onVerify={handlePinVerify}
    />
  );
  
  return { verifyPin, PinModalComponent };
};

// Example API call for PIN verification (to be implemented in your API service)
const verifyPinWithBackend = async (pin) => {
  // This should be replaced with actual API call
  const response = await fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  return response.json();
};

export default PinVerification;