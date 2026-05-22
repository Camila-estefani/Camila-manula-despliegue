import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../models/auth.model';
import { ClientProfileUpdateRequest } from '../models/client-profile.model';

export interface FileUploadResponse {
  url: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class ClientProfileService {
  private readonly apiUrl = `${environment.apiUrl}/v1/api/auth/me`;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(this.apiUrl);
  }

  updateProfile(request: ClientProfileUpdateRequest): Observable<AuthUser> {
    return this.http.put<AuthUser>(this.apiUrl, request);
  }

  uploadProfileImage(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileUploadResponse>(`${environment.apiUrl}/v1/api/auth/me/photo`, formData);
  }
}