"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlacementChartProps {
  forwardness: number; // 0-100, where 0 is back and 100 is forward
  ringIndex: number; // 0-100, singer's formant strength
  nasality: number; // 0-100
  className?: string;
}

export function PlacementChart({
  forwardness = 70,
  ringIndex = 65,
  nasality = 20,
  className,
}: PlacementChartProps) {
  const getPlacementLabel = (value: number) => {
    if (value < 30) return "Back Placement";
    if (value < 50) return "Neutral";
    if (value < 70) return "Forward";
    return "Very Forward";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle>Tone Placement</CardTitle>
        <CardDescription>
          Resonance patterns and energy distribution (2.5-3.5 kHz)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2D Placement Visualization */}
        <div className="relative aspect-square max-w-[250px] mx-auto">
          {/* Grid Background */}
          <div className="absolute inset-0 border-2 border-muted">
            {/* Grid lines */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-muted" />
            
            {/* Labels */}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              Forward
            </span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              Back
            </span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Low
            </span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              High
            </span>
          </div>

          {/* Placement Indicator */}
          <div
            className="absolute w-6 h-6 bg-primary -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-lg transition-all duration-500"
            style={{
              left: `${50 + (ringIndex - 50) * 0.8}%`,
              top: `${100 - forwardness}%`,
            }}
          >
            <div className="w-2 h-2 bg-primary-foreground" />
          </div>

          {/* Target zone overlay */}
          <div
            className="absolute w-16 h-16 border-2 border-dashed border-primary/30 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: "65%",
              top: "25%",
            }}
          />
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Forwardness</span>
              <Badge variant={forwardness > 60 ? "default" : "secondary"}>
                {getPlacementLabel(forwardness)}
              </Badge>
            </div>
            <div className="h-3 bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${forwardness}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Back (0)</span>
              <span className="font-medium text-foreground">{forwardness}</span>
              <span>Forward (100)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ring Index</span>
              <span className="text-sm text-muted-foreground">Singer&apos;s Formant</span>
            </div>
            <div className="h-3 bg-muted overflow-hidden">
              <div
                className="h-full bg-chart-4 transition-all duration-500"
                style={{ width: `${ringIndex}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Weak (0)</span>
              <span className="font-medium text-foreground">{ringIndex}</span>
              <span>Strong (100)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nasality</span>
              <span className="text-sm text-muted-foreground">Anti-resonance</span>
            </div>
            <div className="h-3 bg-muted overflow-hidden">
              <div
                className="h-full bg-chart-5 transition-all duration-500"
                style={{ width: `${nasality}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low (0)</span>
              <span className="font-medium text-foreground">{nasality}</span>
              <span>High (100)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
