import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../services/cart.service';
import { ExchangeService } from '../../../../services/exchange.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CommonModule, TranslatePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  taxa = signal(850);
  updatingId = signal<number | null>(null);

  items = computed(() => this.cartService.getItems()());

  constructor(
    public cartService: CartService,
    public exchangeService: ExchangeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.exchangeService.getTaxa().subscribe(t => this.taxa.set(t));
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, this.taxa())
    );
  }

  updateQuantidade(productId: number, qtd: number): void {
    this.updatingId.set(productId);
    this.cartService.updateQuantidade(productId, qtd);
    setTimeout(() => this.updatingId.set(null), 300);
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
  }

  totalKz(): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(this.cartService.totalPrice(), this.taxa())
    );
  }

  finalizar(): void {
    this.router.navigate(['/checkout']);
  }
}
