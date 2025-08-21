'use client';
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Percent, ShoppingCart, TrendingDown, TrendingUp, ShoppingBag, Truck, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import Header from "@/components/Header";
import { getProductDetails } from "@/lib/data";
import ProductPriceTrendChart from "@/components/charts/ProductPriceTrendChart";
import ProductMarginTrendChart from "@/components/charts/ProductMarginTrendChart";
import ProductPurchasesTable from "@/components/tables/ProductPurchasesTable";
import KpiCard from "@/components/dashboard/KPI";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product, ProcessedPurchase, ProductSummary } from "@/lib/types";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";
import { ModeAdjustmentDialog } from "@/components/dialogs/ModeAdjustmentDialog";

type ProductDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [details, setDetails] = useState<{ product: Product; purchases: ProcessedPurchase[]; summary: ProductSummary | undefined; } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customModes, setCustomModes] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsLoading(true);
    getProductDetails(params.id, customModes).then(data => {
      setDetails(data);
      setIsLoading(false);
    });
  }, [params.id, customModes]);

  const handleModeSave = (newMode: number) => {
    setCustomModes(prev => ({ ...prev, [params.id]: newMode }));
    setIsModalOpen(false);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!details) {
    notFound();
  }

  const { product, purchases, summary } = details;
  const nonOutlierPurchases = purchases.filter(p => !p.isOutlier);

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/margin-analysis">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {product.name}
          </h1>
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
            <KpiCard title="Latest Purchase Price" value={formatCurrency(summary?.latestPurchasePrice || 0)} description="Most recent purchase price" icon={DollarSign} />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Price Trend</CardTitle>
                    <CardDescription>Price fluctuation over time across all vendors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductPriceTrendChart data={nonOutlierPurchases} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Margin Trend</CardTitle>
                    <CardDescription>Margin % fluctuation over time across all vendors.</CardDescription>
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
                    <CardDescription>All purchase records for {product.name}. Outliers are marked and excluded from calculations.</CardDescription>
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
