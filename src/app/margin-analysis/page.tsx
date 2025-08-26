'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import { getAppData } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KPI";
import { DollarSign, Percent, Search, ShoppingCart, Users, FileDown, MapPin } from "lucide-react";
import type { MarginAnalysisProductSummary, ProcessedPurchase } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { subMonths, isWithinInterval, parseISO } from 'date-fns';

type Period = '3m' | 'fy';

function MarginAnalysisContent() {
    const searchParams = useSearchParams();
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const cityState = searchParams.get('cityState');


    const [allPurchases, setAllPurchases] = useState<ProcessedPurchase[]>([]);
    const [summary, setSummary] = useState<MarginAnalysisProductSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [period, setPeriod] = useState<Period>('fy');
    const [isLoading, setIsLoading] = useState(true);

    const filters = useMemo(() => {
        let f: { state?: string, city?: string, cityState?: string } = {};
        if (scope === 'state' && state) {
            f.state = state;
        } else if (scope === 'city' && city && cityState) {
            f.city = city;
            f.state = cityState; // Pass state for city filter
        }
        return f;
    }, [scope, state, city, cityState]);

    useEffect(() => {
        // Here we pass the correct structure to getAppData
        getAppData({
            state: filters.state,
            city: filters.city,
            // getAppData expects state for city, not cityState
        }).then(data => {
            setAllPurchases(data.processedPurchases);
            setSummary(data.marginAnalysisSummary.sort((a,b) => b.totalMarginLoss - a.totalMarginLoss));
            setIsLoading(false);
        });
    }, [filters]);

    const handleDownload = () => {
        const dataToExport = filteredSummary.map(p => ({
            'Product ID': p.id,
            'Product Name': p.name,
            'Total Margin Loss': p.totalMarginLoss,
            'Margin Loss %': p.marginLossPercentage,
            'Purchases (YTD)': p.purchaseCount,
            'Vendor Count': p.vendorCount,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Margin Analysis');
        
        // Adjust column widths
        const colWidths = [
            { wch: 20 }, // Product ID
            { wch: 30 }, // Product Name
            { wch: 20 }, // Total Margin Loss
            { wch: 15 }, // Margin Loss %
            { wch: 20 }, // Purchases (YTD)
            { wch: 15 }, // Vendor Count
        ];
        worksheet['!cols'] = colWidths;
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'product_margin_analysis.xlsx');
    };
    
    const filteredSummary = summary
      .map(productSummary => {
          const now = new Date();
          let periodStartDate: Date;
          let periodEndDate: Date | null = null;
          
          if (period === '3m') {
              periodStartDate = subMonths(now, 3);
          } else { // 'fy'
              const currentMonth = now.getMonth(); // 0-11 (Jan-Dec)
              const currentYear = now.getFullYear();
              if (currentMonth >= 3) { // April (month 3) onwards
                  periodStartDate = new Date(currentYear, 3, 1); // April 1 of current year
                  periodEndDate = new Date(currentYear + 1, 2, 31); // March 31 of next year
              } else { // Jan, Feb, March (months 0, 1, 2)
                  periodStartDate = new Date(currentYear - 1, 3, 1); // April 1 of previous year
                  periodEndDate = new Date(currentYear, 2, 31); // March 31 of current year
              }
          }

          const purchasesInPeriod = allPurchases.filter(p => {
              const purchaseDate = parseISO(p.date);
              const isProductMatch = p.productId === productSummary.id;
              
              if (!isProductMatch) return false;
              
              if (periodEndDate) { // Financial year
                  return isWithinInterval(purchaseDate, { start: periodStartDate, end: periodEndDate });
              } else { // Last 3 months
                  return purchaseDate >= periodStartDate;
              }
          });
          
          if(purchasesInPeriod.length === 0) return null;

          const totalMarginLoss = purchasesInPeriod.reduce((acc, p) => acc + p.marginLoss, 0);
          const totalPurchaseCost = purchasesInPeriod.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
          const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;
          const vendorIds = new Set(purchasesInPeriod.map(p => p.vendorId));

          return {
              ...productSummary,
              totalMarginLoss,
              marginLossPercentage,
              purchaseCount: purchasesInPeriod.length,
              vendorCount: vendorIds.size
          };
      })
      .filter((p): p is MarginAnalysisProductSummary => p !== null) // remove nulls
      .filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a,b) => b.totalMarginLoss - a.totalMarginLoss);
    
    const getPageTitle = () => {
      if (scope === 'city' && city && cityState) return `Product Margin Loss Analysis for ${city}, ${cityState}`;
      if (scope === 'state' && state) return `Product Margin Loss Analysis for ${state}`;
      return 'Pan-India Product Margin Loss Analysis';
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-semibold">{getPageTitle()}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownload} disabled={isLoading || filteredSummary.length === 0}>
                        <FileDown className="mr-2" />
                        Download Excel
                    </Button>
                </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search for products..."
                        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant={period === 'fy' ? 'default' : 'outline'} onClick={() => setPeriod('fy')}>Financial Year</Button>
                    <Button variant={period === '3m' ? 'default' : 'outline'} onClick={() => setPeriod('3m')}>3 Months</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product Drill-Down</CardTitle>
                    <CardDescription>Click on a product to see more details about its margin performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                       <p>Loading analysis...</p>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {filteredSummary.map((product) => (
                                <AccordionItem value={product.id} key={product.id}>
                                    <AccordionTrigger className='hover:no-underline'>
                                        <div className="flex justify-between w-full pr-4">
                                            <span className="font-semibold text-lg">{product.name}</span>
                                            <span className="text-destructive font-semibold text-lg">{formatCurrency(product.totalMarginLoss)}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                                                <KpiCard title="Margin Loss %" value={`${formatNumber(product.marginLossPercentage)}%`} description="Total margin loss / total purchase cost" icon={Percent} />
                                                <KpiCard title="Total Margin Loss" value={formatCurrency(product.totalMarginLoss)} description="Cumulative loss for this product" icon={DollarSign} />
                                                <KpiCard title="Purchases" value={product.purchaseCount.toString()} description={`Number of purchase orders in period`} icon={ShoppingCart} />
                                                <KpiCard title="Vendor Count" value={product.vendorCount.toString()} description="Unique vendors for this product" icon={Users} />
                                            </div>
                                            <Button asChild>
                                                <Link href={`/products/${product.id}`}>View Full Details</Link>
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                     {filteredSummary.length === 0 && !isLoading && (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No products found matching your search and filter criteria.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}


export default function MarginAnalysisPage() {
    return (
        <>
            <Header />
            <Suspense fallback={<p>Loading...</p>}>
              <MarginAnalysisContent />
            </Suspense>
        </>
    )
}
