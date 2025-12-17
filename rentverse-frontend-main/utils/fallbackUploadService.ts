/**
 * Fallback Upload Service - Alternative when Cloudinary fails
 * 
 * This provides a local fallback upload service that stores images
 * in the backend when Cloudinary upload fails.
 */

interface FallbackUploadResult {
  success: boolean
  url: string
  message: string
  publicId?: string
}

export async function uploadToBackend(file: File): Promise<FallbackUploadResult> {
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', 'property')
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }
    
    const result = await response.json()
    
    return {
      success: true,
      url: result.url || result.imageUrl,
      message: 'Upload successful',
      publicId: result.publicId
    }
  } catch (error) {
    console.error('Backend upload failed:', error)
    return {
      success: false,
      url: '',
      message: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

export async function uploadImagesWithFallback(
  files: File[],
  onProgress?: (progress: any[]) => void
): Promise<any> {
  const results = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      // Try Cloudinary first
      const { uploadSingleImageToCloudinary } = await import('./uploadService')
      const result = await uploadSingleImageToCloudinary(file)
      
      results.push({
        success: true,
        message: 'Cloudinary upload successful',
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format
        }
      })
    } catch (cloudinaryError) {
      console.warn(`Cloudinary failed for ${file.name}, trying backend fallback:`, cloudinaryError)
      
      // Fallback to backend upload
      const backendResult = await uploadToBackend(file)
      
      if (backendResult.success) {
        results.push({
          success: true,
          message: 'Backend upload successful',
          data: {
            publicId: backendResult.publicId || `local-${Date.now()}`,
            url: backendResult.url,
            width: 0,
            height: 0,
            format: file.type.split('/')[1]
          }
        })
      } else {
        results.push({
          success: false,
          message: `Both Cloudinary and backend upload failed. Cloudinary: ${cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error'}. Backend: ${backendResult.message}`,
          data: {}
        })
      }
    }
  }
  
  return {
    success: results.some(r => r.success),
    message: results.length === 1 ? results[0].message : `${results.filter(r => r.success).length} of ${results.length} uploads successful`,
    data: results.filter(r => r.success).map(r => r.data)
  }
}