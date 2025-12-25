// Validation utilities
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    throw new ValidationError('Email là bắt buộc', 'email');
  }
  if (!emailRegex.test(email)) {
    throw new ValidationError('Email không hợp lệ', 'email');
  }
  return true;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    throw new ValidationError('Mật khẩu là bắt buộc', 'password');
  }
  if (password.length < 6) {
    throw new ValidationError('Mật khẩu phải có ít nhất 6 ký tự', 'password');
  }
  return true;
};

// Phone validation
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phone) {
    throw new ValidationError('Số điện thoại là bắt buộc', 'phone');
  }
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw new ValidationError('Số điện thoại không hợp lệ', 'phone');
  }
  return true;
};

// Required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new ValidationError(`${fieldName} là bắt buộc`, fieldName.toLowerCase());
  }
  return true;
};

// Number validation
export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (isNaN(value) || value === null || value === undefined) {
    throw new ValidationError(`${fieldName} phải là số`, fieldName.toLowerCase());
  }
  
  const num = Number(value);
  if (min !== null && num < min) {
    throw new ValidationError(`${fieldName} phải lớn hơn hoặc bằng ${min}`, fieldName.toLowerCase());
  }
  if (max !== null && num > max) {
    throw new ValidationError(`${fieldName} phải nhỏ hơn hoặc bằng ${max}`, fieldName.toLowerCase());
  }
  return true;
};

// Product validation
export const validateProduct = (product) => {
  const errors = [];
  
  try {
    validateRequired(product.name, 'Tên sản phẩm');
  } catch (e) {
    errors.push(e.message);
  }
  
  try {
    validateRequired(product.price, 'Giá sản phẩm');
    validateNumber(product.price, 'Giá sản phẩm', 0);
  } catch (e) {
    errors.push(e.message);
  }
  
  try {
    validateRequired(product.category, 'Danh mục');
  } catch (e) {
    errors.push(e.message);
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
  
  return true;
};

// Order validation
export const validateOrder = (order) => {
  const errors = [];
  
  try {
    validateRequired(order.user_id, 'User ID');
  } catch (e) {
    errors.push(e.message);
  }
  
  try {
    validateRequired(order.items, 'Sản phẩm');
    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new ValidationError('Đơn hàng phải có ít nhất 1 sản phẩm');
    }
  } catch (e) {
    errors.push(e.message);
  }
  
  try {
    validateNumber(order.total_amount, 'Tổng tiền', 0);
  } catch (e) {
    errors.push(e.message);
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
  
  return true;
};

// User profile validation
export const validateUserProfile = (profile) => {
  const errors = [];
  
  if (profile.email) {
    try {
      validateEmail(profile.email);
    } catch (e) {
      errors.push(e.message);
    }
  }
  
  if (profile.phone) {
    try {
      validatePhone(profile.phone);
    } catch (e) {
      errors.push(e.message);
    }
  }
  
  if (profile.full_name) {
    try {
      validateRequired(profile.full_name, 'Họ và tên');
    } catch (e) {
      errors.push(e.message);
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
  
  return true;
};

// Generic form validation
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    try {
      if (rule.required) {
        validateRequired(value, rule.label || field);
      }
      
      if (rule.type === 'email' && value) {
        validateEmail(value);
      }
      
      if (rule.type === 'password' && value) {
        validatePassword(value);
      }
      
      if (rule.type === 'phone' && value) {
        validatePhone(value);
      }
      
      if (rule.type === 'number' && value) {
        validateNumber(value, rule.label || field, rule.min, rule.max);
      }
      
      if (rule.minLength && value && value.length < rule.minLength) {
        throw new ValidationError(`${rule.label || field} phải có ít nhất ${rule.minLength} ký tự`);
      }
      
      if (rule.maxLength && value && value.length > rule.maxLength) {
        throw new ValidationError(`${rule.label || field} không được vượt quá ${rule.maxLength} ký tự`);
      }
      
      if (rule.pattern && value && !rule.pattern.test(value)) {
        throw new ValidationError(rule.patternMessage || `${rule.label || field} không đúng định dạng`);
      }
      
    } catch (error) {
      errors[field] = error.message;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
