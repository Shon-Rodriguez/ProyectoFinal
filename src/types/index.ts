export interface CompanySettings {
  id?: number;
  logo?: string;
  name: string;
  doc_id: string;
  phone: string;
  email: string;
  address?: string;
  currency: string;
}

export type DocType = "RUC" | "DNI";

export interface Client {
  id?: number;
  name: string;
  doc_type: DocType;
  doc_id: string;
  phone: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export type ItemType = "PRODUCTO" | "SERVICIO";

export interface CatalogItem {
  id?: number;
  name: string;
  description?: string;
  price: number;
  type: ItemType;
  created_at?: string;
}

export interface Quotation {
  id?: number;
  code: string;
  client_id: number;
  date: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  created_at?: string;
  client_name?: string;
  client_document?: string;
}

export interface QuotationDetail {
  id?: number;
  quotation_id?: number;
  catalog_id: number;
  quantity: number;
  unit_price: number;
  subtotal_line: number;
  catalog_name?: string;
}

export interface QuotationWithDetails extends Quotation {
  id: number;
  details: QuotationDetail[];
}
