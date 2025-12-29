import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiPackage, FiTag, FiDollarSign, FiImage, FiSettings } from 'react-icons/fi';
import ImageUpload from '../ImageUpload';
import { validateProduct } from '../../utils/validation';

const CATEGORIES = [
  { value: 'phone', label: 'Điện thoại' },
  { value: 'accessory', label: 'Phụ kiện' },
  { value: 'tablet', label: 'Máy tính bảng' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'smartwatch', label: 'Đồng hồ thông minh' },
  { value: 'headphone', label: 'Tai nghe' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Tạm dừng' },
  { value: 'draft', label: 'Nháp' }
];

const ProductForm = ({ 
  product = null, 
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
    brand: '',
    specifications: '',
    discount: 0,
    featured: false,
    status: 'active'
  });
  
  const [errors, setErrors] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        stock: product.stock?.toString() || '',
        image: product.image || '',
        brand: product.brand || '',
        specifications: product.specifications || '',
        discount: product.discount || 0,
        featured: Boolean(product.featured),
        status: product.status || 'active'
      });
      
      // Set uploaded images for preview
      if (product.image) {
        setUploadedImages([{
          id: 'existing',
          url: product.image,
          publicId: product.image,
          thumbnailUrl: product.image
        }]);
      } else {
        setUploadedImages([]);
      }
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image: '',
        brand: '',
        specifications: '',
        discount: 0,
        featured: false,
        status: 'active'
      });
      setUploadedImages([]);
    }
    setErrors({});
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (uploadedImage, allImages) => {
    console.log('[ProductForm] Image upload:', { uploadedImage, allImages });
    
    if (uploadedImage) {
      const imageUrl = uploadedImage.secure_url || uploadedImage.url;
      setFormData(prev => ({
        ...prev,
        image: imageUrl
      }));
      setUploadedImages([{
        id: uploadedImage.public_id || Date.now(),
        url: imageUrl,
        publicId: uploadedImage.public_id,
        thumbnailUrl: imageUrl
      }]);
    } else {
      // Handle image removal
      const imageValue = allImages.length > 0 ? allImages[0].url : '';
      setFormData(prev => ({
        ...prev,
        image: imageValue
      }));
      setUploadedImages(allImages);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form data
      validateProduct(formData);
      
      // Prepare payload
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        discount: Number(formData.discount) || 0,
        featured: Boolean(formData.featured)
      };
      
      console.log('[ProductForm] Submitting:', payload);
      await onSave(payload);
      
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        console.error('[ProductForm] Submit error:', error);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Preview Card (if editing) */}
      {product && (
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiPackage className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{product.name}</h3>
              <p className="text-slate-400 text-sm">{product.brand} • {product.category}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-green-400 font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </span>
                <span className="text-slate-400 text-sm">Kho: {product.stock}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <FiTag className="w-5 h-5 text-blue-400" />
            </div>
            Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400 transition-all ${
                  errors.name ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
                placeholder="Nhập tên sản phẩm"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Thương hiệu *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400 transition-all ${
                  errors.brand ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
                placeholder="Nhập thương hiệu"
              />
              {errors.brand && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  {errors.brand}
                </p>
              )}
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Danh mục *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 border-slate-600 text-white transition-all ${
                  errors.category ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
              >
                <option value="">Chọn danh mục</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white transition-all"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Mô tả *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400 transition-all resize-none ${
                errors.description ? 'border-red-500 ring-1 ring-red-500' : ''
              }`}
              placeholder="Nhập mô tả sản phẩm"
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                {errors.description}
              </p>
            )}
          </div>
        </div>

        {/* Price and Stock */}
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <FiDollarSign className="w-5 h-5 text-green-400" />
            </div>
            Giá và kho hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Giá (VNĐ) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400 transition-all ${
                  errors.price ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
                placeholder="0"
              />
              {errors.price && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Số lượng *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400 transition-all ${
                  errors.stock ? 'border-red-500 ring-1 ring-red-500' : ''
                }`}
                placeholder="0"
              />
              {errors.stock && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                  {errors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Giảm giá (%)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400 transition-all"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <FiImage className="w-5 h-5 text-purple-400" />
            </div>
            Hình ảnh sản phẩm
          </h3>
          <ImageUpload
            onUploadComplete={handleImageUpload}
            onUploadError={(error) => console.error('Upload error:', error)}
            existingImages={uploadedImages}
            multiple={false}
            maxFiles={1}
            folder="products"
          />
        </div>

        {/* Additional Settings */}
        <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <FiSettings className="w-5 h-5 text-orange-400" />
            </div>
            Cài đặt bổ sung
          </h3>
          
          {/* Specifications */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Thông số kỹ thuật
            </label>
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400 transition-all resize-none"
              placeholder="Nhập thông số kỹ thuật (tùy chọn)"
            />
          </div>

          {/* Featured checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              id="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="featured" className="ml-3 text-sm font-medium text-slate-200">
              Sản phẩm nổi bật
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-600/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700 font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            <FiX className="w-4 h-4" />
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <FiSave className="w-4 h-4" />
            {loading ? 'Đang lưu...' : (product ? 'Cập nhật' : 'Tạo mới')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
