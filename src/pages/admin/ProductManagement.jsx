import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useProductManagement } from '../../hooks/useProductManagement';
import ProductFilters from '../../components/ProductFilters/ProductFilters';
import ProductTable from '../../components/ProductTable/ProductTable';
import ProductPagination from '../../components/ProductPagination/ProductPagination';
import ProductModal from '../../components/ProductModal/ProductModal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 300;

const ProductManagement = () => {
  // Use custom hook for product management
  const {
    products,
    totalCount,
    loading,
    saving,
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    searchTerm,
    filterCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    handleSearch,
    handleCategoryFilter,
    handlePageChange,
    handlePageSizeChange
  } = useProductManagement();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Debounced search
  const debouncedSearchTerm = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);

  // Modal handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleViewProduct = (product) => {
    // For now, just edit - can implement view modal later
    handleEditProduct(product);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Save failed:', error);
      // Error is handled by the hook and toast is shown
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Quản lý sản phẩm
            </h1>
            <p className="text-slate-300">
              Quản lý danh sách sản phẩm trong cửa hàng
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <FiPlus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        </div>

      {/* Filters */}
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        filterCategory={filterCategory}
        onCategoryChange={handleCategoryFilter}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        totalCount={totalCount}
      />

      {/* Products Table */}
      <ProductTable
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onView={handleViewProduct}
        loading={loading}
      />

      {/* Pagination */}
      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onPageChange={handlePageChange}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={handleCloseModal}
        product={editingProduct}
        onSave={handleSaveProduct}
        loading={saving}
      />
      </div>
    </div>
  );
};

export default ProductManagement;
