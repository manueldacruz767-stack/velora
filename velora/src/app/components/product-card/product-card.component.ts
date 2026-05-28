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
      tablets: 'Tablets',
      'mobile-accessories': 'Acessórios Mobile',
      fragrances: 'Perfumes',
      skincare: 'Cuidado de Pele',
      beauty: 'Beleza',
      'mens-shirts': 'Camisas',
      'womens-dresses': 'Vestidos',
      'mens-shoes': 'Calçado Masculino',
      'womens-shoes': 'Calçado Feminino',
      'womens-bags': 'Malas',
      'mens-watches': 'Relógios Masculinos',
      'womens-watches': 'Relógios Femininos',
      sunglasses: 'Óculos de Sol',
      jewellery: 'Jóias',
      'home-decoration': 'Decoração',
      furniture: 'Móveis',
      'kitchen-accessories': 'Cozinha',
      groceries: 'Alimentação',
      'sports-accessories': 'Desporto',
      vehicle: 'Automóvel',
      motorcycle: 'Motociclismo',
    };
    return labels[category] || category;
  }
}
