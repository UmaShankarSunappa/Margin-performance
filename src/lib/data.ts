import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary } from "@/lib/types";
import { parseISO, subYears, subDays, format, startOfYear } from 'date-fns';
import sampleData from './data.json';


let cache: AppData | null = null;

export async function getAppData(): Promise<AppData> {
  if (cache) {
    return cache;
  }

  const { products, vendors, purchases } = sampleData;

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
    
    // Handle cases where bestMarginData might not be found (though it should be)
    const bestPrice = bestMarginData ? bestMarginData.price : p.purchasePrice;
    const marginLoss = (p.purchasePrice - bestPrice) * p.quantity;
    totalMarginLoss += marginLoss > 0 ? marginLoss : 0;
    
    return {
      ...p,
      product,
      vendor,
      marginLoss: marginLoss > 0 ? marginLoss : 0,
      isBestMargin: p.purchasePrice === bestPrice,
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
  const startOfCurrentYear = startOfYear(new Date());
  const marginAnalysisSummary: MarginAnalysisProductSummary[] = products.map(product => {
    const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    const purchasesYTD = productPurchases.filter(p => parseISO(p.date) >= startOfCurrentYear);
    
    const totalPurchaseCost = productPurchases.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
    const totalMarginLoss = productPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    
    const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;

    const vendorIds = new Set(productPurchases.map(p => p.vendorId));

    return {
        ...productsSummary.find(ps => ps.id === product.id)!,
        purchaseCount: purchasesYTD.length,
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

    const startOfCurrentYear = startOfYear(new Date());
    const purchasesYTD = productPurchases.filter(p => parseISO(p.date) >= startOfCurrentYear).length;

    return { product, purchases: productPurchases, summary, purchasesYTD };
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
    }).sort((a, b) => a.productName.localeCompare(b.productName));

    return { vendor, summary, productsSummary: productsSummaryForVendor };
}
