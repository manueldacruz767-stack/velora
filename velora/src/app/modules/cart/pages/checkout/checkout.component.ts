import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../../../services/cart.service';
import { ExchangeService } from '../../../../services/exchange.service';
import { PaymentService } from '../../../../services/payment.service';
import { ProxyPayService, ProxyPayMockResponse } from '../../../../services/proxypay.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { environment } from '../../../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  taxa = signal(850);
  loading = signal(false);
  success = signal(false);
  paymentStep = signal<'form' | 'reference' | 'processing' | 'success'>('form');
  reference = signal('');
  paymentMethod = signal<'proxypay' | 'paypal'>('proxypay');
  freight = 1500;
  paypalOrderId = signal('');
  paypalApprovalUrl = signal('');
  proxyPayRef = signal<ProxyPayMockResponse | null>(null);
  pedidoId = signal('');
  private paymentSub: Subscription | null = null;

  shippingForm;

  items = computed(() => this.cartService.getItems()());

  constructor(
    public cartService: CartService,
    public exchangeService: ExchangeService,
    private paymentService: PaymentService,
    private proxyPayService: ProxyPayService,
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.shippingForm = this.fb.group({
      endereco: ['', Validators.required],
      cidade: ['', Validators.required],
      telefone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]]
    });
  }

  ngOnInit(): void {
    this.exchangeService.getTaxa().subscribe(t => this.taxa.set(t));
    this.reference.set(this.paymentService.createReference());
  }

  ngOnDestroy(): void {
    this.paymentSub?.unsubscribe();
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, this.taxa())
    );
  }

  formatarData(data: string): string {
    return this.proxyPayService.formatarDataExpiracao(data);
  }

  totalKz(): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(this.cartService.totalPrice(), this.taxa())
    );
  }

  freightKz(): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(this.freight, this.taxa())
    );
  }

  totalComFreteKz(): string {
    const totalUSD = this.cartService.totalPrice() + this.freight;
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(totalUSD, this.taxa())
    );
  }

  totalComFreteUSD(): number {
    return this.cartService.totalPrice() + this.freight;
  }

  selectMethod(method: 'proxypay' | 'paypal'): void {
    this.paymentMethod.set(method);
  }

  onSubmit(): void {
    if (this.shippingForm.invalid || this.items().length === 0) return;

    if (this.paymentMethod() === 'proxypay') {
      this.submitProxyPay();
    } else {
      this.submitPayPal();
    }
  }

  private submitProxyPay(): void {
    this.loading.set(true);
    const orderId = Date.now().toString();
    this.pedidoId.set(orderId);
    const nome = this.shippingForm.get('nome')?.value || 'Cliente';
    const valorKz = this.exchangeService.converterParaKz(this.totalComFreteUSD(), this.taxa());

    this.paymentSub = this.proxyPayService.gerarReferenciaMulticaixa(
      Math.round(valorKz),
      nome,
      orderId
    ).subscribe({
      next: (ref) => {
        this.proxyPayRef.set(ref);
        this.reference.set(ref.referencia);
        this.paymentStep.set('reference');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.paymentStep.set('form');
      }
    });
  }

  simularPagamentoATM(): void {
    this.paymentStep.set('processing');
    this.loading.set(true);

    this.proxyPayService.simularPagamentoATM().subscribe({
      next: () => {
        this.paymentStep.set('success');
        this.success.set(true);
        this.loading.set(false);
        this.createOrderAndRedirect();
      },
      error: () => {
        this.loading.set(false);
        this.paymentStep.set('reference');
      }
    });
  }

  private submitPayPal(): void {
    if (this.paypalApprovalUrl()) {
      window.location.href = this.paypalApprovalUrl();
      return;
    }

    this.loading.set(true);
    const totalUSD = this.totalComFreteUSD().toFixed(2);
    const orderId = Date.now().toString();

    this.paymentService.processPayment({
      orderId,
      amount: this.totalComFreteUSD(),
      currency: 'USD',
      paymentMethod: 'paypal'
    }).subscribe({
      next: (res) => {
        if (res.redirectUrl) {
          this.paypalApprovalUrl.set(res.redirectUrl);
          this.loading.set(false);
          window.location.href = res.redirectUrl;
        } else {
          this.paymentStep.set('success');
          this.success.set(true);
          this.loading.set(false);
          this.createOrderAndRedirect();
        }
      },
      error: () => this.loading.set(false)
    });
  }

  private createOrderAndRedirect(): void {
    const items = this.items().map(item => ({
      product_id: item.product.id,
      product_nome: item.product.title,
      preco: item.product.price,
      quantidade: item.quantidade,
      origem: item.product.vendedor_id ? 'local' : 'api',
      imagem_url: item.product.image || item.product.thumbnail || null
    }));
    const total = this.cartService.totalPrice() + this.freight;

    this.http.post<any>(`${environment.backendUrl}/orders`, { items, total }).subscribe({
      next: (res) => {
        const orderId = res.data.id;
        this.http.post(`${environment.backendUrl}/orders/${orderId}/confirm`, {}).subscribe({
          next: () => {
            this.cartService.clearCart();
            this.router.navigate(['/checkout/success', orderId]);
          },
          error: () => {
            this.cartService.clearCart();
            this.router.navigate(['/checkout/success', orderId]);
          }
        });
      },
      error: () => {
        this.cartService.clearCart();
        this.router.navigate(['/pedidos']);
      }
    });
  }
}
