import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 600000, // 10 minutes
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor to add global loading state or auth tokens
api.interceptors.request.use(
  (config) => {
    // skipLoading can be passed in config to avoid the spinner
    const skip = (config as any).skipLoading;
    if (typeof window !== 'undefined' && !skip) {
      window.dispatchEvent(new Event('api-request-start'));
    }
    return config;
  },
  (error) => {
    // If request never started due to setup error
    if (typeof window !== 'undefined' && !(error.config as any)?.skipLoading) {
      window.dispatchEvent(new Event('api-request-end'));
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally and stop loading state
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined' && !(response.config as any).skipLoading) {
      window.dispatchEvent(new Event('api-request-end'));
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      const skip = (error.config as any)?.skipLoading;
      if (!skip) {
        window.dispatchEvent(new Event('api-request-end'));
      }
      const url = error.config?.url || '';
      const isVoiceCall = url.includes('/voice/');
      const isNetworkError = !error.response; // connection refused / timeout

      if (isVoiceCall) {
        // Voice calls handle their own errors — stay silent here
      } else if (isNetworkError && !skip) {
        console.warn('[NavAI API] Backend unreachable:', error.message);
      } else if (!skip) {
        console.error('API Error:', error.response?.status, error.response?.data || error.message);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
