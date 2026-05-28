import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../interfaces/product';

interface DummyProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  thumbnail: string;
  images: string[];
  rating: number;
  brand: string;
  stock: number;
  discountPercentage: number;
}

interface DummyResponse {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private produtosSubject = new BehaviorSubject<Product[]>([]);
  private loaded = false;
  private nextId = 1000;
  private baseUrl = 'https://dummyjson.com/products';
  private readonly CACHE_KEY = 'velora_produtos_cache';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000;

  constructor(private http: HttpClient) {
    this.loadFromCache();
  }

  private loadFromCache(): void {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > this.CACHE_EXPIRY) {
        localStorage.removeItem(this.CACHE_KEY);
        return;
      }
      this.produtosSubject.next(data);
      this.loaded = true;
    } catch {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  private saveToCache(products: Product[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        data: products,
        timestamp: Date.now()
      }));
    } catch {}
  }

  getProdutos(): Observable<Product[]> {
    this.carregarProdutos();
    return this.produtosSubject.asObservable();
  }

  get produtosSnapshot(): Product[] {
    return this.produtosSubject.value;
  }

  getProdutoPorId(id: number): Product | undefined {
    return this.produtosSubject.value.find(p => p.id === id);
  }

  carregarProdutos(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.http.get<DummyResponse>(`${this.baseUrl}?limit=20&skip=0`).subscribe({
      next: (res) => {
        const products = res.products.map(p => this.mapProduct(p));
        this.produtosSubject.next(products);
        this.saveToCache(products);
        this.http.get<DummyResponse>(`${this.baseUrl}?limit=30&skip=20`).subscribe({
          next: (res2) => {
            const more = res2.products.map(p => this.mapProduct(p));
            const all = [...products, ...more];
            this.produtosSubject.next(all);
            this.saveToCache(all);
          }
        });
      }
    });
  }

  adicionarProduto(produto: Omit<Product, 'id'>): Product {
    const novo: Product = {
      ...produto,
      id: this.nextId++,
      rating: produto.rating || { rate: 0, count: 0 },
      images: produto.images || [],
      image: produto.image || produto.thumbnail || '',
      stock: produto.stock ?? 10,
      discountPercentage: produto.discountPercentage ?? 0,
      thumbnail: produto.thumbnail || produto.image || ''
    };
    const current = this.produtosSubject.value;
    this.produtosSubject.next([novo, ...current]);
    return novo;
  }

  atualizarProduto(id: number, dados: Partial<Product>): void {
    const current = this.produtosSubject.value;
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return;
    const updated = [...current];
    updated[index] = { ...updated[index], ...dados, id };
    this.produtosSubject.next(updated);
  }

  eliminarProduto(id: number): void {
    const current = this.produtosSubject.value;
    this.produtosSubject.next(current.filter(p => p.id !== id));
  }

  private mapProduct(p: DummyProduct): Product {
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      category: p.category,
      thumbnail: p.thumbnail,
      images: p.images,
      image: p.thumbnail,
      rating: { rate: p.rating, count: 0 },
      stock: p.stock,
      brand: p.brand,
      discountPercentage: p.discountPercentage
    };
  }
}
