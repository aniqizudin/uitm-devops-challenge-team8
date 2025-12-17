const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import middleware
const protect = require('../../middleware/auth.middleware');

// Import controllers
const agreementController = require('./agreement.controller');

// --- ROUTES ---

// Get all agreements (existing)
// router.get('/', protect, agreementController.getAllAgreements);

// Get pending landlord signatures (NEW ENDPOINT)
router.get('/pending-landlord-signatures', protect, async (req, res) => {
  try {
    // Get current user
    const currentUserId = req.user.id;
    
    // Find all agreements where:
    // 1. Either tenant OR landlord signature is missing (pending)
    // 2. This shows all agreements that need signatures
    const agreements = await prisma.rentalAgreement.findMany({
      where: {
        OR: [
          {
            AND: [
              {
                tenantSignature: {
                  not: null // Tenant has signed
                }
              },
              {
                landlordSignature: null // Landlord hasn't signed yet
              }
            ]
          },
          {
            AND: [
              {
                tenantSignature: null // Tenant hasn't signed yet
              },
              {
                landlordSignature: {
                  not: null // Landlord has signed
                }
              }
            ]
          }
        ]
      },
      include: {
        lease: {
          include: {
            property: {
              select: {
                title: true,
                address: true,
                city: true
              }
            },
            tenant: {
              select: {
                name: true,
                email: true
              }
            },
            landlord: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    });

    // Transform data for frontend
    const formattedAgreements = agreements.map(agreement => ({
      id: agreement.id,
      leaseId: agreement.leaseId,
      status: agreement.status,
      pdfUrl: agreement.pdfUrl,
      tenantSignature: agreement.tenantSignature,
      tenantSignedAt: agreement.tenantSignedAt,
      landlordSignature: agreement.landlordSignature,
      landlordSignedAt: agreement.landlordSignedAt,
      createdAt: agreement.createdAt,
      property: agreement.lease.property,
      tenant: agreement.lease.tenant,
      landlord: agreement.lease.landlord
    }));

    res.json({
      success: true,
      message: 'Pending landlord signatures retrieved successfully',
      data: formattedAgreements
    });

  } catch (error) {
    console.error('Error fetching pending landlord signatures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending landlord signatures',
      error: error.message
    });
  }
});

// Get signature status for specific lease (existing)
router.get('/signature-status/:leaseId', protect, agreementController.getSignatureStatus);

// Get signature QR code (existing)
router.get('/signature-qr/:leaseId', protect, agreementController.getSignatureQRCode);

// Sign agreement (existing)
router.post('/sign', protect, agreementController.signAgreement);

// Download agreement (existing)
// router.get('/download/:leaseId', protect, agreementController.downloadAgreement);

module.exports = router;