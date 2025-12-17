const express = require('express');
const router = express.Router();
const propertyController = require('./properties.controller');
const protect = require('../../middleware/auth.middleware');

// Public Route (The most generic GET - for viewing ALL public properties)
router.get('/', propertyController.getAllProperties); 

// Protected Routes (Specific, named routes go here)
router.get('/my-properties', protect, propertyController.getMyProperties); 
router.post('/', protect, propertyController.createProperty);
router.put('/:id', protect, propertyController.updateProperty); // Needs protect middleware
router.delete('/:id', protect, propertyController.deleteProperty); // Needs protect middleware

// Public Route (The generic dynamic route - MUST be last)
// ✅ NEW LINE ADDED: Route to log a property view
router.post('/:id/view', propertyController.logPropertyView);
// ✅ Generic route for a single property by ID
router.get('/:id', propertyController.getPropertyById); 


module.exports = router;