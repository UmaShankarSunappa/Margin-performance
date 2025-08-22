'use client';
import { notFound, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Percent, ShoppingCart, TrendingDown, TrendingUp, ShoppingBag, Truck, Edit, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
import { ModeAdjustmentDialog } from "@/components/dialogs/ModeAdjustmentDialog";
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
  const [customModes, setCustomModes] = useState<Record<string, number>>({});
  
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

  useEffect(() => {
    setIsLoading(true);
    getProductDetails(params.id, filters, customModes, showPanIndia).then(data => {
      setDetails(data);
      setIsLoading(false);
    });
  }, [params.id, customModes, filters, showPanIndia]);

  const handleModeSave = (newMode: number) => {
    setCustomModes(prev => ({ ...prev, [params.id]: newMode }));
    setIsModalOpen(false);
  };

  const getBackLink = () => {
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const cityState = searchParams.get('cityState');

    const params = new URLSearchParams();
    if(scope) params.set('scope', scope);
    if(state) params.set('state', state);
    if(city) params.set('city', city);
    if(cityState) params.set('cityState', cityState);
    
    const queryString = params.toString();

    // If we came from a filtered dashboard, go back there. Otherwise, go to margin analysis.
    if (scope === 'state' || scope === 'city') return `/?${queryString}`;
    return `/margin-analysis?${queryString}`;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!details) {
    notFound();
  }

  const { product, purchases, summary, panIndiaSummary } = details;
  const nonOutlierPurchases = purchases.filter(p => !p.isOutlier);
  
  const isFilterActive = initialScope && (initialScope === 'state' || initialScope === 'city');

  const getPageTitle = () => {
    if (!isFilterActive || showPanIndia) return `Analysis for ${product.name}`;
    const state = searchParams.get('state') || searchParams.get('cityState');
    const city = searchParams.get('city');
    if(city) return `${product.name} - Analysis for ${city}, ${state}`;
    if(state) return `${product.name} - Analysis for ${state}`;
    return product.name;
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <KpiCard title="Total Purchases" value={formatNumber(summary?.purchaseCount || 0)} description="Number of valid purchase transactions" icon={ShoppingCart} />
            <KpiCard title="Total Quantity Purchased" value={formatNumber(summary?.totalQuantityPurchased || 0)} description="Cumulative units from valid purchases" icon={ShoppingBag} />
            <KpiCard title="Best Margin %" value={`${formatNumber(summary?.bestMargin || 0)}%`} description="Highest margin (non-outlier)" icon={TrendingUp} />
            <KpiCard title="Worst Margin %" value={`${formatNumber(summary?.worstMargin || 0)}%`} description="Lowest margin (non-outlier)" icon={TrendingDown} />
            <KpiCard title="Average Margin %" value={`${formatNumber(summary?.averageMargin || 0)}%`} description="Overall average margin (non-outlier)" icon={Percent} />
            <KpiCard title="Total Margin Loss" value={formatCurrency(summary?.totalMarginLoss || 0)} description="Cumulative margin loss (non-outlier)" icon={DollarSign} />
            <KpiCard title="Mode Margin %" value={`${formatNumber(summary?.modeMargin || 0)}%`} description="Most frequent margin" icon={Percent} />
            <KpiCard title="Best Vendor" value={summary?.bestVendor?.name || 'N/A'} description={summary?.bestVendor ? 'Vendor with highest margin' : ''} icon={Truck} />
            <KpiCard title="Worst Vendor" value={summary?.worstVendor?.name || 'N/A'} description={summary?.worstVendor ? 'Vendor with lowest margin' : ''} icon={Truck} />
            <KpiCard title="Margin Loss %" value={`${formatNumber(summary?.marginLossPercentage || 0)}%`} description="Total margin loss / total purchase cost" icon={Percent} />
        </div>

        {showPanIndia && panIndiaSummary && (
          <>
             <div className="flex items-center gap-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">Pan-India Comparison</h2>
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
          </>
        )}

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Price Trend</CardTitle>
                    <CardDescription>Price fluctuation over time (filtered view).</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductPriceTrendChart data={nonOutlierPurchases} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Margin Trend</CardTitle>
                    <CardDescription>Margin % fluctuation over time (filtered view).</CardDescription>
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
                        Displaying purchase records for the selected scope. Pan-India comparison only affects KPIs above.
                    </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                    <Edit className="mr-2" />
                    Adjust Mode
                </Button>
            </CardHeader>
            <CardContent>
                <ProductPurchasesTable purchases={purchases} />
            </CardContent>
        </Card>
      </main>
      
      <ModeAdjustmentDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModeSave}
        productName={product.name}
        currentMode={summary?.modeMargin || 0}
      />
    </>
  );
}
