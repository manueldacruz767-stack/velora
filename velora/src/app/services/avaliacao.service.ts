import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AvaliacaoResponse } from '../interfaces/avaliacao';

@Injectable({ providedIn: 'root' })
export class AvaliacaoService {
  private apiUrl = `${environment.backendUrl}/avaliacoes`;

  constructor(private http: HttpClient) {}

  getByProduct(productId: number): Observable<AvaliacaoResponse> {
    return this.http.get<AvaliacaoResponse>(`${this.apiUrl}/${productId}`);
  }

  create(productId: number, rating: number, comentario: string): Observable<AvaliacaoResponse> {
    return this.http.post<AvaliacaoResponse>(`${this.apiUrl}/${productId}`, { rating, comentario });
  }
}
