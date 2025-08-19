import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary } from "@/lib/types";
import { parseISO, subYears, subDays, format } from 'date-fns';

const products: Product[] = [
    { id: "dolo-650", name: "Dolo-650", sellingPrice: 30.00 },
    { id: "paracetamol-500", name: "Paracetamol-500", sellingPrice: 20.00 },
    { id: "azithromycin-250", name: "Azithromycin-250", sellingPrice: 118.00 },
    { id: "vitamin-c-1000", name: "Vitamin-C 1000mg", sellingPrice: 45.00 },
    { id: "ors-sachet", name: "ORS Sachet", sellingPrice: 22.00 },
    { id: "amoxicillin-500", name: "Amoxicillin-500", sellingPrice: 85.00 },
    { id: "cetirizine-10", name: "Cetirizine-10mg", sellingPrice: 25.00 },
    { id: "omeprazole-20", name: "Omeprazole-20mg", sellingPrice: 60.00 },
    { id: "losartan-50", name: "Losartan-50mg", sellingPrice: 75.00 },
    { id: "metformin-500", name: "Metformin-500mg", sellingPrice: 40.00 },
    { id: "atorvastatin-20", name: "Atorvastatin-20mg", sellingPrice: 95.00 },
    { id: "salbutamol-inhaler", name: "Salbutamol Inhaler", sellingPrice: 150.00 },
    { id: "crocin-advance", name: "Crocin Advance", sellingPrice: 35.00 },
    { id: "benadryl-syrup", name: "Benadryl Syrup 150ml", sellingPrice: 120.00 },
    { id: "vicks-vaporub", name: "Vicks Vaporub 50g", sellingPrice: 140.00 },
    { id: "band-aid-100", name: "Band-Aid Strips (100)", sellingPrice: 100.00 },
    { id: "dettol-250", name: "Dettol Antiseptic 250ml", sellingPrice: 180.00 },
    { id: "savlon-200", name: "Savlon Antiseptic 200ml", sellingPrice: 170.00 },
    { id: "moov-50", name: "Moov Ointment 50g", sellingPrice: 160.00 },
    { id: "volini-gel-75", name: "Volini Gel 75g", sellingPrice: 210.00 },
    { id: "horlicks-500", name: "Horlicks 500g Jar", sellingPrice: 250.00 },
    { id: "protinex-400", name: "Protinex Powder 400g", sellingPrice: 600.00 },
    { id: "ensure-400", name: "Ensure Powder 400g", sellingPrice: 650.00 },
    { id: "revital-h-30", name: "Revital H (30 caps)", sellingPrice: 310.00 },
    { id: "becosules-20", name: "Becosules (20 caps)", sellingPrice: 50.00 },
];

const vendors: Vendor[] = [
    { id: "mehta-group", name: "Mehta Group" },
    { id: "svizera", name: "Svizera Health Remedies" },
    { id: "ss-pharma", name: "SS Pharma Distributors" },
    { id: "sanghvi-pharma", name: "Sanghvi Pharma" },
    { id: "mahaveer-pharma", name: "Mahaveer Pharma" },
    { id: "sun-pharma-dist", name: "Sun Pharma Distributors" },
    { id: "cipla-logistics", name: "Cipla Logistics" },
    { id: "lupin-dist", name: "Lupin Distribution" },
    { id: "zydus-health", name: "Zydus Healthcare" },
    { id: "reddy-labs-dist", name: "Dr. Reddy's Distribution" },
    { id: "torrent-pharma", name: "Torrent Pharma Logistics" },
    { id: "mankind-pharma", name: "Mankind Pharma" }
];

function generatePurchases(): Purchase[] {
    const generatedPurchases: Purchase[] = [];
    const startDate = subYears(new Date(), 2);
    let purchaseIdCounter = 1;

    for (const product of products) {
        // Ensure each product has a "best price" vendor
        const bestVendorIndex = Math.floor(Math.random() * vendors.length);
        const bestPrice = product.sellingPrice * (0.9 - Math.random() * 0.2); // 70-90% of selling price

        // Generate purchases over the last 2 years
        const totalDays = 365 * 2;
        const numPurchases = 20 + Math.floor(Math.random() * 30); // 20 to 50 purchases per product

        for (let i = 0; i < numPurchases; i++) {
            const date = subDays(new Date(), Math.floor(Math.random() * totalDays));
            
            let vendorIndex = Math.floor(Math.random() * vendors.length);
            let purchasePrice: number;

            // Introduce some logic to occasionally get the best price
            if (i % 4 === 0) { // 25% chance to be the best price vendor
                vendorIndex = bestVendorIndex;
                purchasePrice = bestPrice;
            } else {
                // Other vendors have a price between bestPrice and sellingPrice
                purchasePrice = bestPrice + (product.sellingPrice - bestPrice) * (0.2 + Math.random() * 0.7);
            }
            
            // Ensure price doesn't exceed selling price
            purchasePrice = Math.min(purchasePrice, product.sellingPrice * 0.98);

            generatedPurchases.push({
                id: `p${purchaseIdCounter++}`,
                productId: product.id,
                vendorId: vendors[vendorIndex].id,
                date: format(date, 'yyyy-MM-dd'),
                quantity: 50 + Math.floor(Math.random() * 450), // Represents purchases for multiple stores
                purchasePrice: parseFloat(purchasePrice.toFixed(2)),
            });
        }
    }
    return generatedPurchases;
}

const purchases: Purchase[] = generatePurchases();


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

    const oneYearAgo = subYears(new Date(), 1);
    const purchasesLastYear = productPurchases.filter(p => parseISO(p.date) >= oneYearAgo).length;

    return { product, purchases: productPurchases, summary, purchasesLastYear };
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
