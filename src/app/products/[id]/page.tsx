import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Percent, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import Header from "@/components/Header";
import { getProductDetails } from "@/lib/data";
import ProductPriceTrendChart from "@/components/charts/ProductPriceTrendChart";
import ProductPurchasesTable from "@/components/tables/ProductPurchasesTable";
import KpiCard from "@/components/dashboard/KPI";
import { formatCurrency, formatNumber } from "@/lib/utils";

type ProductDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const details = await getProductDetails(params.id);

  if (!details) {
    notFound();
  }

  const { product, purchases, summary } = details;

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {product.name}
          </h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Margin Loss" value={formatCurrency(summary?.totalMarginLoss || 0)} description={`Across ${summary?.purchaseCount} purchases`} icon={DollarSign} />
            <KpiCard title="Average Margin" value={`${formatNumber(summary?.averageMargin || 0)}%`} description="Average margin for this product" icon={Percent} />
            <KpiCard title="Best Margin Achieved" value={`${formatNumber(summary?.bestMargin || 0)}%`} description="Highest margin across all vendors" icon={Percent} />
            <KpiCard title="Selling Price" value={formatCurrency(product.sellingPrice)} description="Current selling price" icon={DollarSign} />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Price Trend</CardTitle>
                    <CardDescription>Price fluctuation over time across all vendors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductPriceTrendChart data={purchases} />
                </CardContent>
            </Card>
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Purchase History</CardTitle>
                    <CardDescription>All purchase records for {product.name}.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <ProductPurchasesTable purchases={purchases} />
                </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
