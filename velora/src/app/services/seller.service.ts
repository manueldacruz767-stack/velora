import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../interfaces/product';

export interface WalletData {
  user_id: number;
  saldo: number;
  saldo_bloqueado: number;
}

export interface SellerWalletResponse {
  data: WalletData;
  vendas_entregues: number;
}

export interface SellerProductsResponse {
  data: Product[];
}

@Injectable({ providedIn: 'root' })
export class SellerService {
  private apiUrl = `${environment.backendUrl}/seller`;

  constructor(private http: HttpClient) {}

  getWallet(): Observable<SellerWalletResponse> {
    return this.http.get<SellerWalletResponse>(`${this.apiUrl}/wallet`);
  }

  getProducts(): Observable<SellerProductsResponse> {
    return this.http.get<SellerProductsResponse>(`${this.apiUrl}/products`);
  }

  updateStock(productId: number, stock: number): Observable<{ data: Product; message: string }> {
    return this.http.put<{ data: Product; message: string }>(
      `${this.apiUrl}/products/${productId}/stock`, { stock }
    );
  }

  uploadImage(productId: number, file: File): Observable<{ data: Product; message: string }> {
    const formData = new FormData();
    formData.append('imagem', file);
    return this.http.post<{ data: Product; message: string }>(
      `${this.apiUrl}/products/${productId}/image`, formData
    );
  }
}
