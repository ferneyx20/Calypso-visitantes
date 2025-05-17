
"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface VisitData {
  name: string; // Sede name
  visits: number;
}

interface VisitsByBranchChartProps {
  data: VisitData[];
}

const chartConfig = {
  visits: {
    label: "Visitas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function VisitsByBranchChart({ data }: VisitsByBranchChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-8 text-muted-foreground">
        No hay datos suficientes para mostrar el gráfico.
      </div>
    );
  }

  // Show top 3 or fewer if less data available
  const chartData = data.slice(0, 3);

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{
            left: 10,
            right: 10,
            top: 5,
            bottom: 5,
          }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" dataKey="visits" hide/>
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            width={100} 
            tickFormatter={(value) => value.length > 12 ? `${value.substring(0,12)}...` : value}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Legend content={() => null} /> {/* Hide default legend if not needed or customize */}
          <Bar
            dataKey="visits"
            layout="vertical"
            fill="var(--color-visits)"
            radius={4}
            // nameKey="name" // recharts uses nameKey for the bar label if needed, but YAxis dataKey handles this for category
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
