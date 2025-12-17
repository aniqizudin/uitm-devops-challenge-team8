// src/utils/propertiesApiClient.ts

import type { Property, PropertiesResponse, SearchFilters } from '@/types/property';
import { protectedFetch, publicFetch } from './apiClient'; // ✅ USING THE NEW CLIENT

// Define the shape of the successful response for a single item (for type safety)
interface PropertySingleResponse {
    success: boolean;
    data: Property;
    message?: string;
}

// Define the shape of the successful response for property view (for type safety)
interface PropertyViewResponse {
    success: boolean;
    data: {
        property: Property;
        // The view logging response often returns the property data itself
    };
    message?: string;
}

// Define the shape of the successful response for deletion
interface DeleteResponse {
    success: boolean;
    message: string;
}


/**
 * Properties API client
 */
export class PropertiesApiClient {
  
  /**
   * Log a property view (Public POST call)
   */
  static async logPropertyView(propertyId: string): Promise<PropertyViewResponse> {
    try {
      // ✅ Using publicFetch for a public, fire-and-forget POST
      const response = await publicFetch(`/properties/${propertyId}/view`, {
        method: 'POST',
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log property view');
      }

      // Note: We are returning the response data here, even though we just log the view
      return data as PropertyViewResponse;
    } catch (error) {
      console.error('Property view logging API error:', error);
      throw error instanceof Error ? error : new Error('Network error occurred');
    }
  }

  /**
   * Get property details (Public GET call)
   */
  static async getProperty(propertyId: string): Promise<Property> {
    try {
      // ✅ Using publicFetch for property details
      const response = await publicFetch(`/properties/${propertyId}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get property details');
      }

      // The backend returns property data in data.data structure
      const backendProperty = data.data || data.data?.property; 
      if (!backendProperty) {
        throw new Error('No property data found in response');
      }

      // Map backend response to frontend Property interface
      const propertyData: Property = {
        ...backendProperty,
        type: backendProperty.propertyType?.code || 'APARTMENT',
        price: typeof backendProperty.price === 'string' ? parseFloat(backendProperty.price) : backendProperty.price,
        area: backendProperty.area || backendProperty.areaSqm || 0,
      }

      return propertyData;
    } catch (error) {
      console.error('Get property API error:', error);
      throw error instanceof Error ? error : new Error('Network error occurred');
    }
  }

  /**
   * Search properties (Public GET call)
   */
  static async searchProperties(filters: SearchFilters = {}): Promise<PropertiesResponse> {
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const queryString = params.toString()
      const endpoint = `/properties${queryString ? `?${queryString}` : ''}`

      // ✅ Using publicFetch for public search
      const response = await publicFetch(endpoint);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search properties');
      }

      return data as PropertiesResponse;
    } catch (error) {
      console.error('Search properties API error:', error);
      throw error instanceof Error ? error : new Error('Network error occurred');
    }
  }

  /**
   * Get properties owned by the current user (Protected GET call)
   */
  static async getMyProperties(page: number = 1, limit: number = 10): Promise<PropertiesResponse> {
    try {
      const response = await protectedFetch(`/properties/my-properties?page=${page}&limit=${limit}`);
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user properties');
      }

      return data as PropertiesResponse;
    } catch (error) {
      console.error('Get My Properties API error:', error);
      throw error instanceof Error ? error : new Error('Network error occurred');
    }
  }


  /**
   * Create a new property (Protected POST call)
   */
  static async createProperty(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    try {
      // ✅ Using protectedFetch for creation
      const response = await protectedFetch('/properties', {
        method: 'POST',
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create property');
      }

      return data.data as Property;
    } catch (error) {
      console.error('Create property API error:', error);
      throw error instanceof Error ? error : new Error('Network error occurred');
    }
  }

  /**
   * Update an existing property (Protected PUT call)
   */
  static async updateProperty(propertyId: string, updates: Partial<Property>): Promise<Property> {
    try {
      // ✅ Using protectedFetch for update
      const response = await protectedFetch(`/properties/${propertyId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update property');
      }

      return data.data as Property;
    } catch (error) {
      console.error('Update property API error:', error);
      throw error instanceof Error ? error : new Error('Network error occurred');
    }
  }

  /**
   * Delete a property (Protected DELETE call)
   */
  static async deleteProperty(propertyId: string): Promise<DeleteResponse> {
    try {
      // ✅ Using protectedFetch for deletion
      const response = await protectedFetch(`/properties/${propertyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete property');
      }

      return data as DeleteResponse;
    } catch (error) {
      console.error('Delete property API error:', error);
      throw error instanceof Error ? error : new Error('Network error occurred');
    }
  }
}