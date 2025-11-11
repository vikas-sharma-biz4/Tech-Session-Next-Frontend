import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { ROUTES } from '@/constants';

const api: AxiosInstance = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include httpOnly cookies in requests
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired - redirect to login
      window.location.href = ROUTES.LOGIN;
    }
    return Promise.reject(error);
  }
);

export default api;

