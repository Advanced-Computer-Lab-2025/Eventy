// API service for bazaars
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';


export interface Bazaar {
  _id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  attendees?: number;
  capacity?: number;
  bannerImage?: string;
  eventType: "bazaar";
  createdBy: string;
  professors?: Array<{ name: string; email: string }>;
}

export interface Application {
  _id: string;
  bazaarId: {
    _id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
  };
  type: "bazaar" | "booth";
  attendees: Array<{ name: string; email: string }>;
  boothSize: "2x2" | "4x4";
  durationWeeks?: number;
  locationPreference?: string;
  status: "pending" | "accepted" | "rejected";
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

class BazaarApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getUpcomingBazaars(): Promise<Bazaar[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/upcoming`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<Bazaar[]> = await response.json();
      
      // Filter only bazaars from the response
      const bazaars = apiResponse.data.filter(event => event.eventType === "bazaar");
      
      return bazaars;
    } catch (error) {
      console.error("Error fetching upcoming bazaars:", error);
      throw error;
    }
  }

  async getBazaarsByStatus(status?: string): Promise<Bazaar[]> {
    try {
      const params = new URLSearchParams();
      if (status) {
        params.append("status", status);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/events/search?type=bazaar${status ? `&status=${status}` : ''}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<Bazaar[]> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error("Error fetching bazaars by status:", error);
      throw error;
    }
  }

  async searchBazaars(query: string): Promise<Bazaar[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/search?name=${encodeURIComponent(query)}&type=bazaar`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<Bazaar[]> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error("Error searching bazaars:", error);
      throw error;
    }
  }

  async registerForBazaar(bazaarId: string): Promise<void> {
    try {
      // This method is deprecated - use applyToBazaar instead
      console.warn("registerForBazaar is deprecated. Use applyToBazaar with proper application data.");
      throw new Error("Please use the vendor application form instead of direct registration.");
    } catch (error) {
      console.error("Error registering for bazaar:", error);
      throw error;
    }
  }

  async getApplicationsByStatus(status?: string): Promise<Application[]> {
    try {
      const params = new URLSearchParams();
      if (status) {
        params.append("status", status);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/applications/me?${params.toString()}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<Application[]> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }
  }

  async getPendingApplications(): Promise<Application[]> {
    return this.getApplicationsByStatus("pending");
  }

  async getRejectedApplications(): Promise<Application[]> {
    return this.getApplicationsByStatus("rejected");
  }

  async getApprovedApplications(): Promise<Application[]> {
    return this.getApplicationsByStatus("accepted");
  }

  async applyToBazaar(bazaarId: string, applicationData: {
    attendees: Array<{ name: string; email: string }>;
    boothSize: "2x2" | "4x4";
  }): Promise<Application> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/bazaars/${bazaarId}/apply`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          bazaarId,
          type: "booth",
          ...applicationData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ApiResponse<Application> = await response.json();
      return apiResponse.data;
    } catch (error) {
      console.error("Error applying to bazaar:", error);
      throw error;
    }
  }
}

export const bazaarApiService = new BazaarApiService();
