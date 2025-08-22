
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ChartData {
  id: string;
  name: string;
  totalMarginLoss: number;
}

interface ProductMarginLossChartProps {
    data: ChartData[];
}

export default function ProductMarginLossChart({ data }: ProductMarginLossChartProps) {
  const router = useRouter();

  const handleBarClick = (payload: any) => {
    if (payload && payload.activePayload && payload.activePayload[0]) {
      const productId = payload.activePayload[0].payload.id;
      router.push(`/products/${productId}`);
    }
  };

  return (
    <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart 
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={handleBarClick}
        >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" dataKey="totalMarginLoss" tickFormatter={(value) => formatCurrency(value as number)} />
            <YAxis 
                type="category" 
                dataKey="name" 
                width={80} 
                tick={{ fontSize: 12 }} 
                interval={0}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.3)', radius: 'var(--radius)' }}
                contentStyle={{
                    background: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                }}
                formatter={(value) => formatCurrency(value as number)}
             />
            <Bar dataKey="totalMarginLoss" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} />
        </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
