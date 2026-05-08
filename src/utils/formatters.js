// frontend/src/utils/formatters.js
import { format, formatDistance, formatRelative, differenceInDays, isToday, isYesterday } from 'date-fns';

// Currency Formatter (Nigerian Naira)
export const formatCurrency = (amount, options = {}) => {
  const { locale = 'en-NG', currency = 'NGN', minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
  
  if (amount === null || amount === undefined) return '₦0';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
};

// Format currency without symbol
export const formatNumber = (number, options = {}) => {
  const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
  
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(number);
};

// Date Formatters
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

export const formatDateTime = (date, formatStr = 'dd/MM/yyyy hh:mm a') => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

export const formatTime = (date, formatStr = 'hh:mm a') => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

// Relative time formatter
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'hh:mm a')}`;
  }
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'hh:mm a')}`;
  }
  
  const daysDiff = differenceInDays(new Date(), dateObj);
  if (daysDiff < 7) {
    return formatRelative(dateObj, new Date());
  }
  
  return format(dateObj, 'dd/MM/yyyy');
};

// Stock Formatters
export const formatStockDisplay = (packs, units, packSize) => {
  const parts = [];
  if (packs > 0) parts.push(`${packs} pack(s)`);
  if (units > 0) parts.push(`${units} unit(s)`);
  if (parts.length === 0) return 'Out of stock';
  
  const totalUnits = (packs * packSize) + units;
  return `${parts.join(' + ')} (${totalUnits} total units)`;
};

export const formatStockStatus = (packs, units, packSize, reorderLevel = 20) => {
  const totalUnits = (packs * packSize) + units;
  
  if (totalUnits === 0) {
    return { label: 'Out of Stock', color: 'red', variant: 'danger' };
  }
  if (totalUnits < reorderLevel) {
    return { label: 'Low Stock', color: 'yellow', variant: 'warning' };
  }
  if (totalUnits < reorderLevel * 2) {
    return { label: 'Moderate Stock', color: 'blue', variant: 'info' };
  }
  return { label: 'Good Stock', color: 'green', variant: 'success' };
};

// Expiry Formatters
export const formatExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { label: 'No expiry', color: 'gray', variant: 'secondary' };
  
  const today = new Date();
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const daysUntilExpiry = differenceInDays(expiry, today);
  
  if (daysUntilExpiry < 0) {
    return { label: 'Expired', color: 'red', variant: 'danger', days: Math.abs(daysUntilExpiry) };
  }
  if (daysUntilExpiry <= 30) {
    return { label: 'Expiring Soon', color: 'red', variant: 'danger', days: daysUntilExpiry };
  }
  if (daysUntilExpiry <= 90) {
    return { label: 'Near Expiry', color: 'yellow', variant: 'warning', days: daysUntilExpiry };
  }
  return { label: 'Valid', color: 'green', variant: 'success', days: daysUntilExpiry };
};

// Percentage Formatter
export const formatPercentage = (value, decimalPlaces = 1) => {
  return `${value.toFixed(decimalPlaces)}%`;
};

// Phone Number Formatter (Nigerian format)
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a Nigerian number
  if (cleaned.startsWith('234')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  }
  if (cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
};

// Receipt Number Formatter
export const formatReceiptNumber = (number) => {
  return `RCPT-${String(number).padStart(8, '0')}`;
};

// Transaction ID Formatter
export const formatTransactionId = (id) => {
  return `TRX-${String(id).slice(-8).toUpperCase()}`;
};

// Batch Number Formatter
export const formatBatchNumber = (batch) => {
  if (!batch) return 'N/A';
  return batch.toUpperCase();
};

// NAFDAC Number Formatter
export const formatNafdacNumber = (number) => {
  if (!number) return 'N/A';
  return number.toUpperCase();
};

// Address Formatter
export const formatAddress = (address) => {
  if (!address) return 'N/A';
  const { street, city, state, country } = address;
  const parts = [street, city, state, country].filter(Boolean);
  return parts.join(', ');
};

// Name Formatter (Capitalize each word)
export const formatName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Truncate text
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration in milliseconds
export const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// Format discount
export const formatDiscount = (discount, type = 'percentage') => {
  if (type === 'percentage') {
    return `${discount}% OFF`;
  }
  return `${formatCurrency(discount)} OFF`;
};

// Format barcode
export const formatBarcode = (barcode) => {
  if (!barcode) return 'N/A';
  // Add spaces every 4 characters for readability
  return barcode.replace(/(.{4})/g, '$1 ').trim();
};

// Format payment method for display
export const formatPaymentMethod = (method) => {
  const methods = {
    cash: 'Cash',
    card: 'Card Payment',
    transfer: 'Bank Transfer',
    pos: 'POS',
    wallet: 'Wallet',
  };
  return methods[method] || method.toUpperCase();
};

// Format role for display
export const formatRole = (role) => {
  const roles = {
    admin: 'Administrator',
    pos_agent: 'POS Agent',
    manager: 'Store Manager',
    pharmacist: 'Pharmacist',
  };
  return roles[role] || role;
};

// Format unit type
export const formatUnitType = (type) => {
  const types = {
    tablet: 'Tablet(s)',
    capsule: 'Capsule(s)',
    sachet: 'Sachet(s)',
    bottle: 'Bottle(s)',
    pack: 'Pack(s)',
    ml: 'ML',
    mg: 'MG',
  };
  return types[type] || type;
};

// Format for CSV export
export const formatForCSV = (data) => {
  if (typeof data === 'object') {
    return JSON.stringify(data);
  }
  if (typeof data === 'number') {
    return data.toString();
  }
  return data || '';
};