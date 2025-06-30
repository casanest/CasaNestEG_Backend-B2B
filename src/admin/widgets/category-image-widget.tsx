// File: src/admin/widgets/category-image-widget.tsx
// Category image upload widget for Medusa v2.6 - Aligned with Medusa React patterns

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, toast } from "@medusajs/ui"
import { Trash, Upload, Image as ImageIcon, AlertCircle } from "lucide-react"
import { useRef, useState, useCallback } from "react"
import React from "react"
import { 
  DetailWidgetProps, 
  AdminProductCategory,
} from "@medusajs/framework/types"

// Types for API responses
interface UploadResponse {
  uploads: Array<{
    url?: string;
    key?: string;
  }>;
}

interface CategoryUpdateResponse {
  product_category: AdminProductCategory;
}

// The widget component
const CategoryImageWidget = ({ 
  data,
}: DetailWidgetProps<AdminProductCategory>) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Get initial image URL from metadata with better type checking
  const getInitialImageUrl = useCallback(() => {
    if (!data.metadata) return null
    
    const metadata = data.metadata as Record<string, any>
    const imageUrl = metadata.image_url
    
    if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      console.log('Found existing image URL in metadata:', imageUrl)
      return imageUrl
    }
    
    return null
  }, [data.metadata])
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(getInitialImageUrl)
  
  // Update preview URL when data changes (e.g., after category refresh)
  React.useEffect(() => {
    const newImageUrl = getInitialImageUrl()
    if (newImageUrl !== previewUrl) {
      console.log('Updating preview URL from metadata:', newImageUrl)
      setPreviewUrl(newImageUrl)
    }
  }, [data.metadata, getInitialImageUrl, previewUrl])

  // Upload file using admin API (following Medusa patterns)
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('files', file)
    
    try {
      const response = await fetch('/admin/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed response:', errorText)
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      // Comprehensive debug logging
      console.log('=== UPLOAD DEBUG INFO ===')
      console.log('Full response:', JSON.stringify(result, null, 2))
      console.log('Response type:', typeof result)
      console.log('Response keys:', Object.keys(result))
      
      // Check if response has uploads array
      if (result.uploads) {
        console.log('Uploads array:', result.uploads)
        console.log('Uploads array length:', result.uploads.length)
        if (result.uploads.length > 0) {
          console.log('First upload item:', JSON.stringify(result.uploads[0], null, 2))
          console.log('First upload item keys:', Object.keys(result.uploads[0]))
        }
      }
      
      // Check for other possible array names
      const possibleArrayNames = ['files', 'data', 'results', 'items', 'upload']
      for (const arrayName of possibleArrayNames) {
        if (result[arrayName] && Array.isArray(result[arrayName])) {
          console.log(`Found array named '${arrayName}':`, result[arrayName])
        }
      }
      
      console.log('=== END DEBUG INFO ===')
      
      // Try to find the uploaded file data
      let uploadedFiles: any[] = []
      
      if (result.uploads && Array.isArray(result.uploads)) {
        uploadedFiles = result.uploads
      } else if (result.files && Array.isArray(result.files)) {
        uploadedFiles = result.files
      } else if (result.data && Array.isArray(result.data)) {
        uploadedFiles = result.data
      } else if (Array.isArray(result)) {
        uploadedFiles = result
      } else {
        // If it's a single object, treat it as the uploaded file
        uploadedFiles = [result]
      }
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        console.error('No uploaded files found in response')
        throw new Error('No file was uploaded successfully - check console for response structure')
      }

      const uploadedFile = uploadedFiles[0]
      console.log('Using uploaded file:', uploadedFile)
      
      // Try different possible URL fields
      let imageUrl: string | undefined
      
      const possibleUrlFields = [
        'url', 'URL', 'file_url', 'fileUrl', 'src', 'href', 'link',
        'key', 'path', 'file_path', 'filePath', 'location', 'uri',
        'public_url', 'publicUrl', 'download_url', 'downloadUrl'
      ]
      
      for (const field of possibleUrlFields) {
        if (uploadedFile[field]) {
          console.log(`Found URL in field '${field}':`, uploadedFile[field])
          imageUrl = uploadedFile[field]
          break
        }
      }
      
      if (!imageUrl) {
        console.error('No URL field found in uploaded file object:', uploadedFile)
        console.error('Available fields:', Object.keys(uploadedFile))
        throw new Error(`Upload response missing URL field. Available fields: ${Object.keys(uploadedFile).join(', ')}`)
      }
      
      // Ensure URL is properly formatted
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/uploads/${imageUrl}`
      }

      console.log('Final image URL:', imageUrl)
      return imageUrl
      
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }, [])

  // Update category using admin API (following Medusa patterns)
  const updateCategoryMetadata = useCallback(async (categoryId: string, metadata: Record<string, any>) => {
    try {
      console.log('Updating category metadata:', { categoryId, metadata })
      
      const response = await fetch(`/admin/product-categories/${categoryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update failed response:', errorText)
        throw new Error(`Update failed: ${response.status} ${response.statusText}`)
      }

      const result: CategoryUpdateResponse = await response.json()
      console.log('Category updated successfully:', result.product_category)
      
      // Update the local data reference to reflect the new metadata
      // This ensures the UI shows the updated data immediately
      if (result.product_category) {
        Object.assign(data, result.product_category)
      }
      
      return result.product_category
    } catch (error) {
      console.error('Update error:', error)
      throw error
    }
  }, [data])

  // Show error notification
  const showError = useCallback((message: string) => {
    toast.error("Error", {
      description: message,
      duration: 5000,
    })
  }, [])

  // Show success notification
  const showSuccess = useCallback((message: string) => {
    toast.success("Success", {
      description: message,
      duration: 3000,
    })
  }, [])

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return 'Please select a valid image file (JPG, PNG, GIF, WebP)'
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    // Check file name length and characters
    if (file.name.length > 255) {
      return 'File name is too long'
    }
    
    // Check for problematic characters
    const problematicChars = /[<>:"/\\|?*\x00-\x1f]/
    if (problematicChars.test(file.name)) {
      return 'File name contains invalid characters'
    }

    return null
  }

  // Handle file selection and upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      showError(validationError)
      return
    }

    setIsUploading(true)
    let previewObjectUrl: string | null = null

    try {
      // Create preview immediately for better UX
      previewObjectUrl = URL.createObjectURL(file)
      setPreviewUrl(previewObjectUrl)

      // Upload file using admin API
      const imageUrl = await uploadFile(file)
      
      // Update category metadata with image URL
      const updatedMetadata = {
        ...(data.metadata || {}),
        image_url: imageUrl,
        image_alt: `${data.name} category image`,
        image_file_name: file.name,
        image_file_size: file.size,
        image_file_type: file.type,
        image_uploaded_at: new Date().toISOString()
      }
      
      console.log('Saving metadata:', updatedMetadata)
      const updatedCategory = await updateCategoryMetadata(data.id, updatedMetadata)

      // Clean up preview URL and set the real URL
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl)
        previewObjectUrl = null
      }
      
      // Ensure we use the URL from the updated category metadata
      const finalImageUrl = (updatedCategory.metadata?.image_url as string) || imageUrl
      console.log('Setting final preview URL:', finalImageUrl)
      setPreviewUrl(finalImageUrl)
      showSuccess('Category image uploaded successfully')
      
    } catch (error) {
      console.error('Upload error:', error)
      
      // Clean up preview URL on error
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl)
      }
      
      // Revert preview on error
      setPreviewUrl((data.metadata?.image_url as string) || null)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to upload image. Please try again.'
      showError(errorMessage)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle image removal
  const handleRemoveImage = async () => {
    if (!previewUrl) return

    // Confirm removal
    if (!window.confirm('Are you sure you want to remove this image?')) {
      return
    }

    setIsUploading(true)

    try {
      // Update category metadata to remove image
      const updatedMetadata = {
        ...(data.metadata || {}),
        image_url: null,
        image_alt: null,
        image_file_name: null,
        image_file_size: null,
        image_file_type: null,
        image_removed_at: new Date().toISOString()
      }
      
      await updateCategoryMetadata(data.id, updatedMetadata)

      setPreviewUrl(null)
      showSuccess('Category image removed successfully')
      
    } catch (error) {
      console.error('Remove image error:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to remove image. Please try again.'
      showError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  // Trigger file input click
  const triggerFileSelect = () => {
    if (isUploading) return
    fileInputRef.current?.click()
  }

  // Get file size display
  const getFileSizeDisplay = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  // Handle image load error
  const handleImageError = () => {
    console.error('Image load error')
    showError('Failed to load image')
    setPreviewUrl(null)
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Category Image</Heading>
        {previewUrl && (
          <Button
            variant="secondary"
            size="small"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
      
      {/* Content */}
      <div className="px-6 py-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {/* Image preview or upload area */}
        <div className="mb-4">
          {previewUrl ? (
            <div className="relative group">
              <img
                src={previewUrl}
                alt={(data.metadata?.image_alt as string) || data.name || 'Category image'}
                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 transition-all duration-200"
                onError={handleImageError}
                loading="lazy"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center text-white">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-sm">
                      {isUploading ? 'Uploading...' : 'Updating...'}
                    </span>
                  </div>
                </div>
              )}
              {/* Hover overlay for changing image */}
              {!isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer"
                     onClick={triggerFileSelect}>
                  <div className="opacity-0 group-hover:opacity-100 text-white text-center transition-opacity duration-200">
                    <Upload className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-sm">Change Image</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center transition-colors ${
                isUploading 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:border-gray-400 hover:bg-gray-50'
              }`}
              onClick={triggerFileSelect}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 text-center">
                Click to upload category image
                <br />
                <span className="text-xs text-gray-400">
                  Supports: JPG, PNG, GIF, WebP (max 5MB)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {previewUrl ? (
            <Button
              variant="secondary"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Change Image
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          )}
        </div>

        {/* Image information */}
        {previewUrl && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <code className="text-xs text-gray-600 break-all block p-2 bg-white rounded border">
                  {previewUrl}
                </code>
              </div>
              
              {typeof data.metadata === "object" && data.metadata !== null && typeof (data.metadata as any).image_file_name === 'string' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    File Name
                  </label>
                  <span className="text-xs text-gray-600">
                    {(data.metadata as any).image_file_name}
                  </span>
                </div>
              )}
              
              {typeof data.metadata === "object" && data.metadata !== null && typeof (data.metadata as any).image_file_size === 'number' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    File Size
                  </label>
                  <span className="text-xs text-gray-600">
                    {getFileSizeDisplay((data.metadata as any).image_file_size)}
                  </span>
                </div>
              )}
              
              {typeof data.metadata === "object" && data.metadata !== null && typeof (data.metadata as any).image_file_type === 'string' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <span className="text-xs text-gray-600">
                    {(data.metadata as any).image_file_type}
                  </span>
                </div>
              )}
              
              {typeof data.metadata === "object" && data.metadata !== null && typeof (data.metadata as any).image_uploaded_at === 'string' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Uploaded At
                  </label>
                  <span className="text-xs text-gray-600">
                    {new Date((data.metadata as any).image_uploaded_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata storage info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Metadata Storage</p>
              <ul className="space-y-1 text-blue-600">
                <li>• <code>image_url</code> - Image URL</li>
                <li>• <code>image_alt</code> - Alt text for accessibility</li>
                <li>• <code>image_file_name</code> - Original file name</li>
                <li>• <code>image_file_size</code> - File size in bytes</li>
                <li>• <code>image_file_type</code> - MIME type</li>
                <li>• <code>image_uploaded_at</code> - Upload timestamp</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryImageWidget