import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, Truck } from "lucide-react";

import Header from "@/components/Header";
import { getAppData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KPI";
import ProductMarginLossChart from "@/components/charts/ProductMarginLossChart";
import VendorMarginLossChart from "@/components/charts/VendorMarginLossChart";

export default async function Home() {
  const data = await getAppData();

  const topProducts = data.productsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5);
    
  const topVendors = data.vendorsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5);

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Total Margin Loss"
            value={formatCurrency(data.totalMarginLoss)}
            description="Cumulative loss across all products"
            icon={DollarSign}
          />
          <KpiCard
            title="Total SKU's"
            value={data.products.length.toString()}
            description="Total unique products with purchases"
            icon={Package}
          />
          <KpiCard
            title="Partners"
            value={data.vendors.length.toString()}
            description="Total unique partners in the system"
            icon={Truck}
          />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Products by Margin Loss</CardTitle>
                <CardDescription>
                  Products with the highest margin loss compared to benchmark prices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductMarginLossChart data={topProducts} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Vendors by Margin Loss</CardTitle>
                <CardDescription>
                  Vendors associated with the highest total margin loss.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VendorMarginLossChart data={topVendors} />
              </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
