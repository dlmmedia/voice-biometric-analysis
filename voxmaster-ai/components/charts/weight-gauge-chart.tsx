"use client";

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface WeightGaugeChartProps {
  weight: number; // 0-100, where 0 is light and 100 is heavy
  pressed: number; // 0-100, where 0 is breathy and 100 is pressed
  className?: string;
}

const chartConfig = {
  weight: {
    label: "Weight",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function WeightGaugeChart({
  weight = 55,
  pressed = 40,
  className,
}: WeightGaugeChartProps) {
  const chartData = [
    { name: "weight", value: weight, fill: "hsl(var(--chart-2))" },
  ];

  const endAngle = 90 - (weight / 100) * 180;

  const getWeightLabel = (value: number) => {
    if (value < 30) return "Light";
    if (value < 50) return "Light-Medium";
    if (value < 70) return "Medium-Heavy";
    return "Heavy";
  };

  const getPressedLabel = (value: number) => {
    if (value < 30) return "Breathy";
    if (value < 50) return "Balanced";
    if (value < 70) return "Slightly Pressed";
    return "Pressed";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>Vocal Weight</CardTitle>
        <CardDescription>
          Source strength and glottal closure characteristics
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={endAngle}
            innerRadius={60}
            outerRadius={100}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              polarRadius={[66, 54]}
              className="first:fill-muted last:fill-background"
            />
            <RadialBar dataKey="value" background cornerRadius={0} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {weight}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-sm"
                        >
                          {getWeightLabel(weight)}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>

        <div className="grid grid-cols-2 gap-4 mt-4 pb-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Weight Scale</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Light</span>
              <div className="flex-1 mx-2 h-2 bg-muted overflow-hidden">
                <div
                  className="h-full bg-chart-2 transition-all"
                  style={{ width: `${weight}%` }}
                />
              </div>
              <span className="text-sm">Heavy</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Pressed Scale</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Breathy</span>
              <div className="flex-1 mx-2 h-2 bg-muted overflow-hidden">
                <div
                  className="h-full bg-chart-3 transition-all"
                  style={{ width: `${pressed}%` }}
                />
              </div>
              <span className="text-sm">Pressed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 text-center">
          <div>
            <p className="text-2xl font-bold">{weight}</p>
            <p className="text-xs text-muted-foreground">{getWeightLabel(weight)}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{pressed}</p>
            <p className="text-xs text-muted-foreground">{getPressedLabel(pressed)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
