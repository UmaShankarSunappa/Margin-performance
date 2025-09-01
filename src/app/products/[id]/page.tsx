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
import { format, parse } from 'date-fns';


import Header from "@/components/Header";
import { getProductDetails } from "@/lib/data";
import ProductPriceTrendChart from "@/components/charts/ProductPriceTrendChart";
import ProductMarginTrendChart from "@/components/charts/ProductMarginTrendChart";
import ProductPurchasesTable from "@/components/tables/ProductPurchasesTable";
import KpiCard from "@/components/dashboard/KPI";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product, ProcessedPurchase, ProductSummary, ProductDetails } from "@/lib/types";
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

  useEffect(() => {
    setIsLoading(true);
    getProductDetails(params.id, filters, customMultipliers, showPanIndia, period).then(data => {
      setDetails(data);
      setIsLoading(false);
    });
  }, [params.id, customMultipliers, filters, showPanIndia, period]);

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
        'Margin Loss': p.isOutlier ? 'N/A' : p.marginLoss,
        'Is Outlier?': p.isOutlier ? 'Yes' : 'No',
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
        { wch: 12 }, // Is Outlier?
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

    const params = new URLSearchParams();
    if(scope) params.set('scope', scope);
    if(state) params.set('state', state);
    if(city) params.set('city', city);
    if(cityState) params.set('cityState', cityState);
    if(period) params.set('period', period);
    
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

  const { product, purchases, summary, panIndiaSummary, summaryLast3Months } = details;
  const nonOutlierPurchases = purchases.filter(p => !p.isOutlier);
  
  const isFilterActive = initialScope && (initialScope === 'state' || initialScope === 'city');

  const getFormattedPeriod = () => {
      if (!period) return '';
      if (period === 'mtd') return ' (Current Month till Date)';
      try {
          const date = parse(period, 'yyyy-MM', new Date());
          return ` (for ${format(date, 'MMMM yyyy')})`;
      } catch (e) {
          return '';
      }
  };

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
    }
     return `${baseTitle}${getFormattedPeriod()}`;
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
        
        {/* KPI Section */}
        {summaryLast3Months && (
          <div>
             <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">Last 3 Months Analysis</h2>
                <Separator />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KpiCard title="Total Purchases" value={formatNumber(summaryLast3Months.purchaseCount)} description="Last 3M valid purchases" icon={ShoppingCart} />
                <KpiCard title="Total Quantity" value={formatNumber(summaryLast3Months.totalQuantityPurchased)} description="Last 3M cumulative units" icon={ShoppingBag} />
                <KpiCard title="Best Margin %" value={`${formatNumber(summaryLast3Months.bestMargin)}%`} description="Last 3M highest margin" icon={TrendingUp} />
                <KpiCard title="Worst Margin %" value={`${formatNumber(summaryLast3Months.worstMargin)}%`} description="Last 3M lowest margin" icon={TrendingDown} />
                <KpiCard title="Average Margin %" value={`${formatNumber(summaryLast3Months.averageMargin)}%`} description="Last 3M average margin" icon={Percent} />
                <KpiCard title="Total Margin Loss" value={formatCurrency(summaryLast3Months.totalMarginLoss)} description="Last 3M cumulative margin loss" icon={DollarSign} />
                <KpiCard title="Mode Margin %" value={`${formatNumber(summaryLast3Months.modeMargin)}%`} description="Last 3M most frequent margin" icon={Percent} />
                 <KpiCard title="Best Vendor" value={summaryLast3Months?.bestVendor?.name || 'N/A'} description="Last 3M vendor with highest margin" icon={Truck} />
                <KpiCard title="Worst Vendor" value={summaryLast3Months?.worstVendor?.name || 'N/A'} description="Last 3M vendor with lowest margin" icon={Truck} />
                <KpiCard title="Margin Loss %" value={`${formatNumber(summaryLast3Months.marginLossPercentage || 0)}%`} description="Last 3M margin loss / total cost" icon={Percent} />
             </div>
          </div>
        )}
        
        {showPanIndia && panIndiaSummary && (
          <div className="mt-6">
             <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">Pan-India Comparison ({period === 'mtd' ? 'Current Month' : `for ${period}`})</h2>
                <Separator />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KpiCard title="Total Purchases" value={formatNumber(panIndiaSummary.purchaseCount)} description="Pan-India valid purchase transactions" icon={ShoppingCart} />
                <KpiCard title="Total Quantity" value={formatNumber(panIndiaSummary.totalQuantityPurchased)} description="Pan-India cumulative units purchased" icon={ShoppingBag} />
                <KpiCard title="Best Margin %" value={`${formatNumber(panIndiaSummary.bestMargin)}%`} description="Pan-India highest margin" icon={TrendingUp} />
                <KpiCard title="Worst Margin %" value={`${formatNumber(panIndiaSummary.worstMargin)}%`} description="Pan-India lowest margin" icon={TrendingDown} />
                <KpiCard title="Average Margin %" value={`${formatNumber(panIndiaSummary.averageMargin)}%`} description="Pan-India average margin" icon={Percent} />
                <KpiCard title="Total Margin Loss" value={formatCurrency(panIndiaSummary.totalMarginLoss)} description="Pan-India cumulative margin loss" icon={DollarSign} />
                <KpiCard title="Mode Margin %" value={`${formatNumber(panIndiaSummary.modeMargin)}%`} description="Pan-India most frequent margin" icon={Percent} />
                <KpiCard 
                  title="Best Vendor" 
                  value={maskVendor ? '***' : (panIndiaSummary.bestVendor?.name || 'N/A')} 
                  description={maskVendor ? "Name hidden for privacy" : "Pan-India vendor with highest margin"} 
                  icon={maskVendor ? Lock : Truck} 
                />
                <KpiCard title="Worst Vendor" value={panIndiaSummary.worstVendor?.name || 'N/A'} description="Pan-India vendor with lowest margin" icon={Truck} />
                <KpiCard title="Margin Loss %" value={`${formatNumber(panIndiaSummary.marginLossPercentage || 0)}%`} description="Pan-India margin loss / total cost" icon={Percent} />
             </div>
          </div>
        )}

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Price Trend</CardTitle>
                    <CardDescription>Price fluctuation over time (for the selected period).</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductPriceTrendChart data={nonOutlierPurchases} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Margin Trend</CardTitle>
                    <CardDescription>Margin % fluctuation over time (for the selected period).</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductMarginTrendChart data={nonOutlierPurchases} />
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Purchase History</CardTitle>
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
