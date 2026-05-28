export interface Product {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image?: string;
    thumbnail?: string;
    images?: string[];
    rating?: {
        rate: number;
        count: number;
    };
    priceKz?: number;
    stock?: number;
    brand?: string;
    discountPercentage?: number;
    vendedor_id?: number;
    origem?: string;

    titulo?: string;
    preco?: number;
    descricao?: string;
    categoria?: string;
    imagem_url?: string;
    vendedor_nome?: string;
    avg_rating?: number;
    total_reviews?: number;
}
