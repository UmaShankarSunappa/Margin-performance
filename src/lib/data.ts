import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary } from "@/lib/types";
import { parseISO, subYears } from 'date-fns';

const products: Product[] = [
  { id: "dolo-650", name: "Dolo-650", sellingPrice: 30.00 },
  { id: "paracetamol-500", name: "Paracetamol-500", sellingPrice: 20.00 },
  { id: "azithromycin-250", name: "Azithromycin-250", sellingPrice: 118.00 },
  { id: "vitamin-c-1000", name: "Vitamin-C 1000mg", sellingPrice: 45.00 },
  { id: "ors-sachet", name: "ORS Sachet", sellingPrice: 22.00 },
];

const vendors: Vendor[] = [
  { id: "medplus", name: "MedPlus" },
  { id: "apollo", name: "Apollo Pharmacy" },
  { id: "wellness-forever", name: "Wellness Forever" },
  { id: "local-dist", name: "Local Distributors Inc." },
];

const purchases: Purchase[] = [
  // Dolo-650
  { id: "p1", productId: "dolo-650", vendorId: "medplus", date: "2023-10-15", quantity: 100, purchasePrice: 22.50 },
  { id: "p2", productId: "dolo-650", vendorId: "apollo", date: "2023-11-20", quantity: 150, purchasePrice: 23.00 },
  { id: "p3", productId: "dolo-650", vendorId: "local-dist", date: "2024-01-10", quantity: 200, purchasePrice: 21.00 }, // Best margin
  { id: "p4", productId: "dolo-650", vendorId: "wellness-forever", date: "2024-03-05", quantity: 120, purchasePrice: 23.50 },

  // Paracetamol-500
  { id: "p5", productId: "paracetamol-500", vendorId: "apollo", date: "2023-10-25", quantity: 500, purchasePrice: 14.00 },
  { id: "p6", productId: "paracetamol-500", vendorId: "medplus", date: "2023-12-18", quantity: 400, purchasePrice: 14.50 },
  { id: "p7", productId: "paracetamol-500", vendorId: "local-dist", date: "2024-02-22", quantity: 600, purchasePrice: 13.50 }, // Best margin
  { id: "p8", productId: "paracetamol-500", vendorId: "wellness-forever", date: "2024-04-12", quantity: 300, purchasePrice: 15.00 },

  // Azithromycin-250
  { id: "p9", productId: "azithromycin-250", vendorId: "local-dist", date: "2023-11-30", quantity: 50, purchasePrice: 90.00 }, // Best margin
  { id: "p10", productId: "azithromycin-250", vendorId: "medplus", date: "2024-01-25", quantity: 70, purchasePrice: 95.00 },
  { id: "p11", productId: "azithromycin-250", vendorId: "apollo", date: "2024-03-15", quantity: 60, purchasePrice: 98.00 },
  
  // Vitamin-C 1000mg
  { id: "p12", productId: "vitamin-c-1000", vendorId: "wellness-forever", date: "2023-12-05", quantity: 200, purchasePrice: 32.00 },
  { id: "p13", productId: "vitamin-c-1000", vendorId: "medplus", date: "2024-02-01", quantity: 250, purchasePrice: 31.00 }, // Best margin
  { id: "p14", productId: "vitamin-c-1000", vendorId: "apollo", date: "2024-04-10", quantity: 180, purchasePrice: 33.50 },
  
  // ORS Sachet
  { id: "p15", productId: "ors-sachet", vendorId: "apollo", date: "2023-12-10", quantity: 1000, purchasePrice: 16.00 },
  { id: "p16", productId: "ors-sachet", vendorId: "local-dist", date: "2024-01-20", quantity: 1200, purchasePrice: 15.50 }, // Best margin
  { id: "p17", productId: "ors-sachet", vendorId: "medplus", date: "2024-04-01", quantity: 800, purchasePrice: 16.50 },
  // Add one old purchase to test the 1-year filter
  { id: "p18", productId: "dolo-650", vendorId: "medplus", date: "2022-01-15", quantity: 50, purchasePrice: 22.00 },
];

let cache: AppData | null = null;

export async function getAppData(): Promise<AppData> {
  if (cache) {
    return cache;
  }

  const productMap = new Map(products.map(p => [p.id, p]));
  const vendorMap = new Map(vendors.map(v => [v.id, v]));

  // Step 1: Calculate margin for each purchase and find best margin for each product
  const purchasesWithMargin = purchases.map(purchase => {
    const product = productMap.get(purchase.productId)!;
    const margin = ((product.sellingPrice - purchase.purchasePrice) / product.sellingPrice) * 100;
    return { ...purchase, margin };
  });

  const bestMargins = new Map<string, { price: number; margin: number }>();
  for (const p of purchasesWithMargin) {
    if (!bestMargins.has(p.productId) || p.margin > bestMargins.get(p.productId)!.margin) {
      bestMargins.set(p.productId, { price: p.purchasePrice, margin: p.margin });
    }
  }

  // Step 2: Process all purchases to calculate margin loss
  let totalMarginLoss = 0;
  const processedPurchases: ProcessedPurchase[] = purchasesWithMargin.map(p => {
    const product = productMap.get(p.productId)!;
    const vendor = vendorMap.get(p.vendorId)!;
    const bestMarginData = bestMargins.get(p.productId)!;
    
    const marginLoss = (p.purchasePrice - bestMarginData.price) * p.quantity;
    totalMarginLoss += marginLoss > 0 ? marginLoss : 0;
    
    return {
      ...p,
      product,
      vendor,
      marginLoss: marginLoss > 0 ? marginLoss : 0,
      isBestMargin: p.purchasePrice === bestMarginData.price,
    };
  });

  // Step 3: Create summaries
  const productsSummary: ProductSummary[] = products.map(product => {
    const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    const totalMarginLoss = productPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    const totalMargin = productPurchases.reduce((acc,p) => acc + p.margin, 0);
    const bestMargin = bestMargins.get(product.id)?.margin || 0;

    return {
      id: product.id,
      name: product.name,
      sellingPrice: product.sellingPrice,
      totalMarginLoss,
      purchaseCount: productPurchases.length,
      averageMargin: productPurchases.length > 0 ? totalMargin / productPurchases.length : 0,
      bestMargin,
    };
  });

  const vendorsSummary = vendors.map(vendor => {
    const vendorPurchases = processedPurchases.filter(p => p.vendorId === vendor.id);
    const totalMarginLoss = vendorPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    return {
      id: vendor.id,
      name: vendor.name,
      totalMarginLoss,
      productsPurchased: new Set(vendorPurchases.map(p => p.productId)).size,
    };
  });

  // Step 4: Margin Analysis Summary
  const oneYearAgo = subYears(new Date(), 1);
  const marginAnalysisSummary: MarginAnalysisProductSummary[] = products.map(product => {
    const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    const purchasesLastYear = productPurchases.filter(p => parseISO(p.date) >= oneYearAgo);
    
    const totalPurchaseCost = productPurchases.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
    const totalMarginLoss = productPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    
    const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;

    const vendorIds = new Set(productPurchases.map(p => p.vendorId));

    return {
        ...productsSummary.find(ps => ps.id === product.id)!,
        purchaseCount: purchasesLastYear.length,
        marginLossPercentage,
        vendorCount: vendorIds.size,
    };
  });


  cache = {
    totalMarginLoss,
    productsSummary,
    vendorsSummary,
    processedPurchases: processedPurchases.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    products,
    vendors,
    marginAnalysisSummary,
  };

  return cache;
}


export async function getProductDetails(productId: string) {
    const data = await getAppData();
    const product = data.products.find(p => p.id === productId);
    if (!product) return null;

    const productPurchases = data.processedPurchases.filter(p => p.productId === productId);
    const summary = data.productsSummary.find(p => p.id === productId);

    return { product, purchases: productPurchases, summary };
}

export async function getVendorDetails(vendorId: string) {
    const data = await getAppData();
    const vendor = data.vendors.find(v => v.id === vendorId);
    if (!vendor) return null;
    
    const vendorPurchases = data.processedPurchases.filter(p => p.vendorId === vendorId);
    const summary = data.vendorsSummary.find(v => v.id === vendorId);

    const productIds = [...new Set(vendorPurchases.map(p => p.productId))];

    const productsSummaryForVendor: VendorProductSummary[] = productIds.map(productId => {
        const purchasesOfProductFromVendor = vendorPurchases.filter(p => p.productId === productId);
        const totalMargin = purchasesOfProductFromVendor.reduce((acc, p) => acc + p.margin, 0);
        const averageMargin = totalMargin / purchasesOfProductFromVendor.length;
        
        const productInfo = data.productsSummary.find(p => p.id === productId);

        return {
            productId,
            productName: productInfo?.name || "Unknown",
            averageMargin,
            bestOverallMargin: productInfo?.bestMargin || 0
        };
    });

    return { vendor, summary, productsSummary: productsSummaryForVendor };
}
