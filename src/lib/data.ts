import type { AppData, Product, Purchase, Vendor, ProcessedPurchase, VendorProductSummary, MarginAnalysisProductSummary, ProductSummary } from "@/lib/types";
import { parseISO, subYears, subDays, format, startOfYear } from 'date-fns';

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
    { id: "aspirin-75", name: "Aspirin 75mg", sellingPrice: 15.00 },
    { id: "ibuprofen-400", name: "Ibuprofen 400mg", sellingPrice: 28.00 },
    { id: "domperidone-10", name: "Domperidone 10mg", sellingPrice: 32.00 },
    { id: "rantac-150", name: "Rantac 150mg", sellingPrice: 42.00 },
    { id: "liv-52", name: "Himalaya Liv.52", sellingPrice: 125.00 },
    { id: "digene-syrup", name: "Digene Syrup 200ml", sellingPrice: 88.00 },
    { id: "pudin-hara", name: "Pudin Hara Pearls (10)", sellingPrice: 20.00 },
    { id: "supradyn-15", name: "Supradyn (15 tabs)", sellingPrice: 55.00 },
    { id: "neurobion-forte-30", name: "Neurobion Forte (30 tabs)", sellingPrice: 35.00 },
    { id: "shelcal-500", name: "Shelcal 500mg (15 tabs)", sellingPrice: 110.00 },
    { id: "telma-40", name: "Telma 40mg", sellingPrice: 150.00 },
    { id: "amlong-5", name: "Amlong 5mg", sellingPrice: 65.00 },
    { id: "ecosprin-75", name: "Ecosprin 75mg", sellingPrice: 10.00 },
    { "id": "glycomet-500", "name": "Glycomet 500mg", "sellingPrice": 45.00 },
    { "id": "janumet-50-1000", "name": "Janumet 50/1000", "sellingPrice": 350.00 },
    { "id": "thyronorm-50", "name": "Thyronorm 50mcg", "sellingPrice": 130.00 },
    { "id": "cremaffin-plus", "name": "Cremaffin Plus Syrup", "sellingPrice": 180.00 },
    { "id": "meftal-spas", "name": "Meftal Spas", "sellingPrice": 50.00 },
    { "id": "pampers-diapers", "name": "Pampers Diapers (M)", "sellingPrice": 699.00 },
    { "id": "huggies-wipes", "name": "Huggies Wipes (80)", "sellingPrice": 250.00 },
    { "id": "lactogen-1", "name": "Nestle Lactogen 1", "sellingPrice": 420.00 },
    { "id": "cetaphil-lotion", "name": "Cetaphil Lotion 250ml", "sellingPrice": 550.00 },
    { "id": "sebamed-soap", "name": "Sebamed Baby Soap", "sellingPrice": 150.00 },
    { "id": "colgate-total", "name": "Colgate Total Toothpaste", "sellingPrice": 120.00 },
    { "id": "listerine-250", "name": "Listerine Mouthwash 250ml", "sellingPrice": 165.00 },
    { id: "strepsils", name: "Strepsils", sellingPrice: 10.00 },
    { id: "vicks-action-500", name: "Vicks Action 500", sellingPrice: 40.00 },
    { id: "combiflam", name: "Combiflam", sellingPrice: 40.00 },
    { id: "disprin", name: "Disprin", sellingPrice: 10.00 },
    { id: "gelusil", name: "Gelusil MPS", sellingPrice: 80.00 },
    { id: "calpol-650", name: "Calpol 650", sellingPrice: 30.00 },
    { id: "sinarest", name: "Sinarest", sellingPrice: 65.00 },
    { id: "allegra-120", name: "Allegra 120mg", sellingPrice: 100.00 },
    { id: "cheston-cold", name: "Cheston Cold", sellingPrice: 55.00 },
    { id: "montair-lc", name: "Montair LC", sellingPrice: 175.00 },
    { id: "pantop-d", name: "Pantop-D", sellingPrice: 120.00 },
    { id: "zinetac-150", name: "Zinetac 150", sellingPrice: 45.00 },
    { id: "novamox-500", name: "Novamox 500", sellingPrice: 90.00 },
    { id: "taxim-o-200", name: "Taxim-O 200", sellingPrice: 110.00 },
    { id: "oflox-200", name: "Oflox 200", sellingPrice: 85.00 },
    { id: "norflox-400", name: "Norflox 400", sellingPrice: 70.00 },
    { id: "clavam-625", name: "Clavam 625", sellingPrice: 220.00 },
    { id: "rozin-10", name: "Rozin 10", sellingPrice: 105.00 },
    { id: "storvas-10", name: "Storvas 10", sellingPrice: 100.00 },
    { id: "losar-h", name: "Losar-H", sellingPrice: 95.00 },
    { id: "amlokind-at", name: "Amlokind-AT", sellingPrice: 75.00 },
    { id: "istamet-50-500", name: "Istamet 50/500", sellingPrice: 250.00 },
    { id: "eltroxin-50", name: "Eltroxin 50mcg", sellingPrice: 135.00 },
    { id: "duphalac-syrup", name: "Duphalac Syrup", sellingPrice: 250.00 },
    { id: "drotin-ds", name: "Drotin-DS", sellingPrice: 70.00 },
    { id: "mamy-poko-pants", name: "Mamy Poko Pants (L)", sellingPrice: 750.00 },
    { id: "johnson-baby-oil", name: "Johnson's Baby Oil 200ml", sellingPrice: 200.00 },
    { id: "nan-pro-1", name: "Nestle Nan Pro 1", sellingPrice: 450.00 },
    { id: "aveeno-lotion", name: "Aveeno Lotion 354ml", sellingPrice: 850.00 },
    { id: "himalaya-baby-wash", name: "Himalaya Baby Wash 200ml", sellingPrice: 180.00 },
    { id: "sensodyne-toothpaste", name: "Sensodyne Toothpaste", sellingPrice: 150.00 },
    { id: "oral-b-toothbrush", name: "Oral-B Toothbrush", sellingPrice: 60.00 },
    { id: "glyaha-lotion", name: "Glyaha Lotion", sellingPrice: 350.00 },
    { id: "acne-uv-gel", name: "Acne UV Gel SPF 50", sellingPrice: 700.00 },
    { id: "betnovate-n", name: "Betnovate-N Cream", sellingPrice: 50.00 },
    { id: "soframycin-skin-cream", name: "Soframycin Skin Cream", sellingPrice: 45.00 },
    { id: "boroline", name: "Boroline Antiseptic Cream", sellingPrice: 85.00 },
    { id: "itraconazole-200", name: "Itraconazole 200mg", sellingPrice: 250.00 },
    { id: "fluconazole-150", name: "Fluconazole 150mg", sellingPrice: 25.00 },
    { id: "levocet-m", name: "Levocet M", sellingPrice: 90.00 },
    { id: "folvite-5mg", name: "Folvite 5mg", sellingPrice: 50.00 },
    { id: "ferinject-500", name: "Ferinject 500mg", sellingPrice: 3500.00 },
    { id: "decadron-injection", name: "Decadron Injection", sellingPrice: 20.00 },
    { id: "human-actrapid", name: "Human Actrapid Insulin", sellingPrice: 500.00 },
    { id: "lantus-solostar", "name": "Lantus Solostar", "sellingPrice": 800.00 },
    { id: "accu-chek-active", "name": "Accu-Chek Active Strips", "sellingPrice": 1000.00 }
];

const vendors: Vendor[] = [
    { id: "ss-pharma", name: "SS Pharma Distributors" },
    { id: "mehta-group", name: "Mehta Group" },
    { id: "svizera", name: "Svizera Health Remedies" },
    { id: "sanghvi-pharma", name: "Sanghvi Pharma" },
    { id: "mahaveer-pharma", name: "Mahaveer Pharma" },
    { id: "sun-pharma-dist", name: "Sun Pharma Distributors" },
    { id: "cipla-logistics", name: "Cipla Logistics" },
    { id: "lupin-dist", name: "Lupin Distribution" },
    { id: "zydus-health", name: "Zydus Healthcare" },
    { id: "reddy-labs-dist", name: "Dr. Reddy's Distribution" },
    { id: "torrent-pharma", name: "Torrent Pharma Logistics" },
    { id: "mankind-pharma", name: "Mankind Pharma" },
    { id: "glenmark-dist", name: "Glenmark Pharmaceuticals" },
    { id: "alkem-labs", name: "Alkem Laboratories" },
    { id: "aurobindo-pharma", name: "Aurobindo Pharma" },
    { id: "piramal-health", name: "Piramal Healthcare" },
    { id: "intas-pharma", name: "Intas Pharmaceuticals" },
    { id: "wockhardt-ltd", name: "Wockhardt Ltd" },
    { id: "cadila-health", name: "Cadila Healthcare" },
    { id: "medplus-dist", name: "MedPlus Mart" },
    { id: "apollo-pharmacy-dist", name: "Apollo Pharmacy" },
    { id: "wellness-forever", name: "Wellness Forever" },
    { id: "frank-ross", name: "Frank Ross Pharmacy" },
    { id: "emami-dist", name: "Emami Group" },
    { id: "dabur-dist", name: "Dabur India" },
    { id: "himalaya-dist", name: "Himalaya Wellness" },
    { id: "patanjali-dist", name: "Patanjali Ayurved" },
    { id: "reliance-retail", name: "Reliance Retail Pharma" },
    { id: "netmeds-marketplace", name: "Netmeds Marketplace" },
    { id: "tata-1mg", name: "Tata 1mg" }
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
