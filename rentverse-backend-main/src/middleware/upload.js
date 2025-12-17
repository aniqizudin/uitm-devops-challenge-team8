const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// 1. Use Memory Storage (Keeps file in RAM to prevent crashing)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 2. Helper: Upload the file buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'rentverse_properties',
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// 3. Custom Middleware to Handle the Upload
const uploadSingle = (fieldName = 'file') => {
  return async (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next(); // No file? Skip.

      try {
        // Manually upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);
        
        // Trick the rest of the app into thinking it was a normal upload
        req.file.path = result.secure_url; 
        req.file.filename = result.public_id;

        next();
      } catch (uploadError) {
        console.error("Cloudinary Upload Failed:", uploadError);
        return res.status(500).json({ success: false, message: "Image upload failed." });
      }
    });
  };
};

// Simple wrappers for other modes
const uploadMultiple = (fieldName, maxCount) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

const handleUploadError = (error, req, res, next) => {
  res.status(500).json({ success: false, message: error.message });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
};