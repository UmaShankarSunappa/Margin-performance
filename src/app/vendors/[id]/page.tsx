import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import Header from "@/components/Header";
import { getVendorDetails } from "@/lib/data";
import VendorProductsTable from "@/components/tables/VendorProductsTable";
import KpiCard from "@/components/dashboard/KPI";
import { formatCurrency, formatNumber } from "@/lib/utils";

type VendorDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const details = await getVendorDetails(params.id);

  if (!details) {
    notFound();
  }

  const { vendor, summary, productsSummary } = details;

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
            {vendor.name}
          </h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <KpiCard title="Total Margin Loss" value={formatCurrency(summary?.totalMarginLoss || 0)} description={`Across ${summary?.productsPurchased} products`} icon={DollarSign} />
             <KpiCard title="Products Supplied" value={summary?.productsPurchased.toString() || '0'} description="Unique products purchased from this vendor" icon={Package} />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Product Margin Analysis</CardTitle>
                <CardDescription>
                    Comparing average margin from {vendor.name} vs. the best available margin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <VendorProductsTable products={productsSummary} />
            </CardContent>
        </Card>
      </main>
    </>
  );
}
