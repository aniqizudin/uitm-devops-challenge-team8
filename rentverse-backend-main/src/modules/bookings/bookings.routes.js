const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../../middleware/auth');
const bookingsController = require('./bookings.controller');

const router = express.Router(); 

// --- PUBLIC ROUTES ---
router.get(
  '/property/:propertyId/booked-periods',
  bookingsController.getPropertyBookedPeriods
);

// --- PROTECTED ROUTES ---
router.post(
  '/',
  auth,
  authorize('USER', 'ADMIN'),
  [
    body('propertyId').isUUID().withMessage('Valid property ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('rentAmount')
      .isFloat({ min: 0 })
      .withMessage('Valid rent amount is required'),
    body('securityDeposit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Security deposit must be positive'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
  ],
  bookingsController.createBooking
);

router.get('/my-bookings', auth, bookingsController.getUserBookings);

router.get('/owner-bookings', auth, bookingsController.getOwnerBookings);

// General bookings endpoint - automatically routes based on user role
router.get('/', auth, bookingsController.getUserBookings);


// --- DYNAMIC ROUTES ---
router.get('/:id', auth, bookingsController.getBookingById);

// Approve/Reject routes (Fixed to PUT)
router.put('/:id/approve', auth, bookingsController.approveBooking);
router.put('/:id/reject', auth, bookingsController.rejectBooking);

router.get(
  '/:id/rental-agreement',
  auth,
  bookingsController.getRentalAgreementPDF
);

router.get(
  '/:id/rental-agreement/download',
  auth,
  bookingsController.downloadRentalAgreementPDF
);

module.exports = router;