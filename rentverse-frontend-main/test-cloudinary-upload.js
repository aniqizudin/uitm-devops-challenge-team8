/**
 * Test script to identify Cloudinary upload issues
 */

// Set up environment variables for testing
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'dqhuvu22u'
process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'ml_default'

const { uploadSingleImageToCloudinary, checkCloudinaryConfig } = require('./utils/uploadService')

// Create a simple test image file (1x1 pixel PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // Color type and CRC
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
  0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, // Image data
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, // More data and CRC
  0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
  0x44, 0xAE, 0x42, 0x60, 0x82                        // End of PNG
])

const testFile = new File([testImageBuffer], 'test.png', { type: 'image/png' })

async function testUpload() {
  console.log('=== Cloudinary Upload Test ===')
  
  // Check configuration
  console.log('\n1. Checking Cloudinary configuration...')
  const config = checkCloudinaryConfig()
  console.log('Config status:', config.configured)
  if (config.issues.length > 0) {
    console.log('Configuration issues:')
    config.issues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  // Test upload
  console.log('\n2. Testing upload...')
  try {
    console.log('Attempting to upload test image...')
    const result = await uploadSingleImageToCloudinary(testFile, (progress) => {
      console.log(`Upload progress: ${progress}%`)
    })
    
    console.log('\n✅ Upload successful!')
    console.log('Result:', {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height
    })
    
  } catch (error) {
    console.log('\n❌ Upload failed!')
    console.log('Error:', error.message)
    console.log('Stack:', error.stack)
  }
}

testUpload().then(() => {
  console.log('\n=== Test completed ===')
  process.exit(0)
}).catch(error => {
  console.error('Test error:', error)
  process.exit(1)
})