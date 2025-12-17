const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const eSignatureService = require('../../services/eSignature.service');

// --- MODULE 3: SIGN AGREEMENT ---
exports.signAgreement = async (req, res) => {
  try {
    const { leaseId, signature, signatureText } = req.body;
    const signatureTextToUse = signature || signatureText;
    const userId = req.user.id; // From the Token

    if (!signatureTextToUse || signatureTextToUse.trim().length === 0) {
      return res.status(400).json({ message: "Signature text is required" });
    }

    // Use the enhanced signature service
    const result = await eSignatureService.storeSignature(
      leaseId, 
      userId, 
      signatureTextToUse.trim(), 
      'agreement', 
      req
    );

    res.json({
      message: "Agreement signed successfully",
      status: result.status,
      agreement: result.agreement,
      signatureDetails: result.signatureDetails
    });

  } catch (error) {
    console.error(error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: "Agreement not found" });
    }
    
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    
    if (error.message.includes('already signed')) {
      return res.status(400).json({ message: error.message });
    }
    
    if (error.message.includes('finalized')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Server error signing agreement" });
  }
};

// NEW: Get signature status for a lease
exports.getSignatureStatus = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;

    // Check user's signature status
    const userSignature = await eSignatureService.hasUserSigned(leaseId, userId);
    
    // Check overall agreement signature status
    const agreementStatus = await eSignatureService.isAgreementFullySigned(leaseId);

    res.json({
      success: true,
      data: {
        userSignature,
        agreementStatus,
        leaseId
      }
    });

  } catch (error) {
    console.error('Get signature status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving signature status' 
    });
  }
};

// NEW: Get signature QR code for display
exports.getSignatureQRCode = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;

    // Find the user and lease info
    const agreement = await prisma.rentalAgreement.findUnique({
      where: { leaseId: leaseId },
      include: { 
        lease: {
          include: {
            tenant: true,
            landlord: true
          }
        }
      }
    });

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    // Check if user is a party to this agreement
    const isTenant = agreement.lease.tenantId === userId;
    const isLandlord = agreement.lease.landlordId === userId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ message: "Unauthorized: You are not a party to this agreement." });
    }

    // Determine user role and name
    const user = isTenant ? agreement.lease.tenant : agreement.lease.landlord;
    const role = isTenant ? 'tenant' : 'landlord';
    
    // Generate QR code
    const qrCodeDataUrl = await eSignatureService.getSignatureQRCode({
      name: user.name || `${user.firstName} ${user.lastName}`,
      timestamp: new Date().toISOString(),
      leaseId: leaseId,
      role: role,
      userId: userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        userInfo: {
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: role,
          email: user.email
        },
        agreementInfo: {
          leaseId: leaseId,
          status: agreement.status
        }
      }
    });

  } catch (error) {
    console.error('Get signature QR code error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating signature QR code' 
    });
  }
};