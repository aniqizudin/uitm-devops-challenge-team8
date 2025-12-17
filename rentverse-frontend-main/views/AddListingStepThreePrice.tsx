'use client'

import { useState, useEffect, useRef } from 'react'
import { usePropertyListingStore } from '@/stores/propertyListingStore'
import { getPriceRecommendation, type PriceRecommendationRequest } from '@/utils/priceRecommendationApi'
import { useRouter } from 'next/navigation' // Needed for redirection after submit/delete

function AddListingStepThreePrice() {
  // Destructure all required state and actions
  const { 
    data, 
    updateData, 
    submitForm, 
    currentStep, 
    steps,
    goToStep,
    previousStep, // <--- Added previousStep
    isLoading: isSubmitting, // Use an alias for submission loading
    propertyId, // <--- Get propertyId from the store
    clearTemporaryData, // <--- Used for cleanup after deletion/submit
  } = usePropertyListingStore()
  
  const router = useRouter() // Initialize router

  const [price, setPrice] = useState(data.price || 1500)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false)
  const isUpdatingFromUser = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Determine if we are in Edit Mode
  const isEditingMode = !!propertyId 
  const submitButtonText = isEditingMode ? 'Save Changes' : 'Publish Listing'


  // Sync local state with store, but prevent loops
  useEffect(() => {
    if (!isUpdatingFromUser.current && data.price !== undefined && data.price !== price) {
      setPrice(data.price)
    }
  }, [data.price, price])

  // Initialize store with default price if not set
  useEffect(() => {
    if (!data.price && price > 0) {
      updateData({ price })
    }
  }, [data.price, price, updateData])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handlePriceClick = () => {
    setIsEditing(true)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseInt(e.target.value) || 0
    setPrice(newPrice)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Update store with debounced approach
    isUpdatingFromUser.current = true
    timeoutRef.current = setTimeout(() => {
      updateData({ price: newPrice })
      isUpdatingFromUser.current = false
    }, 300)
  }

  const handlePriceBlur = () => {
    setIsEditing(false)
    // Ensure final update to store
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    updateData({ price })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      updateData({ price })
    }
  }

  const handleGetRecommendation = async () => {
    setIsLoadingRecommendation(true)
    
    try {
      // Map property type to API format
      let apiPropertyType = 'Condominium'
      if (data.propertyType === 'apartment') apiPropertyType = 'Apartment'
      else if (data.propertyType === 'house') apiPropertyType = 'House'
      
      // Prepare property data for API call
      const propertyData: PriceRecommendationRequest = {
        area: data.areaSqm || 1200,
        bathrooms: data.bathrooms || 2,
        bedrooms: data.bedrooms || 3,
        furnished: data.amenities?.some(amenity => 
          amenity.toLowerCase().includes('furnished')
        ) ? "Yes" : "No",
        location: [data.district, data.city, data.state].filter(Boolean).join(', ') || "Kuala Lumpur",
        property_type: apiPropertyType
      }

      const response = await getPriceRecommendation(propertyData)
      
      // Update the price with AI recommendation
      const recommendedPrice = response.predicted_price
      setPrice(recommendedPrice)
      updateData({ price: recommendedPrice })
      
      console.log('AI Price Recommendation:', response)
      
    } catch (error) {
      console.error('Failed to get price recommendation:', error)
      alert('Failed to get price recommendation. Please try again.')
    } finally {
      setIsLoadingRecommendation(false)
    }
  }


  // ----------------------------------------------------
  // ✅ DELETE LOGIC IMPLEMENTATION (Added)
  // ----------------------------------------------------

  const handleDelete = async () => {
    if (!propertyId) return 

    const isConfirmed = window.confirm(
      'Are you sure you want to permanently delete this property listing? This action cannot be undone.'
    )

    if (!isConfirmed) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Authentication required to delete property.')
      return
    }

    try {
      // Send the DELETE request
      const deleteUrl = `http://localhost:8000/api/properties/${propertyId}`
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        // Use the specific error handling from the backend controller
        if (result.message && result.message.includes('Cannot delete property: It is linked')) {
            alert(result.message) 
        } else {
            throw new Error(result.message || 'Failed to delete property.')
        }
        return 
      }

      // Success and Cleanup
      alert('Property listing deleted successfully!')
      clearTemporaryData() 
      router.push('/property/all') // Redirect to the listings page

    } catch (error) {
      console.error('Error deleting property:', error)
      alert('An unexpected error occurred during deletion.')
    }
  }

  // ----------------------------------------------------
  // ✅ SUBMISSION LOGIC (Updated)
  // ----------------------------------------------------

  const handleSubmitClick = async () => {
    try {
      await submitForm()
      // Success logic: Alert or navigate
      alert(isEditingMode ? 'Property updated successfully!' : 'Property created successfully!')
      clearTemporaryData()
      router.push('/property/all')
    } catch (error) {
      alert('Submission failed. Check console for details.')
    }
  }
  
  const isCurrentlyLoading = isSubmitting || isLoadingRecommendation

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="space-y-12">
        {/* ... (Existing Price Recommendation UI) ... */}
        
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-serif text-slate-900">
            Now, set a rent price
          </h2>
          <p className="text-lg text-slate-500">
            You can edit the price later
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            {isEditing ? (
              <div className="flex items-center">
                <span className="text-6xl font-serif text-slate-900">RM</span>
                <input
                  type="number"
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  onKeyPress={handleKeyPress}
                  className="text-6xl font-serif text-slate-900 bg-transparent border-none outline-none text-center w-48"
                  autoFocus
                />
              </div>
            ) : (
              <div
                className="flex items-center cursor-pointer hover:bg-slate-50 rounded-lg px-4 py-2 transition-colors"
                onClick={handlePriceClick}
              >
                <span className="text-6xl font-serif text-slate-900">
                  RM {price.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-base text-slate-400">
            Click to edit the price
          </p>
        </div>

        <div className="flex justify-center">
          <button 
            className="flex items-center space-x-3 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-colors duration-200"
            onClick={handleGetRecommendation}
            disabled={isCurrentlyLoading}
          >
            <span className="font-medium">
              {isLoadingRecommendation ? 'Getting recommendation...' : 'Get recommendation price'}
            </span>
            <div className="px-3 py-1 bg-white text-teal-600 rounded-full text-sm font-bold">
              RevAI
            </div>
          </button>
        </div>

      </div>
      
      {/* --- ADDED: NAVIGATION & ACTION BUTTONS --- */}
      <div className="flex justify-between items-center mt-12 border-t pt-6">
        
        {/* Delete Button (Only visible in Edit Mode) */}
        {isEditingMode ? (
          <button
            onClick={handleDelete}
            disabled={isCurrentlyLoading}
            className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {isCurrentlyLoading ? 'Deleting...' : 'Delete Property'}
          </button>
        ) : (
          // Placeholder or empty div for alignment in Create Mode
          <div></div> 
        )}
        
        <div className="flex space-x-4">
          <button
            onClick={previousStep}
            disabled={isCurrentlyLoading}
            className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium disabled:opacity-50"
          >
            Back
          </button>
          
          <button 
            onClick={handleSubmitClick}
            disabled={isCurrentlyLoading}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {isCurrentlyLoading ? 'Processing...' : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddListingStepThreePrice