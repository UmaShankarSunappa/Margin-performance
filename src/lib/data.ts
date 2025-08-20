import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary } from "@/lib/types";
import { parseISO, subYears, subDays, format, startOfYear } from 'date-fns';


let cache: AppData | null = null;


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
    // Determine a "best" price for this product to control margin loss
    const bestPrice = product.sellingPrice * (Math.random() * 0.15 + 0.5); // 50-65% of selling

    for (let i = 0; i < purchasesPerProduct; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const date = new Date(Date.now() - Math.random() * 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Random date within last 2 years
      const quantity = Math.floor(Math.random() * 150) + 10; // 10 to 160
      
      // Make most prices higher than the best price
      const priceFluctuation = (Math.random() - 0.2) * 0.5; // Skew towards positive
      let purchasePrice = bestPrice * (1 + priceFluctuation);
      
      // Randomly assign the best price to a purchase
      if (i % 4 === 0) {
          purchasePrice = bestPrice;
      }

      purchases.push({
        id: `p-${purchaseIdCounter++}`,
        productId: product.id,
        vendorId: vendor.id,
        date,
        quantity,
        purchasePrice: parseFloat(purchasePrice.toFixed(2)),
      });
    }
  });

  return { products, vendors, purchases };
}


export async function getAppData(): Promise<AppData> {
  // We don't cache in this scenario to allow for regeneration on each request if needed,
  // but for a real app, you'd re-enable caching.
  // if (cache) {
  //   return cache;
  // }

  const { products, vendors, purchases } = generateData();

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
    
    const bestPrice = bestMarginData ? bestMarginData.price : p.purchasePrice;
    const marginLoss = (p.purchasePrice - bestPrice) * p.quantity;
    const finalMarginLoss = marginLoss > 0 ? marginLoss : 0;
    
    return {
      ...p,
      product,
      vendor,
      marginLoss: finalMarginLoss,
      isBestMargin: p.purchasePrice === bestPrice,
    };
  });
  
  // Calculate the actual total margin loss from generated data
  const actualTotalMarginLoss = processedPurchases.reduce((acc, p) => acc + p.marginLoss, 0);

  // Scale the total margin loss to the target value
  const targetTotalMarginLoss = 1500000;
  const scalingFactor = targetTotalMarginLoss / actualTotalMarginLoss;

  const finalProcessedPurchases = processedPurchases.map(p => ({
      ...p,
      marginLoss: p.marginLoss * scalingFactor
  }));

  totalMarginLoss = finalProcessedPurchases.reduce((acc, p) => acc + p.marginLoss, 0);


  // Step 3: Create summaries
  const productsSummary: ProductSummary[] = products.map(product => {
    const productPurchases = finalProcessedPurchases.filter(p => p.productId === product.id);
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
  });

  const vendorsSummary = vendors.map(vendor => {
    const vendorPurchases = finalProcessedPurchases.filter(p => p.vendorId === vendor.id);
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
    const productPurchases = finalProcessedPurchases.filter(p => p.productId === product.id);
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
  });


  cache = {
    totalMarginLoss,
    productsSummary,
    vendorsSummary,
    processedPurchases: finalProcessedPurchases.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
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
