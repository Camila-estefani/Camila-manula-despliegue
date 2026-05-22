import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClientRequest,
  ClientRequestActionRequest,
  ClientRequestActionResponse
} from '../models/client-request.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientRequestService {
  private readonly apiUrl = `${environment.apiUrl}/v1/api/client-request`;

  constructor(private readonly http: HttpClient) {}

  submitRequest(request: ClientRequest): Observable<ClientRequest> {
    return this.http.post<ClientRequest>(`${this.apiUrl}/save`, request);
  }

  getAllRequests(): Observable<ClientRequest[]> {
    return this.http.get<ClientRequest[]>(`${this.apiUrl}/`);
  }

  getRequestById(id: number): Observable<ClientRequest> {
    return this.http.get<ClientRequest>(`${this.apiUrl}/${id}`);
  }

  getRequestsByStatus(status: string): Observable<ClientRequest[]> {
    return this.http.get<ClientRequest[]>(`${this.apiUrl}/status/${status}`);
  }

  approveRequest(id: number, request?: ClientRequestActionRequest): Observable<ClientRequestActionResponse> {
    return this.http.patch<ClientRequestActionResponse>(`${this.apiUrl}/${id}/approve`, request ?? {});
  }

  rejectRequest(id: number, request?: ClientRequestActionRequest): Observable<ClientRequestActionResponse> {
    return this.http.patch<ClientRequestActionResponse>(`${this.apiUrl}/${id}/reject`, request ?? {});
  }
}
