'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import { FileText, Clock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import useCurrentUser from '@/hooks/useCurrentUser'

interface Agreement {
  id: string
  leaseId: string
  status: string
  createdAt: string
  landlordId?: string
  tenantId?: string
  property?: {
    title: string
    address: string
    city: string
  }
  tenant?: {
    name: string
    email: string
  }
  landlord?: {
    name: string
    email: string
  }
  agreement?: {
    id: string
    tenantSignature?: string
    tenantSignedAt?: string
    landlordSignature?: string
    landlordSignedAt?: string
    status: string
  }
}

function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const router = useRouter()
  const { user, isAuthenticated } = useCurrentUser()

  // Determine if current user is landlord or tenant for each agreement
  const getUserRole = (agreement: Agreement): 'landlord' | 'tenant' => {
    if (!user || !agreement) return 'tenant'
    // Check if current user is the landlord or tenant of this agreement
    return agreement.landlordId === user.id ? 'landlord' : 'tenant'
  }

  useEffect(() => {
    fetchAgreements()
    // Refresh data every 30 seconds to get latest signature status
    const interval = setInterval(fetchAgreements, 30000)
    return () => clearInterval(interval)
  }, [])

  const refreshData = () => {
    fetchAgreements()
  }

  const fetchAgreements = async () => {
    try {
      setIsLoading(true)
      
      // Fetch tenant's bookings (this includes signature status)
      const bookingsResponse = await fetch('http://localhost:8000/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        console.log('Tenant bookings response:', bookingsData) // Debug log
        
        // Handle different response formats safely
        let tenantAgreements: any[] = []
        if (bookingsData) {
          if (Array.isArray(bookingsData)) {
            tenantAgreements = bookingsData
          } else if (bookingsData.data && Array.isArray(bookingsData.data)) {
            tenantAgreements = bookingsData.data
          } else if (bookingsData.data && Array.isArray(bookingsData.data.bookings)) {
            tenantAgreements = bookingsData.data.bookings
          }
        }
        
        // Process agreements data for display
        setAgreements(tenantAgreements)
        
        // Calculate pending signatures for current user based on their role
        try {
          let userPendingCount = 0
          
          // Count agreements where current user still needs to sign
          tenantAgreements.forEach((agreement: any) => {
            const userRole = getUserRole(agreement)
            
            if (userRole === 'tenant') {
              // For tenant: check if tenant hasn't signed
              if (!agreement.agreement?.tenantSignature) {
                userPendingCount++
              }
            } else if (userRole === 'landlord') {
              // For landlord: check if landlord hasn't signed
              if (!agreement.agreement?.landlordSignature) {
                userPendingCount++
              }
            }
          })
          
          setPendingCount(userPendingCount)
        } catch (error) {
          console.log('Could not calculate pending count:', error)
          setPendingCount(0)
        }
      } else {
        console.error('Failed to fetch tenant bookings:', bookingsResponse.status)
        // Set empty arrays on error
        setAgreements([])
        setPendingCount(0)
      }
    } catch (error) {
      console.error('Error fetching agreements:', error)
      // Set empty arrays on error
      setAgreements([])
      setPendingCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string, type: 'landlord' | 'tenant') => {
    const isSigned = status === 'SIGNED'
    
    if (isSigned) {
      return <CheckCircle className="text-green-600" size={18} />
    } else {
      return type === 'landlord' ? 
        <AlertTriangle className="text-orange-600" size={18} /> : 
        <Clock className="text-slate-400" size={18} />
    }
  }

  const getStatusText = (status: string, type: 'landlord' | 'tenant') => {
    if (status === 'SIGNED') {
      if (type === 'landlord') {
        return 'Signed by Landlord'
      } else {
        return 'Signed by Tenant'
      }
    } else if (status === 'PENDING') {
      // Always specify WHO needs to sign, never say "Your Signature" for other party
      if (type === 'landlord') {
        return 'Pending Landlord Signature'
      } else {
        return 'Pending Tenant Signature'
      }
    } else {
      return status || 'Unknown'
    }
  }

  const getStatusColor = (status: string, type: 'landlord' | 'tenant') => {
    if (status === 'SIGNED') {
      return 'text-green-600 bg-green-50'
    } else if (status === 'PENDING' && type === 'landlord') {
      return 'text-orange-600 bg-orange-50'
    } else {
      return 'text-slate-600 bg-slate-50'
    }
  }

  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="text-center py-20 text-slate-600">
          Loading your agreements...
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-slate-900 mb-2">
          My Agreements
        </h1>
        <p className="text-slate-600">
          Manage your rental agreements and digital signatures
        </p>
      </div>

      {/* 🚨 PENDING SIGNATURES ALERT 🚨 */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl border-2 border-orange-600 mb-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              ✍️ PENDING SIGNATURES REQUIRED
            </h2>
            <p className="text-orange-100 mb-4">
              You have {pendingCount} agreement{pendingCount !== 1 ? 's' : ''} waiting for your signature
            </p>
            <button
              onClick={() => {
                const element = document.getElementById('agreements-list');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 rounded-lg font-bold text-lg hover:bg-orange-50 transition-colors shadow-lg"
            >
              <FileText className="mr-2" size={20} />
              View Your Agreements
            </button>
          </div>
        </div>
      )}

      {/* Agreements List */}
      {!agreements || agreements.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="mx-auto text-slate-300 mb-4" size={64} />
          <h2 className="text-2xl font-serif text-slate-900 mb-4">
            No agreements found
          </h2>
          <p className="text-slate-600 mb-6">
            You don't have any rental agreements yet.
          </p>
          <Link href="/property">
            <button className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors">
              Browse Properties
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6" id="agreements-list">
          {agreements.map((agreement, index) => (
            <div key={agreement.id || `agreement-${index}`} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {agreement.property?.title || 'Property Agreement'}
                    </h3>
                    <p className="text-slate-600 mb-1">
                      {agreement.property?.address}, {agreement.property?.city}
                    </p>
                    {agreement.tenant && (
                      <p className="text-sm text-slate-500">
                        Tenant: {agreement.tenant.name} ({agreement.tenant.email})
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      agreement.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      agreement.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {agreement.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Signature Status */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Your Signature ({getUserRole(agreement) === 'landlord' ? 'Landlord' : 'Tenant'})
                      </span>
                      {getStatusIcon(
                        getUserRole(agreement) === 'landlord' 
                          ? ((agreement.agreement?.landlordSignature ? 'SIGNED' : 'PENDING'))
                          : ((agreement.agreement?.tenantSignature ? 'SIGNED' : 'PENDING')),
                        getUserRole(agreement)
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${getStatusColor(
                      getUserRole(agreement) === 'landlord' 
                        ? ((agreement.agreement?.landlordSignature ? 'SIGNED' : 'PENDING'))
                        : ((agreement.agreement?.tenantSignature ? 'SIGNED' : 'PENDING')),
                      getUserRole(agreement)
                    )}`}>
                      {getStatusText(
                        getUserRole(agreement) === 'landlord' 
                          ? ((agreement.agreement?.landlordSignature ? 'SIGNED' : 'PENDING'))
                          : ((agreement.agreement?.tenantSignature ? 'SIGNED' : 'PENDING')),
                        getUserRole(agreement)
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {getUserRole(agreement) === 'landlord' ? 'Tenant Signature' : 'Landlord Signature'}
                      </span>
                      {getStatusIcon(
                        getUserRole(agreement) === 'landlord' 
                          ? ((agreement.agreement?.tenantSignature ? 'SIGNED' : 'PENDING'))
                          : ((agreement.agreement?.landlordSignature ? 'SIGNED' : 'PENDING')),
                        getUserRole(agreement) === 'landlord' ? 'tenant' : 'landlord'
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${getStatusColor(
                      getUserRole(agreement) === 'landlord' 
                        ? ((agreement.agreement?.tenantSignature ? 'SIGNED' : 'PENDING'))
                        : ((agreement.agreement?.landlordSignature ? 'SIGNED' : 'PENDING')),
                      getUserRole(agreement) === 'landlord' ? 'tenant' : 'landlord'
                    )}`}>
                      {getStatusText(
                        getUserRole(agreement) === 'landlord' 
                          ? ((agreement.agreement?.tenantSignature ? 'SIGNED' : 'PENDING'))
                          : ((agreement.agreement?.landlordSignature ? 'SIGNED' : 'PENDING')),
                        getUserRole(agreement) === 'landlord' ? 'tenant' : 'landlord'
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {agreement.leaseId && (
                    <Link
                      href={`/rents/${agreement.leaseId}`}
                      className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="mr-2" size={16} />
                      View Agreement
                    </Link>
                  )}
                  
                  {/* Show sign button based on user's role and signature status */}
                  {((getUserRole(agreement) === 'landlord' && !agreement.agreement?.landlordSignature) ||
                    (getUserRole(agreement) === 'tenant' && !agreement.agreement?.tenantSignature)) && agreement.leaseId && (
                    <button
                      onClick={() => window.open(`http://localhost:3000/rents/${agreement.leaseId}`, '_blank')}
                      className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      <FileText className="mr-2" size={16} />
                      Sign Now
                    </button>
                  )}
                  
                  {/* Refresh button */}
                  <button
                    onClick={refreshData}
                    className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    <Clock className="mr-2" size={16} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 bg-slate-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
          <button
            onClick={refreshData}
            className="flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            <Clock className="mr-2" size={16} />
            Refresh All
          </button>
        </div>
        <div className="flex gap-3">
          <Link href="/property/my-listings">
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm">
              My Listings
            </button>
          </Link>
          <Link href="/property/new">
            <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm">
              Add New Property
            </button>
          </Link>
        </div>
      </div>
    </ContentWrapper>
  )
}

export default AgreementsPage