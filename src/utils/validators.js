// frontend/src/utils/validators.js

// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return emailRegex.test(email);
  };
  
  // Nigerian phone number validation
  export const isValidPhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Nigerian phone number patterns
    const patterns = [
      /^0[789][01]\d{8}$/,      // 080, 081, 090, 091 format
      /^234[789][01]\d{8}$/,    // 23480, 23481, 23490, 23491 format
      /^\+234[789][01]\d{8}$/,  // +23480, +23481 format
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  };
  
  // PIN validation (4 digits)
  export const isValidPin = (pin) => {
    const pinRegex = /^\d{4}$/;
    return pinRegex.test(pin);
  };
  
  // Password validation
  export const isValidPassword = (password, options = {}) => {
    const { minLength = 6, requireUppercase = true, requireLowercase = true, requireNumbers = true, requireSpecialChars = false } = options;
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  
  // Product name validation
  export const isValidProductName = (name) => {
    if (!name || name.trim().length < 2) {
      return { isValid: false, error: 'Product name must be at least 2 characters' };
    }
    if (name.length > 100) {
      return { isValid: false, error: 'Product name cannot exceed 100 characters' };
    }
    return { isValid: true, error: null };
  };
  
  // Price validation
  export const isValidPrice = (price) => {
    if (price === null || price === undefined) {
      return { isValid: false, error: 'Price is required' };
    }
    if (typeof price !== 'number' || isNaN(price)) {
      return { isValid: false, error: 'Price must be a number' };
    }
    if (price < 0) {
      return { isValid: false, error: 'Price cannot be negative' };
    }
    if (price > 10000000) {
      return { isValid: false, error: 'Price cannot exceed ₦10,000,000' };
    }
    return { isValid: true, error: null };
  };
  
  // Quantity validation
  export const isValidQuantity = (quantity, min = 0, max = 10000) => {
    if (quantity === null || quantity === undefined) {
      return { isValid: false, error: 'Quantity is required' };
    }
    if (typeof quantity !== 'number' || isNaN(quantity)) {
      return { isValid: false, error: 'Quantity must be a number' };
    }
    if (quantity < min) {
      return { isValid: false, error: `Quantity cannot be less than ${min}` };
    }
    if (quantity > max) {
      return { isValid: false, error: `Quantity cannot exceed ${max}` };
    }
    if (!Number.isInteger(quantity)) {
      return { isValid: false, error: 'Quantity must be a whole number' };
    }
    return { isValid: true, error: null };
  };
  
  // Date validation
  export const isValidDate = (date, options = {}) => {
    const { futureOnly = false, pastOnly = false, notExpired = false } = options;
    
    if (!date) {
      return { isValid: false, error: 'Date is required' };
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (futureOnly && dateObj < today) {
      return { isValid: false, error: 'Date must be in the future' };
    }
    
    if (pastOnly && dateObj > today) {
      return { isValid: false, error: 'Date must be in the past' };
    }
    
    if (notExpired && dateObj < today) {
      return { isValid: false, error: 'Product has expired' };
    }
    
    return { isValid: true, error: null };
  };
  
  // NAFDAC Number validation
  export const isValidNafdacNumber = (number) => {
    if (!number) return { isValid: true, error: null }; // Optional field
    
    const nafdacRegex = /^[A-Z0-9]{4,20}$/i;
    if (!nafdacRegex.test(number)) {
      return { isValid: false, error: 'Invalid NAFDAC number format' };
    }
    return { isValid: true, error: null };
  };
  
  // Batch number validation
  export const isValidBatchNumber = (batch) => {
    if (!batch) return { isValid: true, error: null }; // Optional field
    
    if (batch.length < 2 || batch.length > 30) {
      return { isValid: false, error: 'Batch number must be between 2 and 30 characters' };
    }
    
    const validChars = /^[A-Z0-9-]+$/i;
    if (!validChars.test(batch)) {
      return { isValid: false, error: 'Batch number can only contain letters, numbers, and hyphens' };
    }
    
    return { isValid: true, error: null };
  };
  
  // Form validation helper
  export const validateForm = (data, rules) => {
    const errors = {};
    
    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];
      
      if (fieldRules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[field] = fieldRules.message || `${field} is required`;
        continue;
      }
      
      if (value && fieldRules.validate) {
        const result = fieldRules.validate(value);
        if (!result.isValid) {
          errors[field] = result.error;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
  
  // Stock validation for sales
  export const validateStockAvailability = (product, requestedPacks, requestedUnits) => {
    const totalAvailable = (product.currentStock.packs * product.packSize) + product.currentStock.units;
    const totalRequested = (requestedPacks * product.packSize) + requestedUnits;
    
    if (totalRequested > totalAvailable) {
      return {
        isValid: false,
        error: `Insufficient stock. Available: ${product.currentStock.packs} packs and ${product.currentStock.units} units (${totalAvailable} total units)`,
        available: totalAvailable,
      };
    }
    
    return { isValid: true, error: null };
  };
  
  // Barcode validation (EAN-13, UPC-A, etc.)
  export const isValidBarcode = (barcode) => {
    if (!barcode) return { isValid: true, error: null };
    
    const cleaned = barcode.replace(/\s/g, '');
    
    if (!/^\d+$/.test(cleaned)) {
      return { isValid: false, error: 'Barcode must contain only numbers' };
    }
    
    const validLengths = [8, 12, 13, 14];
    if (!validLengths.includes(cleaned.length)) {
      return { isValid: false, error: 'Barcode must be 8, 12, 13, or 14 digits' };
    }
    
    return { isValid: true, error: null };
  };
  
  // URL validation
  export const isValidUrl = (url) => {
    if (!url) return { isValid: true, error: null };
    
    try {
      new URL(url);
      return { isValid: true, error: null };
    } catch {
      return { isValid: false, error: 'Invalid URL format' };
    }
  };
  
  // Integer validation
  export const isInteger = (value) => {
    return Number.isInteger(value);
  };
  
  // Positive number validation
  export const isPositiveNumber = (value) => {
    return typeof value === 'number' && value > 0;
  };
  
  // Range validation
  export const isInRange = (value, min, max) => {
    return value >= min && value <= max;
  };