import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  private apiUrl = 'https://v6.exchangerate-api.com/v6/06adf76e108b76c0f22f9192/latest/USD';
  private taxaFixa = 850;

  constructor(private http: HttpClient) { }

  getTaxa(): Observable<number> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.conversion_rates?.AOA || this.taxaFixa),
      catchError(() => of(this.taxaFixa))
    );
  }

  converterParaKz(priceUSD: number, taxa: number): number {
    return Math.round(priceUSD * taxa);
  }

  formatarKz(valor: number): string {
    return `${valor.toLocaleString('pt-AO')} Kz`;
  }

  formatarUSD(valor: number): string {
    return `$${valor.toFixed(2)}`;
  }
}
