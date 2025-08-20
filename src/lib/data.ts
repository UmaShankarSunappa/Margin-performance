import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary } from "@/lib/types";
import { parseISO, subYears, subDays, format, startOfYear } from 'date-fns';

let cache: AppData | null = null;

export const geoLocations = {
    states: ["Karnataka", "Tamil Nadu", "Telangana", "Maharashtra", "West Bengal", "Odisha"],
    citiesByState: {
        "Telangana": ["Hyderabad"],
        "Tamil Nadu": ["Chennai", "Madurai"],
        "Karnataka": ["Bengaluru", "Hubli"],
        "West Bengal": ["Kolkata", "Hooghly"],
        "Odisha": ["Bhubaneswar", "Cuttack"],
        "Maharashtra": ["Mumbai", "Pune", "Nagpur"]
    } as Record<string, string[]>
};

// Function to generate a larger dataset
function generateData() {
  const products: Product[] = [];
  const vendors: Vendor[] = [];
  const purchases: Purchase[] = [];

  const productCount = 150;
  const vendorCount = 66;
  const purchasesPerProduct = 10; 

  // Generate Products
  for (let i = 1; i <= productCount; i++) {
    products.push({
      id: `sku-${i}`,
      name: `SKU-${i}`,
      sellingPrice: Math.random() * 300 + 20, // 20 to 320
    });
  }

  // Generate Vendors
  const vendorNames = ["Om sai enterprise", "Vishal agensises", "Khan C&F", "N sons agensises", "Bharat distributors"];
  for (let i = 1; i <= vendorCount; i++) {
    vendors.push({
      id: `vendor-${i}`,
      name: i <= vendorNames.length ? vendorNames[i-1] : `PharmaDistro ${i}`,
    });
  }

  // Generate Purchases
  let purchaseIdCounter = 1;
  products.forEach(product => {
    const bestPrice = product.sellingPrice * (Math.random() * 0.15 + 0.5); 

    for (let i = 0; i < purchasesPerProduct; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const date = new Date(Date.now() - Math.random() * 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const quantity = Math.floor(Math.random() * 150) + 10;
      
      const priceFluctuation = (Math.random() - 0.2) * 0.5;
      let purchasePrice = bestPrice * (1 + priceFluctuation);
      
      if (i % 4 === 0) {
          purchasePrice = bestPrice;
      }

      // Assign geo location
      const state = geoLocations.states[Math.floor(Math.random() * geoLocations.states.length)];
      const citiesInState = geoLocations.citiesByState[state];
      const city = citiesInState[Math.floor(Math.random() * citiesInState.length)];

      purchases.push({
        id: `p-${purchaseIdCounter++}`,
        productId: product.id,
        vendorId: vendor.id,
        date,
        quantity,
        purchasePrice: parseFloat(purchasePrice.toFixed(2)),
        state,
        city
      });
    }
  });

  return { products, vendors, purchases };
}

// Store the full dataset in memory
const fullDataset = generateData();


export async function getAppData(filters: { state?: string; city?: string } = {}): Promise<AppData> {
  let filteredPurchases = fullDataset.purchases;

  if (filters.state && !filters.city) {
    filteredPurchases = fullDataset.purchases.filter(p => p.state === filters.state);
  } else if (filters.city) {
    // If city is specified, state should also be specified for accuracy
    filteredPurchases = fullDataset.purchases.filter(p => p.city === filters.city && p.state === filters.state);
  }

  // From the filtered purchases, find the unique products and vendors involved
  const productIdsInScope = new Set(filteredPurchases.map(p => p.productId));
  const vendorIdsInScope = new Set(filteredPurchases.map(p => p.vendorId));

  const products = fullDataset.products.filter(p => productIdsInScope.has(p.id));
  const vendors = fullDataset.vendors.filter(v => vendorIdsInScope.has(v.id));
  
  const productMap = new Map(products.map(p => [p.id, p]));
  const vendorMap = new Map(vendors.map(v => [v.id, v]));

  // Step 1: Calculate margin for each purchase and find best margin for each product *within the full dataset*
  const allPurchasesWithMargin = fullDataset.purchases.map(purchase => {
    const product = fullDataset.products.find(p => p.id === purchase.productId)!;
    const margin = ((product.sellingPrice - purchase.purchasePrice) / product.sellingPrice) * 100;
    return { ...purchase, margin };
  });

  const bestMargins = new Map<string, { price: number; margin: number }>();
  for (const p of allPurchasesWithMargin) {
    if (!bestMargins.has(p.productId) || p.margin > bestMargins.get(p.productId)!.margin) {
      bestMargins.set(p.productId, { price: p.purchasePrice, margin: p.margin });
    }
  }

  // Step 2: Process filtered purchases to calculate margin loss
  let totalMarginLoss = 0;
  const processedPurchases: ProcessedPurchase[] = filteredPurchases.map(p => {
    const product = productMap.get(p.productId)!;
    const vendor = vendorMap.get(p.vendorId)!;
    const margin = ((product.sellingPrice - p.purchasePrice) / product.sellingPrice) * 100;
    const bestMarginData = bestMargins.get(p.productId)!;
    
    const bestPrice = bestMarginData ? bestMarginData.price : p.purchasePrice;
    const marginLoss = (p.purchasePrice - bestPrice) * p.quantity;
    const finalMarginLoss = marginLoss > 0 ? marginLoss : 0;
    
    return {
      ...p,
      product,
      vendor,
      margin,
      marginLoss: finalMarginLoss,
      isBestMargin: p.purchasePrice === bestPrice,
    };
  });
  
  const actualTotalMarginLoss = processedPurchases.reduce((acc, p) => acc + p.marginLoss, 0);

  const targetTotalMarginLoss = filters.state || filters.city ? actualTotalMarginLoss : 1500000;
  const scalingFactor = (actualTotalMarginLoss > 0) ? targetTotalMarginLoss / actualTotalMarginLoss : 0;

  const finalProcessedPurchases = processedPurchases.map(p => ({
      ...p,
      marginLoss: p.marginLoss * scalingFactor
  }));

  totalMarginLoss = finalProcessedPurchases.reduce((acc, p) => acc + p.marginLoss, 0);


  // Step 3: Create summaries
  const productsSummary: ProductSummary[] = products.map(product => {
    const productPurchases = finalProcessedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    
    const totalMarginLoss = productPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    const totalMargin = productPurchases.reduce((acc,p) => acc + p.margin, 0);
    const bestMarginPurchase = productPurchases.find(p => p.isBestMargin);
    const sortedByDate = [...productPurchases].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());


    return {
      id: product.id,
      name: product.name,
      sellingPrice: product.sellingPrice,
      totalMarginLoss,
      purchaseCount: productPurchases.length,
      averageMargin: productPurchases.length > 0 ? totalMargin / productPurchases.length : 0,
      bestMargin: bestMargins.get(product.id)?.margin || 0,
      totalQuantityPurchased: productPurchases.reduce((acc, p) => acc + p.quantity, 0),
      worstMargin: productPurchases.length > 0 ? Math.min(...productPurchases.map(p => p.margin)) : 0,
      bestVendor: bestMarginPurchase ? {id: bestMarginPurchase.vendor.id, name: bestMarginPurchase.vendor.name } : null,
      latestPurchasePrice: sortedByDate.length > 0 ? sortedByDate[0].purchasePrice : null
    };
  }).filter((p): p is ProductSummary => p !== null);

  const vendorsSummary = vendors.map(vendor => {
    const vendorPurchases = finalProcessedPurchases.filter(p => p.vendorId === vendor.id);
    if(vendorPurchases.length === 0) return null;

    const totalMarginLoss = vendorPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    return {
      id: vendor.id,
      name: vendor.name,
      totalMarginLoss,
      productsPurchased: new Set(vendorPurchases.map(p => p.productId)).size,
    };
  }).filter((v): v is VendorSummary => v !== null);

  // Step 4: Margin Analysis Summary
  const startOfCurrentYear = startOfYear(new Date());
  const marginAnalysisSummary: MarginAnalysisProductSummary[] = products.map(product => {
     const productPurchases = finalProcessedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;

    const purchasesYTD = productPurchases.filter(p => parseISO(p.date) >= startOfCurrentYear);
    
    const totalPurchaseCost = productPurchases.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
    const totalMarginLoss = productPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    
    const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;

    const vendorIds = new Set(productPurchases.map(p => p.vendorId));
    
    const baseSummary = productsSummary.find(ps => ps.id === product.id)!;

    return {
        ...baseSummary,
        purchaseCount: purchasesYTD.length,
        marginLossPercentage,
        vendorCount: vendorIds.size,
    };
  }).filter((p): p is MarginAnalysisProductSummary => p !== null);;


  return {
    totalMarginLoss,
    productsSummary,
    vendorsSummary,
    processedPurchases: finalProcessedPurchases.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    products,
    vendors,
    marginAnalysisSummary,
  };
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
