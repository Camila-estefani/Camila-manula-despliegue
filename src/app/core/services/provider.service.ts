import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Provider } from '../models/provider.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly apiUrl = `${environment.apiUrl}/v1/api/provider`;

  constructor(private readonly http: HttpClient) {}

  getAllProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.apiUrl}/`);
  }

  getProviderById(id: number): Observable<Provider> {
    return this.http.get<Provider>(`${this.apiUrl}/${id}`);
  }

  createProvider(provider: Provider): Observable<Provider> {
    return this.http.post<Provider>(`${this.apiUrl}/save`, provider);
  }

  updateProvider(id: number, provider: Provider): Observable<Provider> {
    return this.http.put<Provider>(`${this.apiUrl}/update/${id}`, provider);
  }

  patchProvider(id: number, provider: Partial<Provider>): Observable<Provider> {
    return this.http.put<Provider>(`${this.apiUrl}/update/${id}`, provider);
  }

  deleteProvider(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, {});
  }

  restoreProvider(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/restore/${id}`, {});
  }

  getActiveProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.apiUrl}/state/true`);
  }
}
