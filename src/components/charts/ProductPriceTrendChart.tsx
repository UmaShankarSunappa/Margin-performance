"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { MonthlyAverage } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ProductPriceTrendChartProps {
    data: MonthlyAverage[];
}

export default function ProductPriceTrendChart({ data }: ProductPriceTrendChartProps) {
  
  return (
    <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart 
                data={data}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tickFormatter={(value) => formatCurrency(value as number)}
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                    width={80}
                 />
                <Tooltip 
                    contentStyle={{
                        background: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                    formatter={(value, name, props) => [formatCurrency(value as number), 'Avg Price']}
                />
                <Legend />
                <Line type="monotone" dataKey="averagePrice" name="Avg Monthly Price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }}/>
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
