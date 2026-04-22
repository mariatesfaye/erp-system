export type Role = 'ADMIN' | 'STAFF';

export type Me = {
  id: string;
  email: string;
  role: Role;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  unitPrice: string;
};

export type ProductWithBalance = Product & {
  balance: number;
};

export type Customer = {
  id: string;
  name: string;
  createdAt: string;
};

export type InvoiceLine = {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
};

export type Invoice = {
  id: string;
  customerId: string;
  status: 'DRAFT' | 'ISSUED';
  invoiceNumber: string;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
};
