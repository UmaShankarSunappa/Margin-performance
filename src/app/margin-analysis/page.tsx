'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import { getAppData } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Search, FileDown } from "lucide-react";
import type { MarginAnalysisProductSummary, ProcessedPurchase } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subMonths, isWithinInterval, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';

type Period = 'fy' | '3m';

function MarginAnalysisContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const cityState = searchParams.get('cityState');

    const [allPurchases, setAllPurchases] = useState<ProcessedPurchase[]>([]);
    const [allProductsSummary, setAllProductsSummary] = useState<MarginAnalysisProductSummary[]>([]);
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
        getAppData(filters).then(data => {
            setAllPurchases(data.processedPurchases);
            setAllProductsSummary(data.marginAnalysisSummary);
            setIsLoading(false);
        });
    }, [filters]);
    
    const filteredSummary = useMemo(() => {
      if (isLoading) return [];
      
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

      return allProductsSummary
        .map(productSummary => {
            const purchasesInPeriod = allPurchases.filter(p => {
                if (p.productId !== productSummary.id) return false;
                
                const purchaseDate = parseISO(p.date);
                if (periodEndDate) { // Financial year
                    return isWithinInterval(purchaseDate, { start: periodStartDate, end: periodEndDate });
                } else { // Last 3 months
                    return purchaseDate >= periodStartDate;
                }
            });
            
            if(purchasesInPeriod.length === 0) return null;

            const nonOutlierPurchases = purchasesInPeriod.filter(p => !p.isOutlier);
            if (nonOutlierPurchases.length === 0) return null;

            const totalMarginLoss = nonOutlierPurchases.reduce((acc, p) => acc + p.marginLoss, 0);
            const totalPurchaseCost = nonOutlierPurchases.reduce((acc, p) => acc + (p.purchasePrice * p.quantity), 0);
            const marginLossPercentage = totalPurchaseCost > 0 ? (totalMarginLoss / totalPurchaseCost) * 100 : 0;
            const vendorIds = new Set(nonOutlierPurchases.map(p => p.vendorId));

            return {
                ...productSummary,
                totalMarginLoss,
                marginLossPercentage,
                purchaseCount: nonOutlierPurchases.length,
                vendorCount: vendorIds.size
            };
        })
        .filter((p): p is MarginAnalysisProductSummary => p !== null)
        .filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a,b) => b.totalMarginLoss - a.totalMarginLoss);

    }, [allProductsSummary, allPurchases, period, searchQuery, isLoading]);

    const handleDownload = () => {
        const dataToExport = filteredSummary.map(p => ({
            'Product ID': p.id,
            'Product Name': p.name,
            'Total Margin Loss': p.totalMarginLoss,
            'Margin Loss %': p.marginLossPercentage,
            'Purchases': p.purchaseCount,
            'Vendor Count': p.vendorCount,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Margin Analysis');
        
        const colWidths = [
            { wch: 20 }, // Product ID
            { wch: 30 }, // Product Name
            { wch: 20 }, // Total Margin Loss
            { wch: 15 }, // Margin Loss %
            { wch: 20 }, // Purchases
            { wch: 15 }, // Vendor Count
        ];
        worksheet['!cols'] = colWidths;
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, `product_margin_analysis_${period}.xlsx`);
    };

    const handleRowClick = (productId: string) => {
        const params = new URLSearchParams(searchParams);
        // We are already on margin-analysis, so the scope params are present if a filter is active
        router.push(`/products/${productId}?${params.toString()}`);
    }
    
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
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Total Margin Loss</TableHead>
                                        <TableHead className="text-right">Total Purchases</TableHead>
                                        <TableHead className="text-right">Total Vendors</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSummary.map((product) => (
                                        <TableRow 
                                            key={product.id} 
                                            onClick={() => handleRowClick(product.id)}
                                            className="cursor-pointer"
                                        >
                                            <TableCell className="font-semibold">{product.name}</TableCell>
                                            <TableCell className={cn("text-right font-semibold", product.totalMarginLoss > 0 && "text-destructive")}>
                                                {formatCurrency(product.totalMarginLoss)}
                                            </TableCell>
                                            <TableCell className="text-right">{product.purchaseCount}</TableCell>
                                            <TableCell className="text-right">{product.vendorCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
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
