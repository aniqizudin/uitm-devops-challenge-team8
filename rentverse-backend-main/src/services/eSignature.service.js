const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Enhanced service to generate QR code and handle signature validation
async function getSignatureQRCode(userData) {
  try {
    // Create enhanced signature data string
    const signatureData = {
      name: userData.name,
      timestamp: userData.timestamp || new Date().toISOString(),
      leaseId: userData.leaseId,
      role: userData.role,
      signatureId: `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: userData.userId,
      ipAddress: userData.ipAddress || 'unknown',
      userAgent: userData.userAgent || 'unknown'
    };

    const dataString = JSON.stringify(signatureData);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error.message);
    
    // Fallback: Return a simple placeholder QR code
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }
}

// Enhanced signature validation and storage
async function storeSignature(leaseId, userId, signatureText, role, request) {
  try {
    const clientIP = request.ip || request.connection.remoteAddress || request.socket.remoteAddress || 'unknown';
    const userAgent = request.get('User-Agent') || 'unknown';
    
    // Find the rental agreement
    const agreement = await prisma.rentalAgreement.findUnique({
      where: { leaseId: leaseId },
      include: { lease: true } 
    });

    if (!agreement) {
      throw new Error('Agreement not found');
    }

    // Access Permission Check (Security First!)
    const isTenant = agreement.lease.tenantId === userId;
    const isLandlord = agreement.lease.landlordId === userId;

    if (!isTenant && !isLandlord) {
      throw new Error('Unauthorized: You are not a party to this agreement.');
    }

    // Workflow Validation
    if (agreement.status === 'CANCELLED' || agreement.status === 'COMPLETED') {
      throw new Error('Cannot sign: Agreement is already finalized.');
    }

    // Apply Signature Logic with enhanced data
    const updateData = {
      // Note: signatureText, signedAt, ipAddress, userAgent, signatureId are stored in role-specific fields
    };

    let newStatus = agreement.status;

    if (isTenant) {
      if (agreement.tenantSignature) {
        throw new Error('You have already signed this agreement.');
      }
      updateData.tenantSignature = signatureText;
      updateData.tenantSignedAt = new Date();
      updateData.tenantIpAddress = clientIP;
      updateData.tenantUserAgent = userAgent;
      
      // Update Status: If landlord already signed, it's now Complete.
      newStatus = agreement.landlordSignature ? 'COMPLETED' : 'SIGNED_BY_TENANT';
    } 
    
    if (isLandlord) {
      if (agreement.landlordSignature) {
        throw new Error('You have already signed this agreement.');
      }
      updateData.landlordSignature = signatureText;
      updateData.landlordSignedAt = new Date();
      updateData.landlordIpAddress = clientIP;
      updateData.landlordUserAgent = userAgent;
      
      // Update Status: If tenant already signed, it's now Complete.
      newStatus = agreement.tenantSignature ? 'COMPLETED' : newStatus;
    }

    updateData.status = newStatus;

    // Save to Database
    const updatedAgreement = await prisma.rentalAgreement.update({
      where: { id: agreement.id },
      data: updateData
    });

    return {
      success: true,
      status: newStatus,
      agreement: updatedAgreement,
      signatureDetails: {
        signedAt: new Date(),
        ipAddress: clientIP,
        userAgent: userAgent,
        signatureId: `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    };

  } catch (error) {
    console.error('Signature storage error:', error);
    throw error;
  }
}

// Check if user has signed agreement
async function hasUserSigned(leaseId, userId) {
  try {
    const agreement = await prisma.rentalAgreement.findUnique({
      where: { leaseId: leaseId },
      include: { lease: true } 
    });

    if (!agreement) {
      return { hasSigned: false, reason: 'Agreement not found' };
    }

    const isTenant = agreement.lease.tenantId === userId;
    const isLandlord = agreement.lease.landlordId === userId;

    if (!isTenant && !isLandlord) {
      return { hasSigned: false, reason: 'Not authorized to access this agreement' };
    }

    if (isTenant) {
      return { 
        hasSigned: !!agreement.tenantSignature, 
        signedAt: agreement.tenantSignedAt,
        role: 'tenant'
      };
    }

    if (isLandlord) {
      return { 
        hasSigned: !!agreement.landlordSignature, 
        signedAt: agreement.landlordSignedAt,
        role: 'landlord'
      };
    }

    return { hasSigned: false, reason: 'Unknown role' };
  } catch (error) {
    console.error('Signature check error:', error);
    return { hasSigned: false, reason: 'Error checking signature status' };
  }
}

// Check if both parties have signed (required for download)
async function isAgreementFullySigned(leaseId) {
  try {
    const agreement = await prisma.rentalAgreement.findUnique({
      where: { leaseId: leaseId }
    });

    if (!agreement) {
      return { isFullySigned: false, reason: 'Agreement not found' };
    }

    const bothSigned = !!(agreement.tenantSignature && agreement.landlordSignature);
    
    return {
      isFullySigned: bothSigned,
      tenantSigned: !!agreement.tenantSignature,
      landlordSigned: !!agreement.landlordSignature,
      tenantSignedAt: agreement.tenantSignedAt,
      landlordSignedAt: agreement.landlordSignedAt,
      status: agreement.status
    };
  } catch (error) {
    console.error('Full signature check error:', error);
    return { isFullySigned: false, reason: 'Error checking signature status' };
  }
}

module.exports = { 
  getSignatureQRCode, 
  storeSignature, 
  hasUserSigned, 
  isAgreementFullySigned 
};
