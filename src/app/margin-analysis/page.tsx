'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import { getAppData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Search, FileDown } from "lucide-react";
import type { MarginAnalysisProductSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';


function MarginAnalysisContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const cityState = searchParams.get('cityState');
    const dateRange = searchParams.get('range');

    const [allProductsSummary, setAllProductsSummary] = useState<MarginAnalysisProductSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
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
    
    const options = useMemo(() => {
        return { dateRange: dateRange as '1m' | '3m' | '6m' | '9m' | '1y' };
    }, [dateRange]);

    useEffect(() => {
        setIsLoading(true);
        getAppData(filters, options).then(data => {
            setAllProductsSummary(data.marginAnalysisSummary);
            setIsLoading(false);
        });
    }, [filters, options]);
    
    const filteredSummary = useMemo(() => {
        if (isLoading) return [];
        return allProductsSummary.filter(product => 
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a,b) => b.totalMarginLoss - a.totalMarginLoss);
    }, [allProductsSummary, searchQuery, isLoading]);

    const handleDownload = () => {
        const dataToExport = filteredSummary.map(p => ({
            'Product ID': p.id,
            'Product Name': p.name,
            'Total Margin Loss': p.totalMarginLoss,
            'Margin Loss %': p.marginLossPercentage,
            'Total Purchases': p.purchaseCount,
            'Total Quantity': p.totalQuantityPurchased,
            'Total Vendors': p.vendorCount,
            'Best Margin %': p.bestMargin,
            'Worst Margin %': p.worstMargin,
            'Average Margin %': p.averageMargin,
            'Mode Margin %': p.modeMargin,
            'Best Vendor': p.bestVendor?.name || 'N/A',
            'Worst Vendor': p.worstVendor?.name || 'N/A',
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Margin Analysis');
        
        const colWidths = [
            { wch: 20 }, // Product ID
            { wch: 30 }, // Product Name
            { wch: 20 }, // Total Margin Loss
            { wch: 15 }, // Margin Loss %
            { wch: 15 }, // Total Purchases
            { wch: 15 }, // Total Quantity
            { wch: 15 }, // Total Vendors
            { wch: 15 }, // Best Margin
            { wch: 15 }, // Worst Margin
            { wch: 15 }, // Avg Margin
            { wch: 15 }, // Mode Margin
            { wch: 25 }, // Best Vendor
            { wch: 25 }, // Worst Vendor
        ];
        worksheet['!cols'] = colWidths;
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const filename = dateRange ? `product_margin_analysis_${dateRange}.xlsx` : 'product_margin_analysis.xlsx';
        saveAs(data, filename);
    };

    const handleRowClick = (productId: string) => {
        const params = new URLSearchParams(searchParams);
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
                                        <TableHead>Product ID</TableHead>
                                        <TableHead>Product Name</TableHead>
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
                                            <TableCell>{product.id}</TableCell>
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
