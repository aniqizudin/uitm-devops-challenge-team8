import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { uploadProperty, mapPropertyListingToUploadRequest } from '@/utils/propertyUploadApi'

// --- START NEW/UPDATED IMPORTS AND INTERFACES ---

// Import the Property type structure for fetching existing data
import type { Property } from '@/types/property' 

// Define the response structure for fetching a single property
interface SinglePropertyResponse {
    success: boolean
    message: string
    data: Property
}



// Map Backend Property data to Form Data structure
const mapBackendToFormData = (property: Property): Partial<PropertyListingData> => {
    // 1. Safely parse price to number (Fixes Error 2)
    const parsedPrice = typeof property.price === 'string'
        ? parseFloat(property.price)
        : property.price || 0;
        
    // 2. Safely map amenities (Fixes Error 1)
    // Assuming the error is due to an interface mismatch, we cast it to string[]
    // If your backend sends objects, this cast might hide a runtime error, 
    // but based on the provided types, a simple assertion is the quickest fix.
    const mappedAmenities: string[] = (property.amenities || []) as string[]; 

    return {
        propertyType: property.type, // Map 'type' to form's 'propertyType'
        propertyTypeId: property.propertyTypeId,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        areaSqm: property.areaSqm,
        amenities: mappedAmenities, // Use the mapped array
        title: property.title,
        description: property.description,
        images: property.images || [], 
        price: parsedPrice, // Use the parsed number
        isAvailable: property.isAvailable,
        // The remaining fields (legalDocuments, etc.) remain the same
    }
}


// --- END NEW/UPDATED IMPORTS AND INTERFACES ---


// Define all the form data structure
export interface PropertyListingData {
  // Step 1: Basic Information
  propertyType: string
  propertyTypeId?: string // Store the backend property type ID
  address: string
  city: string
  state: string
  district: string
  subdistrict: string
  streetAddress: string
  houseNumber: string
  zipCode: string
  latitude?: number
  longitude?: number
  autoFillDistance?: number // Distance to closest location in km
  
  // Step 1: Property Details
  bedrooms: number
  bathrooms: number
  areaSqm: number
  amenities: string[]
  
  // Step 2: Content & Photos
  title: string
  description: string
  images: string[]
  
  // Step 3: Legal & Pricing
  price: number
  isAvailable: boolean
  legalDocuments: string[]
  maintenanceIncluded: string // 'yes' | 'no' | ''
  landlordType: string // 'individual' | 'company' | 'partnership' | ''
}

export interface PropertyListingStep {
  id: string
  title: string
  component: string
  isCompleted: boolean
  isAccessible: boolean
}

interface PropertyListingStore {
  // State
  currentStep: number
  data: PropertyListingData
  steps: PropertyListingStep[]
  isLoading: boolean
  isDirty: boolean
  propertyId: string | null // ✅ ADDED: ID of the property being edited
  isEditingLoading: boolean // ✅ ADDED: Loading state for fetching data
  
  // Actions
  setCurrentStep: (step: number) => void
  updateData: (updates: Partial<PropertyListingData>) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  markStepCompleted: (stepIndex: number) => void
  validateCurrentStep: () => boolean
  resetForm: () => void
  clearTemporaryData: () => void
  submitForm: () => Promise<void>
  canAccessStep: (stepIndex: number) => boolean
  initializeForEdit: (id: string) => Promise<void> // ✅ ADDED: Function to load existing property
}

// Define the steps sequence
const initialSteps: PropertyListingStep[] = [
  // ... (initialSteps array remains the same)
  {
    id: 'intro',
    title: 'Getting Started',
    component: 'AddListingFirst',
    isCompleted: false,
    isAccessible: true,
  },
  {
    id: 'step-one-intro',
    title: 'Tell us about your place',
    component: 'AddListingStepOne',
    isCompleted: false,
    isAccessible: true, // Make first few steps accessible by default
  },
  {
    id: 'property-type',
    title: 'Property Type',
    component: 'AddListingStepOnePlace',
    isCompleted: false,
    isAccessible: true, // Make this accessible since it's early in the flow
  },
  {
    id: 'location-map',
    title: 'Location & Map',
    component: 'AddListingStepOneMap',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'location-details',
    title: 'Address Details',
    component: 'AddListingStepOneLocation',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'basic-info',
    title: 'Basic Information',
    component: 'AddListingStepOneBasic',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'property-details',
    title: 'Property Details',
    component: 'AddListingStepOneDetails',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'step-two-intro',
    title: 'Make it stand out',
    component: 'AddListingStepTwo',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'photos',
    title: 'Add Photos',
    component: 'AddListingStepTwoPhotos',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'management',
    title: 'Management Settings',
    component: 'AddListingStepTwoManage',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'title',
    title: 'Property Title',
    component: 'AddListingStepTwoTitle',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'description',
    title: 'Description',
    component: 'AddListingStepTwoDescription',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'step-three-intro',
    title: 'Finish and publish',
    component: 'AddListingStepThree',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'legal',
    title: 'Legal Information',
    component: 'AddListingStepThreeLegal',
    isCompleted: false,
    isAccessible: false,
  },
  {
    id: 'pricing',
    title: 'Set Your Price',
    component: 'AddListingStepThreePrice',
    isCompleted: false,
    isAccessible: false,
  },
]

// Initial form data
const initialData: PropertyListingData = {
  // ... (initialData remains the same)
  propertyType: '',
  address: '',
  city: '',
  state: '',
  district: '',
  subdistrict: '',
  streetAddress: '',
  houseNumber: '',
  zipCode: '',
  latitude: undefined,
  longitude: undefined,
  autoFillDistance: undefined,
  bedrooms: 1,
  bathrooms: 1,
  areaSqm: 0,
  amenities: [],
  title: '',
  description: '',
  images: [],
  price: 0,
  isAvailable: true,
  legalDocuments: [],
  maintenanceIncluded: '',
  landlordType: '',
}

export const usePropertyListingStore = create<PropertyListingStore>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      data: initialData,
      steps: initialSteps,
      isLoading: false,
      isDirty: false,
      propertyId: null, // ✅ INITIALIZE: No property ID by default
      isEditingLoading: false, // ✅ INITIALIZE: Not loading by default

      // --- START NEW EDIT FUNCTION ---
      initializeForEdit: async (id: string) => {
        const { isDirty } = get();

        // Prevent fetching if we are already editing and the form has unsaved changes
        if (isDirty && get().propertyId === id) {
            console.warn('Form is dirty, skipping re-initialization.');
            return;
        }

        set({ propertyId: id, isEditingLoading: true, currentStep: 0 });
        console.log(`Attempting to fetch property ID: ${id} for editing.`);

        try {
            // FIX: Use hardcoded URL to fetch property details
            const detailUrl = `http://localhost:8000/api/properties/${id}`;
            const response = await fetch(detailUrl);

            if (!response.ok) {
                console.error('Failed to fetch property details:', response.status);
                throw new Error('Failed to fetch property for edit.');
            }

            const result: SinglePropertyResponse = await response.json();

            if (result.success && result.data) {
                const formData = mapBackendToFormData(result.data);

                // Load data, set all steps as accessible/completed to allow editing
                set((state) => ({
                    data: { ...state.data, ...formData },
                    steps: state.steps.map(step => ({
                        ...step,
                        isCompleted: true, // Mark all steps as completed
                        isAccessible: true, // Make all steps accessible
                    })),
                    // Reset to the beginning of the steps
                    currentStep: 0, 
                    isDirty: false, // Reset dirty status after loading
                }));
                console.log('Property data loaded successfully for editing.');
            } else {
                throw new Error(result.message || 'Failed to parse property data.');
            }

        } catch (error) {
            console.error('Error loading property for edit:', error);
            set({ propertyId: null, data: initialData }); // Revert to creation mode
        } finally {
            set({ isEditingLoading: false });
        }
      },
      // --- END NEW EDIT FUNCTION ---


      setCurrentStep: (step: number) => {
        // ... (remains the same)
        const { steps } = get()
        if (step >= 0 && step < steps.length && get().canAccessStep(step)) {
          set({ currentStep: step })
        }
      },

      updateData: (updates: Partial<PropertyListingData>) => {
        // ... (remains the same)
        set((state) => ({
          data: { ...state.data, ...updates },
          isDirty: true,
        }))
      },

      nextStep: () => {
        // ... (remains the same)
        const { currentStep, steps } = get()
        const nextStep = currentStep + 1
        
        if (nextStep < steps.length) {
          // Mark current step as completed and make next step accessible
          set((state) => ({
            currentStep: nextStep,
            steps: state.steps.map((step, index) => ({
              ...step,
              isCompleted: index === currentStep ? true : step.isCompleted,
              isAccessible: index === nextStep ? true : step.isAccessible,
            })),
          }))
        }
      },

      previousStep: () => {
        // ... (remains the same)
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      goToStep: (step: number) => {
        // ... (remains the same)
        if (get().canAccessStep(step)) {
          set({ currentStep: step })
        }
      },

      markStepCompleted: (stepIndex: number) => {
        // ... (remains the same)
        set((state) => ({
          steps: state.steps.map((step, index) => ({
            ...step,
            isCompleted: index === stepIndex ? true : step.isCompleted,
            isAccessible: index === stepIndex + 1 ? true : step.isAccessible,
          })),
        }))
      },

      validateCurrentStep: () => {
        // ... (remains the same)
        const { currentStep, data } = get()
        const currentStepData = get().steps[currentStep]
        
        console.log('Validating step:', currentStepData.id, 'with data:', data)
        
        // Add validation logic based on step
        switch (currentStepData.id) {
          case 'property-type': {
            const isValid = !!data.propertyType
            console.log('Property type validation:', isValid, 'propertyType:', data.propertyType)
            return isValid
          }
          case 'location-map':
            return !!(data.latitude && data.longitude)
          case 'location-details': {
            const isValid = !!(data.state && data.district)
            console.log('Location details validation:', {
              isValid,
              state: data.state,
              district: data.district,
              subdistrict: data.subdistrict
            })
            return isValid
          }
          case 'basic-info': {
            const isValid = data.bedrooms > 0 && data.bathrooms > 0 && data.areaSqm > 0
            console.log('Basic info validation:', {
              isValid,
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              areaSqm: data.areaSqm
            })
            return isValid
          }
          case 'photos': {
            const isValid = data.images.length >= 1
            console.log('Photos validation:', {
              isValid,
              imageCount: data.images.length,
              images: data.images
            })
            return isValid
          }
          case 'title':
            return !!data.title
          case 'description':
            return !!data.description
          case 'legal':
            return !!data.maintenanceIncluded && !!data.landlordType
          case 'pricing':
            return data.price > 0
          default:
            return true // For intro steps and steps without validation
        }
      },

      canAccessStep: (stepIndex: number) => {
        // ... (remains the same)
        const { steps } = get()
        if (stepIndex >= steps.length || stepIndex < 0) return false
        
        // First step is always accessible
        if (stepIndex === 0) return true
        
        // Check if step is marked as accessible
        return steps[stepIndex].isAccessible
      },

      resetForm: () => {
        set({
          currentStep: 0,
          data: initialData,
          steps: initialSteps,
          isDirty: false,
          propertyId: null, // Reset ID when form is cleared
        })
      },

      clearTemporaryData: () => {
        // Clear from localStorage
        localStorage.removeItem('property-listing-storage')
        get().resetForm()
      },

      submitForm: async () => {
        set({ isLoading: true })
        try {
          const { data, propertyId } = get() // Destructure propertyId
          
          // Validate required fields including propertyTypeId
          if (!data.propertyType) {
            throw new Error('Property type is required')
          }
          
          if (!data.propertyTypeId) {
            console.warn('No propertyTypeId found, using fallback mapping')
          }
          
          // Log images status
          if (data.images && data.images.length > 0) {
            console.log(`Property has ${data.images.length} images ready for upload:`, data.images)
          } else {
            console.warn('No images found in property data - property will be created without images')
          }
          
          // Check multiple ways to get auth token
          let token = null
          
          // Try localStorage
          if (typeof window !== 'undefined') {
            token = localStorage.getItem('authToken')
          }
          
          // If no token, check if it's in a different format or location
          if (!token && typeof window !== 'undefined') {
            // Check for alternative token storage
            const authData = localStorage.getItem('auth-storage')
            if (authData) {
              try {
                const parsed = JSON.parse(authData)
                token = parsed.state?.token || parsed.token
              } catch {
                // Silent fail for parsing errors
              }
            }
          }
          
          if (!token) {
            // Redirect to login page instead of throwing an error
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
            return
          }
          
          // Map property data to upload format (now includes dynamic propertyTypeId)
          const uploadData = mapPropertyListingToUploadRequest(data)
          
          // --- UPDATE SUBMISSION LOGIC FOR EDITING ---
          const method = propertyId ? 'PUT' : 'POST';
          const url = propertyId 
              ? `http://localhost:8000/api/properties/${propertyId}` 
              : `http://localhost:8000/api/properties`; // Creation endpoint
          
          console.log(`Submitting property with method: ${method} to URL: ${url}`);

          const response = await fetch(url, {
              method: method,
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(uploadData),
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API submission failed with status ${response.status}: ${errorText}`);
          }
          
          // Clear temporary data after successful submission/update
          get().clearTemporaryData()
          
        } catch (error) {
          console.error('Error submitting property listing:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'property-listing-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
        steps: state.steps,
        isDirty: state.isDirty,
        propertyId: state.propertyId, // ✅ PERSIST: Save the propertyId for edits
      }),
    }
  )
)

export default usePropertyListingStore