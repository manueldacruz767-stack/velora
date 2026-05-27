import { CartItem } from './cart-item';

export interface Order {
    id?: number;
    userId: number;
    items: CartItem[];
    total: number;
    totalKz?: number;
    data?: string;
    status: 'pendente' | 'confirmado' | 'entregue' | 'cancelado';
}
