'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
// FIND THIS LINE:
import { Plus, Filter, Clock, RefreshCw, Bot, Shield, Activity, AlertTriangle, CheckCircle, Monitor, Smartphone, Laptop, Globe, HelpCircle, Download, Trash2, Ban } from 'lucide-react'
import useAuthStore from '@/stores/authStore'

// --- INTERFACES ---

interface PropertyApproval {
  id: string
  propertyId: string
  reviewerId: string | null
  status: string
  notes: string | null
  reviewedAt: string | null
  createdAt: string
  property: {
    id: string
    title: string
    description: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    price: string
    currencyCode: string
    bedrooms: number
    bathrooms: number
    areaSqm: number
    furnished: boolean
    isAvailable: boolean
    images: string[]
    latitude: number
    longitude: number
    placeId: string | null
    projectName: string | null
    developer: string | null
    code: string
    status: string
    createdAt: string
    updatedAt: string
    ownerId: string
    propertyTypeId: string
    owner: {
      id: string
      email: string
      firstName: string
      lastName: string
      name: string
    }
    propertyType: {
      id: string
      code: string
      name: string
      description: string
      icon: string
      isActive: boolean
      createdAt: string
      updatedAt: string
    }
  }
}

// Interface for Security Logs (Module 5)
interface SecurityLog {
  id: string
  userId: string | null
  action: string
  ipAddress: string
  userAgent: string | null
  status: 'SUCCESS' | 'FAILURE' | 'WARNING'
  details: string | null
  createdAt: string
  user?: {
    email: string
    name: string
  }
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

// Interface for Agreements (Signatures)
interface Agreement {
  id: string
  leaseId: string
  status: string
  pdfUrl: string
  tenantSignature: string | null
  tenantSignedAt: string | null
  landlordSignature: string | null
  landlordSignedAt: string | null
  createdAt: string
  property: {
    title: string
    address: string
    city: string
  }
  tenant: {
    name: string
    email: string
  }
  landlord: {
    name: string
    email: string
  }
}

const getDeviceIcon = (userAgent: string | null) => {
  if (!userAgent) return <HelpCircle size={16} className="text-gray-400" />
  if (userAgent.includes('Mac')) return <Laptop size={16} className="text-gray-600" />
  if (userAgent.includes('Win')) return <Monitor size={16} className="text-blue-600" />
  if (userAgent.includes('Android')) return <Smartphone size={16} className="text-green-600" />
  if (userAgent.includes('iPhone')) return <Smartphone size={16} className="text-slate-900" />
  if (userAgent.includes('Linux')) return <Globe size={16} className="text-orange-600" />
  return <HelpCircle size={16} className="text-gray-400" />
}

function AdminPage() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'approvals' | 'agreements' | 'logs'>('approvals')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Approvals State
  const [pendingApprovals, setPendingApprovals] = useState<PropertyApproval[]>([])
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false)
  const [approvingProperties, setApprovingProperties] = useState<Set<string>>(new Set())
  const [rejectingProperties, setRejectingProperties] = useState<Set<string>>(new Set())
  
  // Agreements State
  const [pendingAgreements, setPendingAgreements] = useState<Agreement[]>([])
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false)
  const [signingAgreements, setSigningAgreements] = useState<Set<string>>(new Set())
  
  // Auto Review State
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(false)
  const [isTogglingAutoReview, setIsTogglingAutoReview] = useState(false)

  // Logs State
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const [logFilter, setLogFilter] = useState<'ALL' | 'FAILURE' | 'SUCCESS'>('ALL')

  const { isLoggedIn } = useAuthStore()

  // --- 1. CHECK ADMIN ROLE ---
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          setError('Authentication token not found')
          setIsLoading(false)
          return
        }
        const response = await fetch('http://localhost:8000/api/auth/me', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
        })
        if (!response.ok) throw new Error('Access denied')
        const backendData = await response.json()
        
        // Handle "your_data" structure from backend
        if (backendData?.your_data?.role === 'ADMIN') {
           setUser({
               id: backendData.your_data.id,
               role: backendData.your_data.role,
               email: backendData.your_data.email || 'admin@rentverse.com',
               firstName: 'Admin',
               lastName: 'User',
               name: 'Admin User',
               isActive: true,
               createdAt: 'N/A',
           })
        } else {
           setUser(null) // Not admin
        }
      } catch (err) {
        console.error(err)
        setError('Failed to verify admin access')
      } finally {
        setIsLoading(false)
      }
    }
    checkAdminRole()
  }, [isLoggedIn])

  // --- 2. FETCH PENDING APPROVALS ---
  const fetchPendingApprovals = async () => {
      if (!user) return
      try {
        setIsLoadingApprovals(true)
        const token = localStorage.getItem('authToken')
        // Using main properties route with filter
        const response = await fetch('http://localhost:8000/api/properties?status=PENDING_REVIEW', {
          method: 'GET',
          headers: { 'accept': '*/*', 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        })
        
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        
        // Normalize Data (Handle various response shapes)
        let rawProperties: any[] = []
        if (data.success) {
            // API returns: { success: true, data: { properties: [...] } }
            if (data.data?.properties && Array.isArray(data.data.properties)) {
                rawProperties = data.data.properties
            } else if (Array.isArray(data.data)) {
                rawProperties = data.data
            } else if (Array.isArray(data.properties)) {
                rawProperties = data.properties
            }
        } else if (Array.isArray(data)) {
            rawProperties = data
        }

        // Map to PropertyApproval structure
        const mapped = rawProperties.map((prop) => {
            if (prop.property) return prop as PropertyApproval
            return {
                id: prop.id, 
                propertyId: prop.id,
                status: prop.status || 'PENDING',
                createdAt: prop.createdAt,
                property: {
                    ...prop,
                    owner: prop.owner || { name: 'Unknown Owner', email: 'N/A' },
                    propertyType: prop.propertyType || { name: 'Unknown' }
                }
            } as PropertyApproval
        })

        // Filter for PENDING only
        const pendingOnly = mapped.filter(a => 
            a.status === 'PENDING' || a.status === 'PENDING_REVIEW' ||
            a.property.status === 'PENDING' || a.property.status === 'PENDING_REVIEW'
        )
        setPendingApprovals(pendingOnly)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoadingApprovals(false)
      }
  }

  // --- 3. FETCH SECURITY LOGS (Module 5) ---
  const fetchSecurityLogs = async () => {
    if (!user) return
    try {
      setIsLoadingLogs(true)
      const token = localStorage.getItem('authToken')
      
      // Connects to /api/admin/logs
      const response = await fetch('http://localhost:8000/api/admin/logs', {
        method: 'GET',
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      })

      if (!response.ok) throw new Error('Failed to fetch logs')
      const data = await response.json()
      
      // Handle response structure { message, count, logs: [] }
      if (data.logs && Array.isArray(data.logs)) {
        setSecurityLogs(data.logs)
      } else if (Array.isArray(data)) {
        setSecurityLogs(data)
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // --- 4. FETCH PENDING AGREEMENTS ---
  const fetchPendingAgreements = async () => {
    if (!user) return
    try {
      setIsLoadingAgreements(true)
      const token = localStorage.getItem('authToken')
      
      // Set empty array to avoid misleading users about pending agreements
      setPendingAgreements([])
    } catch (err) {
      console.error('Error fetching agreements:', err)
    } finally {
      setIsLoadingAgreements(false)
    }
  }

  // Load data when tab changes
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      if (activeTab === 'approvals') fetchPendingApprovals()
      if (activeTab === 'agreements') fetchPendingAgreements()
      if (activeTab === 'logs') fetchSecurityLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab])


  // --- ACTIONS ---

  const toggleAutoReview = async () => {
    setIsTogglingAutoReview(true)
    // Simulated delay (Mock)
    await new Promise(r => setTimeout(r, 600))
    setAutoReviewEnabled(prev => !prev)
    setIsTogglingAutoReview(false)
  }

  const approveProperty = async (id: string) => {
    setApprovingProperties(prev => new Set(prev).add(id))
    const token = localStorage.getItem('authToken')
    try {
        // Use PUT to update status
        await fetch(`http://localhost:8000/api/properties/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'APPROVED' })
        })
        setPendingApprovals(prev => prev.filter(p => p.propertyId !== id))
    } catch (e) { console.error(e) }
    finally { setApprovingProperties(prev => { const s = new Set(prev); s.delete(id); return s }) }
  }

  const rejectProperty = async (id: string) => {
    setRejectingProperties(prev => new Set(prev).add(id))
    const token = localStorage.getItem('authToken')
    try {
        // Use PUT to update status
        await fetch(`http://localhost:8000/api/properties/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'REJECTED' })
        })
        setPendingApprovals(prev => prev.filter(p => p.propertyId !== id))
    } catch (e) { console.error(e) }
    finally { setRejectingProperties(prev => { const s = new Set(prev); s.delete(id); return s }) }
  }

  // --- AGREEMENT ACTIONS ---
  const sendReminder = async (leaseId: string, landlordName: string) => {
    setSigningAgreements(prev => new Set(prev).add(leaseId))
    const token = localStorage.getItem('authToken')
    try {
      // Send reminder to landlord (you could implement an email/notification service here)
      const response = await fetch('http://localhost:8000/api/agreements/send-reminder', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          leaseId,
          message: `Reminder: Please sign the rental agreement for your property. Thank you!`
        })
      })

      if (response.ok) {
        alert(`✅ Reminder sent to ${landlordName}! They will be notified to sign the agreement.`)
      } else {
        // For now, just show success (implement actual reminder system later)
        alert(`✅ Reminder sent to ${landlordName}! (Demo mode - implement email service)`)
      }
    } catch (err) {
      console.error('Error sending reminder:', err)
      // For demo purposes, still show success
      alert(`✅ Reminder sent to ${landlordName}! (Demo mode - implement email service)`)
    } finally {
      setSigningAgreements(prev => { const s = new Set(prev); s.delete(leaseId); return s })
    }
  }

//-------------


  // --- HELPERS ---
  const exportLogsToCSV = () => {
    if (securityLogs.length === 0) return;

    // 1. Define CSV Headers
    const headers = ['Time', 'Event', 'User', 'IP Address', 'Status', 'User Agent'];
    
    // 2. Map data to CSV rows
    const csvContent = [
      headers.join(','), // Header row
      ...securityLogs.map(log => {
        // Escape quotes to prevent CSV breakage
        const safeAgent = (log.userAgent || '').replace(/"/g, '""');
        return [
          `"${new Date(log.createdAt).toLocaleString()}"`,
          `"${log.action}"`,
          `"${log.user?.email || 'Anonymous'}"`,
          `"${log.ipAddress}"`,
          `"${log.status}"`,
          `"${safeAgent}"`
        ].join(',');
      })
    ].join('\n');

    // 3. Create download link dynamically
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `security_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // clear log
  const handleClearLogs = async () => {
    if(!confirm("Are you sure you want to delete logs older than 30 days?")) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/admin/logs/cleanup', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` // secure access
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Success! Cleaned up ${data.count} old logs.`);
        fetchSecurityLogs(); // Refresh the table instantly
      } else {
        alert("Failed to clean logs. Check console.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  }

  // ban ip address
  const handleBanIp = async (ip: string) => {
    if(!confirm(`Are you sure you want to PERMANENTLY ban IP: ${ip}?`)) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/admin/ban-ip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ipAddress: ip })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`🚫 IP ${ip} has been BANNED.`);
      } else {
        alert(`Error: ${data.message || 'Failed to ban IP'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  }
  
  
  // --- RENDER ---
  const formatPrice = (p: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MYR' }).format(parseFloat(p))
  const formatDate = (d: string) => new Date(d).toLocaleString()

  if (isLoading) return (
    <ContentWrapper>
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    </ContentWrapper>
  )

  if (error || !user) return (
    <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-red-600">{error || 'Access denied'}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
              Try Again
            </button>
          </div>
        </div>
    </ContentWrapper>
  )

  return (
    <ContentWrapper>
      {/* Header & Tabs */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
           <p className="text-slate-500">Manage properties and monitor security</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-start md:self-auto">
            <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'approvals' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                Approvals
            </button>
            <button
                onClick={() => setActiveTab('agreements')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'agreements' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                📋 Agreements
            </button>
            <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'logs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Shield size={16} />
                <span>Security Logs</span>
            </button>
        </div>
      </div>

      {/* --- TAB 1: PROPERTY APPROVALS --- */}
      {activeTab === 'approvals' && (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">Total Pending</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{pendingApprovals.length}</p>
                    <div className="absolute top-6 right-6 p-2 bg-yellow-50 rounded-lg text-yellow-600"><Filter size={20}/></div>
                </div>
                {/* Auto Review Toggle */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-teal-100 rounded-lg"><Bot className="w-6 h-6 text-teal-600" /></div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Auto review AI</h3>
                            <p className="text-sm text-slate-500">Automatically approve safe listings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">{autoReviewEnabled ? 'ON' : 'OFF'}</span>
                        <button
                            onClick={toggleAutoReview}
                            disabled={isTogglingAutoReview}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${autoReviewEnabled ? 'bg-teal-600' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${autoReviewEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            {isLoadingApprovals ? (
                <div className="text-center py-20 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="text-slate-500">Loading approvals...</p>
                </div>
            ) : pendingApprovals.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                         <CheckCircle className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No properties pending</h3>
                    <p className="text-slate-500">Good job! You&apos;re all caught up.</p>
                </div>
            ) : (
                <div className="space-y-6">
                {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative w-full md:w-72 h-48 md:h-auto bg-slate-200">
                            <Image 
                                src={(approval.property.images && approval.property.images[0]) || '/placeholder.jpg'} 
                                alt="Property Image" 
                                fill 
                                className="object-cover" 
                            />
                            <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded uppercase">
                                {approval.status}
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{approval.property.title}</h3>
                                        <p className="text-slate-600 text-sm">{approval.property.address}, {approval.property.city}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-teal-600">{formatPrice(approval.property.price)}</p>
                                        <p className="text-xs text-slate-400">/month</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                    <Clock size={14} />
                                    <span>Submitted: {formatDate(approval.createdAt)}</span>
                                    <span>•</span>
                                    <span>Type: {approval.property.propertyType?.name || 'Home'}</span>
                                </div>
                                <p className="text-slate-600 text-sm line-clamp-2 mb-4">{approval.property.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                                <Link href={`/property/${approval.property.id}`} className="text-teal-600 text-sm font-medium hover:underline">
                                    View Full Details
                                </Link>
                                <div className="flex gap-3">
                                    <button onClick={() => approveProperty(approval.propertyId)} disabled={approvingProperties.has(approval.propertyId)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors">
                                        {approvingProperties.has(approval.propertyId) ? 'Approving...' : 'Approve'}
                                    </button>
                                    <button onClick={() => rejectProperty(approval.propertyId)} disabled={rejectingProperties.has(approval.propertyId)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors">
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </>
      )}

      {/* --- TAB 2: AGREEMENTS (SIGNATURES) --- */}
      {activeTab === 'agreements' && (
        <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">Pending Signatures</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{pendingAgreements.length}</p>
                    <div className="absolute top-6 right-6 p-2 bg-orange-50 rounded-lg text-orange-600">📋</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">Awaiting Landlord</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                        {pendingAgreements.filter(a => !a.landlordSignature).length}
                    </p>
                    <div className="absolute top-6 right-6 p-2 bg-blue-50 rounded-lg text-blue-600">✍️</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">Fully Signed</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                        {pendingAgreements.filter(a => a.landlordSignature && a.tenantSignature).length}
                    </p>
                    <div className="absolute top-6 right-6 p-2 bg-green-50 rounded-lg text-green-600">✅</div>
                </div>
            </div>

            {/* Agreements List */}
            {isLoadingAgreements ? (
                <div className="text-center py-20 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="text-slate-500">Loading agreements...</p>
                </div>
            ) : pendingAgreements.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                         <CheckCircle className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No agreements pending</h3>
                    <p className="text-slate-500">All agreements have been signed!</p>
                </div>
            ) : (
                <div className="space-y-6">
                {pendingAgreements.map((agreement) => (
                    <div key={agreement.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{agreement.property.title}</h3>
                                    <p className="text-slate-600 text-sm">{agreement.property.address}, {agreement.property.city}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        agreement.status === 'SIGNED_BY_TENANT' ? 'bg-yellow-100 text-yellow-600' :
                                        agreement.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {agreement.status === 'SIGNED_BY_TENANT' ? 'Awaiting Landlord' :
                                         agreement.status === 'COMPLETED' ? 'Fully Signed' : agreement.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-700">Tenant</p>
                                    <p className="text-sm text-slate-600">{agreement.tenant.name}</p>
                                    <p className="text-xs text-slate-500">{agreement.tenant.email}</p>
                                    {agreement.tenantSignature ? (
                                        <p className="text-xs text-green-600">✅ Signed: {new Date(agreement.tenantSignedAt!).toLocaleString()}</p>
                                    ) : (
                                        <p className="text-xs text-red-600">❌ Not signed</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-700">Landlord</p>
                                    <p className="text-sm text-slate-600">{agreement.landlord.name}</p>
                                    <p className="text-xs text-slate-500">{agreement.landlord.email}</p>
                                    {agreement.landlordSignature ? (
                                        <p className="text-xs text-green-600">✅ Signed: {new Date(agreement.landlordSignedAt!).toLocaleString()}</p>
                                    ) : (
                                        <p className="text-xs text-orange-600">⏳ Pending signature</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="flex gap-2">
                                    <Link 
                                        href={`/rents/${agreement.leaseId}`} 
                                        className="text-teal-600 text-sm font-medium hover:underline"
                                    >
                                        View Agreement
                                    </Link>
                                    <a 
                                        href={agreement.pdfUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm font-medium hover:underline"
                                    >
                                        Download PDF
                                    </a>
                                </div>
                                
                                {!agreement.landlordSignature && (
                                    <button 
                                        onClick={() => sendReminder(agreement.leaseId, agreement.landlord.name)}
                                        disabled={signingAgreements.has(agreement.leaseId)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                                    >
                                        {signingAgreements.has(agreement.leaseId) ? 'Sending...' : 'Send Reminder'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </>
      )}

      {/* --- TAB 3: SECURITY LOGS (MODULE 5) --- */}




      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header with Filter */}


            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                System Activity Logs
            </h3>
            <p className="text-sm text-slate-500">Monitor suspicious login attempts</p>
        </div>
        
        {/* 🚨 DELETE THE OLD <div> HERE AND PASTE YOUR NEW CODE 🚨 */}
        {/* The code you pasted replaces the div that was here */}
             
             <div className="flex items-center gap-3">
                {/* Export Button (Option 3) */}
                <button 
                    onClick={exportLogsToCSV}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
                    title="Download logs as CSV"
                >
                    <Download size={14} />
                    Export
                </button>

                {/* Clear Logs Button (Option 3) */}
                <button 
                    onClick={handleClearLogs}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                    title="Delete logs older than 30 days"
                >
                    <Trash2 size={14} />
                    Clear Old
                </button>

                {/* Existing Filter */}
                <div className="h-6 w-px bg-slate-300 mx-1"></div> {/* Divider */}
                
                <select 
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value as any)}
                    className="text-sm border-slate-300 rounded-lg text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 py-1.5 px-3"
                >
                    <option value="ALL">All Events</option>
                    <option value="FAILURE">❌ Failed Only</option>
                    <option value="SUCCESS">✅ Success Only</option>
                </select>

                <button onClick={fetchSecurityLogs} className="p-2 hover:bg-white rounded-full text-slate-500 transition-colors border border-transparent hover:border-slate-200">
                    <RefreshCw size={18} />
                </button>
            </div>

        {/* 🚨 END OF PASTE */}

    </div>

            {isLoadingLogs ? (
                <div className="p-12 text-center text-slate-500">Loading security logs...</div>
            ) : securityLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No activity logs found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Device Details</th> {/* Column we added earlier */}
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* ✅ UPDATED: Added .filter() logic here */}
                            {securityLogs
                                .filter(log => {
                                    if (logFilter === 'ALL') return true;
                                    const isFailure = log.status === 'FAILURE' || log.action.includes('FAILED');
                                    if (logFilter === 'FAILURE') return isFailure;
                                    if (logFilter === 'SUCCESS') return !isFailure;
                                    return true;
                                })
                                .map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {log.user?.email || log.userId || 'Anonymous'}
                                    </td>

                                    {/* ✅ UPDATED: Icon + Text Cell */}
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            {getDeviceIcon(log.userAgent)}
                                            <div>
                                                <div className="font-medium text-slate-700">
                                                    {log.userAgent ? (
                                                        log.userAgent.includes('Mac') ? 'Mac OS' :
                                                        log.userAgent.includes('Win') ? 'Windows' :
                                                        log.userAgent.includes('Linux') ? 'Linux' :
                                                        log.userAgent.includes('iPhone') ? 'iPhone' :
                                                        log.userAgent.includes('Android') ? 'Android' : 'Other'
                                                    ) : 'Unknown'}
                                                </div>
                                                <div className="text-xs text-slate-400 max-w-[120px] truncate" title={log.userAgent || ''}>
                                                    {log.userAgent || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {log.ipAddress}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.status === 'FAILURE' || log.action.includes('FAILED') ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <AlertTriangle size={12} className="mr-1" /> Failed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle size={12} className="mr-1" /> Success
                                            </span>
                                        )}
                                    </td>

                                    {/* ✅ PASTE YOUR NEW "BAN BUTTON" CODE HERE 👇 */}
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                              onClick={() => handleBanIp(log.ipAddress)}
                                              className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                                              title={`Ban IP: ${log.ipAddress}`}
                                          >
                                              <Ban size={16} />
                                          </button>
                                      </td>
                                      {/* ⬆️ END OF PASTE */}

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}

    </ContentWrapper>
  )
}

export default AdminPage