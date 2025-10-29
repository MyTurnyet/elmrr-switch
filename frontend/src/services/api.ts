// API service functions for the Model Railroad Layout Tracking System

import type {
  OperatingSession,
  Train,
  CarOrder,
  Route,
  Locomotive,
  LocomotiveStatistics,
  LocomotiveTrainAssignment,
  TrainFormData,
  LocomotiveFormData,
  CarOrderGenerationRequest,
  CarOrderGenerationSummary,
  TrainStatus,
  CarOrderStatus,
} from '../types';

const API_BASE_URL = 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  // Cars API
  async getCars(filters?: { carType?: string; location?: string; status?: string; homeYard?: string }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/cars${query}`);
  }

  async getCar(id: string) {
    return this.request(`/cars/${id}`);
  }

  async createCar(data: any) {
    return this.request('/cars', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCar(id: string, data: any) {
    return this.request(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async moveCar(carId: string, destinationIndustryId: string) {
    return this.request(`/cars/${carId}/move`, {
      method: 'POST',
      body: JSON.stringify({ destinationIndustryId }),
    });
  }

  async deleteCar(id: string) {
    return this.request(`/cars/${id}`, {
      method: 'DELETE',
    });
  }

  // Industries API
  async getIndustries() {
    return this.request('/industries');
  }

  async getIndustry(id: string) {
    return this.request(`/industries/${id}`);
  }

  async getIndustryCars(id: string) {
    return this.request(`/industries/${id}/cars`);
  }

  async createIndustry(data: any) {
    return this.request('/industries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIndustry(id: string, data: any) {
    return this.request(`/industries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIndustry(id: string) {
    return this.request(`/industries/${id}`, {
      method: 'DELETE',
    });
  }

  // Other entities (locomotives moved to dedicated section below)

  async getStations() {
    return this.request('/stations');
  }

  async getGoods() {
    return this.request('/goods');
  }

  async getAarTypes() {
    return this.request('/aar-types');
  }

  async getBlocks() {
    return this.request('/blocks');
  }

  async getTracks() {
    return this.request('/tracks');
  }

  // Import/Export API
  async importData(data: any) {
    return this.request('/import/json', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async exportData() {
    return this.request('/import/export');
  }

  async clearData() {
    return this.request('/import/clear', {
      method: 'POST',
    });
  }

  // Routes API
  async getRoutes() {
    return this.request<Route[]>('/routes');
  }

  async getRoute(id: string) {
    return this.request<Route>(`/routes/${id}`);
  }

  async createRoute(data: Partial<Route>) {
    return this.request<Route>('/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoute(id: string, data: Partial<Route>) {
    return this.request<Route>(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoute(id: string) {
    return this.request<void>(`/routes/${id}`, {
      method: 'DELETE',
    });
  }

  // Operating Sessions API
  async getCurrentSession() {
    return this.request<OperatingSession>('/sessions/current');
  }

  async advanceSession() {
    return this.request<OperatingSession>('/sessions/advance', {
      method: 'POST',
    });
  }

  async rollbackSession() {
    return this.request<OperatingSession>('/sessions/rollback', {
      method: 'POST',
    });
  }

  async updateSessionDescription(description: string) {
    return this.request<OperatingSession>('/sessions/current', {
      method: 'PUT',
      body: JSON.stringify({ description }),
    });
  }

  // Trains API
  async getTrains(filters?: {
    sessionNumber?: number;
    status?: TrainStatus;
    routeId?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Train[]>(`/trains${query}`);
  }

  async getTrain(id: string) {
    return this.request<Train>(`/trains/${id}`);
  }

  async createTrain(data: TrainFormData) {
    return this.request<Train>('/trains', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTrain(id: string, data: Partial<TrainFormData>) {
    return this.request<Train>(`/trains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTrain(id: string) {
    return this.request<void>(`/trains/${id}`, {
      method: 'DELETE',
    });
  }

  async generateSwitchList(id: string) {
    return this.request<Train>(`/trains/${id}/generate-switch-list`, {
      method: 'POST',
    });
  }

  async completeTrain(id: string) {
    return this.request<Train>(`/trains/${id}/complete`, {
      method: 'POST',
    });
  }

  async cancelTrain(id: string) {
    return this.request<Train>(`/trains/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Car Orders API
  async getCarOrders(filters?: {
    industryId?: string;
    status?: CarOrderStatus;
    sessionNumber?: number;
    aarTypeId?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<CarOrder[]>(`/car-orders${query}`);
  }

  async getCarOrder(id: string) {
    return this.request<CarOrder>(`/car-orders/${id}`);
  }

  async createCarOrder(data: Partial<CarOrder>) {
    return this.request<CarOrder>('/car-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCarOrder(id: string, data: Partial<CarOrder>) {
    return this.request<CarOrder>(`/car-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCarOrder(id: string) {
    return this.request<void>(`/car-orders/${id}`, {
      method: 'DELETE',
    });
  }

  async generateCarOrders(request?: CarOrderGenerationRequest) {
    return this.request<CarOrderGenerationSummary>('/car-orders/generate', {
      method: 'POST',
      body: JSON.stringify(request || {}),
    });
  }

  // Locomotives API
  async getLocomotives(filters?: {
    manufacturer?: string;
    model?: string;
    homeYard?: string;
    isInService?: boolean;
    isDCC?: boolean;
    search?: string;
    view?: 'list' | 'detail' | 'export';
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.request<Locomotive[]>(`/locomotives${query ? `?${query}` : ''}`);
  }

  async getLocomotiveStatistics() {
    return this.request<LocomotiveStatistics>('/locomotives/statistics');
  }

  async getAvailableLocomotives() {
    return this.request<Locomotive[]>('/locomotives/available');
  }

  async getLocomotiveById(id: string) {
    return this.request<Locomotive>(`/locomotives/${id}`);
  }

  async getLocomotiveAssignments(id: string) {
    return this.request<LocomotiveTrainAssignment>(`/locomotives/${id}/assignments`);
  }

  async createLocomotive(data: LocomotiveFormData) {
    return this.request<Locomotive>('/locomotives', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocomotive(id: string, data: Partial<LocomotiveFormData>) {
    return this.request<Locomotive>(`/locomotives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocomotive(id: string) {
    return this.request<void>(`/locomotives/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
