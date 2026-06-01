import axios from 'axios';
import { AUTH_STATES, setAuthState } from './authState';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000
});

console.log('[api] baseURL =', API_BASE_URL || '(same-origin)');

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[api] request failed', {
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      method: error?.config?.method,
      status: error?.response?.status,
      message: error?.message
    });
    const status = error?.response?.status;
    if (status === 401) {
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong') {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
}

export default api;
