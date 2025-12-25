import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validateNumber,
  ValidationError
} from '../../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should pass for valid emails', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow();
      expect(() => validateEmail('user.name@domain.co.uk')).not.toThrow();
    });

    it('should throw for invalid emails', () => {
      expect(() => validateEmail('')).toThrow('Email là bắt buộc');
      expect(() => validateEmail('invalid-email')).toThrow('Email không hợp lệ');
      expect(() => validateEmail('test@')).toThrow('Email không hợp lệ');
    });
  });

  describe('validatePassword', () => {
    it('should pass for valid passwords', () => {
      expect(() => validatePassword('123456')).not.toThrow();
      expect(() => validatePassword('strongpassword')).not.toThrow();
    });

    it('should throw for invalid passwords', () => {
      expect(() => validatePassword('')).toThrow('Mật khẩu là bắt buộc');
      expect(() => validatePassword('12345')).toThrow('Mật khẩu phải có ít nhất 6 ký tự');
    });
  });

  describe('validatePhone', () => {
    it('should pass for valid phone numbers', () => {
      expect(() => validatePhone('0123456789')).not.toThrow();
      expect(() => validatePhone('01234567890')).not.toThrow();
    });

    it('should throw for invalid phone numbers', () => {
      expect(() => validatePhone('')).toThrow('Số điện thoại là bắt buộc');
      expect(() => validatePhone('123')).toThrow('Số điện thoại không hợp lệ');
      expect(() => validatePhone('abc1234567')).toThrow('Số điện thoại không hợp lệ');
    });
  });

  describe('validateRequired', () => {
    it('should pass for non-empty values', () => {
      expect(() => validateRequired('test', 'Field')).not.toThrow();
      expect(() => validateRequired(123, 'Number')).not.toThrow();
    });

    it('should throw for empty values', () => {
      expect(() => validateRequired('', 'Field')).toThrow('Field là bắt buộc');
      expect(() => validateRequired(null, 'Field')).toThrow('Field là bắt buộc');
      expect(() => validateRequired(undefined, 'Field')).toThrow('Field là bắt buộc');
    });
  });

  describe('validateNumber', () => {
    it('should pass for valid numbers', () => {
      expect(() => validateNumber(10, 'Price', 0, 100)).not.toThrow();
      expect(() => validateNumber('50', 'Age', 0)).not.toThrow();
    });

    it('should throw for invalid numbers', () => {
      expect(() => validateNumber('abc', 'Price')).toThrow('Price phải là số');
      expect(() => validateNumber(-5, 'Price', 0)).toThrow('Price phải lớn hơn hoặc bằng 0');
      expect(() => validateNumber(150, 'Age', 0, 100)).toThrow('Age phải nhỏ hơn hoặc bằng 100');
    });
  });
});
