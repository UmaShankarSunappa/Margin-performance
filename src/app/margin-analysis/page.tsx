'use client';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { getAppData } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KPI";
import { DollarSign, Percent, Search, ShoppingCart, Users } from "lucide-react";
import type { MarginAnalysisProductSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

// We need a client component to use hooks, but data fetching is async.
// This is a common pattern to bridge the two.
export default function MarginAnalysisPage() {
    const [summary, setSummary] = useState<MarginAnalysisProductSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useState(() => {
        getAppData().then(data => {
            setSummary(data.marginAnalysisSummary.sort((a,b) => b.totalMarginLoss - a.totalMarginLoss));
        });
    });

    const filteredSummary = summary.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Product Margin Loss Analysis</h1>
                </div>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Product Drill-Down</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary.length > 0 ? (
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
                                                    <KpiCard title="Purchases (YTD)" value={product.purchaseCount.toString()} description="Number of purchase orders (Year-to-date)" icon={ShoppingCart} />
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
                        ) : (
                           <p>Loading analysis...</p>
                        )}
                         {filteredSummary.length === 0 && summary.length > 0 && (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No products found matching your search.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
