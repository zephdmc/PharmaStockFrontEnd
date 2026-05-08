// frontend/src/utils/constants.js

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    POS_AGENT: 'pos_agent',
    MANAGER: 'manager',
    PHARMACIST: 'pharmacist',
  };
  
  export const USER_ROLES_LIST = Object.values(USER_ROLES);
  
  // User role labels
  export const USER_ROLE_LABELS = {
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.POS_AGENT]: 'POS Agent',
    [USER_ROLES.MANAGER]: 'Store Manager',
    [USER_ROLES.PHARMACIST]: 'Pharmacist',
  };
  
  // Product Unit Types
  export const UNIT_TYPES = {
    TABLET: 'tablet',
    CAPSULE: 'capsule',
    SACHET: 'sachet',
    BOTTLE: 'bottle',
    PACK: 'pack',
    ML: 'ml',
    MG: 'mg',
  };
  
  export const UNIT_TYPES_LIST = Object.values(UNIT_TYPES);
  
  // Unit type labels
  export const UNIT_TYPE_LABELS = {
    [UNIT_TYPES.TABLET]: 'Tablet(s)',
    [UNIT_TYPES.CAPSULE]: 'Capsule(s)',
    [UNIT_TYPES.SACHET]: 'Sachet(s)',
    [UNIT_TYPES.BOTTLE]: 'Bottle(s)',
    [UNIT_TYPES.PACK]: 'Pack(s)',
    [UNIT_TYPES.ML]: 'ML',
    [UNIT_TYPES.MG]: 'MG',
  };
  
  // Payment Methods
  export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    TRANSFER: 'transfer',
    POS: 'pos',
    WALLET: 'wallet',
  };
  
  export const PAYMENT_METHODS_LIST = Object.values(PAYMENT_METHODS);
  
  // Payment method labels
  export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.CASH]: 'Cash',
    [PAYMENT_METHODS.CARD]: 'Card Payment',
    [PAYMENT_METHODS.TRANSFER]: 'Bank Transfer',
    [PAYMENT_METHODS.POS]: 'POS Machine',
    [PAYMENT_METHODS.WALLET]: 'Digital Wallet',
  };
  
  // Transaction Status
  export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    VOID: 'void',
  };
  
  export const TRANSACTION_STATUS_LIST = Object.values(TRANSACTION_STATUS);
  
  // Transaction status labels
  export const TRANSACTION_STATUS_LABELS = {
    [TRANSACTION_STATUS.PENDING]: 'Pending',
    [TRANSACTION_STATUS.COMPLETED]: 'Completed',
    [TRANSACTION_STATUS.FAILED]: 'Failed',
    [TRANSACTION_STATUS.REFUNDED]: 'Refunded',
    [TRANSACTION_STATUS.VOID]: 'Void',
  };
  
  // Transaction status colors
  export const TRANSACTION_STATUS_COLORS = {
    [TRANSACTION_STATUS.PENDING]: 'yellow',
    [TRANSACTION_STATUS.COMPLETED]: 'green',
    [TRANSACTION_STATUS.FAILED]: 'red',
    [TRANSACTION_STATUS.REFUNDED]: 'orange',
    [TRANSACTION_STATUS.VOID]: 'gray',
  };
  
  // Inventory Movement Types
  export const MOVEMENT_TYPES = {
    RESTOCK: 'restock',
    SALE: 'sale',
    ADJUSTMENT: 'adjustment',
    RETURN: 'return',
    DAMAGE: 'damage',
    EXPIRED: 'expired',
  };
  
  export const MOVEMENT_TYPES_LIST = Object.values(MOVEMENT_TYPES);
  
  // Movement type labels
  export const MOVEMENT_TYPE_LABELS = {
    [MOVEMENT_TYPES.RESTOCK]: 'Restock',
    [MOVEMENT_TYPES.SALE]: 'Sale',
    [MOVEMENT_TYPES.ADJUSTMENT]: 'Stock Adjustment',
    [MOVEMENT_TYPES.RETURN]: 'Return',
    [MOVEMENT_TYPES.DAMAGE]: 'Damaged Goods',
    [MOVEMENT_TYPES.EXPIRED]: 'Expired Products',
  };
  
  // Report Types
  export const REPORT_TYPES = {
    SALES: 'sales',
    INVENTORY: 'inventory',
    PROFIT_LOSS: 'profit-loss',
    TAX: 'tax',
    LOW_STOCK: 'low-stock',
    EXPIRING: 'expiring',
    VALUATION: 'valuation',
  };
  
  export const REPORT_TYPES_LIST = Object.values(REPORT_TYPES);
  
  // Report period options
  export const REPORT_PERIODS = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'this-week',
    LAST_WEEK: 'last-week',
    THIS_MONTH: 'this-month',
    LAST_MONTH: 'last-month',
    THIS_QUARTER: 'this-quarter',
    THIS_YEAR: 'this-year',
    CUSTOM: 'custom',
  };
  
  export const REPORT_PERIODS_LIST = Object.values(REPORT_PERIODS);
  
  // VAT rate for Nigeria
  export const VAT_RATE = 0.075; // 7.5%
  
  // Nigerian states
  export const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
    'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
    'FCT Abuja',
  ];
  
  // Pagination defaults
  export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    LIMIT_OPTIONS: [10, 20, 50, 100],
  };
  
  // Date formats
  export const DATE_FORMATS = {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_TIME: 'dd/MM/yyyy hh:mm a',
    API: 'yyyy-MM-dd',
    API_TIME: 'yyyy-MM-dd HH:mm:ss',
    MONTH_DAY: 'MMM dd',
    DAY_MONTH: 'dd MMM',
    TIME: 'hh:mm a',
  };
  
  // Stock thresholds
  export const STOCK_THRESHOLDS = {
    LOW_STOCK: 20, // units
    CRITICAL_STOCK: 5, // units
    EXPIRY_WARNING_DAYS: 90,
    EXPIRY_CRITICAL_DAYS: 30,
  };
  
  // Local storage keys
  export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    CART: 'cart',
    THEME: 'theme',
    LANGUAGE: 'language',
    REMEMBER_EMAIL: 'rememberEmail',
  };
  
  // API endpoints
  export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      VERIFY_PIN: '/auth/verify-pin',
      CHANGE_PASSWORD: '/auth/change-password',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      PROFILE: '/auth/profile',
    },
    PRODUCTS: {
      BASE: '/products',
      SEARCH: '/products/search',
      CATEGORIES: '/products/categories',
      LOW_STOCK: '/products/low-stock',
      EXPIRING: '/products/expiring',
      BULK_IMPORT: '/products/bulk-import',
      EXPORT: '/products/export',
    },
    SALES: {
      BASE: '/sales',
      TODAY: '/sales/today',
      RANGE: '/sales/range',
      SUMMARY: '/sales/summary',
      AGENT_PERFORMANCE: '/sales/agent-performance',
      HOURLY: '/sales/hourly',
      RECEIPT: '/sales/receipt',
      REFUND: '/sales/refund',
    },
    INVENTORY: {
      BASE: '/inventory',
      MOVEMENTS: '/inventory/movements',
      ADD_STOCK: '/inventory/add-stock',
      REMOVE_STOCK: '/inventory/remove-stock',
      VALUATION: '/inventory/valuation',
      TURNOVER: '/inventory/turnover',
    },
    REPORTS: {
      BASE: '/reports',
      SALES: '/reports/sales',
      INVENTORY: '/reports/inventory',
      PROFIT_LOSS: '/reports/profit-loss',
      TAX: '/reports/tax',
      EXPORT_PDF: '/reports/export-pdf',
      EXPORT_EXCEL: '/reports/export-excel',
    },
    USERS: {
      BASE: '/users',
      RESET_PIN: '/users/reset-pin',
      TOGGLE_STATUS: '/users/toggle-status',
    },
  };
  
  // Error messages
  export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'Unauthorized access. Please login again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'Resource not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    INVALID_PIN: 'Invalid PIN. Please try again.',
    INSUFFICIENT_STOCK: 'Insufficient stock available.',
    PRODUCT_NOT_FOUND: 'Product not found.',
    TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  };
  
  // Success messages
  export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful! Redirecting...',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    SALE_COMPLETED: 'Sale completed successfully!',
    PRODUCT_CREATED: 'Product created successfully.',
    PRODUCT_UPDATED: 'Product updated successfully.',
    PRODUCT_DELETED: 'Product deleted successfully.',
    STOCK_ADDED: 'Stock added successfully.',
    STOCK_REMOVED: 'Stock removed successfully.',
    USER_CREATED: 'User created successfully.',
    USER_UPDATED: 'User updated successfully.',
    USER_DELETED: 'User deleted successfully.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    PROFILE_UPDATED: 'Profile updated successfully.',
    REPORT_EXPORTED: 'Report exported successfully.',
  };
  
  // Local storage keys
  export const CURRENCY = {
    SYMBOL: '₦',
    CODE: 'NGN',
    NAME: 'Nigerian Naira',
    LOCALE: 'en-NG',
  };
  
  // Default pharmacy info
  export const DEFAULT_PHARMACY_INFO = {
    name: 'PharmaInventory Store',
    address: '123 Pharmacy Road, Lagos, Nigeria',
    phone: '+234 801 234 5678',
    email: 'info@pharmainventory.com',
    vatNumber: 'VAT-12345678-01',
    rcNumber: 'RC-1234567',
  };
  
  // Chart colors
  export const CHART_COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#8B5CF6',
    gray: '#6B7280',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
  };
  
  // Report chart types
  export const CHART_TYPES = {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie',
    DOUGHNUT: 'doughnut',
    AREA: 'area',
  };
  
  // Time intervals for reports
  export const TIME_INTERVALS = {
    HOURLY: 'hour',
    DAILY: 'day',
    WEEKLY: 'week',
    MONTHLY: 'month',
    QUARTERLY: 'quarter',
    YEARLY: 'year',
  };
  
  // Export file formats
  export const EXPORT_FORMATS = {
    PDF: 'pdf',
    EXCEL: 'excel',
    CSV: 'csv',
  };
  
  // Theme options
  export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
  };
  
  // Language options
  export const LANGUAGES = {
    EN: 'en',
    HA: 'ha', // Hausa
    YO: 'yo', // Yoruba
    IG: 'ig', // Igbo
    PIDGIN: 'pcm', // Nigerian Pidgin
  };
  
  // App configuration
  export const APP_CONFIG = {
    name: 'PharmaInventory',
    version: '1.0.0',
    company: 'PharmaInventory Ltd',
    supportEmail: 'support@pharmainventory.com',
    supportPhone: '+234 801 234 5678',
  };
  
  // Regular expressions
  export const REGEX = {
    EMAIL: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
    PHONE_NIGERIA: /^(0|234|\+234)[789][01]\d{8}$/,
    PIN: /^\d{4}$/,
    ONLY_NUMBERS: /^\d+$/,
    ONLY_LETTERS: /^[A-Za-z]+$/,
    ALPHANUMERIC: /^[A-Za-z0-9]+$/,
    ALPHANUMERIC_WITH_SPACE: /^[A-Za-z0-9\s]+$/,
    NAFDAC: /^[A-Z0-9]{4,20}$/i,
  };
  
  // Default form values
  export const DEFAULT_FORM_VALUES = {
    product: {
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      unitType: UNIT_TYPES.TABLET,
      packSize: 1,
      currentStock: { packs: 0, units: 0 },
      pricePerUnit: 0,
      pricePerPack: 0,
      reorderLevel: STOCK_THRESHOLDS.LOW_STOCK,
      reorderQuantity: 50,
      requiresPrescription: false,
    },
    user: {
      name: '',
      email: '',
      phone: '',
      role: USER_ROLES.POS_AGENT,
      pinCode: '',
      password: '',
    },
  };
  
  // Cache durations (in milliseconds)
  export const CACHE_DURATIONS = {
    PRODUCTS: 5 * 60 * 1000, // 5 minutes
    CATEGORIES: 30 * 60 * 1000, // 30 minutes
    REPORTS: 15 * 60 * 1000, // 15 minutes
    DASHBOARD: 2 * 60 * 1000, // 2 minutes
  };