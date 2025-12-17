import React, { useState, useEffect } from 'react';
import { Check, X, Clock, PenTool, AlertCircle } from 'lucide-react';
import SignatureModal from './SignatureModal';

interface SignatureStatusProps {
  bookingId: string;
  userRole: 'tenant' | 'landlord';
  userName: string;
  onSignatureUpdate?: () => void;
}

interface SignatureData {
  userSignature: {
    hasSigned: boolean;
    signedAt?: string;
    role?: string;
  };
  agreementStatus: {
    isFullySigned: boolean;
    tenantSigned: boolean;
    landlordSigned: boolean;
    tenantSignedAt?: string;
    landlordSignedAt?: string;
    status: string;
  };
}

export default function SignatureStatus({
  bookingId,
  userRole,
  userName,
  onSignatureUpdate
}: SignatureStatusProps) {
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignatureStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:8000/api/agreements/signature-status/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch signature status');
      }

      const result = await response.json();
      setSignatureData(result.data);
    } catch (error) {
      console.error('Error fetching signature status:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignatureStatus();
  }, [bookingId]);

  const handleSignatureComplete = async () => {
    await fetchSignatureStatus();
    if (onSignatureUpdate) {
      onSignatureUpdate();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-slate-200 rounded-lg animate-pulse">
            <PenTool size={20} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Signature Status</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Signature Status</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchSignatureStatus}
              className="text-sm text-red-600 hover:text-red-800 underline mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!signatureData) {
    return null;
  }

  const { userSignature, agreementStatus } = signatureData;
  const isUserSigned = userSignature.hasSigned;
  const isFullySigned = agreementStatus.isFullySigned;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isFullySigned ? 'bg-green-100' : 'bg-slate-100'}`}>
              <PenTool size={20} className={isFullySigned ? 'text-green-600' : 'text-slate-600'} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Signature Status</h3>
              <p className="text-sm text-slate-500">
                Digital signatures required for data integrity
              </p>
            </div>
          </div>
          
          {isFullySigned && (
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <Check size={16} />
              <span>Fully Signed</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* User's Signature Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isUserSigned ? 'bg-green-100' : 'bg-orange-100'}`}>
                {isUserSigned ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Clock size={16} className="text-orange-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  Your Signature ({userRole === 'tenant' ? 'Tenant' : 'Landlord'})
                </p>
                <p className="text-sm text-slate-600">
                  {isUserSigned ? 'Signed' : 'Pending signature'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isUserSigned && userSignature.signedAt && (
                <p className="text-sm text-slate-600">
                  {formatDate(userSignature.signedAt)}
                </p>
              )}
              {!isUserSigned && (
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                >
                  Sign Now
                </button>
              )}
            </div>
          </div>

          {/* Other Party's Signature Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${userRole === 'tenant' ? (agreementStatus.landlordSigned ? 'bg-green-100' : 'bg-orange-100') : (agreementStatus.tenantSigned ? 'bg-green-100' : 'bg-orange-100')}`}>
                {userRole === 'tenant' ? (
                  agreementStatus.landlordSigned ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Clock size={16} className="text-orange-600" />
                  )
                ) : (
                  agreementStatus.tenantSigned ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Clock size={16} className="text-orange-600" />
                  )
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {userRole === 'tenant' ? 'Landlord' : 'Tenant'} Signature
                </p>
                <p className="text-sm text-slate-600">
                  {userRole === 'tenant' ? (
                    agreementStatus.landlordSigned ? 'Signed' : 'Pending signature'
                  ) : (
                    agreementStatus.tenantSigned ? 'Signed' : 'Pending signature'
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              {userRole === 'tenant' && agreementStatus.landlordSigned && agreementStatus.landlordSignedAt && (
                <p className="text-sm text-slate-600">
                  {formatDate(agreementStatus.landlordSignedAt)}
                </p>
              )}
              {userRole === 'landlord' && agreementStatus.tenantSigned && agreementStatus.tenantSignedAt && (
                <p className="text-sm text-slate-600">
                  {formatDate(agreementStatus.tenantSignedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Download Status */}
        <div className="mt-6 p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Agreement Download</p>
              <p className="text-sm text-slate-600">
                {isFullySigned 
                  ? 'Agreement is ready for download - both parties have signed'
                  : 'Download requires both parties to sign the agreement'
                }
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isFullySigned 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {isFullySigned ? 'Available' : 'Blocked'}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        leaseId={bookingId}
        onSignatureComplete={handleSignatureComplete}
        userRole={userRole}
        userName={userName}
      />
    </>
  );
}