import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../interfaces/product';
import { ExchangeService } from '../../services/exchange.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  product = input.required<Product>();
  taxa = input(850);
  compact = input(false);
  added = signal(false);

  addedToCart = output<Product>();

  constructor(public exchangeService: ExchangeService) {}

  addToCart(): void {
    this.addedToCart.emit(this.product());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 1500);
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, this.taxa())
    );
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      smartphones: 'Smartphones',
      laptops: 'Computadores',
      fragrances: 'Perfumes',
      'home-decoration': 'Decoração',
      'mens-shirts': 'Moda Masculina',
      'womens-dresses': 'Moda Feminina',
      beauty: 'Beleza',
      'skin-care': 'Cuidado de Pele',
      skincare: 'Cuidado de Pele',
      groceries: 'Alimentação',
      furniture: 'Móveis',
      'mobile-accessories': 'Acessórios',
      'mens-watches': 'Relógios',
      'womens-watches': 'Relógios',
      'mens-shoes': 'Calçado',
      'womens-shoes': 'Calçado',
      'womens-bags': 'Bolsas',
      sunglasses: 'Óculos',
      jewellery: 'Jóias',
      'womens-jewellery': 'Jóias',
    };
    return labels[category] || category;
  }
}
