import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary, ProductDetails, VendorSummary, MonthlyAverage, HomePageData, ValueOutlierFilter } from "@/lib/types";
import { parseISO, startOfYear, subMonths, isAfter, subYears, endOfMonth, startOfMonth, sub, isWithinInterval, getYear, format as formatDate, startOfToday, getMonth, parse } from 'date-fns';

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
  const purchasesPerProduct = 20;

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

    products.push({
      id: `sku-${i}`,
      name: productName,
      sellingPrice: Math.random() * 300 + 20,
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
  const today = new Date();
  
  products.forEach(product => {
    const commonMarginPercentage = (Math.random() * 15 + 10) / 100;
    const commonPurchasePrice = product.sellingPrice * (1 - commonMarginPercentage);
    const isOutlierSku = parseInt(product.id.split('-')[1]) <= 3;
    
    for (let i = 0; i < purchasesPerProduct; i++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        // Generate dates within the last 2 years for broad data
        const date = sub(today, { days: Math.floor(Math.random() * 730) }).toISOString().split('T')[0];
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

export function getFinancialYearMonths(startYear = 2025) {
    const months = [];
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    // Financial year starts in April (month 3)
    let financialYearStart = new Date(startYear, 3, 1);

    // Loop from the start of the financial year to the current month
    while (financialYearStart <= today) {
        months.push({
            label: formatDate(financialYearStart, 'MMM yyyy'),
            value: formatDate(financialYearStart, 'yyyy-MM'),
        });
        financialYearStart.setMonth(financialYearStart.getMonth() + 1);
    }

    return months.reverse(); // Show most recent first
}


export async function getAppData(
    geoFilters: { state?: string; city?: string, cityState?: string } = {},
    options: { customMultipliers?: Record<string, number>, period?: 'mtd' | string, valueOutlierFilter?: ValueOutlierFilter } = {}
): Promise<AppData> {
  const allPurchases = fullDataset.purchases;
  
  const now = new Date();
  let endDate: Date;
  let startDate: Date;

  if (options.period === 'mtd' || !options.period) {
      endDate = startOfToday();
      startDate = startOfMonth(subMonths(now, 3)); 
  } else {
      const [year, month] = options.period.split('-').map(Number);
      const selectedMonthDate = new Date(year, month - 1, 1);
      endDate = endOfMonth(selectedMonthDate);
      startDate = startOfMonth(subMonths(selectedMonthDate, 3));
  }

  const timeFilteredPurchases = allPurchases.filter(p => {
      const purchaseDate = parseISO(p.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
  });

  let filteredPurchases = timeFilteredPurchases;

  if (geoFilters.city && geoFilters.state) {
    filteredPurchases = timeFilteredPurchases.filter(p => p.city === geoFilters.city && p.state === geoFilters.state);
  } else if (geoFilters.state) {
    filteredPurchases = timeFilteredPurchases.filter(p => p.state === geoFilters.state);
  }

  const productIdsInScope = new Set(filteredPurchases.map(p => p.productId));
  const vendorIdsInScope = new Set(filteredPurchases.map(p => p.vendorId));

  const products = fullDataset.products.filter(p => productIdsInScope.has(p.id));
  const vendors = fullDataset.vendors.filter(v => vendorIdsInScope.has(v.id));
  
  const productMap = new Map(fullDataset.products.map(p => [p.id, p]));
  const vendorMap = new Map(fullDataset.vendors.map(v => [v.id, v]));

  // Calculate margins for all purchases globally first to establish benchmarks
  const allPurchasesWithMargin = allPurchases.map(purchase => {
    const product = productMap.get(purchase.productId)!;
    const margin = ((product.sellingPrice - purchase.purchasePrice) / product.sellingPrice) * 100;
    return { ...purchase, margin };
  });
  
  // Value-based outlier filtering
  let valueFilteredPurchases = filteredPurchases;
  if (options.valueOutlierFilter && options.valueOutlierFilter !== 'none') {
    const valueOutlierThresholdPercentage = options.valueOutlierFilter === '1percent' ? 0.01 : 0.05;
    const skuTotalValues = new Map<string, number>();

    // Calculate total value for each SKU within the period
    filteredPurchases.forEach(p => {
        const value = p.purchasePrice * p.quantity;
        skuTotalValues.set(p.productId, (skuTotalValues.get(p.productId) || 0) + value);
    });

    valueFilteredPurchases = filteredPurchases.map(p => {
        const totalValue = skuTotalValues.get(p.productId) || 0;
        const threshold = totalValue * valueOutlierThresholdPercentage;
        const purchaseValue = p.purchasePrice * p.quantity;
        return { ...p, isValueOutlier: purchaseValue < threshold };
    });
  } else {
     valueFilteredPurchases = filteredPurchases.map(p => ({...p, isValueOutlier: false }));
  }


  const productBenchmarks = new Map<string, { mode: number, bestMargin: number, bestPrice: number }>();
  for (const product of fullDataset.products) {
      // Benchmark should be calculated on the entire history to find the true best margin
      const productPurchases = allPurchasesWithMargin.filter(p => p.productId === product.id);
      if (productPurchases.length === 0) continue;

      const margins = productPurchases.map(p => p.margin);
      const modeMargin = getMode(margins.map(m => parseFloat(m.toFixed(2)))) ?? 0;
      const multiplier = options.customMultipliers?.[product.id] ?? 4.0;
      const outlierThreshold = multiplier * modeMargin;
      
      const nonOutlierPurchases = valueFilteredPurchases
        .map(p => {
            const fullPurchase = allPurchasesWithMargin.find(pwm => pwm.id === p.id)!;
            return { ...fullPurchase, isValueOutlier: p.isValueOutlier };
        })
        .filter(p => p.productId === product.id && p.margin < outlierThreshold && !p.isValueOutlier);
      
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

  const processedPurchases: ProcessedPurchase[] = valueFilteredPurchases.map(p => {
    const product = productMap.get(p.productId)!;
    const vendor = vendorMap.get(p.vendorId)!;
    const benchmark = productBenchmarks.get(p.productId);
    const purchaseWithMargin = allPurchasesWithMargin.find(pwm => pwm.id === p.id)!;
    const margin = purchaseWithMargin.margin;

    if (!benchmark) {
        return { ...p, margin, product, vendor, marginLoss: 0, isBestMargin: false, isMarginOutlier: false, isValueOutlier: p.isValueOutlier, benchmarkMargin: margin, modeMargin: 0 };
    }

    const { mode, bestMargin, bestPrice } = benchmark;
    const multiplier = options.customMultipliers?.[p.productId] ?? 4.0;
    const outlierThreshold = multiplier * mode;
    const isMarginOutlier = margin >= outlierThreshold;

    let marginLoss = 0;
    if (!isMarginOutlier && !p.isValueOutlier) {
      const marginDifference = bestMargin - margin;
      const lossPerUnit = product.sellingPrice * (marginDifference / 100);
      const totalLoss = lossPerUnit * p.quantity;
      marginLoss = totalLoss > 0 ? totalLoss : 0;
    }
    
    return { ...p, margin, product, vendor, marginLoss, isBestMargin: p.purchasePrice === bestPrice && !isMarginOutlier && !p.isValueOutlier, isMarginOutlier, isValueOutlier: p.isValueOutlier, benchmarkMargin: bestMargin, modeMargin: mode };
  });
  
  const totalMarginLoss = processedPurchases.reduce((acc, p) => acc + p.marginLoss, 0);

  const productsSummary: ProductSummary[] = products.map(product => {
    const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    const nonOutlierPurchases = productPurchases.filter(p => !p.isMarginOutlier && !p.isValueOutlier);
    if (nonOutlierPurchases.length === 0) return null;

    const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    const totalPurchaseValue = nonOutlierPurchases.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
    
    const bestMarginForPeriod = Math.max(...nonOutlierPurchases.map(p => p.margin));
    const bestMarginPurchase = nonOutlierPurchases.find(p => p.margin === bestMarginForPeriod)!;
    const worstMarginPurchase = nonOutlierPurchases.sort((a,b) => a.margin - b.margin)[0];
    const benchmark = productBenchmarks.get(product.id);
    const modeMargin = benchmark?.mode || 0;
    
    return {
      id: product.id,
      name: product.name,
      sellingPrice: product.sellingPrice,
      totalMarginLoss,
      purchaseCount: nonOutlierPurchases.length,
      averageMargin: nonOutlierPurchases.length > 0 ? nonOutlierPurchases.reduce((acc, p) => acc + p.margin, 0) / nonOutlierPurchases.length : 0,
      bestMargin: bestMarginForPeriod,
      totalQuantityPurchased: nonOutlierPurchases.reduce((acc, p) => acc + p.quantity, 0),
      worstMargin: worstMarginPurchase.margin,
      bestVendor: {id: bestMarginPurchase.vendor.id, name: bestMarginPurchase.vendor.name },
      worstVendor: { id: worstMarginPurchase.vendor.id, name: worstMarginPurchase.vendor.name },
      marginLossPercentage: totalPurchaseValue > 0 ? (totalMarginLoss / totalPurchaseValue) * 100 : 0,
      modeMargin: modeMargin,
    };
  }).filter((p): p is ProductSummary => p !== null);

  const vendorsSummary: VendorSummary[] = vendors.map(vendor => {
    const vendorPurchases = processedPurchases.filter(p => p.vendorId === vendor.id && !p.isMarginOutlier && !p.isValueOutlier);
    if(vendorPurchases.length === 0) return null;
    const totalMarginLoss = vendorPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
    return { id: vendor.id, name: vendor.name, totalMarginLoss, productsPurchased: new Set(vendorPurchases.map(p => p.productId)).size };
  }).filter((v): v is VendorSummary => v !== null);

  const marginAnalysisSummary: MarginAnalysisProductSummary[] = products.map(product => {
     const productPurchases = processedPurchases.filter(p => p.productId === product.id);
    if (productPurchases.length === 0) return null;
    const nonOutlierPurchases = productPurchases.filter(p => !p.isMarginOutlier && !p.isValueOutlier);
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


export async function getProductDetails(
    productId: string, 
    filters: { state?: string; city?: string, cityState?:string } = {}, 
    customMultipliers?: Record<string, number>,
    getPanIndiaData: boolean = false,
    period: string = 'mtd',
    valueOutlierFilter: ValueOutlierFilter = 'none'
): Promise<ProductDetails | null> {
    const product = fullDataset.products.find(p => p.id === productId);
    if (!product) return null;

    const options = { customMultipliers, period, valueOutlierFilter };

    const dataForPeriod = await getAppData({ ...filters }, options);
    const purchasesForPeriod = dataForPeriod.processedPurchases.filter(p => p.productId === productId);
    const summaryForPeriod = dataForPeriod.productsSummary.find(p => p.id === productId);

    const now = new Date();
    const financialYearStart = now.getMonth() >= 3 ? new Date(now.getFullYear(), 3, 1) : new Date(now.getFullYear() - 1, 3, 1);
    
    const allProductPurchasesYTD = (await getAppData({...filters}, { customMultipliers, period: 'mtd', valueOutlierFilter })) // Use MTD to get up to current date for YTD
      .processedPurchases
      .filter(p => p.productId === productId && !p.isMarginOutlier && !p.isValueOutlier && parseISO(p.date) >= financialYearStart);
      
    const monthlyAverages: MonthlyAverage[] = [];
    for(let i = 0; i < 12; i++){
        const monthDate = new Date(financialYearStart.getFullYear(), financialYearStart.getMonth() + i, 1);
        if (monthDate > now) break;

        const monthPurchases = allProductPurchasesYTD.filter(p => {
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
    if (getPanIndiaData) {
        const panIndiaData = await getAppData({}, options);
        panIndiaSummary = panIndiaData.productsSummary.find(p => p.id === productId);
    }
    
    return { 
        product, 
        purchases: purchasesForPeriod, 
        summary: summaryForPeriod, 
        panIndiaSummary,
        monthlyAverages
    };
}

export async function getVendorDetails(
    vendorId: string,
    filters: { state?: string; city?: string, cityState?:string } = {},
    period: string = 'mtd',
    valueOutlierFilter: ValueOutlierFilter = 'none'
) {
    const data = await getAppData(filters, { period, valueOutlierFilter }); 
    const vendor = data.vendors.find(v => v.id === vendorId);
    if (!vendor) return null;
    
    const allPurchases = data.processedPurchases;
    const vendorPurchases = allPurchases.filter(p => p.vendorId === vendorId);
    const summary = data.vendorsSummary.find(v => v.id === vendorId);

    const productIds = [...new Set(vendorPurchases.map(p => p.productId))];

    const productsSummaryForVendor: VendorProductSummary[] = productIds.map(productId => {
        const purchasesOfProductFromVendor = vendorPurchases.filter(p => p.productId === productId && !p.isMarginOutlier && !p.isValueOutlier);
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
    geoFilters: { state?: string; city?: string, cityState?: string } = {},
    period: 'mtd' | string,
    valueOutlierFilter: ValueOutlierFilter
): Promise<HomePageData> {
    
    const analysisData = await getAppData(geoFilters, { period, valueOutlierFilter });

    return {
        analysisData,
    };
}
