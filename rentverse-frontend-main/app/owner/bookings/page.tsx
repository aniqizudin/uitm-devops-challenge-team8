'use client'

import { useEffect, useState, useCallback } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
import { protectedFetch } from '@/utils/apiClient'
import { Calendar, User, Home, Check, X } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { useRouter } from 'next/navigation'

// --- Type Definitions ---
interface Booking {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  totalPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';
  notes?: string;
  property: {
    title: string;
    address: string;
  };
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// --- Booking Management Client ---
const BookingApiClient = {
  getOwnerBookings: async (statusFilter: string = ''): Promise<Booking[]> => {
    try {
      const statusQuery = statusFilter ? `?status=${statusFilter}` : '';
      const response = await protectedFetch(`/bookings/owner-bookings${statusQuery}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch owner bookings: ${response.status}`);
      }
      
      const data = await response.json();
      
      const rawBookings = data.data?.bookings || data.data || [];
      
      // Explicitly map and convert price fields to ensure they are numbers
      const formattedBookings: Booking[] = rawBookings.map((booking: any) => ({
          ...booking,
          rentAmount: parseFloat(booking.rentAmount) || 0,
          totalPrice: parseFloat(booking.totalPrice) || 0,
      }));
      
      return formattedBookings; 
      
    } catch (error) {
      console.error('API Error fetching owner bookings:', error);
      throw error;
    }
  },

  approveBooking: async (bookingId: string, notes: string = ''): Promise<Booking> => {
    const response = await protectedFetch(`/bookings/${bookingId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to approve booking: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data?.booking || result.data;
  },

  rejectBooking: async (bookingId: string, reason: string): Promise<Booking> => {
    if (!reason) throw new Error('Rejection reason is required.');
    
    const response = await protectedFetch(`/bookings/${bookingId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to reject booking: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data?.booking || result.data;
  },
};
// --- End Booking Management Client ---


function OwnerBookingsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore(); 
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // FINAL CLEAN USE EFFECT: Only checks authentication, relies on global router for role check.
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
  }, [isLoggedIn, router]);


  const fetchBookings = useCallback(async (status: string) => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    
    try {
      const fetchedBookings = await BookingApiClient.getOwnerBookings(status);
      setBookings(fetchedBookings);
    } catch (error) {
      alert('Error loading bookings: ' + (error as Error).message);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);


  useEffect(() => {
    if (isLoggedIn) {
        fetchBookings(currentFilter);
    }
  }, [fetchBookings, currentFilter, isLoggedIn]);
  
  
  // --- Helper Render Functions ---

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'APPROVED': return 'text-green-700 bg-green-100 border-green-200';
      case 'REJECTED': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatCurrency = (amount: string | number) => {
      const numericAmount = parseFloat(amount as string);
      if (isNaN(numericAmount)) return 'RM 0.00'; 
      return `RM ${numericAmount.toFixed(2).toLocaleString()}`;
  };


  // --- Action Handlers ---
  
  const handleApprove = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to approve this booking?')) return;
    
    setActionLoadingId(bookingId);
    try {
      await BookingApiClient.approveBooking(bookingId);
      alert('Booking approved successfully!');
      fetchBookings(currentFilter); // Refresh list
    } catch (error) {
      alert('Approval failed: ' + (error as Error).message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = window.prompt('Please provide a reason for rejecting this booking:');
    if (!reason) {
      alert('Rejection canceled or reason not provided.');
      return;
    }
    
    setActionLoadingId(bookingId);
    try {
      await BookingApiClient.rejectBooking(bookingId, reason);
      alert('Booking rejected successfully!');
      fetchBookings(currentFilter); // Refresh list
    } catch (error) {
      alert('Rejection failed: ' + (error as Error).message);
    } finally {
      setActionLoadingId(null);
    }
  };
  
  // --- Rendering ---

  if (!isLoggedIn) {
    return null; 
  }

  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="text-center py-20 text-slate-600">
          Loading your owner bookings dashboard...
        </div>
      </ContentWrapper>
    );
  }


  return (
    <ContentWrapper>
      <h1 className="text-3xl font-serif text-slate-900 mb-6">
        Landlord Dashboard
      </h1>
      
      {/* Status Filter */}
      <div className="flex space-x-4 mb-8 border-b pb-3">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <button
            key={status || 'ALL'}
            onClick={() => setCurrentFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentFilter === status
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status || 'All Bookings'}
          </button>
        ))}
      </div>
      
      {/* Booking List */}
      <div className="space-y-6">
        {bookings.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-500">
            No {currentFilter.toLowerCase() || 'matching'} bookings found.
          </div>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-4 border-b pb-4">
                {/* Property & Tenant Info */}
                <div>
                  <div className="flex items-center space-x-2 text-sm font-medium mb-1">
                    <Home size={16} className="text-slate-500" />
                    <span className="text-slate-900">{booking.property.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <User size={16} className="text-slate-500" />
                    <span className="text-slate-700">Tenant: {booking.tenant?.firstName || 'N/A'} {booking.tenant?.lastName || ''}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div 
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusColor(booking.status)}`}
                >
                  {booking.status}
                </div>
              </div>

              {/* Details & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Dates & Price */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Calendar size={16} />
                    <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {formatCurrency(booking.totalPrice)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatCurrency(booking.rentAmount)} per month
                  </div>
                </div>
                
                {/* Message / Notes */}
                <div className="text-sm text-slate-600 border-l pl-4">
                  <p className="font-medium text-slate-800">Tenant Message:</p>
                  <p>{booking.notes || 'N/A'}</p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 justify-end">
                  {booking.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionLoadingId === booking.id}
                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {actionLoadingId === booking.id ? 'Approving...' : <><Check size={18} className="mr-1" /> Approve</>}
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionLoadingId === booking.id}
                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {actionLoadingId === booking.id ? 'Rejecting...' : <><X size={18} className="mr-1" /> Reject</>}
                      </button>
                    </>
                  ) : (
                    <span className={`px-4 py-2 text-sm rounded-lg ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ContentWrapper>
  );
}

export default OwnerBookingsPage