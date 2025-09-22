// src/lib/rateLimiter.ts
import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private readonly windowMs: number;
  private readonly maxRequests: number;
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Limpiar IPs antiguas cada minuto
    setInterval(() => this.cleanup(), 60000);
  }
  
  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }
  
  private getClientIdentifier(request: NextRequest): string {
    // Obtener IP del cliente
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Combinar con user-agent para mejor identificación
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }
  
  public isRateLimited(request: NextRequest): boolean {
    const clientId = this.getClientIdentifier(request);
    const now = Date.now();
    
    if (!this.store[clientId]) {
      this.store[clientId] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return false;
    }
    
    const client = this.store[clientId];
    
    if (client.resetTime < now) {
      client.count = 1;
      client.resetTime = now + this.windowMs;
      return false;
    }
    
    client.count++;
    return client.count > this.maxRequests;
  }
  
  public getRemainingRequests(request: NextRequest): number {
    const clientId = this.getClientIdentifier(request);
    const client = this.store[clientId];
    
    if (!client) return this.maxRequests;
    
    const now = Date.now();
    if (client.resetTime < now) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - client.count);
  }
}

// Crear instancias para diferentes endpoints
export const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests por minuto
export const uploadRateLimiter = new RateLimiter(300000, 10); // 10 uploads por 5 minutos