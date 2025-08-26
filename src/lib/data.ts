import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary, ProductDetails, VendorSummary } from "@/lib/types";
import { parseISO, startOfYear, subMonths, isAfter } from 'date-fns';

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
    const commonMarginPercentage = (Math.random() * 15 + 10) / 100; // 10-25%
    const commonPurchasePrice = product.sellingPrice * (1 - commonMarginPercentage);

    // Force an outlier for the first few products
    const isOutlierSku = parseInt(product.id.split('-')[1]) <= 3; // Force for SKU-1, SKU-2, SKU-3
    
    for (let i = 0; i < purchasesPerProduct; i++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const date = new Date(Date.now() - Math.random() * 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const quantity = Math.floor(Math.random() * 150) + 10;
        let purchasePrice;
        
        // This makes the LAST purchase for outlier SKUs a guaranteed, large outlier
        if (isOutlierSku && i === purchasesPerProduct - 1) {
            // This margin (e.g., 80%) will be very high compared to the common margin (10-25%)
            const outlierMargin = 0.80; 
            purchasePrice = product.sellingPrice * (1 - outlierMargin);
        } else {
            const randomFactor = Math.random();
            if (randomFactor < 0.6) { // 60% chance of being the common price
                purchasePrice = commonPurchasePrice;
            } else if (randomFactor < 0.9) { // 30% chance of slight variation
                purchasePrice = commonPurchasePrice * (1 + (Math.random() - 0.5) * 0.1); // +/- 5%
            } else { // 10% chance of being a different, but not necessarily outlier price
                purchasePrice = commonPurchasePrice * (1 - Math.random() * 0.15); // Price can be lower -> margin higher but likely not outlier
            }
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


export async function getAppData(filters: { state?: string; city?: string, cityState?: string, customModes?: Record<string, number> } = {}): Promise<AppData> {
  let filteredPurchases = fullDataset.purchases;

  // Correct filtering logic. Use cityState for city filtering.
  if (filters.city && filters.state) {
    filteredPurchases = fullDataset.purchases.filter(p => p.city === filters.city && p.state === filters.state);
  } else if (filters.state) {
    filteredPurchases = fullDataset.purchases.filter(p => p.state === filters.state);
  }

  const productIdsInScope = new Set(filteredPurchases.map(p => p.productId));
  const vendorIdsInScope = new Set(filteredPurchases.map(p => p.vendorId));

  const products = fullDataset.products.filter(p => productIdsInScope.has(p.id));
  const vendors = fullDataset.vendors.filter(v => vendorIdsInScope.has(v.id));
  
  const productMap = new Map(fullDataset.products.map(p => [p.id, p]));
  const vendorMap = new Map(fullDataset.vendors.map(v => [v.id, v]));

  // Step 1: Calculate margin for ALL purchases to establish global benchmarks
  const allPurchasesWithMargin = fullDataset.purchases.map(purchase => {
    const product = productMap.get(purchase.productId)!;
    const margin = ((product.sellingPrice - purchase.purchasePrice) / product.sellingPrice) * 100;
    return { ...purchase, margin };
  });

  // Step 2: For each product, calculate global mode, identify outliers, and find the best margin from non-outliers
  const productBenchmarks = new Map<string, { mode: number, bestMargin: number, bestPrice: number }>();
  for (const product of fullDataset.products) {
      const productPurchases = allPurchasesWithMargin.filter(p => p.productId === product.id);
      if (productPurchases.length === 0) continue;

      const margins = productPurchases.map(p => p.margin);
      
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

  // Step 3: Process filtered purchases to calculate margin loss using the global benchmarks
  const processedPurchases: ProcessedPurchase[] = filteredPurchases.map(p => {
    const product = productMap.get(p.productId)!;
    const vendor = vendorMap.get(p.vendorId)!;
    const benchmark = productBenchmarks.get(p.productId);

    // This part now uses the pre-calculated margin
    const purchaseWithMargin = allPurchasesWithMargin.find(pwm => pwm.id === p.id)!;
    const margin = purchaseWithMargin.margin;

    if (!benchmark) { // Should not happen if product exists
        return { ...p, margin, product, vendor, marginLoss: 0, isBestMargin: false, isOutlier: false, benchmarkMargin: margin, modeMargin: 0 };
    }

    const { mode, bestMargin, bestPrice } = benchmark;
    const outlierThreshold = 4 * mode;
    const isOutlier = margin >= outlierThreshold;

    let marginLoss = 0;
    if (!isOutlier) {
      const marginDifference = bestMargin - margin;
      const lossPerUnit = product.sellingPrice * (marginDifference / 100);
      const totalLoss = lossPerUnit * p.quantity;
      marginLoss = totalLoss > 0 ? totalLoss : 0;
    }
    
    return {
      ...p,
      margin,
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

  // Step 4: Create summaries based on the SCOPED/FILTERED data
  const productsSummary: ProductSummary[] = products.map(product => {
    const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    
    const nonOutlierPurchases = productPurchases.filter(p => !p.isOutlier);
    if (nonOutlierPurchases.length === 0) return null; // Don't show products that ONLY have outlier purchases in this scope

    const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    const totalPurchaseValue = nonOutlierPurchases.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
    
    // Global benchmark is used for bestMargin
    const benchmark = productBenchmarks.get(product.id);
    const bestMarginFromBenchmark = benchmark?.bestMargin || 0;
    const modeMargin = benchmark?.mode || 0;
    
    const bestMarginPurchase = nonOutlierPurchases.sort((a,b) => b.margin - a.margin)[0];
    const worstMarginPurchase = nonOutlierPurchases.sort((a,b) => a.margin - b.margin)[0];
    
    return {
      id: product.id,
      name: product.name,
      sellingPrice: product.sellingPrice,
      totalMarginLoss,
      purchaseCount: nonOutlierPurchases.length,
      averageMargin: nonOutlierPurchases.length > 0 ? nonOutlierPurchases.reduce((acc, p) => acc + p.margin, 0) / nonOutlierPurchases.length : 0,
      bestMargin: bestMarginFromBenchmark,
      totalQuantityPurchased: nonOutlierPurchases.reduce((acc, p) => acc + p.quantity, 0),
      worstMargin: worstMarginPurchase.margin,
      bestVendor: {id: bestMarginPurchase.vendor.id, name: bestMarginPurchase.vendor.name },
      worstVendor: { id: worstMarginPurchase.vendor.id, name: worstMarginPurchase.vendor.name },
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
  const marginAnalysisSummary: MarginAnalysisProductSummary[] = products.map(product => {
     const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    
    const nonOutlierPurchases = productPurchases.filter(p => !p.isOutlier);
    const totalPurchaseCost = nonOutlierPurchases.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
    const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    
    const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;

    const vendorIds = new Set(nonOutlierPurchases.map(p => p.vendorId));
    
    const baseSummary = productsSummary.find(ps => ps.id === product.id);
    if (!baseSummary) return null;

    return {
        ...baseSummary,
        purchaseCount: nonOutlierPurchases.length, // This should reflect the filtered period
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


export async function getProductDetails(
    productId: string, 
    filters: { state?: string; city?: string, cityState?:string } = {}, 
    customModes?: Record<string, number>,
    getPanIndiaData: boolean = false
): Promise<ProductDetails | null> {
    const product = fullDataset.products.find(p => p.id === productId);
    if (!product) return null;

    // Get data for the filtered scope
    const filteredData = await getAppData({ ...filters, customModes });
    const filteredPurchases = filteredData.processedPurchases.filter(p => p.productId === productId);
    const filteredSummary = filteredData.productsSummary.find(p => p.id === productId);

    let panIndiaSummary: ProductSummary | undefined = undefined;

    // If requested, get Pan-India data for comparison
    if (getPanIndiaData) {
        const panIndiaData = await getAppData({ customModes }); // No geo filters
        panIndiaSummary = panIndiaData.productsSummary.find(p => p.id === productId);
    }
    
    return { 
        product, 
        purchases: filteredPurchases, 
        summary: filteredSummary, 
        panIndiaSummary 
    };
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
