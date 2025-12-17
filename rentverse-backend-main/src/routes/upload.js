const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');
const uploadController = require('../utils/uploadController');

const router = express.Router();

router.post('/single', auth, uploadSingle('file'), uploadController.uploadSingle);
router.post('/multiple', auth, uploadMultiple('files', 10), uploadController.uploadMultiple);
router.post('/property-images', auth, authorize('USER', 'ADMIN'), uploadMultiple('files', 10), uploadController.uploadPropertyImages);
router.post('/avatar', auth, uploadSingle('file'), uploadController.uploadAvatar);
router.delete('/delete/:publicId', auth, uploadController.deleteFile);
router.delete('/delete-multiple', auth, uploadController.deleteMultipleFiles);
router.get('/video-thumbnail/:publicId', auth, uploadController.getVideoThumbnail);

router.use(handleUploadError);
module.exports = router;