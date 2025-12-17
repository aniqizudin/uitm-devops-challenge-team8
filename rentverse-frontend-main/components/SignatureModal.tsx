import React, { useState } from 'react';
import { X, PenTool, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaseId: string;
  onSignatureComplete: (signatureData: any) => void;
  userRole: 'tenant' | 'landlord';
  userName: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  leaseId,
  onSignatureComplete,
  userRole,
  userName
}: SignatureModalProps) {
  const [signatureText, setSignatureText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signatureText.trim()) {
      alert('Please provide your signature');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:8000/api/agreements/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leaseId,
          signatureText: signatureText.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to sign agreement');
      }

      const result = await response.json();
      
      onSignatureComplete({
        signatureData: result,
        signatureText: signatureText.trim(),
        userRole,
        signedAt: new Date()
      });

      onClose();
      alert('Agreement signed successfully!');
      
    } catch (error) {
      console.error('Signature error:', error);
      alert('Failed to sign agreement: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignatureText(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <PenTool size={20} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sign Agreement</h2>
              <p className="text-sm text-slate-500">
                {userRole === 'tenant' ? 'Tenant' : 'Landlord'} Signature Required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-2">Agreement Details</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="font-medium">Agreement ID:</span> {leaseId}</p>
              <p><span className="font-medium">Signing as:</span> {userRole}</p>
              <p><span className="font-medium">Signer:</span> {userName}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="signature" className="block text-sm font-medium text-slate-700">
              Digital Signature
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
              <div className="text-center">
                <PenTool size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-3">
                  Enter your full name as your digital signature
                </p>
                <input
                  id="signature"
                  type="text"
                  value={signatureText}
                  onChange={handleInputChange}
                  placeholder={`Type your full name: ${userName}`}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center font-medium"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              By typing your name above, you are electronically signing this rental agreement. 
              This provides legal consent and non-repudiation as required for secure transactions.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Check size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Legal Agreement</p>
                <p>
                  Your signature confirms that you have read, understood, and agree to all terms 
                  and conditions outlined in this rental agreement.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !signatureText.trim()}
              className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing...</span>
                </>
              ) : (
                <>
                  <PenTool size={16} />
                  <span>Sign & Accept</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}