import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VendorProductSummary } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface VendorProductsTableProps {
  products: VendorProductSummary[];
}

export default function VendorProductsTable({ products }: VendorProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Avg. Margin (This Vendor)</TableHead>
          <TableHead className="text-right">Best Available Margin</TableHead>
          <TableHead className="text-right">Difference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => {
            const difference = p.averageMargin - p.bestOverallMargin;
            return (
                <TableRow key={p.productId}>
                    <TableCell>
                        <Link href={`/products/${p.productId}`} className="font-medium hover:underline">
                         {p.productName}
                        </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(p.averageMargin)}%</TableCell>
                    <TableCell className="text-right">{formatNumber(p.bestOverallMargin)}%</TableCell>
                    <TableCell className={cn("text-right", difference < 0 ? "text-destructive" : "text-green-600")}>
                        {difference > 0 ? '+' : ''}{formatNumber(difference)}%
                    </TableCell>
                </TableRow>
            );
        })}
      </TableBody>
    </Table>
  );
}
