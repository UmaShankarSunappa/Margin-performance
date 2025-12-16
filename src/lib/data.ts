



import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary, ProductDetails, VendorSummary, MonthlyAverage, HomePageData, QuantityOutlierFilter, DataFilters, PurchaseWithMargin } from "@/lib/types";
import { parseISO, startOfYear, subMonths, isAfter, subYears, endOfMonth, startOfMonth, sub, isWithinInterval, getYear, format as formatDate, getMonth, parse } from 'date-fns';

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
  const purchasesWithMargin: PurchaseWithMargin[] = [];

  const productCount = 150;
  const vendorCount = 66;
  const purchasesPerProduct = 20;
  
   const manufacturers = {
    "Sun Pharma": ["Consumer Healthcare", "Specialty Generic"],
    "Cipla": ["Respiratory", "Urology", "Cardiology"],
    "Dr. Reddy's": ["Pharmaceutical Services", "Generic Formulations"],
    "Lupin": ["Anti-Infective", "Diabetes"],
    "Zydus Cadila": ["Wellness", "Animal Health"],
    "Glenmark": ["Glenmark Consumer Care", "Sanitary Hygine"],
  };
  const manufacturerNames = Object.keys(manufacturers);


  // Generate Products
  const pharmaNames = [
    "Dolo 650mg", "Telma 40mg", "Istamet 50/500mg", "Calpol 500mg", "Azithral 500mg",
    "Pantop 40mg", "Augmentin 625 Duo", "Volini Gel", "Moov Spray", "Betadine Ointment",
    "Zincovit Tablet", "Neurobion Forte", "Ecosprin 75mg", "Atorva 10mg", "Losar 50mg",
    "Ciplox Eye Drops", "Otrivin Nasal Spray", "Vicks Action 500", "Crocin Advance",
    "Combiflam Tablet", "Glycomet GP 2", "Janumet 50/1000", "Mixtard 30/70", "Humalog KwikPen",
    "Thyronorm 50mcg", "Eltroxin 100mcg", "Shelcal 500mg", "Evion 400mg", "Limcee 500mg",
    "Clavam 625mg", "Taxim-O 200mg", "Cefix 200mg", "Monocef 1g Injection", "Moxikind-CV 625",
    "Domstal Tablet", "Ondem 4mg", "Eldoper Capsule", "Rantac 150mg", "Digene Gel",
    "Gelusil MPS", "Cremaffin Plus", "Duphalac Syrup", "Smuth Syrup", "Isabgol Husk",
    "Revital H", "Supradyn Tablet", "Becosules Z", "A to Z NS Tablet", "Polybion Capsule",
    "Unienzyme Tablet", "Allegra 120mg", "Cetrizine 10mg", "Avil 25mg", "Montair LC",
    "Deriphyllin Retard 150", "Asthalin Inhaler", "Seroflo Inhaler", "Foracort Inhaler",
    "Budecort Respules", "Duolin Respules", "Meftal-Spas Tablet", "Voveran SR 100", "Nise Tablet",
    "Etorico 90mg", "Myoril Capsule", "Zerodol-SP", "Omnigel", "Soframycin Skin Cream",
    "Candid-B Cream", "Fourderm Cream", "Betnovate-N Cream", "Silverex Ointment",
    "Neosporin Powder", "Cipladine Ointment", "Burnol Cream", "Dettol Antiseptic", "Savlon Liquid",
    "Band-Aid", "Leukoplast Tape", "Accu-Chek Active", "Dr. Morepen GlucoOne", "Omron BP Monitor",
    "Himalaya Liv.52", "Himalaya Gasex", "Himalaya Septilin", "Dabur Chyawanprash", "Pudin Hara",
    "Hajmola", "Eno Fruit Salt", "ORS Powder", "Electral Powder", "Gaviscon Syrup"
  ];

  for (let i = 1; i <= productCount; i++) {
    const nameIndex = (i - 1) % pharmaNames.length;
    let productName = pharmaNames[nameIndex];
    if (i > pharmaNames.length) {
        productName = `${productName} #${Math.floor(i / pharmaNames.length) + 1}`;
    }
    const manufacturer = manufacturerNames[i % manufacturerNames.length];
    const divisions = manufacturers[manufacturer as keyof typeof manufacturers];
    const division = divisions[i % divisions.length];

    products.push({
      id: `sku-${i}`,
      name: productName,
      sellingPrice: Math.random() * 300 + 20,
      manufacturer,
      division,
      productType: Math.random() > 0.15 ? 'Non-Private Label' : 'Private Label',
    });
  }

  const vendorNames = ["Om sai enterprise", "Vishal agensises", "Khan C&F", "N sons agensises", "Bharat distributors"];
  for (let i = 1; i <= vendorCount; i++) {
    vendors.push({
      id: `vendor-${i}`,
      name: i <= vendorNames.length ? vendorNames[i-1] : `PharmaDistro ${i}`,
    });
  }

  let purchaseIdCounter = 1;

  // Months with data: Dec, Nov, Oct, Sep (2025)
  const monthsWithData = [11, 10, 9, 8]; 

  products.forEach(product => {
    const commonMarginPercentage = (Math.random() * 15 + 10) / 100;
    const commonPurchasePrice = product.sellingPrice * (1 - commonMarginPercentage);
    const isOutlierSku = parseInt(product.id.split('-')[1]) <= 3;
    
    for (let i = 0; i < purchasesPerProduct; i++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        
        // Generate dates only in the specified months of 2025
        const monthIndex = monthsWithData[Math.floor(Math.random() * monthsWithData.length)];
        const dayOfMonth = Math.floor(Math.random() * 28) + 1; // 1 to 28
        const date = new Date(2025, monthIndex, dayOfMonth).toISOString().split('T')[0];

        const quantity = Math.floor(Math.random() * 150) + 10;
        let purchasePrice;
        
        if (isOutlierSku && i === purchasesPerProduct - 1) {
            const outlierMargin = 0.80; 
            purchasePrice = product.sellingPrice * (1 - outlierMargin);
        } else {
            const randomFactor = Math.random();
            if (randomFactor < 0.6) {
                purchasePrice = commonPurchasePrice;
            } else if (randomFactor < 0.9) {
                purchasePrice = commonPurchasePrice * (1 + (Math.random() - 0.5) * 0.1);
            } else {
                purchasePrice = commonPurchasePrice * (1 - Math.random() * 0.15);
            }
        }
        
        const state = geoLocations.states[Math.floor(Math.random() * geoLocations.states.length)];
        const citiesInState = geoLocations.citiesByState[state];
        const city = citiesInState[Math.floor(Math.random() * citiesInState.length)];

        const purchase: Purchase = {
            id: `pur-${purchaseIdCounter++}`,
            invoiceNumber: `INV-${Math.floor(Math.random() * 1000000) + 1}`,
            mrp: product.sellingPrice,
            productId: product.id,
            vendorId: vendor.id,
            date,
            quantity,
            purchasePrice: parseFloat(purchasePrice.toFixed(2)),
            state,
            city
        };
        purchases.push(purchase);
        
        const margin = ((product.sellingPrice - purchase.purchasePrice) / product.sellingPrice) * 100;
        purchasesWithMargin.push({ ...purchase, margin });
    }
  });

  return { products, vendors, purchases, purchasesWithMargin };
}

// Store the full dataset in memory
const fullDataset = generateData();

export function getFilterOptions() {
    const manufacturers = [...new Set(fullDataset.products.map(p => p.manufacturer))];
    const divisions = [...new Set(fullDataset.products.map(p => p.division))];
    const vendors = [...new Set(fullDataset.vendors.map(v => v.name))];
    return { manufacturers, divisions, vendors };
}


export function getFinancialYearMonths() {
    const months = [];
    // Per user request, current month is Dec 2025
    const endDate = new Date(2025, 11, 1); 
    const fyStartDate = new Date(2025, 3, 1); // April 2025

    let currentDate = endDate;
    while (currentDate >= fyStartDate) {
        months.push({
            label: formatDate(currentDate, 'MMM yyyy'),
            value: formatDate(currentDate, 'yyyy-MM'),
        });
        currentDate = subMonths(currentDate, 1);
    }

    return months;
}


export async function getAppData(
    filters: DataFilters,
    options: { customMultipliers?: Record<string, number>, period?: 'mtd' | string | { start: Date, end: Date }, quantityOutlierFilter?: QuantityOutlierFilter } = {}
): Promise<AppData> {
  const allPurchasesWithMargin = fullDataset.purchasesWithMargin;
  const allProducts = fullDataset.products;
  
  const now = new Date(2025, 11, 15); // Simulate "today" as Dec 15, 2025
  let endDate: Date;
  let startDate: Date;

  if (typeof options.period === 'object') {
    startDate = options.period.start;
    endDate = options.period.end;
  } else if (options.period === 'mtd' || !options.period) {
      endDate = now;
      startDate = startOfMonth(subMonths(now, 3)); 
  } else {
      const [year, month] = options.period.split('-').map(Number);
      const selectedMonthDate = new Date(year, month - 1, 1);
      endDate = endOfMonth(selectedMonthDate);
      startDate = startOfMonth(subMonths(selectedMonthDate, 3));
  }

  const timeFilteredPurchases = allPurchasesWithMargin.filter(p => {
      const purchaseDate = parseISO(p.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
  });

  const productMap = new Map(allProducts.map(p => [p.id, p]));

  let attributeFilteredPurchases = timeFilteredPurchases;

  if (filters.productType && filters.productType !== 'all') {
    attributeFilteredPurchases = attributeFilteredPurchases.filter(p => {
        const product = productMap.get(p.productId);
        return product && product.productType === filters.productType;
    });
  }
  if (filters.manufacturer && filters.manufacturer !== 'all') {
      attributeFilteredPurchases = attributeFilteredPurchases.filter(p => {
        const product = productMap.get(p.productId);
        return product && product.manufacturer === filters.manufacturer;
      });
  }
  if (filters.division && filters.division !== 'all') {
      attributeFilteredPurchases = attributeFilteredPurchases.filter(p => {
        const product = productMap.get(p.productId);
        return product && product.division === filters.division;
      });
  }
  
  const vendorMap = new Map(fullDataset.vendors.map(v => [v.id, v]));

  if (filters.vendor && filters.vendor !== 'all') {
    attributeFilteredPurchases = attributeFilteredPurchases.filter(p => {
        const vendor = vendorMap.get(p.vendorId);
        return vendor && vendor.name === filters.vendor;
      });
  }
  
  let geoFilteredPurchases = attributeFilteredPurchases;

  if (filters.geo.city && filters.geo.state) {
    geoFilteredPurchases = attributeFilteredPurchases.filter(p => p.city === filters.geo.city && p.state === filters.geo.state);
  } else if (filters.geo.state) {
    geoFilteredPurchases = attributeFilteredPurchases.filter(p => p.state === filters.geo.state);
  }
  
  let filteredPurchases = geoFilteredPurchases;

  const productIdsInScope = new Set(filteredPurchases.map(p => p.productId));
  const vendorIdsInScope = new Set(filteredPurchases.map(p => p.vendorId));

  const products = allProducts.filter(p => productIdsInScope.has(p.id));
  const vendors = fullDataset.vendors.filter(v => vendorIdsInScope.has(v.id));
  
  // Quantity-based outlier filtering
  let quantityFilteredPurchases = filteredPurchases;
  if (options.quantityOutlierFilter && options.quantityOutlierFilter !== 'none') {
    const quantityOutlierThresholdPercentage = options.quantityOutlierFilter === '1percent' ? 0.01 : 0.05;
    const skuTotalQuantities = new Map<string, number>();

    // Calculate total quantity for each SKU within the period
    filteredPurchases.forEach(p => {
        skuTotalQuantities.set(p.productId, (skuTotalQuantities.get(p.productId) || 0) + p.quantity);
    });

    quantityFilteredPurchases = filteredPurchases.map(p => {
        const totalQuantity = skuTotalQuantities.get(p.productId) || 0;
        const threshold = totalQuantity * quantityOutlierThresholdPercentage;
        return { ...p, isQuantityOutlier: p.quantity < threshold };
    });
  } else {
     quantityFilteredPurchases = filteredPurchases.map(p => ({...p, isQuantityOutlier: false }));
  }


  const productBenchmarks = new Map<string, { mode: number, bestMargin: number, bestPrice: number }>();
  for (const product of allProducts) {
      // Benchmark should be calculated on the entire history to find the true best margin
      const productPurchases = allPurchasesWithMargin.filter(p => p.productId === product.id);
      if (productPurchases.length === 0) continue;

      const margins = productPurchases.map(p => p.margin);
      const modeMargin = getMode(margins.map(m => parseFloat(m.toFixed(2)))) ?? 0;
      const multiplier = options.customMultipliers?.[product.id] ?? 4.0;
      const outlierThreshold = multiplier * modeMargin;
      
      const nonOutlierPurchases = quantityFilteredPurchases
        .filter(p => p.productId === product.id && p.margin < outlierThreshold && !p.isQuantityOutlier);
      
      let bestMargin = 0;
      let bestPrice = product.sellingPrice;
      if (nonOutlierPurchases.length > 0) {
        bestMargin = Math.max(...nonOutlierPurchases.map(p => p.margin));
        const bestPurchase = nonOutlierPurchases.find(p => p.margin === bestMargin)!;
        bestPrice = bestPurchase.purchasePrice;
      } else {
        const nonOutlierGlobal = productPurchases.filter(p => p.margin < outlierThreshold);
        if (nonOutlierGlobal.length > 0) {
           bestMargin = Math.max(...nonOutlierGlobal.map(p => p.margin));
           const bestPurchase = nonOutlierGlobal.find(p => p.margin === bestMargin)!;
           bestPrice = bestPurchase.purchasePrice;
        } else {
            bestMargin = modeMargin;
            bestPrice = product.sellingPrice * (1 - (modeMargin / 100));
        }
      }
      productBenchmarks.set(product.id, { mode: modeMargin, bestMargin, bestPrice });
  }

  const processedPurchases: ProcessedPurchase[] = quantityFilteredPurchases.map(p => {
    const product = productMap.get(p.productId)!;
    const vendor = vendorMap.get(p.vendorId)!;
    const benchmark = productBenchmarks.get(p.productId);
    const margin = p.margin;

    if (!benchmark) {
        return { ...p, margin, product, vendor, marginLoss: 0, isBestMargin: false, isMarginOutlier: false, isQuantityOutlier: p.isQuantityOutlier, benchmarkMargin: margin, modeMargin: 0 };
    }

    const { mode, bestMargin, bestPrice } = benchmark;
    const multiplier = options.customMultipliers?.[p.productId] ?? 4.0;
    const outlierThreshold = multiplier * mode;
    const isMarginOutlier = margin >= outlierThreshold;

    let marginLoss = 0;
    if (!isMarginOutlier && !p.isQuantityOutlier) {
      const marginDifference = bestMargin - margin;
      const lossPerUnit = product.sellingPrice * (marginDifference / 100);
      const totalLoss = lossPerUnit * p.quantity;
      marginLoss = totalLoss > 0 ? totalLoss : 0;
    }
    
    return { ...p, margin, product, vendor, marginLoss, isBestMargin: p.purchasePrice === bestPrice && !isMarginOutlier && !p.isQuantityOutlier, isMarginOutlier, isQuantityOutlier: p.isQuantityOutlier, benchmarkMargin: bestMargin, modeMargin: mode };
  });
  
  const totalMarginLoss = processedPurchases.reduce((acc, p) => acc + p.marginLoss, 0);

  const productsSummary: ProductSummary[] = products.map(product => {
    const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    const nonOutlierPurchases = productPurchases.filter(p => !p.isMarginOutlier && !p.isQuantityOutlier);
    if (nonOutlierPurchases.length === 0) return null;

    const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    const totalPurchaseValue = nonOutlierPurchases.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
    
    const bestMarginForPeriod = nonOutlierPurchases.length > 0 ? Math.max(...nonOutlierPurchases.map(p => p.margin)) : 0;
    const bestMarginPurchase = nonOutlierPurchases.find(p => p.margin === bestMarginForPeriod);
    const worstMarginPurchase = nonOutlierPurchases.length > 0 ? nonOutlierPurchases.sort((a,b) => a.margin - b.margin)[0] : undefined;
    const benchmark = productBenchmarks.get(product.id);
    const modeMargin = benchmark?.mode || 0;
    
    return {
      id: product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      sellingPrice: product.sellingPrice,
      totalMarginLoss,
      purchaseCount: nonOutlierPurchases.length,
      averageMargin: nonOutlierPurchases.length > 0 ? nonOutlierPurchases.reduce((acc, p) => acc + p.margin, 0) / nonOutlierPurchases.length : 0,
      bestMargin: bestMarginForPeriod,
      totalQuantityPurchased: nonOutlierPurchases.reduce((acc, p) => acc + p.quantity, 0),
      worstMargin: worstMarginPurchase?.margin ?? 0,
      bestVendor: bestMarginPurchase ? {id: bestMarginPurchase.vendor.id, name: bestMarginPurchase.vendor.name } : null,
      worstVendor: worstMarginPurchase ? { id: worstMarginPurchase.vendor.id, name: worstMarginPurchase.vendor.name } : null,
      marginLossPercentage: totalPurchaseValue > 0 ? (totalMarginLoss / totalPurchaseValue) * 100 : 0,
      modeMargin: modeMargin,
    };
  }).filter((p): p is ProductSummary => p !== null);

  const vendorsSummary: VendorSummary[] = vendors.map(vendor => {
    const vendorPurchases = processedPurchases.filter(p => p.vendorId === vendor.id && !p.isMarginOutlier && !p.isQuantityOutlier);
    if(vendorPurchases.length === 0) return null;
    const totalMarginLoss = vendorPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    return { id: vendor.id, name: vendor.name, totalMarginLoss, productsPurchased: new Set(vendorPurchases.map(p => p.productId)).size };
  }).filter((v): v is VendorSummary => v !== null);

  const marginAnalysisSummary: MarginAnalysisProductSummary[] = products.map(product => {
     const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    const nonOutlierPurchases = productPurchases.filter(p => !p.isMarginOutlier && !p.isQuantityOutlier);
    const totalPurchaseCost = nonOutlierPurchases.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
    const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;
    const vendorIds = new Set(nonOutlierPurchases.map(p => p.vendorId));
    const baseSummary = productsSummary.find(ps => ps.id === product.id);
    if (!baseSummary) return null;

    const globalBenchmark = productBenchmarks.get(product.id);
    if (!globalBenchmark) return null;
    
    // Use the best margin calculated for the specific filtered period
    const enhancedBaseSummary = { ...baseSummary, bestMargin: baseSummary.bestMargin };

    return { ...enhancedBaseSummary, purchaseCount: nonOutlierPurchases.length, marginLossPercentage, vendorCount: vendorIds.size };
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

export async function getRawPurchasesForProduct(productId: string): Promise<Purchase[]> {
    return fullDataset.purchases.filter(p => p.productId === productId);
}


export async function getProductDetails(
    productId: string, 
    dataFilters: DataFilters, 
    customMultipliers?: Record<string, number>,
    getPanIndiaData: boolean = false,
    period: string = 'mtd',
    quantityOutlierFilter: QuantityOutlierFilter = 'none'
): Promise<ProductDetails | null> {
    const product = fullDataset.products.find(p => p.id === productId);
    if (!product) return null;

    const options = { customMultipliers, period, quantityOutlierFilter };

    // This fetches data for the entire 4-month window
    const dataForPeriod = await getAppData(dataFilters, options);
    const purchasesForPeriod = dataForPeriod.processedPurchases.filter(p => p.productId === productId);
    const summaryForPeriod = dataForPeriod.productsSummary.find(p => p.id === productId);

    // Define the date range for the primary selected month
    const now = new Date(2025, 11, 15); // Simulate "today" as Dec 15, 2025
    let monthlyEndDate: Date;
    let monthlyStartDate: Date;

    if (period === 'mtd' || !period) {
        monthlyEndDate = now;
        monthlyStartDate = startOfMonth(now);
    } else {
        const [year, month] = period.split('-').map(Number);
        const selectedMonthDate = new Date(year, month - 1, 1);
        monthlyStartDate = startOfMonth(selectedMonthDate);
        monthlyEndDate = endOfMonth(selectedMonthDate);
    }
    
    // Filter the 4-month purchases down to the single selected month for monthly KPIs
    const monthlyPurchases = purchasesForPeriod.filter(p => {
        const pDate = parseISO(p.date);
        return pDate >= monthlyStartDate && pDate <= monthlyEndDate && !p.isMarginOutlier && !p.isQuantityOutlier;
    });

    const monthlySummary: ProductMonthlySummary = {
        totalMarginLoss: monthlyPurchases.reduce((acc, p) => acc + p.marginLoss, 0),
        purchaseCount: monthlyPurchases.length,
        totalQuantityPurchased: monthlyPurchases.reduce((acc, p) => acc + p.quantity, 0),
        marginLossPercentage: 0
    };
    const monthlyTotalPurchaseValue = monthlyPurchases.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
    monthlySummary.marginLossPercentage = monthlyTotalPurchaseValue > 0 ? (monthlySummary.totalMarginLoss / monthlyTotalPurchaseValue) * 100 : 0;
    

    const allProductPurchases4Months = dataForPeriod.processedPurchases
      .filter(p => p.productId === productId && !p.isMarginOutlier && !p.isQuantityOutlier);
      
    const monthlyAverages: MonthlyAverage[] = [];
    const analysisStartDate = startOfMonth(subMonths(monthlyEndDate, 3));

    for(let i = 0; i < 4; i++){
        const monthDate = startOfMonth(subMonths(monthlyEndDate, 3 - i));
        
        const monthPurchases = allProductPurchases4Months.filter(p => {
            const pDate = parseISO(p.date);
            return pDate.getFullYear() === monthDate.getFullYear() && pDate.getMonth() === monthDate.getMonth();
        });

        if (monthPurchases.length > 0) {
            const totalMargin = monthPurchases.reduce((acc, p) => acc + p.margin, 0);
            const totalPrice = monthPurchases.reduce((acc, p) => acc + p.purchasePrice, 0);
            monthlyAverages.push({
                month: formatDate(monthDate, 'MMM'),
                averageMargin: totalMargin / monthPurchases.length,
                averagePrice: totalPrice / monthPurchases.length,
            });
        }
    }

    let panIndiaSummary: ProductSummary | undefined = undefined;
    let panIndiaMonthlySummary: ProductMonthlySummary | undefined = undefined;

    if (getPanIndiaData) {
        const panIndiaDataFilters = { ...dataFilters, geo: {} };
        const panIndiaData = await getAppData(panIndiaDataFilters, options);
        panIndiaSummary = panIndiaData.productsSummary.find(p => p.id === productId);

        const panIndiaMonthlyPurchases = panIndiaData.processedPurchases.filter(p => {
            const pDate = parseISO(p.date);
            return p.productId === productId && pDate >= monthlyStartDate && pDate <= monthlyEndDate && !p.isMarginOutlier && !p.isQuantityOutlier;
        });

        panIndiaMonthlySummary = {
            totalMarginLoss: panIndiaMonthlyPurchases.reduce((acc, p) => acc + p.marginLoss, 0),
            purchaseCount: panIndiaMonthlyPurchases.length,
            totalQuantityPurchased: panIndiaMonthlyPurchases.reduce((acc, p) => acc + p.quantity, 0),
            marginLossPercentage: 0
        };
        const panIndiaMonthlyTotalPurchaseValue = panIndiaMonthlyPurchases.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
        panIndiaMonthlySummary.marginLossPercentage = panIndiaMonthlyTotalPurchaseValue > 0 ? (panIndiaMonthlySummary.totalMarginLoss / panIndiaMonthlyTotalPurchaseValue) * 100 : 0;
    }
    
    return { 
        product, 
        purchases: purchasesForPeriod, 
        summary: summaryForPeriod, 
        panIndiaSummary,
        monthlySummary,
        panIndiaMonthlySummary,
        monthlyAverages
    };
}

export async function getVendorDetails(
    vendorId: string,
    dataFilters: DataFilters,
    period: string = 'mtd',
    quantityOutlierFilter: QuantityOutlierFilter = 'none'
) {
    const data = await getAppData(dataFilters, { period, quantityOutlierFilter }); 
    const vendor = data.vendors.find(v => v.id === vendorId);
    if (!vendor) return null;
    
    const allPurchases = data.processedPurchases;
    const vendorPurchases = allPurchases.filter(p => p.vendorId === vendorId);
    const summary = data.vendorsSummary.find(v => v.id === vendorId);

    const productIds = [...new Set(vendorPurchases.map(p => p.productId))];

    const productsSummaryForVendor: VendorProductSummary[] = productIds.map(productId => {
        const purchasesOfProductFromVendor = vendorPurchases.filter(p => p.productId === productId && !p.isMarginOutlier && !p.isQuantityOutlier);
        if (purchasesOfProductFromVendor.length === 0) return null;
        
        const totalMargin = purchasesOfProductFromVendor.reduce((acc, p) => acc + p.margin, 0);
        const averageMargin = totalMargin / purchasesOfProductFromVendor.length;
        
        const productInfo = data.productsSummary.find(p => p.id === productId);

        return {
            productId,
            productName: productInfo?.name || "Unknown",
            averageMargin,
            bestOverallMargin: productInfo?.bestMargin || 0
        };
    }).filter((p): p is VendorProductSummary => p !== null)
    .sort((a, b) => a.productName.localeCompare(b.productName));

    return { vendor, summary, productsSummary: productsSummaryForVendor };
}


export async function getHomePageData(
    dataFilters: DataFilters,
    period: 'mtd' | string,
    quantityOutlierFilter: QuantityOutlierFilter
): Promise<HomePageData> {
    
    const today = new Date(2025, 11, 15);
    const currentYear = getYear(today);
    const currentMonth = getMonth(today);
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const ytdStartDate = new Date(fyStartYear, 3, 1);

    const periodOptions = { period, quantityOutlierFilter };
    const ytdOptions = { period: { start: ytdStartDate, end: today }, quantityOutlierFilter };

    const [analysisData, ytdData] = await Promise.all([
        getAppData(dataFilters, periodOptions),
        getAppData(dataFilters, ytdOptions)
    ]);

    return {
        analysisData,
        ytdTotalMarginLoss: ytdData.totalMarginLoss,
    };
}
