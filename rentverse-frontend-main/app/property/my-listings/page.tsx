'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import Link from 'next/link'
import type { Property } from '@/types/property'

function MyListingsPage() {
  const [properties, setProperties] = useState<Property[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchMyProperties = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await PropertiesApiClient.getMyProperties(1, 10) // Fetch first page
      
      if (response.success && response.data?.properties) {
        setProperties(response.data.properties)
      } else {
        setProperties([])
      }

    } catch (err) {
      console.error('Error fetching owner properties:', err)
      // The error message from the failing API call is caught here
      setError('Failed to load property details. Please ensure your Backend server is running on port 8000 and you are logged in.')
      setProperties(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMyProperties()
  }, [fetchMyProperties])


  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="text-center py-20 text-slate-600">
          Loading your property listings...
        </div>
      </ContentWrapper>
    )
  }

  if (error) {
    // Displays the detailed error message from the failed API call
    return (
      <ContentWrapper>
        <div className="text-center py-20 text-red-600">
          {error}
          <p className="mt-4 text-sm text-slate-500">
            If the error persists, please check your network console for API fetch failures.
          </p>
          <button
            onClick={() => router.refresh()}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Refreshing
          </button>
        </div>
      </ContentWrapper>
    )
  }

  // --- Render Content ---
  
  if (!properties || properties.length === 0) {
    return (
      <ContentWrapper>
        <div className="text-center py-20">
          <h2 className="text-2xl font-serif text-slate-900 mb-4">
            You don't have any properties listed yet.
          </h2>
          <p className="text-slate-600 mb-6">
            Start the listing process now and rent out your place!
          </p>
          <Link href="/property/new">
            <button className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors">
              List a New Property
            </button>
          </Link>
        </div>
      </ContentWrapper>
    )
  }

  // Properties are loaded
  return (
    <ContentWrapper>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-serif text-slate-900">
          My Active Listings ({properties.length})
        </h1>
        <div className="flex gap-3">
          <Link href="/property/new">
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              + New Listing
            </button>
          </Link>
        </div>
      </div>





      {/* --- PROPERTY LISTINGS --- */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">My Property Listings</h2>
        {properties.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-500">
            No properties listed yet.
          </div>
        ) : (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              ✅ Properties Loaded Successfully!
            </h3>
            <p className="text-blue-700 mb-4">
              Found {properties.length} property listing(s).
            </p>
            <div className="grid gap-4">
              {properties.map((property) => (
                <div key={property.id} className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900">{property.title}</h4>
                  <p className="text-sm text-slate-600">{property.address}, {property.city}</p>
                  <p className="text-sm font-medium text-teal-600">MYR {property.price}/month</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination component would go here */}
    </ContentWrapper>
  )
}

export default MyListingsPage