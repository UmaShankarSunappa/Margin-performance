'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import { getAppData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { FileDown } from "lucide-react";
import type { MarginAnalysisProductSummary, QuantityOutlierFilter, DataFilters } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { DataTableColumnHeader } from '@/components/tables/DataTableColumnHeader';


function MarginAnalysisContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [allProductsSummary, setAllProductsSummary] = useState<MarginAnalysisProductSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState<Record<string, string[]>>({});

    const scope = searchParams.get('scope');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const cityState = searchParams.get('cityState');
    const period = searchParams.get('period');

    const dataFilters = useMemo((): DataFilters => {
        const scope = searchParams.get('scope');
        const state = searchParams.get('state');
        const city = searchParams.get('city');
        const cityState = searchParams.get('cityState');
        const manufacturer = searchParams.get('manufacturer') || 'all';
        const division = searchParams.get('division') || 'all';
        const vendor = searchParams.get('vendor') || 'all';
        const productType = searchParams.get('productType') || 'all';

        let geo: { state?: string; city?: string, cityState?: string } = {};
        if (scope === 'state' && state) {
            geo.state = state;
        } else if (scope === 'city' && city && cityState) {
            geo.city = city;
            geo.state = cityState;
        }

        return {
            geo,
            manufacturer,
            division,
            vendor,
            productType,
        };
    }, [searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            
            const currentPeriod = searchParams.get('period') as 'mtd' | string | null;
            const currentQof = searchParams.get('qof') as QuantityOutlierFilter | undefined;

            const options = { 
                period: currentPeriod || 'mtd',
                quantityOutlierFilter: currentQof || 'none'
            };

            try {
                const data = await getAppData(dataFilters, options);
                setAllProductsSummary(data.marginAnalysisSummary);
            } catch(e) {
                console.error("Failed to load margin analysis", e);
                setAllProductsSummary([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [searchParams, dataFilters]);

    const handleFilterChange = (columnId: string, selectedValues: string[]) => {
        setFilters(prev => ({
            ...prev,
            [columnId]: selectedValues
        }));
    };
    
    const filteredSummary = useMemo(() => {
        if (isLoading) return [];
        
        let filtered = allProductsSummary;

        Object.entries(filters).forEach(([columnId, selectedValues]) => {
            if (selectedValues.length > 0) {
                filtered = filtered.filter(product => {
                    const value = product[columnId as keyof MarginAnalysisProductSummary];
                    return selectedValues.includes(String(value));
                });
            }
        });

        return filtered.sort((a,b) => b.totalMarginLoss - a.totalMarginLoss);
    }, [allProductsSummary, filters, isLoading]);

    const getColumnOptions = (columnId: keyof MarginAnalysisProductSummary) => {
        return [...new Set(allProductsSummary.map(p => String(p[columnId])))];
    }

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
        const filename = period ? `product_margin_analysis_${period}.xlsx` : 'product_margin_analysis.xlsx';
        saveAs(data, filename);
    };

    const handleRowClick = (productId: string) => {
        const params = new URLSearchParams(searchParams);
        router.push(`/products/${productId}?${params.toString()}`);
    }
    
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
      let baseTitle = '';
      if (scope === 'city' && city && cityState) {
        baseTitle = `Product Margin Loss Analysis for ${city}, ${cityState}`;
      } else if (scope === 'state' && state) {
        baseTitle = `Product Margin Loss Analysis for ${state}`;
      } else {
        baseTitle = 'Pan-India Product Margin Loss Analysis';
      }
      return `${baseTitle}${getFormattedPeriod()}`;
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

            <Card>
                <CardHeader>
                    <CardTitle>Product Drill-Down</CardTitle>
                    <CardDescription>Click on a product to see more details about its margin performance. Use the column headers to filter the data.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                       <p>Loading analysis...</p>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <DataTableColumnHeader
                                          title="Product ID"
                                          columnId="id"
                                          options={getColumnOptions('id')}
                                          onFilterChange={handleFilterChange}
                                          className="w-[150px]"
                                        />
                                        <DataTableColumnHeader
                                          title="Product Name"
                                          columnId="name"
                                          options={getColumnOptions('name')}
                                          onFilterChange={handleFilterChange}
                                          className="w-[300px]"
                                        />
                                        <DataTableColumnHeader
                                          title="Total Margin Loss"
                                          columnId="totalMarginLoss"
                                          options={getColumnOptions('totalMarginLoss')}
                                          onFilterChange={handleFilterChange}
                                          format="currency"
                                          className="text-right"
                                        />
                                        <DataTableColumnHeader
                                          title="Total Purchases"
                                          columnId="purchaseCount"
                                          options={getColumnOptions('purchaseCount')}
                                          onFilterChange={handleFilterChange}
                                          className="text-right"
                                        />
                                        <DataTableColumnHeader
                                          title="Total Vendors"
                                          columnId="vendorCount"
                                          options={getColumnOptions('vendorCount')}
                                          onFilterChange={handleFilterChange}
                                          className="text-right"
                                        />
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
                            <p className="text-muted-foreground">No products found matching your filter criteria.</p>
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
