// Set VITE_API_URL in Vercel to your deployed backend URL, e.g.
// https://your-hostelhub-api.onrender.com/api
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\\/$/, '');

const getHeaders = () => {
  const token = localStorage.getItem('hostelhub_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Helper for requests
  request: async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = getHeaders();
    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed.');
      }
      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  },

  get: (endpoint, options = {}) => {
    return api.request(endpoint, { ...options, method: 'GET' });
  },

  post: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete: (endpoint, options = {}) => {
    return api.request(endpoint, { ...options, method: 'DELETE' });
  }
};
