

export interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  manufacturer: string;
  division: string;
  productType: 'Private Label' | 'Non-Private Label';
}

export interface Vendor {
  id: string;
  name: string;
}

export interface Purchase {
  id: string;
  productId: string;
  vendorId: string;
  date: string;
  quantity: number;
  purchasePrice: number;
  state: string;
  city: string;
  invoiceNumber: string;
  mrp: number;
}

export interface PurchaseWithMargin extends Purchase {
  margin: number;
}

export interface ProcessedPurchase extends PurchaseWithMargin {
  product: Product;
  vendor: Vendor;
  marginLoss: number;
  isBestMargin: boolean;
  isMarginOutlier: boolean;
  isQuantityOutlier: boolean;
  benchmarkMargin: number;
  modeMargin: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  manufacturer: string;
  totalMarginLoss: number;
  purchaseCount: number;
  averageMargin: number;
  bestMargin: number;
  sellingPrice: number;
  totalQuantityPurchased: number;
  worstMargin: number;
  bestVendor: { id: string; name: string } | null;
  worstVendor: { id: string; name: string } | null;
  marginLossPercentage: number;
  modeMargin: number;
}

export interface ProductMonthlySummary {
  totalMarginLoss: number;
  purchaseCount: number;
  totalQuantityPurchased: number;
  marginLossPercentage: number;
}

export interface VendorSummary {
  id: string;
  name: string;
  totalMarginLoss: number;
  productsPurchased: number;
}

export interface VendorProductSummary {
    productId: string;
    productName: string;
    averageMargin: number;
    bestOverallMargin: number;
}

export interface MarginAnalysisProductSummary extends ProductSummary {
    marginLossPercentage: number;
    vendorCount: number;
}

export interface AppData {
  totalMarginLoss: number;
  productsSummary: ProductSummary[];
  vendorsSummary: VendorSummary[];
  processedPurchases: ProcessedPurchase[];
  products: Product[];
  vendors: Vendor[];
  marginAnalysisSummary: MarginAnalysisProductSummary[];
}

export interface HomePageData {
    analysisData: AppData;
    ytdTotalMarginLoss: number;
}

export interface MonthlyAverage {
  month: string;
  averagePrice: number;
  averageMargin: number;
}

export interface ProductDetails {
  product: Product;
  purchases: ProcessedPurchase[];
  summary: ProductSummary | undefined;
  panIndiaSummary?: ProductSummary;
  monthlySummary: ProductMonthlySummary;
  panIndiaMonthlySummary?: ProductMonthlySummary;
  monthlyAverages: MonthlyAverage[];
}

export type QuantityOutlierFilter = 'none' | '1percent' | '5percent';

export interface DataFilters {
    geo: { state?: string; city?: string, cityState?: string };
    manufacturer: string | string[];
    division: string | string[];
    vendor: string;
    productType: string;
}
    
