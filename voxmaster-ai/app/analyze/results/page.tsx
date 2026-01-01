"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TimbreRadarChart } from "@/components/charts/timbre-radar-chart";
import { WeightGaugeChart } from "@/components/charts/weight-gauge-chart";
import { PlacementChart } from "@/components/charts/placement-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconDownload,
  IconPlayerPlay,
  IconPlayerPause,
  IconChartBar,
  IconWaveSine,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

// Mock analysis results - in production this would come from the API
const mockResults = {
  filename: "sample_voice.wav",
  duration: "00:15",
  audioType: "spoken" as const,
  analyzedAt: new Date().toISOString(),
  timbre: {
    brightness: 72,
    breathiness: 25,
    warmth: 68,
    roughness: 12,
  },
  weight: {
    weight: 58,
    pressed: 35,
  },
  placement: {
    forwardness: 75,
    ringIndex: 62,
    nasality: 18,
  },
  sweetSpot: {
    clarity: 78,
    warmth: 68,
    presence: 72,
    smoothness: 85,
    harshnessPenalty: 8,
    total: 76.3,
  },
  features: {
    spectralCentroid: 2450,
    hnr: 18.5,
    cpp: 12.3,
    h1h2: 4.2,
    f0Mean: 185,
    f0Range: [145, 245],
    formants: {
      f1: 520,
      f2: 1680,
      f3: 2580,
      f4: 3450,
    },
  },
};

export default function AnalysisResultsPage() {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <DashboardLayout
      title="Analysis Results"
      description={`Analysis of ${mockResults.filename}`}
    >
      <div className="space-y-6">
        {/* Header with file info and actions */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <IconPlayerPause className="size-4" />
                ) : (
                  <IconPlayerPlay className="size-4" />
                )}
              </Button>
              <div>
                <p className="font-medium">{mockResults.filename}</p>
                <p className="text-sm text-muted-foreground">
                  Duration: {mockResults.duration} • Type:{" "}
                  <Badge variant="secondary" className="ml-1">
                    {mockResults.audioType}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/analyze">New Analysis</Link>
              </Button>
              <Button>
                <IconDownload className="mr-2 size-4" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sweet Spot Score */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IconSparkles className="size-5 text-primary" />
              <CardTitle>Sweet Spot Score</CardTitle>
            </div>
            <CardDescription>
              Perceptual quality score based on ISO 226 equal-loudness weighting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-primary">
                  {mockResults.sweetSpot.total.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">{mockResults.sweetSpot.clarity}</p>
                  <p className="text-xs text-muted-foreground">Clarity (25%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{mockResults.sweetSpot.warmth}</p>
                  <p className="text-xs text-muted-foreground">Warmth (20%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{mockResults.sweetSpot.presence}</p>
                  <p className="text-xs text-muted-foreground">Presence (20%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{mockResults.sweetSpot.smoothness}</p>
                  <p className="text-xs text-muted-foreground">Smoothness (15%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-destructive">
                    -{mockResults.sweetSpot.harshnessPenalty}
                  </p>
                  <p className="text-xs text-muted-foreground">Harshness (20%)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <TimbreRadarChart data={mockResults.timbre} />
          <WeightGaugeChart
            weight={mockResults.weight.weight}
            pressed={mockResults.weight.pressed}
          />
          <PlacementChart
            forwardness={mockResults.placement.forwardness}
            ringIndex={mockResults.placement.ringIndex}
            nasality={mockResults.placement.nasality}
          />
        </div>

        {/* Detailed Features */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconChartBar className="size-5" />
              <CardTitle>Acoustic Features</CardTitle>
            </div>
            <CardDescription>
              Raw acoustic measurements extracted from the audio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="spectral">
              <TabsList>
                <TabsTrigger value="spectral">Spectral</TabsTrigger>
                <TabsTrigger value="harmonic">Harmonic</TabsTrigger>
                <TabsTrigger value="formants">Formants</TabsTrigger>
                <TabsTrigger value="pitch">Pitch</TabsTrigger>
              </TabsList>
              <TabsContent value="spectral" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Spectral Centroid</p>
                    <p className="text-2xl font-bold">{mockResults.features.spectralCentroid} Hz</p>
                    <p className="text-xs text-muted-foreground mt-1">Brightness measure</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">HNR</p>
                    <p className="text-2xl font-bold">{mockResults.features.hnr} dB</p>
                    <p className="text-xs text-muted-foreground mt-1">Harmonics-to-noise</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="harmonic" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">CPP</p>
                    <p className="text-2xl font-bold">{mockResults.features.cpp} dB</p>
                    <p className="text-xs text-muted-foreground mt-1">Cepstral Peak Prominence</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">H1-H2</p>
                    <p className="text-2xl font-bold">{mockResults.features.h1h2} dB</p>
                    <p className="text-xs text-muted-foreground mt-1">Open quotient proxy</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="formants" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F1</p>
                    <p className="text-2xl font-bold">{mockResults.features.formants.f1} Hz</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F2</p>
                    <p className="text-2xl font-bold">{mockResults.features.formants.f2} Hz</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F3</p>
                    <p className="text-2xl font-bold">{mockResults.features.formants.f3} Hz</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F4</p>
                    <p className="text-2xl font-bold">{mockResults.features.formants.f4} Hz</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="pitch" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Mean F0</p>
                    <p className="text-2xl font-bold">{mockResults.features.f0Mean} Hz</p>
                    <p className="text-xs text-muted-foreground mt-1">Average pitch</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F0 Range</p>
                    <p className="text-2xl font-bold">
                      {mockResults.features.f0Range[0]}-{mockResults.features.f0Range[1]} Hz
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Min to Max</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
