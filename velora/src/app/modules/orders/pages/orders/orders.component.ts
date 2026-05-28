import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../../../services/order.service';
import { ExchangeService } from '../../../../services/exchange.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, CommonModule, TranslatePipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal(true);
  taxa = signal(850);
  statusMap: Record<string, { label: string; class: string }> = {
    pendente: { label: 'Pendente', class: 'status-pendente' },
    pago: { label: 'Pago', class: 'status-pago' },
    processando: { label: 'Processando', class: 'status-processando' },
    enviado: { label: 'Enviado', class: 'status-enviado' },
    entregue: { label: 'Entregue', class: 'status-entregue' },
    cancelado: { label: 'Cancelado', class: 'status-cancelado' }
  };

  constructor(
    private orderService: OrderService,
    public exchangeService: ExchangeService
  ) {}

  ngOnInit(): void {
    this.exchangeService.getTaxa().subscribe(t => this.taxa.set(t));
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, this.taxa())
    );
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  statusLabel(status: string): string {
    return this.statusMap[status]?.label || status;
  }

  statusClass(status: string): string {
    return this.statusMap[status]?.class || '';
  }

  exportPdf(): void {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(203, 161, 53);
    doc.text('VELORA', 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Histórico de Pedidos', 14, 32);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-AO')}`, 14, 39);

    const rows = this.orders().map(o => [
      `#${o.id}`,
      this.formatDate(o.created_at),
      this.statusLabel(o.status),
      `${o.items?.length || 0} itens`,
      this.formatKz(o.total),
    ]);

    (doc as any).autoTable({
      startY: 46,
      head: [['Pedido', 'Data', 'Status', 'Itens', 'Total']],
      body: rows,
      headStyles: { fillColor: [203, 161, 53], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 4 },
    });

    doc.save('velora-pedidos.pdf');
  }

  exportCsv(): void {
    const rows = this.orders().flatMap(o =>
      (o.items || []).map(item => ({
        Pedido: `#${o.id}`,
        Data: this.formatDate(o.created_at),
        Status: this.statusLabel(o.status),
        Produto: item.product_nome,
        Quantidade: item.quantidade,
        'Preço Unit.': this.exchangeService.formatarUSD(item.preco),
        'Preço Total': this.formatKz(item.preco * item.quantidade),
      }))
    );

    if (rows.length === 0) return;
    const csv = Papa.unparse(rows);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'velora-pedidos.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
