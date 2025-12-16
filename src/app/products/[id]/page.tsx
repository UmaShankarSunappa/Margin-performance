
'use client';
import { notFound, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Percent, ShoppingCart, TrendingDown, TrendingUp, ShoppingBag, Truck, Edit, Lock, Trash2, Eye, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format, parse, subMonths, startOfMonth } from 'date-fns';


import Header from "@/components/Header";
import { getProductDetails } from "@/lib/data";
import ProductPriceTrendChart from "@/components/charts/ProductPriceTrendChart";
import ProductMarginTrendChart from "@/components/charts/ProductMarginTrendChart";
import ProductPurchasesTable from "@/components/tables/ProductPurchasesTable";
import KpiCard from "@/components/dashboard/KPI";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product, ProcessedPurchase, ProductSummary, ProductDetails, QuantityOutlierFilter, ProductMonthlySummary } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import Loading from "@/app/loading";
import { MultiplierAdjustmentDialog } from "@/components/dialogs/MultiplierAdjustmentDialog";
import { Separator } from "@/components/ui/separator";

type ProductDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const searchParams = useSearchParams();
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customMultipliers, setCustomMultipliers] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(true);
  
  const initialScope = searchParams.get('scope');
  const [showPanIndia, setShowPanIndia] = useState(false);

  const filters = useMemo(() => {
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const cityState = searchParams.get('cityState');
    
    let f: { state?: string; city?: string, cityState?: string } = {};
    if (scope === 'state' && state) {
      f.state = state;
    } else if (scope === 'city' && city && cityState) {
      f.city = city;
      f.state = cityState;
    }
    return f;
  }, [searchParams]);

  const period = searchParams.get('period') || 'mtd';
  const quantityOutlierFilter = (searchParams.get('qof') as QuantityOutlierFilter) || 'none';

  useEffect(() => {
    setIsLoading(true);
    getProductDetails(params.id, filters, customMultipliers, showPanIndia, period, quantityOutlierFilter).then(data => {
      setDetails(data);
      setIsLoading(false);
    });
  }, [params.id, customMultipliers, filters, showPanIndia, period, quantityOutlierFilter]);

  const handleMultiplierSave = (newMultiplier: number) => {
    setCustomMultipliers(prev => ({ ...prev, [params.id]: newMultiplier }));
    setIsModalOpen(false);
  };

  const handleDownloadHistory = () => {
    if (!details) return;

    const dataToExport = details.purchases.map(p => ({
        'Purchase ID': p.id,
        'Vendor Name': p.vendor.name,
        'Vendor ID': p.vendorId,
        'Date': format(new Date(p.date), 'dd MMM yyyy'),
        'Quantity': p.quantity,
        'Cost Price': p.purchasePrice,
        'Margin %': p.margin,
        'Margin Loss': p.isMarginOutlier ? 'N/A' : p.marginLoss,
        'Is Margin Outlier?': p.isMarginOutlier ? 'Yes' : 'No',
        'Is Quantity Outlier?': p.isQuantityOutlier ? 'Yes' : 'No',
        'Is Best Margin?': p.isBestMargin ? 'Yes' : 'No',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase History');
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 15 }, // Purchase ID
        { wch: 25 }, // Vendor Name
        { wch: 15 }, // Vendor ID
        { wch: 15 }, // Date
        { wch: 10 }, // Quantity
        { wch: 15 }, // Cost Price
        { wch: 15 }, // Margin %
        { wch: 15 }, // Margin Loss
        { wch: 18 }, // Is Margin Outlier?
        { wch: 18 }, // Is Quantity Outlier?
        { wch: 15 }, // Is Best Margin?
    ];
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const filename = `${details.product.name.replace(/ /g, '_')}_purchase_history.xlsx`;
    saveAs(data, filename);
  };

  const getBackLink = () => {
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const cityState = searchParams.get('cityState');
    const period = searchParams.get('period');
    const qof = searchParams.get('qof');

    const params = new URLSearchParams();
    if(scope) params.set('scope', scope);
    if(state) params.set('state', state);
    if(city) params.set('city', city);
    if(cityState) params.set('cityState', cityState);
    if(period) params.set('period', period);
    if(qof) params.set('qof', qof);
    
    const queryString = params.toString();

    // Go back to margin analysis as it's the previous drill down step
    return `/margin-analysis?${queryString}`;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!details) {
    notFound();
  }

  const { product, purchases, summary, panIndiaSummary, monthlySummary, monthlyAverages } = details;
  
  const isFilterActive = initialScope && (initialScope === 'state' || initialScope === 'city');
  
  // Decide which summary to display based on the toggle
  const displaySummary = showPanIndia ? panIndiaSummary : summary;
  const displayMonthlySummary = showPanIndia ? details.panIndiaMonthlySummary : monthlySummary;


  const getFormattedPeriod = () => {
      if (!period) return '';
      if (period === 'mtd') return `Analysis for Current Month`;
      try {
          const date = parse(period, 'yyyy-MM', new Date());
          return `Analysis for ${format(date, 'MMMM yyyy')}`;
      } catch (e) {
          return '';
      }
  };
  
  const getKpiTitle = (monthly: boolean = false) => {
    let title = 'Historical Analysis (Current Month + Last 3 Months)';
    if(monthly) {
        if (period === 'mtd') {
            title = `Analysis for Current Month`;
        } else {
            try {
                const date = parse(period, 'yyyy-MM', new Date());
                title = `Analysis for ${format(date, 'MMMM yyyy')}`;
            } catch(e) {}
        }
    }
    if (showPanIndia) {
        return `Pan-India - ${title}`;
    }
    return title;
  }

  const getPageTitle = () => {
    let baseTitle = `Analysis for ${product.name}`;
    if (!showPanIndia) {
      const state = searchParams.get('state') || searchParams.get('cityState');
      const city = searchParams.get('city');
      if (city) {
        baseTitle = `${product.name} - Analysis for ${city}, ${state}`;
      } else if (state) {
        baseTitle = `${product.name} - Analysis for ${state}`;
      }
    } else {
        baseTitle = `${product.name} - Pan-India Analysis`;
    }
     return `${baseTitle}`;
  }
  
  const maskVendor = panIndiaSummary && summary && panIndiaSummary.bestVendor?.id !== summary.bestVendor?.id;


  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href={getBackLink()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="flex-1">
             <h1 className="shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {getPageTitle()}
             </h1>
          </div>
          {isFilterActive && (
             <div className="flex items-center space-x-2 ml-auto">
                <Switch 
                  id="pan-india-toggle" 
                  checked={showPanIndia}
                  onCheckedChange={setShowPanIndia}
                />
                <Label htmlFor="pan-india-toggle">Compare Pan-India</Label>
              </div>
          )}
        </div>
        
        {/* KPI Section - Monthly */}
        {displayMonthlySummary && (
          <div>
             <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">{getKpiTitle(true)}</h2>
                <Separator />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Purchases" value={formatNumber(displayMonthlySummary.purchaseCount)} description="Valid purchases in period" icon={ShoppingCart} />
                <KpiCard title="Total Quantity" value={formatNumber(displayMonthlySummary.totalQuantityPurchased)} description="Cumulative units in period" icon={ShoppingBag} />
                <KpiCard title="Total Margin Loss" value={formatCurrency(displayMonthlySummary.totalMarginLoss)} description="Cumulative margin loss in period" icon={DollarSign} />
                <KpiCard title="Margin Loss %" value={`${formatNumber(displayMonthlySummary.marginLossPercentage || 0)}%`} description="Margin loss / total cost" icon={Percent} />
             </div>
          </div>
        )}

        {/* KPI Section - Historical */}
        {displaySummary && (
          <div className="mt-6">
             <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">{getKpiTitle(false)}</h2>
                <Separator />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KpiCard title="Best Margin %" value={`${formatNumber(displaySummary.bestMargin)}%`} description="Highest margin in period" icon={TrendingUp} />
                <KpiCard title="Worst Margin %" value={`${formatNumber(displaySummary.worstMargin)}%`} description="Lowest margin in period" icon={TrendingDown} />
                <KpiCard title="Average Margin %" value={`${formatNumber(displaySummary.averageMargin)}%`} description="Average margin in period" icon={Percent} />
                <KpiCard title="Mode Margin %" value={`${formatNumber(displaySummary.modeMargin)}%`} description="Most frequent margin in period" icon={Percent} />
                <KpiCard 
                  title="Best Vendor" 
                  value={maskVendor && showPanIndia ? '***' : (displaySummary.bestVendor?.name || 'N/A')} 
                  description={maskVendor && showPanIndia ? "Name hidden for privacy" : "Vendor with highest margin"} 
                  icon={maskVendor && showPanIndia ? Lock : Truck} 
                />
                <KpiCard title="Worst Vendor" value={displaySummary.worstVendor?.name || 'N/A'} description="Vendor with lowest margin" icon={Truck} />
             </div>
          </div>
        )}

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Average Purchase Price (Last 4 Months)</CardTitle>
                    <CardDescription>Monthly average purchase price trend for the analysis period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductPriceTrendChart data={monthlyAverages} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Average Margin Trend (Last 4 Months)</CardTitle>
                    <CardDescription>Monthly average margin percentage trend for the analysis period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductMarginTrendChart data={monthlyAverages} />
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Purchase History (Last 4 Months)</CardTitle>
                    <CardDescription>
                        Displaying purchase records for the selected scope and period.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {showHistory ? (
                        <Button variant="outline" onClick={() => setShowHistory(false)}>
                            <Trash2 className="mr-2" />
                            Clear History
                        </Button>
                    ) : (
                         <Button variant="outline" onClick={() => setShowHistory(true)}>
                            <Eye className="mr-2" />
                            Show History
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                        <Edit className="mr-2" />
                        Adjust Multiplier
                    </Button>
                     <Button variant="outline" onClick={handleDownloadHistory} disabled={!showHistory || purchases.length === 0}>
                        <FileDown className="mr-2" />
                        Download Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {showHistory ? (
                    <ProductPurchasesTable purchases={purchases} />
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">Purchase history cleared. Click "Show History" to view it again.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
      
      <MultiplierAdjustmentDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleMultiplierSave}
        productName={product.name}
        currentMultiplier={customMultipliers[params.id] || 4.0}
      />
    </>
  );
}
