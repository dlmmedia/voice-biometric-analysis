"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TimbreData {
  brightness: number;
  breathiness: number;
  warmth: number;
  roughness: number;
}

interface TimbreRadarChartProps {
  data?: TimbreData;
  className?: string;
}

const defaultData: TimbreData = {
  brightness: 65,
  breathiness: 30,
  warmth: 72,
  roughness: 15,
};

const chartConfig = {
  value: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function TimbreRadarChart({
  data = defaultData,
  className,
}: TimbreRadarChartProps) {
  const chartData = [
    { attribute: "Brightness", value: data.brightness },
    { attribute: "Breathiness", value: data.breathiness },
    { attribute: "Warmth", value: data.warmth },
    { attribute: "Roughness", value: data.roughness },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle>Timbre Analysis</CardTitle>
        <CardDescription>
          Spectral shape and harmonic content characteristics
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="attribute"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <PolarGrid gridType="polygon" />
            <Radar
              dataKey="value"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-4 mt-4 pb-4">
          {chartData.map((item) => (
            <div key={item.attribute} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.attribute}</span>
              <span className="text-sm font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
