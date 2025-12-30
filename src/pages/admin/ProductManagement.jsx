import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useProductManagement } from "../../hooks/useProductManagement";
import ProductFilters from "../../components/ProductFilters/ProductFilters";
import ProductTable from "../../components/ProductTable/ProductTable";
import ProductPagination from "../../components/ProductPagination/ProductPagination";
import ProductModal from "../../components/ProductModal/ProductModal";

const ProductManagement = () => {
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
    handlePageSizeChange,
    refresh,
  } = useProductManagement();

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleViewProduct = (product) => handleEditProduct(product);

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
      await deleteProduct(product.id);
      if (typeof refresh === "function") refresh();
    }
  };

  const handleSaveProduct = async (productData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await createProduct(productData);
    }
    setShowModal(false);
    setEditingProduct(null);
    if (typeof refresh === "function") refresh();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quản lý sản phẩm</h1>
            <p className="text-slate-300">Quản lý danh sách sản phẩm trong cửa hàng</p>

            {loading && (
              <p className="mt-2 text-sm text-slate-400 flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-full border-b-2 border-blue-500 animate-spin" />
                Đang tải sản phẩm...
              </p>
            )}
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

        {/* Table */}
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

        {/* Modal */}
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
