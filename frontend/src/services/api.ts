// API service functions for the Model Railroad Layout Tracking System

const API_BASE_URL = 'http://localhost:3001/api';

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

  // Other entities
  async getLocomotives() {
    return this.request('/locomotives');
  }

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

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
