import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ProxyPayPaymentRequest {
  amount: number;
  custom_fields: {
    nome_cliente: string;
    pedido_id: string;
  };
}

export interface ProxyPayMockResponse {
  entidade: string;
  referencia: string;
  valor: number;
  expiracao: string;
}

@Injectable({ providedIn: 'root' })
export class ProxyPayService {

  private gerarReferencia(length: number = 9): string {
    let ref = '';
    for (let i = 0; i < length; i++) {
      ref += Math.floor(Math.random() * 10).toString();
    }
    return ref;
  }

  private calcularExpiracao(): string {
    const agora = new Date();
    agora.setHours(agora.getHours() + 48);
    return agora.toISOString();
  }

  gerarReferenciaMulticaixa(
    valorKz: number,
    nomeCliente: string,
    pedidoId: string
  ): Observable<ProxyPayMockResponse> {
    const mockResponse: ProxyPayMockResponse = {
      entidade: '99999',
      referencia: this.gerarReferencia(9),
      valor: valorKz,
      expiracao: this.calcularExpiracao()
    };

    const request: ProxyPayPaymentRequest = {
      amount: valorKz,
      custom_fields: {
        nome_cliente: nomeCliente,
        pedido_id: pedidoId
      }
    };

    console.log('[ProxyPay Mock] Enviando requisição:', JSON.stringify(request, null, 2));
    console.log('[ProxyPay Mock] Resposta simulada:', JSON.stringify(mockResponse, null, 2));

    return of(mockResponse);
  }

  simularPagamentoATM(): Observable<{ success: boolean; message: string }> {
    console.log('[ProxyPay Mock] SimularPagamento no ATM — pagamento confirmado com sucesso!');
    return of({
      success: true,
      message: 'Pagamento confirmado com sucesso via ATM.'
    });
  }

  formatarDataExpiracao(isoString: string): string {
    const data = new Date(isoString);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  }
}
