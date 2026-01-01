"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TimbreRadarChart } from "@/components/charts/timbre-radar-chart";
import { WeightGaugeChart } from "@/components/charts/weight-gauge-chart";
import { PlacementChart } from "@/components/charts/placement-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAnalysis, useReports, useApp } from "@/lib/context/app-context";
import {
  IconDownload,
  IconPlayerPlay,
  IconPlayerPause,
  IconChartBar,
  IconWaveSine,
  IconSparkles,
  IconLoader2,
} from "@tabler/icons-react";
import Link from "next/link";

export default function AnalysisResultsPage() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");
  
  const { currentAnalysis, getAnalysis } = useAnalysis();
  const { createReport } = useReports();
  const { apiUrl } = useApp();
  
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<typeof currentAnalysis>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // Fetch analysis data
  React.useEffect(() => {
    const fetchAnalysis = async () => {
      if (currentAnalysis && (!analysisId || currentAnalysis.id === analysisId)) {
        setAnalysis(currentAnalysis);
        setIsLoading(false);
        return;
      }
      
      if (analysisId) {
        try {
          const result = await getAnalysis(analysisId);
          setAnalysis(result);
        } catch (error) {
          console.error("Failed to fetch analysis:", error);
          toast.error("Failed to load analysis");
        }
      }
      setIsLoading(false);
    };
    
    fetchAnalysis();
  }, [analysisId, currentAnalysis, getAnalysis]);
  
  // Audio playback
  const handlePlayPause = () => {
    if (!analysis?.audio_url) {
      toast.error("No audio available for playback");
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio(`${apiUrl}${analysis.audio_url}`);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => {
        console.error("Playback failed:", e);
        toast.error("Failed to play audio");
      });
    }
    setIsPlaying(!isPlaying);
  };
  
  // Export report
  const handleExport = async () => {
    if (!analysis?.id) return;
    
    setIsExporting(true);
    try {
      const report = await createReport(analysis.id, "pdf");
      toast.success("Report generated successfully!");
      
      // Download the report
      const downloadUrl = `${apiUrl}/api/reports/${report.id}/download`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = report.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsExporting(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Analysis Results" description="Loading...">
        <div className="space-y-6">
          <Card>
            <CardContent className="py-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // No analysis found
  if (!analysis) {
    return (
      <DashboardLayout title="Analysis Results" description="No analysis found">
        <Card>
          <CardContent className="py-12 text-center">
            <IconWaveSine className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Analysis Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested analysis could not be found.
            </p>
            <Button asChild>
              <Link href="/analyze">Start New Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  // Map analysis data to display format
  const results = {
    filename: analysis.filename,
    audioType: analysis.audio_type,
    analyzedAt: analysis.analyzed_at,
    timbre: analysis.timbre,
    weight: analysis.weight,
    placement: {
      forwardness: analysis.placement?.forwardness || 0,
      ringIndex: analysis.placement?.ring_index || 0,
      nasality: analysis.placement?.nasality || 0,
    },
    sweetSpot: {
      clarity: analysis.sweet_spot?.clarity || 0,
      warmth: analysis.sweet_spot?.warmth || 0,
      presence: analysis.sweet_spot?.presence || 0,
      smoothness: analysis.sweet_spot?.smoothness || 0,
      harshnessPenalty: analysis.sweet_spot?.harshness_penalty || 0,
      total: analysis.sweet_spot?.total || 0,
    },
    features: analysis.features,
  };

  return (
    <DashboardLayout
      title="Analysis Results"
      description={`Analysis of ${results.filename}`}
    >
      <div className="space-y-6">
        {/* Header with file info and actions */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePlayPause}
                disabled={!analysis?.audio_url}
              >
                {isPlaying ? (
                  <IconPlayerPause className="size-4" />
                ) : (
                  <IconPlayerPlay className="size-4" />
                )}
              </Button>
              <div>
                <p className="font-medium">{results.filename}</p>
                <p className="text-sm text-muted-foreground">
                  Analyzed: {new Date(results.analyzedAt).toLocaleString()} • Type:{" "}
                  <Badge variant="secondary" className="ml-1">
                    {results.audioType}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/analyze">New Analysis</Link>
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <IconDownload className="mr-2 size-4" />
                )}
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
                  {results.sweetSpot.total.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">{results.sweetSpot.clarity.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Clarity (25%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{results.sweetSpot.warmth.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Warmth (20%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{results.sweetSpot.presence.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Presence (20%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{results.sweetSpot.smoothness.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Smoothness (15%)</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-destructive">
                    -{results.sweetSpot.harshnessPenalty.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Harshness (20%)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <TimbreRadarChart data={results.timbre} />
          <WeightGaugeChart
            weight={results.weight?.weight || 50}
            pressed={results.weight?.pressed || 50}
          />
          <PlacementChart
            forwardness={results.placement.forwardness}
            ringIndex={results.placement.ringIndex}
            nasality={results.placement.nasality}
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
                    <p className="text-2xl font-bold">{results.features?.spectral_centroid?.toFixed(0) || "N/A"} Hz</p>
                    <p className="text-xs text-muted-foreground mt-1">Brightness measure</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">HNR</p>
                    <p className="text-2xl font-bold">{results.features?.hnr?.toFixed(1) || "N/A"} dB</p>
                    <p className="text-xs text-muted-foreground mt-1">Harmonics-to-noise</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="harmonic" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">CPP</p>
                    <p className="text-2xl font-bold">{results.features?.cpp?.toFixed(1) || "N/A"} dB</p>
                    <p className="text-xs text-muted-foreground mt-1">Cepstral Peak Prominence</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">H1-H2</p>
                    <p className="text-2xl font-bold">{results.features?.h1_h2?.toFixed(1) || "N/A"} dB</p>
                    <p className="text-xs text-muted-foreground mt-1">Open quotient proxy</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="formants" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F1</p>
                    <p className="text-2xl font-bold">{results.features?.formants?.f1?.toFixed(0) || "N/A"} Hz</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F2</p>
                    <p className="text-2xl font-bold">{results.features?.formants?.f2?.toFixed(0) || "N/A"} Hz</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F3</p>
                    <p className="text-2xl font-bold">{results.features?.formants?.f3?.toFixed(0) || "N/A"} Hz</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F4</p>
                    <p className="text-2xl font-bold">{results.features?.formants?.f4?.toFixed(0) || "N/A"} Hz</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="pitch" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Mean F0</p>
                    <p className="text-2xl font-bold">{results.features?.f0_mean?.toFixed(0) || "N/A"} Hz</p>
                    <p className="text-xs text-muted-foreground mt-1">Average pitch</p>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">F0 Range</p>
                    <p className="text-2xl font-bold">
                      {results.features?.f0_range ? `${results.features.f0_range[0]?.toFixed(0)}-${results.features.f0_range[1]?.toFixed(0)}` : "N/A"} Hz
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
