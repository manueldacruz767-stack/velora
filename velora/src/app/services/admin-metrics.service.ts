import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminMetrics {
  total_users: number;
  total_vendedores: number;
  total_produtos: number;
  total_pedidos: number;
  pedidos_pendentes: number;
  pedidos_pagos: number;
  faturamento_total: number;
  saldo_admin: number;
  novos_utilizadores: { dia: string; total: number }[];
  pedidos_por_dia: { dia: string; total: number; receita: number }[];
  avaliacoes_mes: number;
}

export interface AdminMetricsResponse {
  data: AdminMetrics;
}

@Injectable({ providedIn: 'root' })
export class AdminMetricsService {
  private apiUrl = `${environment.backendUrl}/admin/metrics`;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<AdminMetricsResponse> {
    return this.http.get<AdminMetricsResponse>(this.apiUrl);
  }
}
