import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
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
export class ProductService {
  private baseUrl = `https://dummyjson.com/products`;

  private categories = [
    'smartphones',
    'laptops',
    'fragrances',
    'home-decoration',
    'mens-shirts',
    'womens-dresses'
  ];

  constructor(private http: HttpClient) {}

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

  getProductsByCategories(): Observable<Product[]> {
    const requests = this.categories.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}`).pipe(
        map(res => res.products.slice(0, 3).map(p => this.mapProduct(p)))
      )
    );
    return forkJoin(requests).pipe(
      map(results => results.reduce((acc, products) => [...acc, ...products], []))
    );
  }

  getProductsByCategoriesFull(): Observable<{ category: string; products: Product[] }[]> {
    const requests = this.categories.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}?limit=8`).pipe(
        map(res => ({
          category: cat,
          products: res.products.map(p => this.mapProduct(p))
        }))
      )
    );
    return forkJoin(requests);
  }

  getFeaturedByCategory(): Observable<{ category: string; products: Product[] }[]> {
    const requests = this.categories.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}`).pipe(
        map(res => ({
          category: cat,
          products: res.products.slice(0, 3).map(p => this.mapProduct(p))
        }))
      )
    );
    return forkJoin(requests);
  }

  getProducts(limit: number = 30, skip: number = 0): Observable<{ products: Product[]; total: number }> {
    return this.http.get<DummyResponse>(`${this.baseUrl}?limit=${limit}&skip=${skip}`).pipe(
      map(res => ({
        products: res.products.map(p => this.mapProduct(p)),
        total: res.total
      }))
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<DummyProduct>(`${this.baseUrl}/${id}`).pipe(
      map(p => this.mapProduct(p))
    );
  }

  getProductsByCategory(category: string, limit: number = 20): Observable<Product[]> {
    return this.http.get<DummyResponse>(`${this.baseUrl}/category/${category}?limit=${limit}`).pipe(
      map(res => res.products.map(p => this.mapProduct(p)))
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<DummyResponse>(`${this.baseUrl}/search?q=${query}`).pipe(
      map(res => res.products.map(p => this.mapProduct(p)))
    );
  }

  getAllCategories(): Observable<string[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`).pipe(
      map(cats => cats.map(c => c.slug || c.name || c))
    );
  }

  getCategoryProductCounts(): Observable<{ category: string; count: number }[]> {
    const cats = ['smartphones', 'laptops', 'fragrances', 'home-decoration', 'mens-shirts', 'womens-dresses', 'skincare', 'groceries', 'furniture', 'tops', 'womens-jewellery', 'womens-watches', 'womens-bags', 'womens-shoes', 'sunglasses', 'automotive', 'motorcycle'];
    const requests = cats.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}?limit=1`).pipe(
        map(res => ({ category: cat, count: res.total }))
      )
    );
    return forkJoin(requests);
  }

  getProductsByIds(ids: number[]): Observable<Product[]> {
    if (ids.length === 0) return of([]);
    const requests = ids.map(id =>
      this.http.get<DummyProduct>(`${this.baseUrl}/${id}`).pipe(
        map(p => this.mapProduct(p))
      )
    );
    return forkJoin(requests);
  }
}
