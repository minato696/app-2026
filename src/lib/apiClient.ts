// src/lib/apiClient.ts
import config from '@/config';

/**
 * Cliente API seguro para hacer peticiones internas
 */
class APIClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = config.apiUrl;
    
    // Si estamos accediendo desde una IP, asegurarnos de que los requests funcionen correctamente
    if (typeof window !== 'undefined') {
      const currentHost = window.location.host;
      
      // Verificar si el host actual está en la lista de dominios permitidos
      const isAllowedHost = config.allowedDomains.some(domain => 
        currentHost.includes(domain) || currentHost.includes(domain.split(':')[0])
      );
      
      if (isAllowedHost && this.baseURL === '') {
        // Forzar a usar URL relativas incluso cuando accedemos por IP
        this.baseURL = '';
      }
    }
  }
  
  private async fetcher(endpoint: string, options: RequestInit = {}) {
    // Asegurar que endpoint empieza con /
    const normalizedEndpoint = !endpoint.startsWith('/') ? `/${endpoint}` : endpoint;
    
    // Obtener el host actual para incluirlo en los headers (para CORS)
    const currentHost = typeof window !== 'undefined' ? window.location.host : '';
    
    const response = await fetch(`${this.baseURL}${normalizedEndpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Host': currentHost, // Agregar host actual como header
        ...options.headers,
      },
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      console.error(`Error en la petición a ${normalizedEndpoint}:`, response.status, response.statusText);
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async getStations() {
    return this.fetcher('/api/stations');
  }
  
  async getPrograms(stationId?: string) {
    const query = stationId ? `?stationId=${stationId}` : '';
    return this.fetcher(`/api/programs${query}`);
  }
  
  async getCurrentProgram(stationId: string) {
    return this.fetcher(`/api/current-program?stationId=${stationId}`);
  }
  
  async uploadImage(formData: FormData) {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: formData,
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`Upload Error: ${response.status}`);
    }
    
    return response.json();
  }
}

export const apiClient = new APIClient();