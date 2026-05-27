import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, map, of, tap, delay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProxyPayReference {
  id: number;
}

export interface ProxyPayCreateResponse {
  reference_id: number;
  amount: string;
  expires_at: string;
}

export interface PaymentStatus {
  status: 'pending' | 'confirmed' | 'failed';
  reference: string;
  message?: string;
}

export interface PayPalTokenResponse {
  access_token: string;
}

export interface PayPalCreateResponse {
  paypal_order_id: string;
  approve_url: string;
  status: string;
}

export interface PayPalCaptureResponse {
  success: boolean;
  order_id: number;
  paypal_status: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: 'USD' | 'AOA';
  paymentMethod: 'proxypay' | 'paypal';
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  redirectUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = `${environment.backendUrl}/payment`;

  constructor(private http: HttpClient) {}

  // ─── Local Reference (display only) ─────────────────────────

  createReference(): string {
    const num = Math.floor(100000000 + Math.random() * 900000000).toString();
    return num.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  // ─── ProxyPay ────────────────────────────────────────────────

  generateReferenceId(): Observable<ProxyPayReference> {
    return this.http.post<ProxyPayReference>(`${this.apiUrl}/reference`, {});
  }

  createPaymentReference(referenceId: number, amount: string, orderId: string): Observable<ProxyPayCreateResponse> {
    return this.http.post<ProxyPayCreateResponse>(`${this.apiUrl}/create`, {
      reference_id: referenceId,
      amount,
      order_id: orderId
    });
  }

  pollPaymentStatus(): Observable<PaymentStatus[]> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/status`).pipe(
      map(res => res.data.map(p => ({
        status: 'confirmed' as const,
        reference: String(p.id),
        message: 'Pagamento recebido'
      })))
    );
  }

  confirmPayment(paymentId: string): Observable<{ success: boolean; order_id: number }> {
    return this.http.delete<{ success: boolean; order_id: number }>(`${this.apiUrl}/confirm/${paymentId}`);
  }

  simulateProxyPay(reference: string): Observable<PaymentStatus> {
    return of({
      status: 'confirmed' as const,
      reference,
      message: 'Pagamento confirmado com sucesso'
    }).pipe(delay(5000));
  }

  // ─── Unified Payment Processing ───────────────────────────

  processPayment(data: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}`, data);
  }

  confirmPayPalOrder(orderId: string): Observable<{ success: boolean; order_id: number }> {
    return this.http.post<{ success: boolean; order_id: number }>(`${this.apiUrl}/paypal-confirm`, { paypal_order_id: orderId });
  }

  // ─── PayPal ──────────────────────────────────────────────────

  getPaypalToken(): Observable<PayPalTokenResponse> {
    return this.http.post<PayPalTokenResponse>(`${this.apiUrl}/paypal/token`, {});
  }

  createPaypalOrder(amountUsd: string, amountKz: string, orderId: string): Observable<PayPalCreateResponse> {
    return this.http.post<PayPalCreateResponse>(`${this.apiUrl}/paypal/create`, {
      amount_usd: amountUsd,
      amount_kz: amountKz,
      order_id: orderId
    });
  }

  capturePaypalOrder(paypalOrderId: string): Observable<PayPalCaptureResponse> {
    return this.http.post<PayPalCaptureResponse>(`${this.apiUrl}/paypal/capture`, {
      paypal_order_id: paypalOrderId
    });
  }
}
