"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ProcessedPurchase } from "@/lib/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface ProductPriceTrendChartProps {
    data: ProcessedPurchase[];
}

export default function ProductPriceTrendChart({ data }: ProductPriceTrendChartProps) {
  const sortedData = [...data].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return (
    <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart 
                data={sortedData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => format(new Date(str), "MMM d")}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tickFormatter={(value) => formatCurrency(value as number)}
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                 />
                <Tooltip 
                    contentStyle={{
                        background: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                    labelFormatter={(label) => format(new Date(label), "PPP")}
                    formatter={(value, name, props) => [`${formatCurrency(value as number)} from ${props.payload.vendor.name}`, 'Purchase Price']}
                />
                <Legend />
                <Line type="monotone" dataKey="purchasePrice" name="Purchase Price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }}/>
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
