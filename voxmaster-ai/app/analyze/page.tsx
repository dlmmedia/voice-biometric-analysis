"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AudioDropzone } from "@/components/audio/audio-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconPlayerPlay,
  IconMicrophone,
  IconMusic,
  IconWaveSine,
  IconLoader2,
} from "@tabler/icons-react";

type AudioType = "spoken" | "sung";
type PromptType = "sustained" | "passage" | "verse";

export default function AnalyzePage() {
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [audioType, setAudioType] = React.useState<AudioType>("spoken");
  const [promptType, setPromptType] = React.useState<PromptType>("sustained");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const handleFileSelect = (file: File) => {
    setAudioFile(file);
  };

  const handleAnalyze = async () => {
    if (!audioFile) return;
    
    setIsAnalyzing(true);
    // TODO: Connect to backend API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

  return (
    <DashboardLayout
      title="Vocal Analysis"
      description="Analyze vocal technique with DLM feature extraction"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Upload and Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconWaveSine className="size-5" />
                Upload Audio
              </CardTitle>
              <CardDescription>
                Upload a WAV, MP3, or M4A file for vocal analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioDropzone onFileSelect={handleFileSelect} />
            </CardContent>
          </Card>

          {/* Audio Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Audio Type</CardTitle>
              <CardDescription>
                Select whether the audio contains spoken or sung voice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={audioType}
                onValueChange={(value) => setAudioType(value as AudioType)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="spoken"
                    id="spoken"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="spoken"
                    className="flex flex-col items-center justify-between border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <IconMicrophone className="mb-3 size-6" />
                    <span className="font-medium">Spoken Voice</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Speech, reading, conversation
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="sung"
                    id="sung"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="sung"
                    className="flex flex-col items-center justify-between border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <IconMusic className="mb-3 size-6" />
                    <span className="font-medium">Sung Voice</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Singing, sustained notes, melodies
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Prompt Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Type</CardTitle>
              <CardDescription>
                Select the type of vocal content for optimal analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={promptType} onValueChange={(v) => setPromptType(v as PromptType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sustained">Sustained Vowel</TabsTrigger>
                  <TabsTrigger value="passage">Reading Passage</TabsTrigger>
                  <TabsTrigger value="verse">Song Verse</TabsTrigger>
                </TabsList>
                <TabsContent value="sustained" className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Best for:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Pure tone quality assessment</li>
                      <li>Timbre analysis without consonants</li>
                      <li>Vibrato rate and depth measurement</li>
                      <li>Formant tracking accuracy</li>
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="passage" className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Best for:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Natural speech patterns</li>
                      <li>Prosodic feature analysis</li>
                      <li>Articulation clarity measurement</li>
                      <li>Dynamic range assessment</li>
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="verse" className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Best for:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Singing voice analysis</li>
                      <li>Register transitions</li>
                      <li>Singer&apos;s formant detection</li>
                      <li>Note stability tracking</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Analysis Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Audio File</span>
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {audioFile ? audioFile.name : "Not selected"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Audio Type</span>
                <Badge variant="outline">
                  {audioType === "spoken" ? "Spoken" : "Sung"}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Prompt Type</span>
                <Badge variant="outline">
                  {promptType === "sustained" && "Sustained Vowel"}
                  {promptType === "passage" && "Reading Passage"}
                  {promptType === "verse" && "Song Verse"}
                </Badge>
              </div>
              <Separator />
              <div className="pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!audioFile || isAnalyzing}
                  onClick={handleAnalyze}
                >
                  {isAnalyzing ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <IconPlayerPlay className="mr-2 size-4" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features to Extract */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">DLM Features to Extract</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-orange-500" />
                  <span>Tone Placement</span>
                  <span className="text-xs text-muted-foreground ml-auto">2.5-3.5 kHz</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-blue-500" />
                  <span>Vocal Weight</span>
                  <span className="text-xs text-muted-foreground ml-auto">CPP, H1-H2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-purple-500" />
                  <span>Timbre</span>
                  <span className="text-xs text-muted-foreground ml-auto">Centroid, HNR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
