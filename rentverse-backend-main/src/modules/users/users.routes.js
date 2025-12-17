const express = require('express');
const router = express.Router();
const usersController = require('./users.controller'); 
const { auth, authorize } = require('../../middleware/auth');

// --- USER PROFILE ROUTES ---

// Essential route for the Frontend to fetch user profile/role
router.get('/me', auth, usersController.getMe); 

router.get('/profile', auth, usersController.getProfile);

// --- TEMPORARILY COMMENTED OUT ROUTES (Keep these commented for now) ---

/*
router.patch('/profile', auth, userController.updateProfile);
router.patch('/change-password', auth, userController.changePassword);
router.delete('/account', auth, userController.deleteAccount);
router.get('/', auth, authorize('ADMIN'), userController.getAllUsers);
router.get('/:id', auth, authorize('ADMIN'), userController.getUserById);
router.patch('/:id/role', auth, authorize('ADMIN'), userController.updateUserRole);
router.delete('/:id', auth, authorize('ADMIN'), userController.deleteUser);
*/

module.exports = router;