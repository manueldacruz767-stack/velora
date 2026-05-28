import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, shareReplay } from 'rxjs';
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
  private cache = new Map<string, any>();
  private readonly ALL_CATEGORIES = [
    'smartphones', 'laptops', 'tablets', 'mobile-accessories',
    'fragrances', 'skincare', 'beauty',
    'mens-shirts', 'womens-dresses', 'mens-shoes', 'womens-shoes', 'womens-bags',
    'mens-watches', 'womens-watches', 'sunglasses', 'jewellery',
    'home-decoration', 'furniture', 'kitchen-accessories', 'groceries',
    'sports-accessories', 'vehicle', 'motorcycle'
  ];

  private categories = this.ALL_CATEGORIES;

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
    const key = 'by_categories_all';
    if (this.cache.has(key)) return this.cache.get(key)!;
    const requests = this.categories.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}`).pipe(
        map(res => res.products.slice(0, 3).map(p => this.mapProduct(p)))
      )
    );
    const obs = forkJoin(requests).pipe(
      map(results => results.reduce((acc, products) => [...acc, ...products], [])),
      shareReplay(1)
    );
    this.cache.set(key, obs);
    return obs;
  }

  getProductsByCategoriesFull(): Observable<{ category: string; products: Product[] }[]> {
    const key = 'by_categories_full';
    if (this.cache.has(key)) return this.cache.get(key)!;
    const requests = this.categories.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}?limit=8`).pipe(
        map(res => ({
          category: cat,
          products: res.products.map(p => this.mapProduct(p))
        }))
      )
    );
    const obs = forkJoin(requests).pipe(shareReplay(1));
    this.cache.set(key, obs);
    return obs;
  }

  getFeaturedByCategory(): Observable<{ category: string; products: Product[] }[]> {
    const key = 'featured_by_category';
    if (this.cache.has(key)) return this.cache.get(key)!;
    const requests = this.categories.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}`).pipe(
        map(res => ({
          category: cat,
          products: res.products.slice(0, 3).map(p => this.mapProduct(p))
        }))
      )
    );
    const obs = forkJoin(requests).pipe(shareReplay(1));
    this.cache.set(key, obs);
    return obs;
  }

  getProducts(limit: number = 20, skip: number = 0): Observable<{ products: Product[]; total: number }> {
    const key = `products_${limit}_${skip}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const obs = this.http.get<DummyResponse>(`${this.baseUrl}?limit=${limit}&skip=${skip}`).pipe(
      map(res => ({
        products: res.products.map(p => this.mapProduct(p)),
        total: res.total
      })),
      shareReplay(1)
    );
    this.cache.set(key, obs);
    return obs;
  }

  getProductById(id: number): Observable<Product> {
    const key = `product_${id}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const obs = this.http.get<DummyProduct>(`${this.baseUrl}/${id}`).pipe(
      map(p => this.mapProduct(p)),
      shareReplay(1)
    );
    this.cache.set(key, obs);
    return obs;
  }

  getProductsByCategory(category: string, limit: number = 20): Observable<Product[]> {
    const key = `cat_${category}_${limit}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const obs = this.http.get<DummyResponse>(`${this.baseUrl}/category/${category}?limit=${limit}`).pipe(
      map(res => res.products.map(p => this.mapProduct(p))),
      shareReplay(1)
    );
    this.cache.set(key, obs);
    return obs;
  }

  searchProducts(query: string): Observable<Product[]> {
    const key = `search_${query}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const obs = this.http.get<DummyResponse>(`${this.baseUrl}/search?q=${query}`).pipe(
      map(res => res.products.map(p => this.mapProduct(p))),
      shareReplay(1)
    );
    this.cache.set(key, obs);
    return obs;
  }

  getAllCategories(): Observable<string[]> {
    if (this.cache.has('all_categories')) return this.cache.get('all_categories')!;
    const obs = this.http.get<any[]>(`${this.baseUrl}/categories`).pipe(
      map(cats => cats.map(c => c.slug || c.name || c)),
      shareReplay(1)
    );
    this.cache.set('all_categories', obs);
    return obs;
  }

  getCategoryProductCounts(): Observable<{ category: string; count: number }[]> {
    const requests = this.ALL_CATEGORIES.map(cat =>
      this.http.get<DummyResponse>(`${this.baseUrl}/category/${cat}?limit=1`).pipe(
        map(res => ({ category: cat, count: res.total }))
      )
    );
    return forkJoin(requests);
  }

  getProductsByIds(ids: number[]): Observable<Product[]> {
    if (ids.length === 0) return of([]);
    const key = `by_ids_${ids.sort().join(',')}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const requests = ids.map(id =>
      this.http.get<DummyProduct>(`${this.baseUrl}/${id}`).pipe(
        map(p => this.mapProduct(p))
      )
    );
    const obs = forkJoin(requests).pipe(shareReplay(1));
    this.cache.set(key, obs);
    return obs;
  }
}
