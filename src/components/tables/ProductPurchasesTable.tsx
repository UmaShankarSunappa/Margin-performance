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

interface ProductPurchasesTableProps {
  purchases: ProcessedPurchase[];
}

export default function ProductPurchasesTable({ purchases }: ProductPurchasesTableProps) {
  return (
    <div className="relative w-full overflow-auto h-[320px]">
        <Table>
        <TableHeader className="sticky top-0 bg-background">
            <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Date</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Margin %</TableHead>
            <TableHead className="text-right">Margin Loss</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {purchases.map((p) => (
            <TableRow key={p.id} className={cn(p.isBestMargin && "bg-primary/20")}>
                <TableCell>
                <Link href={`/vendors/${p.vendorId}`} className="font-medium hover:underline">
                    {p.vendor.name}
                </Link>
                {p.isBestMargin && <Badge variant="outline" className="ml-2 border-primary text-primary">Best Margin</Badge>}
                </TableCell>
                <TableCell className="text-right">{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.purchasePrice)}</TableCell>
                <TableCell className="text-right">{formatNumber(p.margin)}%</TableCell>
                <TableCell className={cn("text-right", p.marginLoss > 0 && "text-destructive")}>
                {formatCurrency(p.marginLoss)}
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
