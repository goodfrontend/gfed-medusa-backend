export type ShopifyCollection = {
  id: number;
  title: string;
  handle: string;
  description?: string;
  image?: ShopifyImage;
  products?: ShopifyProduct[];
};

export type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
};

export type ShopifyVariant = {
  id: number;
  title: string;
  option1: string;
  option2: string;
  option3: string;
  sku: string;
  requires_shipping: boolean;
  taxable: boolean;
  featured_image: ShopifyImage;
  available: boolean;
  price: string;
  grams: number;
  compare_at_price: string;
  position: number;
  product_id: number;
};

export type ShopifyImage = {
  id: number;
  position: number;
  alt: string;
  product_id: number;
  variant_ids: number[];
  src: string;
  width: number;
  height: number;
};

export type ShopifyOption = {
  name: string;
  position: number;
  values: string[];
};
