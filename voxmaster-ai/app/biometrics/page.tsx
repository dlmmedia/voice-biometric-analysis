"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  IconFingerprint,
  IconPlus,
  IconMicrophone,
  IconUpload,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconTrash,
  IconPointFilled,
} from "@tabler/icons-react";

// Mock enrolled voices
const enrolledVoices = [
  {
    id: "1",
    name: "Primary Voice",
    enrolledAt: "2024-01-15",
    samplesCount: 5,
    quality: 92,
    status: "active" as const,
    hasSpokenCentroid: true,
    hasSingingCentroid: true,
  },
  {
    id: "2",
    name: "Secondary Voice",
    enrolledAt: "2024-01-10",
    samplesCount: 3,
    quality: 78,
    status: "active" as const,
    hasSpokenCentroid: true,
    hasSingingCentroid: false,
  },
];

export default function BiometricsPage() {
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = React.useState(false);
  const [enrollStep, setEnrollStep] = React.useState(1);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordedSamples, setRecordedSamples] = React.useState(0);
  const [verificationResult, setVerificationResult] = React.useState<null | {
    match: boolean;
    confidence: number;
    voiceName: string;
  }>(null);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording
    setTimeout(() => {
      setIsRecording(false);
      setRecordedSamples((prev) => prev + 1);
    }, 3000);
  };

  const handleVerify = () => {
    // Simulate verification
    setTimeout(() => {
      setVerificationResult({
        match: true,
        confidence: 94.5,
        voiceName: "Primary Voice",
      });
    }, 1500);
  };

  return (
    <DashboardLayout
      title="Voice Biometrics"
      description="VoiceID Sentinel - Create and manage voice signatures for identification"
    >
      <Tabs defaultValue="signatures" className="space-y-6">
        <TabsList>
          <TabsTrigger value="signatures">Voice Signatures</TabsTrigger>
          <TabsTrigger value="verify">Verify Identity</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
        </TabsList>

        {/* Voice Signatures Tab */}
        <TabsContent value="signatures" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Enrolled Voices</h2>
              <p className="text-sm text-muted-foreground">
                Manage voice signatures for biometric verification
              </p>
            </div>
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <IconPlus className="mr-2 size-4" />
                  Enroll New Voice
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Voice Enrollment</DialogTitle>
                  <DialogDescription>
                    Record multiple samples to create a robust voice signature
                  </DialogDescription>
                </DialogHeader>

                {enrollStep === 1 && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="voiceName">Voice Name</Label>
                      <Input id="voiceName" placeholder="e.g., My Primary Voice" />
                    </div>
                    <div className="space-y-2">
                      <Label>Consent</Label>
                      <Alert>
                        <IconShieldCheck className="size-4" />
                        <AlertTitle>Privacy Notice</AlertTitle>
                        <AlertDescription className="text-sm">
                          Your voice data will be processed to create a biometric signature.
                          The raw audio will be deleted after processing. You can delete
                          your voice signature at any time.
                        </AlertDescription>
                      </Alert>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch id="consent" />
                        <Label htmlFor="consent" className="text-sm">
                          I consent to voice biometric processing
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {enrollStep === 2 && (
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Record at least 3 samples for accurate enrollment
                      </p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`size-8 flex items-center justify-center border-2 ${
                              i <= recordedSamples
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted"
                            }`}
                          >
                            {i <= recordedSamples ? (
                              <IconCheck className="size-4" />
                            ) : (
                              i
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        size="lg"
                        variant={isRecording ? "destructive" : "default"}
                        onClick={handleStartRecording}
                        disabled={isRecording}
                        className="w-full"
                      >
                        {isRecording ? (
                          <>
                            <IconPointFilled className="mr-2 size-4 animate-pulse text-red-500" />
                            Recording... (3s)
                          </>
                        ) : (
                          <>
                            <IconMicrophone className="mr-2 size-4" />
                            {recordedSamples === 0 ? "Start Recording" : "Record Another"}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Speak naturally for 3 seconds per sample
                      </p>
                    </div>
                  </div>
                )}

                {enrollStep === 3 && (
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center">
                        <IconFingerprint className="size-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Processing Voice Signature</p>
                        <p className="text-sm text-muted-foreground">
                          Extracting speaker embeddings...
                        </p>
                      </div>
                      <Progress value={66} className="w-full" />
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {enrollStep === 1 && (
                    <Button onClick={() => setEnrollStep(2)}>Continue</Button>
                  )}
                  {enrollStep === 2 && recordedSamples >= 3 && (
                    <Button onClick={() => setEnrollStep(3)}>
                      Create Signature
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Centroids</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledVoices.map((voice) => (
                  <TableRow key={voice.id}>
                    <TableCell className="font-medium">{voice.name}</TableCell>
                    <TableCell>{voice.enrolledAt}</TableCell>
                    <TableCell>{voice.samplesCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={voice.quality} className="w-16 h-2" />
                        <span className="text-sm">{voice.quality}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge
                          variant={voice.hasSpokenCentroid ? "default" : "secondary"}
                        >
                          Speech
                        </Badge>
                        <Badge
                          variant={voice.hasSingingCentroid ? "default" : "secondary"}
                        >
                          Singing
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={voice.status === "active" ? "default" : "secondary"}
                      >
                        {voice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <IconTrash className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Verify Identity Tab */}
        <TabsContent value="verify" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Voice Verification</CardTitle>
                <CardDescription>
                  Record or upload audio to verify speaker identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2"
                    onClick={handleVerify}
                  >
                    <IconMicrophone className="size-6" />
                    <span>Record Sample</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col gap-2">
                    <IconUpload className="size-6" />
                    <span>Upload Audio</span>
                  </Button>
                </div>

                {verificationResult && (
                  <Alert
                    variant={verificationResult.match ? "default" : "destructive"}
                  >
                    {verificationResult.match ? (
                      <IconCheck className="size-4" />
                    ) : (
                      <IconX className="size-4" />
                    )}
                    <AlertTitle>
                      {verificationResult.match ? "Match Found" : "No Match"}
                    </AlertTitle>
                    <AlertDescription>
                      {verificationResult.match
                        ? `Identified as "${verificationResult.voiceName}" with ${verificationResult.confidence}% confidence`
                        : "Voice does not match any enrolled signatures"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification History</CardTitle>
                <CardDescription>
                  Recent verification attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: "2 min ago", result: "match", confidence: 94.5 },
                    { time: "1 hour ago", result: "match", confidence: 91.2 },
                    { time: "3 hours ago", result: "no_match", confidence: 23.1 },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {item.result === "match" ? (
                          <IconCheck className="size-4 text-green-600" />
                        ) : (
                          <IconX className="size-4 text-red-600" />
                        )}
                        <span className="text-sm">{item.time}</span>
                      </div>
                      <Badge variant={item.result === "match" ? "default" : "destructive"}>
                        {item.confidence}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Anti-Spoofing Protection</CardTitle>
              <CardDescription>
                Configure liveness detection and replay attack prevention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Replay Detection</p>
                  <p className="text-sm text-muted-foreground">
                    Detect and block recorded audio playback attacks
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Voice Detection</p>
                  <p className="text-sm text-muted-foreground">
                    Detect AI-generated or cloned voices
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mode-Identity Consistency</p>
                  <p className="text-sm text-muted-foreground">
                    Verify voice type matches biometric centroid
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Alert>
                <IconAlertTriangle className="size-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  All anti-spoofing features are enabled. Your voice signatures are
                  protected against common attack vectors.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
