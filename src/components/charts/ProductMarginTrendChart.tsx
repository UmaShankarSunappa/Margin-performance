"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { MonthlyAverage } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface ProductMarginTrendChartProps {
    data: MonthlyAverage[];
}

export default function ProductMarginTrendChart({ data }: ProductMarginTrendChartProps) {
  
  return (
    <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart 
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tickFormatter={(value) => `${formatNumber(value as number)}%`}
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                 />
                <Tooltip 
                    contentStyle={{
                        background: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                    formatter={(value, name, props) => [`${formatNumber(value as number)}%`, 'Avg Margin']}
                />
                <Legend />
                <Line type="monotone" dataKey="averageMargin" name="Avg Monthly Margin %" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--accent))" }} activeDot={{ r: 6 }}/>
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
}
