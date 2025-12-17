// src/utils/apiClient.ts

const BASE_URL = 'http://localhost:8000/api'; 

const getToken = () => localStorage.getItem('authToken');

// Generic function to make protected API calls (requires token)
export const protectedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// Generic function for public calls (used for public search, public property details)
export const publicFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
        'Accept': 'application/json',
        ...options.headers,
    }
  });
  return response;
};