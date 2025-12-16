import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProcessedPurchase } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ProductPurchasesTableProps {
  purchases: ProcessedPurchase[];
}

export default function ProductPurchasesTable({ purchases }: ProductPurchasesTableProps) {
  return (
    <div className="relative w-full overflow-auto h-[320px]">
        <Table>
        <TableHeader className="sticky top-0 bg-background">
            <TableRow>
                <TableHead>Purchase Number</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Invoice Date</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">MRP</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
                <TableHead className="text-right">Margin Loss</TableHead>
                <TableHead>Location</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {purchases.map((p) => (
            <TableRow key={p.id} className={cn(
                p.isBestMargin && !p.isMarginOutlier && !p.isQuantityOutlier && "bg-primary/20",
                (p.isMarginOutlier || p.isQuantityOutlier) && "bg-destructive/10 text-muted-foreground"
            )}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.invoiceNumber}</TableCell>
                <TableCell>
                    <Link href={`/vendors/${p.vendorId}?${new URLSearchParams(window.location.search)}`} className="font-medium hover:underline">
                        {p.vendor.name}
                    </Link>
                    {p.isBestMargin && !p.isMarginOutlier && !p.isQuantityOutlier && <Badge variant="outline" className="ml-2 border-primary text-primary">Best Margin</Badge>}
                    {p.isMarginOutlier && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="ml-2 cursor-help">Margin Outlier</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>This purchase margin ({formatNumber(p.margin)}%) is an outlier based on the mode ({formatNumber(p.modeMargin)}%) and was excluded from loss calculations.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                     {p.isQuantityOutlier && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="ml-2 cursor-help">Quantity Outlier</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>This purchase's quantity was too low and excluded from analysis based on your filter.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </TableCell>
                <TableCell className="text-right">{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-right">{formatNumber(p.quantity)}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.mrp)}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.purchasePrice)}</TableCell>
                <TableCell className="text-right">{formatNumber(p.margin)}%</TableCell>
                <TableCell className={cn("text-right", p.marginLoss > 0 && !p.isMarginOutlier && !p.isQuantityOutlier && "text-destructive")}>
                    {p.isMarginOutlier || p.isQuantityOutlier ? 'N/A' : formatCurrency(p.marginLoss)}
                </TableCell>
                <TableCell>{p.city}, {p.state}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
