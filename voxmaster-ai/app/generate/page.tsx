"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  IconMicrophone,
  IconPlayerPlay,
  IconDownload,
  IconRefresh,
  IconWand,
  IconVolume,
  IconSettings,
} from "@tabler/icons-react";

// Voice types as defined in PRD
const voiceTypes = [
  {
    id: "command",
    name: "Command",
    description: "Authoritative, high presence, low pitch variance",
    weight: "Heavy",
    presence: "High",
  },
  {
    id: "intimate",
    name: "Intimate",
    description: "Warm, soft, close proximity feel",
    weight: "Light",
    presence: "Medium",
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description: "Engaging, dynamic range, varied inflections",
    weight: "Medium",
    presence: "Medium",
  },
  {
    id: "whisper",
    name: "Whisper",
    description: "Breathy, low volume, intimate urgency",
    weight: "Light",
    presence: "Low",
  },
  {
    id: "urgent",
    name: "Urgent",
    description: "Fast-paced, high energy, compelling",
    weight: "Heavy",
    presence: "High",
  },
];

// Inflection overlays
const inflections = [
  { id: "punch", name: "Punch", description: "Loudness spike on key words" },
  { id: "drawl", name: "Drawl", description: "Vowel elongation for emphasis" },
  { id: "uptalk", name: "Uptalk", description: "Rising intonation pattern" },
  { id: "breathpause", name: "Breath Pause", description: "Strategic pauses" },
];

// Perceptual profiles
const perceptualProfiles = [
  { id: "podcast", name: "Podcast Clarity", description: "Optimized for podcast/audio content" },
  { id: "warm", name: "Warm/Intimate", description: "Cozy, personal feel" },
  { id: "broadcast", name: "Broadcast", description: "Professional radio/TV quality" },
  { id: "asmr", name: "ASMR", description: "Soft, soothing, close-mic" },
];

export default function GeneratePage() {
  const [selectedVoice, setSelectedVoice] = React.useState<string>("");
  const [selectedVoiceType, setSelectedVoiceType] = React.useState<string>("storyteller");
  const [selectedProfile, setSelectedProfile] = React.useState<string>("podcast");
  const [activeInflections, setActiveInflections] = React.useState<string[]>([]);
  const [textPrompt, setTextPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);

  // Layer controls
  const [pitchVariance, setPitchVariance] = React.useState([50]);
  const [speakingRate, setSpeakingRate] = React.useState([50]);
  const [expressiveness, setExpressiveness] = React.useState([70]);

  const toggleInflection = (id: string) => {
    setActiveInflections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!textPrompt || !selectedVoice) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate generation progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const selectedTypeDetails = voiceTypes.find((t) => t.id === selectedVoiceType);

  return (
    <DashboardLayout
      title="PersonaFlow Generator"
      description="Generate voices with layered identity and style control"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Layer 1: Identity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Layer 1</Badge>
                <CardTitle className="text-lg">Identity</CardTitle>
              </div>
              <CardDescription>
                Select the voice signature to condition the generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice signature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary Voice (92% quality)</SelectItem>
                  <SelectItem value="secondary">Secondary Voice (78% quality)</SelectItem>
                  <SelectItem value="new">+ Enroll New Voice</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Layer 2: Voice Type */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Layer 2</Badge>
                <CardTitle className="text-lg">Voice Type</CardTitle>
              </div>
              <CardDescription>
                Select the computational mode for voice generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {voiceTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedVoiceType(type.id)}
                    className={`p-4 text-center border-2 transition-all ${
                      selectedVoiceType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{type.name}</p>
                  </button>
                ))}
              </div>
              {selectedTypeDetails && (
                <div className="mt-4 p-4 bg-muted/50 space-y-2">
                  <p className="text-sm">{selectedTypeDetails.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Weight: {selectedTypeDetails.weight}</span>
                    <span>Presence: {selectedTypeDetails.presence}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Layer 3: Inflections */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Layer 3</Badge>
                <CardTitle className="text-lg">Inflections</CardTitle>
              </div>
              <CardDescription>
                Overlay temporal patterns for expression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {inflections.map((inflection) => (
                  <div
                    key={inflection.id}
                    className="flex items-center justify-between p-4 border"
                  >
                    <div>
                      <p className="font-medium text-sm">{inflection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inflection.description}
                      </p>
                    </div>
                    <Switch
                      checked={activeInflections.includes(inflection.id)}
                      onCheckedChange={() => toggleInflection(inflection.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Layer 4: Perceptual Optimization */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Layer 4</Badge>
                <CardTitle className="text-lg">Perceptual Profile</CardTitle>
              </div>
              <CardDescription>
                Target perceptual characteristics for the output
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {perceptualProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name} - {profile.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Accordion type="single" collapsible>
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <IconSettings className="size-4" />
                      Advanced Controls
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Pitch Variance</Label>
                        <span className="text-sm text-muted-foreground">
                          {pitchVariance[0]}%
                        </span>
                      </div>
                      <Slider
                        value={pitchVariance}
                        onValueChange={setPitchVariance}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Speaking Rate</Label>
                        <span className="text-sm text-muted-foreground">
                          {speakingRate[0]}%
                        </span>
                      </div>
                      <Slider
                        value={speakingRate}
                        onValueChange={setSpeakingRate}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Expressiveness</Label>
                        <span className="text-sm text-muted-foreground">
                          {expressiveness[0]}%
                        </span>
                      </div>
                      <Slider
                        value={expressiveness}
                        onValueChange={setExpressiveness}
                        max={100}
                        step={1}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Text Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Text Prompt</CardTitle>
              <CardDescription>
                Enter the text you want to generate as speech
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your text here..."
                className="min-h-[150px]"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {textPrompt.length} characters
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setTextPrompt("")}
                    disabled={!textPrompt}
                  >
                    <IconRefresh className="mr-2 size-4" />
                    Clear
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!textPrompt || !selectedVoice || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <IconWand className="mr-2 size-4 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconWand className="mr-2 size-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={generationProgress} />
                  <p className="text-xs text-center text-muted-foreground">
                    {generationProgress < 30 && "Processing identity conditioning..."}
                    {generationProgress >= 30 && generationProgress < 60 && "Applying voice type parameters..."}
                    {generationProgress >= 60 && generationProgress < 90 && "Optimizing perceptual quality..."}
                    {generationProgress >= 90 && "Finalizing output..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Configuration Summary & Output */}
        <div className="space-y-6">
          {/* Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Identity</span>
                  <span className="font-medium">
                    {selectedVoice || "Not selected"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Voice Type</span>
                  <Badge variant="outline">{selectedVoiceType}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Inflections</span>
                  <span className="font-medium">
                    {activeInflections.length || "None"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profile</span>
                  <span className="font-medium capitalize">{selectedProfile}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Output */}
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>
                Generated audio will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generationProgress === 100 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 flex items-center gap-4">
                    <Button size="icon" variant="outline">
                      <IconPlayerPlay className="size-4" />
                    </Button>
                    <div className="flex-1">
                      <div className="h-8 bg-primary/20 flex items-center px-2">
                        <div className="w-1/3 h-1 bg-primary" />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">0:00 / 0:12</span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <IconDownload className="mr-2 size-4" />
                      Download
                    </Button>
                    <Button variant="outline">
                      <IconRefresh className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconVolume className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No audio generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Integration Note */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <IconMicrophone className="size-6 mx-auto mb-2 opacity-50" />
                <p>Powered by Eleven Labs API</p>
                <p className="text-xs mt-1">Voice synthesis with identity conditioning</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
