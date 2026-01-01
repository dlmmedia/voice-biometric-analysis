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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { useGeneration, useApp } from "@/lib/context/app-context";
import {
  IconMicrophone,
  IconPlayerPlay,
  IconDownload,
  IconRefresh,
  IconWand,
  IconVolume,
  IconSettings,
  IconLoader2,
  IconAlertCircle,
  IconPlayerPause,
} from "@tabler/icons-react";
import Link from "next/link";

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
  const { isBackendConnected } = useApp();
  const { voiceSignatures, generateVoice } = useGeneration();
  
  const [selectedVoice, setSelectedVoice] = React.useState<string>("");
  const [selectedVoiceType, setSelectedVoiceType] = React.useState<string>("storyteller");
  const [selectedProfile, setSelectedProfile] = React.useState<string>("podcast");
  const [activeInflections, setActiveInflections] = React.useState<string[]>([]);
  const [textPrompt, setTextPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [generatedAudio, setGeneratedAudio] = React.useState<{
    url: string | null;
    base64: string | null;
    duration: number;
    verificationScores: any;
  } | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Layer controls
  const [pitchVariance, setPitchVariance] = React.useState([50]);
  const [speakingRate, setSpeakingRate] = React.useState([50]);
  const [expressiveness, setExpressiveness] = React.useState([70]);

  const toggleInflection = (id: string) => {
    setActiveInflections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  
  // Set default voice when signatures load
  React.useEffect(() => {
    if (voiceSignatures.length > 0 && !selectedVoice) {
      setSelectedVoice(voiceSignatures[0].id);
    }
  }, [voiceSignatures, selectedVoice]);

  const handleGenerate = async () => {
    if (!textPrompt) {
      toast.error("Please enter text to generate");
      return;
    }
    
    if (!selectedVoice) {
      toast.error("Please select a voice signature");
      return;
    }
    
    if (!isBackendConnected) {
      toast.error("Backend not connected. Please start the backend server.");
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedAudio(null);

    // Progress animation
    const interval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 5, 90));
    }, 200);
    
    try {
      const result = await generateVoice({
        text: textPrompt,
        signatureId: selectedVoice,
        voiceType: selectedVoiceType,
        inflections: activeInflections,
        perceptualProfile: selectedProfile,
        pitchVariance: pitchVariance[0],
        speakingRate: speakingRate[0],
        expressiveness: expressiveness[0],
      });
      
      clearInterval(interval);
      setGenerationProgress(100);
      
      setGeneratedAudio({
        url: result.audio_url,
        base64: result.audio_base64,
        duration: result.duration_seconds,
        verificationScores: result.verification_scores,
      });
      
      toast.success("Voice generated successfully!");
      
    } catch (error) {
      clearInterval(interval);
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePlayPause = () => {
    if (!generatedAudio?.base64) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(`data:audio/mpeg;base64,${generatedAudio.base64}`);
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
  
  const handleDownload = () => {
    if (!generatedAudio?.base64) return;
    
    const link = document.createElement("a");
    link.href = `data:audio/mpeg;base64,${generatedAudio.base64}`;
    link.download = `voxmaster_generated_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audio downloaded!");
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
              {voiceSignatures.length === 0 ? (
                <Alert>
                  <IconAlertCircle className="size-4" />
                  <AlertTitle>No Voice Signatures</AlertTitle>
                  <AlertDescription>
                    You need to enroll a voice signature first.{" "}
                    <Link href="/biometrics" className="underline font-medium">
                      Go to Voice Biometrics
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice signature" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceSignatures.map((sig: any) => (
                      <SelectItem key={sig.id} value={sig.id}>
                        {sig.name} ({Math.round(sig.quality_score || 0)}% quality)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
              {generatedAudio ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-4">
                    <Button size="icon" variant="outline" onClick={handlePlayPause}>
                      {isPlaying ? (
                        <IconPlayerPause className="size-4" />
                      ) : (
                        <IconPlayerPlay className="size-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="h-8 bg-primary/20 rounded flex items-center px-2">
                        <div className="w-full h-1 bg-primary/30 relative">
                          <div 
                            className="absolute inset-y-0 left-0 bg-primary transition-all" 
                            style={{ width: isPlaying ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {generatedAudio.duration.toFixed(1)}s
                    </span>
                  </div>
                  
                  {/* Verification Scores */}
                  {generatedAudio.verificationScores && (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Verification Scores</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold text-primary">
                            {generatedAudio.verificationScores.identity_match?.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Identity</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold text-primary">
                            {generatedAudio.verificationScores.voice_type_accuracy?.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Voice Type</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="text-lg font-bold text-primary">
                            {generatedAudio.verificationScores.perceptual_match?.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Perceptual</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleDownload}>
                      <IconDownload className="mr-2 size-4" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setGeneratedAudio(null);
                      audioRef.current = null;
                      setIsPlaying(false);
                    }}>
                      <IconRefresh className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="text-center py-8">
                  <IconLoader2 className="size-8 mx-auto mb-2 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating audio...</p>
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
