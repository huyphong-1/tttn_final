import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://didongviet.vercel.app/api' : 'http://localhost:3001/api');

export const useProductManagement = () => {
  const { showSuccess, showError } = useToast();
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch products with filters and pagination
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory !== 'all' && { category: filterCategory })
      });

      const response = await fetch(`${API_BASE_URL}/products?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('[useProductManagement] API Response:', data);

      setProducts(data.data || []);
      setTotalCount(data.count || 0);
      
    } catch (error) {
      console.error('[useProductManagement] Fetch error:', error);
      showError('Không thể tải danh sách sản phẩm');
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterCategory, showError]);

  const createProduct = useCallback(async (productData) => {
    try {
      setSaving(true);
      
      const payload = {
        ...productData,
        price: Number(productData.price),
        stock: Number(productData.stock),
        discount: Number(productData.discount) || 0,
        featured: Boolean(productData.featured),
        status: productData.status || 'active'
      };

      console.log('[useProductManagement] Creating product:', payload);

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const newProduct = await response.json();
      
      // Refresh products list
      await fetchProducts();
      
      showSuccess('Tạo sản phẩm thành công!');
      return newProduct;
      
    } catch (error) {
      console.error('[useProductManagement] Create error:', error);
      showError(error.message || 'Không thể tạo sản phẩm');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [fetchProducts, showSuccess, showError]);

  // Update existing product
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setSaving(true);
      
      const payload = {
        ...productData,
        price: Number(productData.price),
        stock: Number(productData.stock),
        discount: Number(productData.discount) || 0,
        featured: Boolean(productData.featured),
        status: productData.status || 'active'
      };

      console.log('[useProductManagement] Updating product:', productId, payload);

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      
      // Refresh products list
      await fetchProducts();
      
      showSuccess('Cập nhật sản phẩm thành công!');
      return updatedProduct;
      
    } catch (error) {
      console.error('[useProductManagement] Update error:', error);
      showError(error.message || 'Không thể cập nhật sản phẩm');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [fetchProducts, showSuccess, showError]);

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    try {
      setSaving(true);
      
      console.log('[useProductManagement] Deleting product:', productId);

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      // Refresh products list
      await fetchProducts();
      
      showSuccess('Xóa sản phẩm thành công!');
      
    } catch (error) {
      console.error('[useProductManagement] Delete error:', error);
      showError(error.message || 'Không thể xóa sản phẩm');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [fetchProducts, showSuccess, showError]);

  // Search and filter handlers
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleCategoryFilter = useCallback((category) => {
    setFilterCategory(category);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Load products on mount and when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    // Data
    products,
    totalCount,
    
    // Loading states
    loading,
    saving,
    
    // Pagination
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Filters
    searchTerm,
    filterCategory,
    
    // Actions
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProducts,
    
    // Handlers
    handleSearch,
    handleCategoryFilter,
    handlePageSizeChange,
    handlePageChange
  };
};
