import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FiUpload, FiImage, FiX, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { 
  uploadImageToCloudinary, 
  validateImageFile, 
  getOptimizedImageUrl 
} from '../../utils/cloudinaryUtils';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinaryConfig';

const ImageUpload = ({ 
  onUploadComplete, 
  onUploadError,
  multiple = false,
  maxFiles = 5,
  folder = CLOUDINARY_FOLDERS.PRODUCTS,
  existingImages = [],
  className = '',
  uploadText = 'Chọn hoặc kéo thả ảnh vào đây',
  acceptedFormats = 'JPG, PNG, WebP'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState(existingImages);
  
  const [errors, setErrors] = useState([]);
  
  // Update uploadedImages when existingImages prop changes
  useEffect(() => {
    setUploadedImages(existingImages);
  }, [existingImages]);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    
    // Check file limit
    if (multiple && uploadedImages.length + fileArray.length > maxFiles) {
      setErrors([`Chỉ có thể upload tối đa ${maxFiles} ảnh`]);
      return;
    }
    
    if (!multiple && fileArray.length > 1) {
      setErrors(['Chỉ có thể upload 1 ảnh']);
      return;
    }

    // Clear previous errors
    setErrors([]);

    // Process each file
    fileArray.forEach((file, index) => {
      processFile(file, index);
    });
  }, [multiple, maxFiles, uploadedImages.length]);

  // Process individual file
  const processFile = useCallback(async (file, index) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrors(prev => [...prev, ...validation.errors]);
      return;
    }

    // Add to uploading state
    const uploadId = `${Date.now()}_${index}`;
    setUploadingFiles(prev => [...prev, {
      id: uploadId,
      file,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // Upload to Cloudinary
      const result = await uploadImageToCloudinary(file, folder, {
        tags: ['product', 'techphone']
      });

      // Update uploading state
      setUploadingFiles(prev => 
        prev.map(item => 
          item.id === uploadId 
            ? { ...item, status: 'completed', progress: 100 }
            : item
        )
      );

      // Add to uploaded images
      const newImage = {
        id: result.public_id,
        url: result.url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        thumbnailUrl: getOptimizedImageUrl(result.public_id, 'PRODUCT_THUMB')
      };

      setUploadedImages(prev => {
        const updated = multiple ? [...prev, newImage] : [newImage];
        return updated;
      });

      // Remove from uploading after delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(item => item.id !== uploadId));
      }, 1000);

      // Callback with updated images array
      const updatedImages = multiple ? [...uploadedImages, newImage] : [newImage];
      if (onUploadComplete) {
        console.log('[ImageUpload] Calling onUploadComplete with:', { newImage, updatedImages });
        onUploadComplete(newImage, updatedImages);
      }

    } catch (error) {
      // Update uploading state with error
      setUploadingFiles(prev => 
        prev.map(item => 
          item.id === uploadId 
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      );

      setErrors(prev => [...prev, error.message]);
      
      if (onUploadError) {
        onUploadError(error);
      }

      // Remove from uploading after delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(item => item.id !== uploadId));
      }, 3000);
    }
  }, [folder, onUploadComplete, onUploadError, uploadedImages, multiple]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Remove uploaded image
  const removeImage = useCallback((imageId) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      if (onUploadComplete) {
        onUploadComplete(null, updated);
      }
      return updated;
    });
  }, [onUploadComplete]);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div 
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
            ${isDragOver 
              ? 'bg-blue-500 shadow-lg shadow-blue-500/25' 
              : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
            }
          `}>
            <FiUpload className={`text-xl transition-colors ${
              isDragOver ? 'text-white' : 'text-slate-600 dark:text-slate-300'
            }`} />
          </div>

          <div className="space-y-2">
            <p className="text-base font-medium text-slate-700 dark:text-slate-200">
              {uploadText}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hỗ trợ: {acceptedFormats} • Tối đa 5MB
              {multiple && ` • Tối đa ${maxFiles} ảnh`}
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            Chọn ảnh
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <FiAlertCircle className="text-lg" />
            <span className="font-semibold">Có lỗi xảy ra:</span>
          </div>
          <ul className="text-sm text-red-300 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-slate-700 dark:text-slate-200 font-medium">Đang upload:</h4>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  {file.status === 'uploading' && (
                    <FiLoader className="text-blue-500 animate-spin" />
                  )}
                  {file.status === 'completed' && (
                    <FiCheck className="text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <FiAlertCircle className="text-red-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-slate-100 text-sm font-medium truncate">
                    {file.file.name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.status === 'error' && (
                    <p className="text-red-500 text-xs mt-1">
                      {file.error}
                    </p>
                  )}
                </div>

                <div className="text-sm">
                  {file.status === 'uploading' && (
                    <span className="text-blue-500 font-medium">Đang upload...</span>
                  )}
                  {file.status === 'completed' && (
                    <span className="text-green-500 font-medium">Hoàn thành</span>
                  )}
                  {file.status === 'error' && (
                    <span className="text-red-500 font-medium">Thất bại</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-slate-700 dark:text-slate-200 font-medium">
            Ảnh đã upload ({uploadedImages.length}):
          </h4>
          
          <div className={`
            grid gap-4
            ${multiple 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
              : 'grid-cols-1 max-w-sm'
            }
          `}>
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt="Uploaded"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                >
                  <FiX className="text-sm" />
                </button>

                {/* Image info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="truncate font-medium">{image.format?.toUpperCase()}</p>
                  <p className="text-white/80">{image.width} × {image.height}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
