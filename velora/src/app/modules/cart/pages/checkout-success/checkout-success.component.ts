import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { environment } from '../../../../../environments/environment';

interface RastreioEvent {
  id: number;
  order_id: number;
  status: string;
  descricao: string;
  localizacao: string | null;
  created_at: string;
}

interface OrderData {
  id: number;
  user_id: number;
  total: number;
  status: string;
  created_at: string;
  items: any[];
}

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './checkout-success.component.html',
  styleUrl: './checkout-success.component.scss'
})
export class CheckoutSuccessComponent implements OnInit {
  orderId = signal<number | null>(null);
  order = signal<OrderData | null>(null);
  rastreio = signal<RastreioEvent[]>([]);
  loading = signal(true);
  error = signal(false);

  statusIcons: Record<string, string> = {
    pago: '✓',
    processando: '◐',
    enviado: '→',
    entregue: '✓'
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error.set(true); this.loading.set(false); return; }
    this.orderId.set(id);
    this.loadOrder(id);
    this.loadRastreio(id);
  }

  private loadOrder(id: number): void {
    this.http.get<{ data: OrderData }>(`${environment.backendUrl}/orders/${id}`).subscribe({
      next: (res) => { this.order.set(res.data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  private loadRastreio(id: number): void {
    this.http.get<{ data: RastreioEvent[] }>(`${environment.backendUrl}/rastreio/${id}`).subscribe({
      next: (res) => { this.rastreio.set(res.data); },
      error: () => {}
    });
  }

  get isAtivo(): boolean {
    return ['pago', 'processando', 'enviado'].includes(this.order()?.status ?? '');
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      pendente: 'orders.pendente',
      pago: 'checkout.sucesso_titulo',
      processando: 'rastreio_processando',
      enviado: 'rastreio_enviado',
      entregue: 'rastreio_entregue'
    };
    return map[this.order()?.status ?? 'pendente'];
  }
}
