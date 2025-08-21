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
import { subMonths, isAfter, parseISO } from 'date-fns';

type Period = 'all' | '1m' | '3m' | '6m' | '1y';

function MarginAnalysisContent() {
    const searchParams = useSearchParams();
    const states = searchParams.get('states')?.split(',');
    const city = searchParams.get('city');
    const state = searchParams.get('state'); // For city-wise

    const [allPurchases, setAllPurchases] = useState<ProcessedPurchase[]>([]);
    const [summary, setSummary] = useState<MarginAnalysisProductSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [period, setPeriod] = useState<Period>('all');
    const [isLoading, setIsLoading] = useState(true);

    const filters = useMemo(() => {
        let f: { states?: string[], city?: string, state?: string } = {};
        if (states && states.length > 0) f.states = states;
        if (city && state) f = { city, state };
        return f;
    }, [states, city, state]);

    useEffect(() => {
        getAppData(filters).then(data => {
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
          let periodStartDate: Date | null = null;
          if (period !== 'all') {
              const months = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }[period];
              periodStartDate = subMonths(now, months);
          }

          const purchasesInPeriod = allPurchases.filter(p => 
              p.productId === productSummary.id &&
              (!periodStartDate || isAfter(parseISO(p.date), periodStartDate))
          );
          
          if(purchasesInPeriod.length === 0 && period !== 'all') return null;

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
      if (city && state) return `Product Margin Loss Analysis for ${city}, ${state}`;
      if (states && states.length > 0) {
          if(states.length === 1) return `Product Margin Loss Analysis for ${states[0]}`;
          return `Product Margin Loss Analysis for ${states.length} states`;
      }
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
                    <Button variant={period === '1y' ? 'default' : 'outline'} onClick={() => setPeriod('1y')}>1 Year</Button>
                    <Button variant={period === '6m' ? 'default' : 'outline'} onClick={() => setPeriod('6m')}>6 Months</Button>
                    <Button variant={period === '3m' ? 'default' : 'outline'} onClick={() => setPeriod('3m')}>3 Months</Button>
                    <Button variant={period === '1m' ? 'default' : 'outline'} onClick={() => setPeriod('1m')}>1 Month</Button>
                    <Button variant={period === 'all' ? 'default' : 'outline'} onClick={() => setPeriod('all')}>All Time</Button>
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
