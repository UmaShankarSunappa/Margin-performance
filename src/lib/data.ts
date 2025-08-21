import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary, VendorSummary } from "@/lib/types";
import { parseISO, startOfYear } from 'date-fns';

// Helper to find the mode of an array of numbers
function getMode(arr: number[]): number | undefined {
    if (arr.length === 0) return undefined;
    const frequencyMap: { [key: number]: number } = {};
    let maxFreq = 0;
    let modes: number[] = [];

    arr.forEach(item => {
        frequencyMap[item] = (frequencyMap[item] || 0) + 1;
        if (frequencyMap[item] > maxFreq) {
            maxFreq = frequencyMap[item];
        }
    });

    // In case of multiple modes, we can decide on a strategy.
    // For now, let's take the first one we find.
    // Or, for financial data, perhaps the lowest of the modes is safest.
    for (const key in frequencyMap) {
        if (frequencyMap[key] === maxFreq) {
            modes.push(parseFloat(key));
        }
    }
    
    if (modes.length > 0) {
      return modes.sort((a,b) => a-b)[0]; // Return the smallest mode
    }

    return arr.length > 0 ? arr[0] : undefined; // Fallback if no clear mode
}

export const geoLocations = {
    states: ["Karnataka", "Tamil Nadu", "Telangana", "Maharashtra", "West Bengal", "Odisha"],
    citiesByState: {
        "Telangana": ["Hyderabad", "Medak"],
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
  const purchasesPerProduct = 20; // Increased for better mode calculation

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
      // Create a more realistic margin distribution for mode calculation
      const commonMarginPercentage = (Math.random() * 15 + 10) / 100; // 10-25%
      const commonPurchasePrice = product.sellingPrice * (1 - commonMarginPercentage);

      for (let i = 0; i < purchasesPerProduct; i++) {
          const vendor = vendors[Math.floor(Math.random() * vendors.length)];
          const date = new Date(Date.now() - Math.random() * 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const quantity = Math.floor(Math.random() * 150) + 10;
          let purchasePrice;

          const randomFactor = Math.random();
          if (randomFactor < 0.6) { // 60% chance of being the common price
              purchasePrice = commonPurchasePrice;
          } else if (randomFactor < 0.9) { // 30% chance of slight variation
              purchasePrice = commonPurchasePrice * (1 + (Math.random() - 0.5) * 0.2); // +/- 10%
          } else { // 10% chance of being a significant outlier
              purchasePrice = commonPurchasePrice * (1 - Math.random() * 0.5); // Price can be much lower -> margin higher
          }
          
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


export async function getAppData(filters: { state?: string; city?: string, customModes?: Record<string, number> } = {}): Promise<AppData> {
  let filteredPurchases = fullDataset.purchases;

  if (filters.city && filters.state) {
    filteredPurchases = fullDataset.purchases.filter(p => p.city === filters.city && p.state === filters.state);
  } else if(filters.state) {
    filteredPurchases = fullDataset.purchases.filter(p => p.state === filters.state);
  }

  const productIdsInScope = new Set(filteredPurchases.map(p => p.productId));
  const vendorIdsInScope = new Set(filteredPurchases.map(p => p.vendorId));

  const products = fullDataset.products.filter(p => productIdsInScope.has(p.id));
  const vendors = fullDataset.vendors.filter(v => vendorIdsInScope.has(v.id));
  
  const productMap = new Map(products.map(p => [p.id, p]));
  const vendorMap = new Map(vendors.map(v => [v.id, v]));

  // Step 1: Calculate margin for all purchases within the current filter scope
  const purchasesWithMargin = filteredPurchases.map(purchase => {
    const product = productMap.get(purchase.productId)!;
    const margin = ((product.sellingPrice - purchase.purchasePrice) / product.sellingPrice) * 100;
    return { ...purchase, margin };
  });

  // Step 2: For each product, calculate mode, identify outliers, and find the best margin from non-outliers
  const productBenchmarks = new Map<string, { mode: number, bestMargin: number, bestPrice: number }>();
  for (const product of products) {
      const productPurchases = purchasesWithMargin.filter(p => p.productId === product.id);
      if (productPurchases.length === 0) continue;

      const margins = productPurchases.map(p => p.margin);
      
      // Use custom mode if provided, otherwise calculate it
      const modeMargin = filters.customModes?.[product.id] ?? getMode(margins.map(m => parseFloat(m.toFixed(2)))) ?? 0;
      
      const outlierThreshold = 4 * modeMargin;

      const nonOutlierPurchases = productPurchases.filter(p => p.margin < outlierThreshold);
      
      let bestMargin = 0;
      let bestPrice = product.sellingPrice;

      if (nonOutlierPurchases.length > 0) {
        bestMargin = Math.max(...nonOutlierPurchases.map(p => p.margin));
        const bestPurchase = nonOutlierPurchases.find(p => p.margin === bestMargin)!;
        bestPrice = bestPurchase.purchasePrice;
      }

      productBenchmarks.set(product.id, { mode: modeMargin, bestMargin, bestPrice });
  }

  // Step 3: Process filtered purchases to calculate margin loss using the new logic
  const processedPurchases: ProcessedPurchase[] = purchasesWithMargin.map(p => {
    const product = productMap.get(p.productId)!;
    const vendor = vendorMap.get(p.vendorId)!;
    const benchmark = productBenchmarks.get(p.productId);

    if (!benchmark) { // Should not happen if product exists
        return { ...p, product, vendor, marginLoss: 0, isBestMargin: false, isOutlier: false, benchmarkMargin: p.margin, modeMargin: 0 };
    }

    const { mode, bestMargin, bestPrice } = benchmark;
    const outlierThreshold = 4 * mode;
    const isOutlier = p.margin >= outlierThreshold;

    let marginLoss = 0;
    if (!isOutlier) {
      // (Actual Price - Best Price) * Quantity
      const loss = (p.purchasePrice - bestPrice) * p.quantity;
      marginLoss = loss > 0 ? loss : 0;
    }
    
    return {
      ...p,
      product,
      vendor,
      marginLoss,
      isBestMargin: p.purchasePrice === bestPrice && !isOutlier,
      isOutlier,
      benchmarkMargin: bestMargin,
      modeMargin: mode,
    };
  });
  
  const totalMarginLoss = processedPurchases.reduce((acc, p) => acc + p.marginLoss, 0);

  // Step 4: Create summaries
  const productsSummary: ProductSummary[] = products.map(product => {
    const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    
    const nonOutlierPurchases = productPurchases.filter(p => !p.isOutlier);

    const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    const totalPurchaseValue = nonOutlierPurchases.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
    
    const benchmark = productBenchmarks.get(product.id);
    const bestMarginFromBenchmark = benchmark?.bestMargin || 0;
    const modeMargin = benchmark?.mode || 0;
    
    const bestMarginPurchase = nonOutlierPurchases.find(p => p.isBestMargin);
    const worstMarginPurchase = nonOutlierPurchases.length > 0 
      ? nonOutlierPurchases.reduce((worst, current) => (current.margin < worst.margin ? current : worst), nonOutlierPurchases[0])
      : null;
    const sortedByDate = [...productPurchases].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    
    return {
      id: product.id,
      name: product.name,
      sellingPrice: product.sellingPrice,
      totalMarginLoss,
      purchaseCount: nonOutlierPurchases.length,
      averageMargin: nonOutlierPurchases.length > 0 ? nonOutlierPurchases.reduce((acc, p) => acc + p.margin, 0) / nonOutlierPurchases.length : 0,
      bestMargin: bestMarginFromBenchmark,
      totalQuantityPurchased: nonOutlierPurchases.reduce((acc, p) => acc + p.quantity, 0),
      worstMargin: nonOutlierPurchases.length > 0 ? Math.min(...nonOutlierPurchases.map(p => p.margin)) : 0,
      bestVendor: bestMarginPurchase ? {id: bestMarginPurchase.vendor.id, name: bestMarginPurchase.vendor.name } : null,
      worstVendor: worstMarginPurchase ? { id: worstMarginPurchase.vendor.id, name: worstMarginPurchase.vendor.name } : null,
      latestPurchasePrice: sortedByDate.length > 0 ? sortedByDate[0].purchasePrice : null,
      marginLossPercentage: totalPurchaseValue > 0 ? (totalMarginLoss / totalPurchaseValue) * 100 : 0,
      modeMargin: modeMargin,
    };
  }).filter((p): p is ProductSummary => p !== null);

  const vendorsSummary: VendorSummary[] = vendors.map(vendor => {
    const vendorPurchases = processedPurchases.filter(p => p.vendorId === vendor.id && !p.isOutlier);
    if(vendorPurchases.length === 0) return null;

    const totalMarginLoss = vendorPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    return {
      id: vendor.id,
      name: vendor.name,
      totalMarginLoss,
      productsPurchased: new Set(vendorPurchases.map(p => p.productId)).size,
    };
  }).filter((v): v is VendorSummary => v !== null);

  // Step 5: Margin Analysis Summary
  const startOfCurrentYear = startOfYear(new Date());
  const marginAnalysisSummary: MarginAnalysisProductSummary[] = products.map(product => {
     const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;

    const purchasesYTD = productPurchases.filter(p => parseISO(p.date) >= startOfCurrentYear);
    
    const nonOutlierPurchases = productPurchases.filter(p => !p.isOutlier);
    const totalPurchaseCost = nonOutlierPurchases.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
    const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    
    const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;

    const vendorIds = new Set(nonOutlierPurchases.map(p => p.vendorId));
    
    const baseSummary = productsSummary.find(ps => ps.id === product.id)!;

    return {
        ...baseSummary,
        purchaseCount: purchasesYTD.filter(p => !p.isOutlier).length,
        marginLossPercentage,
        vendorCount: vendorIds.size,
    };
  }).filter((p): p is MarginAnalysisProductSummary => p !== null);


  return {
    totalMarginLoss,
    productsSummary,
    vendorsSummary,
    processedPurchases: processedPurchases.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    products,
    vendors,
    marginAnalysisSummary,
  };
}


export async function getProductDetails(productId: string, customModes?: Record<string, number>) {
    // This function will now accept custom modes to re-calculate data
    const data = await getAppData({ customModes: customModes });
    const product = data.products.find(p => p.id === productId);
    if (!product) return null;

    // We need all purchases for this product, regardless of initial geo filter, to recalculate
    const allPurchasesForProduct = (await getAppData({ customModes })).processedPurchases.filter(p => p.productId === productId);
    
    const summary = data.productsSummary.find(p => p.id === productId);

    return { product, purchases: allPurchasesForProduct, summary };
}

export async function getVendorDetails(vendorId: string) {
    const data = await getAppData(); // This will get Pan-India by default
    const vendor = data.vendors.find(v => v.id === vendorId);
    if (!vendor) return null;
    
    const allPurchases = (await getAppData()).processedPurchases;
    const vendorPurchases = allPurchases.filter(p => p.vendorId === vendorId);
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