import { Product } from './product';

export interface CartItem {
  id?: number;
  product: Product;
  quantidade: number;
  subtotal?: number;
}
