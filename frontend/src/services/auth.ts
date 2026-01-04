/**
 * Authentication Service
 * Handles user authentication, token management, and authorization
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Token storage key
const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_info';

// Token response interface
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

// User info interface
export interface UserInfo {
  user_id: string;
  email: string;
  username: string;
  full_name?: string;
  phone?: string;
  company?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  remaining_quota: number;
  total_quota: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// Register data interface
export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  phone?: string;
  company?: string;
}

// Login data interface
export interface LoginData {
  username: string;
  password: string;
}

// Quota info interface
export interface QuotaInfo {
  remaining_quota: number;
  total_quota: number;
  used_quota: number;
  quota_percentage: number;
}

// Package interface
export interface Package {
  package_id: string;
  package_name: string;
  quota_amount: number;
  price: number;
  discount: number;
  description?: string;
  features: string[];
  is_active: boolean;
}

// Order interface
export interface Order {
  order_id: string;
  user_id: string;
  package_name: string;
  quota_amount: number;
  price: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  payment_method?: string;
  paid_at?: string;
  created_at: string;
}

/**
 * Authentication Service Class
 */
class AuthService {
  private token: string | null = null;
  private user: UserInfo | null = null;

  constructor() {
    // Load token and user from localStorage on init
    this.loadFromStorage();
  }

  /**
   * Load authentication data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken) {
        this.token = storedToken;
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }

      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      this.clearStorage();
    }
  }

  /**
   * Save authentication data to localStorage
   */
  private saveToStorage(token: string, user: UserInfo): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear authentication data from localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<UserInfo> {
    try {
      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/auth/register`,
        data
      );

      const { access_token, user } = response.data;

      // Auto-login after registration
      this.token = access_token;
      this.user = user;

      this.saveToStorage(access_token, user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return user;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Registration failed');
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<UserInfo> {
    try {
      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/auth/login`,
        data
      );

      const { access_token, user } = response.data;

      this.token = access_token;
      this.user = user;

      this.saveToStorage(access_token, user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return user;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Login failed');
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    this.token = null;
    this.user = null;

    this.clearStorage();
    delete axios.defaults.headers.common['Authorization'];
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserInfo | null {
    return this.user;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  /**
   * Get quota information
   */
  async getQuotaInfo(): Promise<QuotaInfo> {
    try {
      const response = await axios.get<QuotaInfo>(
        `${API_BASE_URL}/auth/quota`
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Failed to fetch quota info');
    }
  }

  /**
   * Get available packages
   */
  async getPackages(): Promise<Package[]> {
    try {
      const response = await axios.get<Package[]>(
        `${API_BASE_URL}/auth/packages?is_active=true`
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Failed to fetch packages');
    }
  }

  /**
   * Create an order
   */
  async createOrder(packageId: string, paymentMethod?: string): Promise<Order> {
    try {
      const response = await axios.post<Order>(
        `${API_BASE_URL}/auth/orders`,
        {
          package_id: packageId,
          payment_method: paymentMethod
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Failed to create order');
    }
  }

  /**
   * Pay for an order
   */
  async payOrder(orderId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/orders/${orderId}/pay`
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Payment failed');
    }
  }

  /**
   * Get user orders
   */
  async getOrders(page: number = 1, pageSize: number = 10): Promise<{ orders: Order[]; total: number }> {
    try {
      const response = await axios.get<{ orders: Order[]; total: number }>(
        `${API_BASE_URL}/auth/orders`,
        {
          params: { page, page_size: pageSize }
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Failed to fetch orders');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserInfo>): Promise<UserInfo> {
    try {
      // Note: This endpoint needs to be implemented in backend
      const response = await axios.patch<UserInfo>(
        `${API_BASE_URL}/auth/profile`,
        data
      );

      // Update local user info
      this.user = { ...this.user, ...response.data } as UserInfo;
      this.saveToStorage(this.token!, this.user);

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail: string }>;
      throw new Error(axiosError.response?.data?.detail || 'Failed to update profile');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export axios instance configured with auth
export const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
authAxios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data and redirect to login
      authService.logout();

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
