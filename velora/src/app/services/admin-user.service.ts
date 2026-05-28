import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PendingUser {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  status: string;
  created_at: string;
}

export interface AdminResponse {
  message: string;
  data: PendingUser;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private apiUrl = `${environment.backendUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  getPendingUsers(): Observable<{ data: PendingUser[] }> {
    return this.http.get<{ data: PendingUser[] }>(`${this.apiUrl}/pendentes`);
  }

  approveUser(id: number): Observable<AdminResponse> {
    return this.http.post<AdminResponse>(`${this.apiUrl}/${id}/aprovar`, {});
  }

  rejectUser(id: number): Observable<AdminResponse> {
    return this.http.post<AdminResponse>(`${this.apiUrl}/${id}/rejeitar`, {});
  }
}
