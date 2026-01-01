"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AudioDropzone } from "@/components/audio/audio-dropzone";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useBiometrics, useApp } from "@/lib/context/app-context";
import { useAudioRecorder, blobToFile, formatRecordingTime } from "@/hooks/use-audio-recorder";
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
  IconLoader2,
  IconPlayerStop,
} from "@tabler/icons-react";

export default function BiometricsPage() {
  const { isBackendConnected } = useApp();
  const { 
    voiceSignatures, 
    refreshSignatures, 
    enrollVoice, 
    verifyVoice, 
    deleteSignature,
    getVerificationHistory,
  } = useBiometrics();
  
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = React.useState(false);
  const [enrollStep, setEnrollStep] = React.useState(1);
  const [voiceName, setVoiceName] = React.useState("");
  const [consentGiven, setConsentGiven] = React.useState(false);
  const [includeSinging, setIncludeSinging] = React.useState(false);
  const [recordedSamples, setRecordedSamples] = React.useState<Blob[]>([]);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const [enrollmentProgress, setEnrollmentProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [verificationHistory, setVerificationHistory] = React.useState<any[]>([]);
  const [verificationResult, setVerificationResult] = React.useState<null | {
    match: boolean;
    confidence: number;
    voiceName: string | null;
    antiSpoofing: any;
  }>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [uploadedVerifyFile, setUploadedVerifyFile] = React.useState<File | null>(null);
  
  // Audio recorder for enrollment
  const enrollRecorder = useAudioRecorder({
    maxDuration: 5,
    onRecordingComplete: (blob) => {
      setRecordedSamples((prev) => [...prev, blob]);
      toast.success(`Sample ${recordedSamples.length + 1} recorded!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Audio recorder for verification
  const verifyRecorder = useAudioRecorder({
    maxDuration: 10,
    onRecordingComplete: async (blob) => {
      await handleVerifyBlob(blob);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Load data on mount
  React.useEffect(() => {
    const loadData = async () => {
      if (isBackendConnected) {
        try {
          await refreshSignatures();
          const history = await getVerificationHistory();
          setVerificationHistory(history);
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [isBackendConnected, refreshSignatures, getVerificationHistory]);
  
  // Handle enrollment
  const handleEnroll = async () => {
    if (recordedSamples.length < 3) {
      toast.error("Please record at least 3 samples");
      return;
    }
    
    setIsEnrolling(true);
    setEnrollmentProgress(0);
    
    try {
      // Convert blobs to files
      const files = recordedSamples.map((blob, i) => 
        blobToFile(blob, `sample_${i + 1}.wav`)
      );
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setEnrollmentProgress((prev) => Math.min(prev + 10, 90));
      }, 200);
      
      await enrollVoice(files, voiceName, includeSinging);
      
      clearInterval(progressInterval);
      setEnrollmentProgress(100);
      
      toast.success("Voice enrolled successfully!");
      
      // Reset and close
      setTimeout(() => {
        setIsEnrollDialogOpen(false);
        resetEnrollment();
      }, 1000);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enrollment failed");
    } finally {
      setIsEnrolling(false);
    }
  };
  
  const resetEnrollment = () => {
    setEnrollStep(1);
    setVoiceName("");
    setConsentGiven(false);
    setIncludeSinging(false);
    setRecordedSamples([]);
    setEnrollmentProgress(0);
  };
  
  // Handle verification from recording
  const handleVerifyBlob = async (blob: Blob) => {
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const file = blobToFile(blob, "verify_sample.wav");
      const result = await verifyVoice(file);
      
      setVerificationResult({
        match: result.match,
        confidence: result.confidence,
        voiceName: result.matched_signature_name,
        antiSpoofing: result.anti_spoofing,
      });
      
      // Refresh history
      const history = await getVerificationHistory();
      setVerificationHistory(history);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle verification from uploaded file
  const handleVerifyFile = async () => {
    if (!uploadedVerifyFile) {
      toast.error("Please select an audio file");
      return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const result = await verifyVoice(uploadedVerifyFile);
      
      setVerificationResult({
        match: result.match,
        confidence: result.confidence,
        voiceName: result.matched_signature_name,
        antiSpoofing: result.anti_spoofing,
      });
      
      // Refresh history
      const history = await getVerificationHistory();
      setVerificationHistory(history);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle delete
  const handleDelete = async (signatureId: string) => {
    try {
      await deleteSignature(signatureId);
      toast.success("Voice signature deleted");
    } catch (error) {
      toast.error("Failed to delete signature");
    }
  };
  
  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
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
                      <Input 
                        id="voiceName" 
                        placeholder="e.g., My Primary Voice" 
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="includeSinging" 
                          checked={includeSinging}
                          onCheckedChange={setIncludeSinging}
                        />
                        <Label htmlFor="includeSinging" className="text-sm">
                          Include singing samples
                        </Label>
                      </div>
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
                        <Switch 
                          id="consent" 
                          checked={consentGiven}
                          onCheckedChange={setConsentGiven}
                        />
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
                            className={`size-8 flex items-center justify-center rounded-full border-2 ${
                              i <= recordedSamples.length
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted"
                            }`}
                          >
                            {i <= recordedSamples.length ? (
                              <IconCheck className="size-4" />
                            ) : (
                              i
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Audio Level Meter */}
                      {enrollRecorder.isRecording && (
                        <div className="space-y-2">
                          <Progress value={enrollRecorder.audioLevel} className="h-2" />
                          <p className="text-2xl font-mono font-bold text-primary">
                            {formatRecordingTime(enrollRecorder.recordingTime)}
                          </p>
                        </div>
                      )}
                      
                      <Button
                        size="lg"
                        variant={enrollRecorder.isRecording ? "destructive" : "default"}
                        onClick={() => {
                          if (enrollRecorder.isRecording) {
                            enrollRecorder.stopRecording();
                          } else {
                            enrollRecorder.startRecording();
                          }
                        }}
                        className="w-full"
                      >
                        {enrollRecorder.isRecording ? (
                          <>
                            <IconPlayerStop className="mr-2 size-4" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <IconMicrophone className="mr-2 size-4" />
                            {recordedSamples.length === 0 ? "Start Recording" : "Record Another"}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Speak naturally for 3-5 seconds per sample
                      </p>
                    </div>
                  </div>
                )}

                {enrollStep === 3 && (
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        {isEnrolling ? (
                          <IconLoader2 className="size-8 text-primary animate-spin" />
                        ) : (
                          <IconFingerprint className="size-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {isEnrolling ? "Processing Voice Signature" : "Ready to Enroll"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isEnrolling 
                            ? "Extracting speaker embeddings..." 
                            : `${recordedSamples.length} samples ready`
                          }
                        </p>
                      </div>
                      {isEnrolling && (
                        <Progress value={enrollmentProgress} className="w-full" />
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {enrollStep === 1 && (
                    <Button 
                      onClick={() => setEnrollStep(2)}
                      disabled={!voiceName.trim() || !consentGiven}
                    >
                      Continue
                    </Button>
                  )}
                  {enrollStep === 2 && recordedSamples.length >= 3 && (
                    <Button onClick={() => setEnrollStep(3)}>
                      Continue to Enroll
                    </Button>
                  )}
                  {enrollStep === 3 && (
                    <Button onClick={handleEnroll} disabled={isEnrolling}>
                      {isEnrolling ? (
                        <>
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                          Creating Signature...
                        </>
                      ) : (
                        "Create Signature"
                      )}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            {isLoading ? (
              <CardContent className="py-8">
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            ) : voiceSignatures.length === 0 ? (
              <CardContent className="text-center py-12">
                <IconFingerprint className="size-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Voice Signatures</h3>
                <p className="text-muted-foreground mb-4">
                  Enroll your first voice to get started with biometric verification.
                </p>
              </CardContent>
            ) : (
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
                  {voiceSignatures.map((voice: any) => (
                    <TableRow key={voice.id}>
                      <TableCell className="font-medium">{voice.name}</TableCell>
                      <TableCell>{formatRelativeTime(voice.enrolled_at || voice.created_at)}</TableCell>
                      <TableCell>{voice.samples_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={voice.quality_score || 0} className="w-16 h-2" />
                          <span className="text-sm">{Math.round(voice.quality_score || 0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge
                            variant={voice.has_spoken_centroid ? "default" : "secondary"}
                          >
                            Speech
                          </Badge>
                          <Badge
                            variant={voice.has_singing_centroid ? "default" : "secondary"}
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
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(voice.id)}
                        >
                          <IconTrash className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
                {/* Recording Section */}
                <div className="space-y-4">
                  {verifyRecorder.isRecording && (
                    <div className="text-center space-y-2 p-4 border rounded-lg bg-muted/50">
                      <Progress value={verifyRecorder.audioLevel} className="h-2" />
                      <p className="text-2xl font-mono font-bold text-primary">
                        {formatRecordingTime(verifyRecorder.recordingTime)}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={verifyRecorder.isRecording ? "destructive" : "outline"}
                      className="h-24 flex-col gap-2"
                      onClick={() => {
                        if (verifyRecorder.isRecording) {
                          verifyRecorder.stopRecording();
                        } else {
                          verifyRecorder.startRecording();
                        }
                      }}
                      disabled={isVerifying}
                    >
                      {verifyRecorder.isRecording ? (
                        <>
                          <IconPlayerStop className="size-6" />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <IconMicrophone className="size-6" />
                          <span>Record Sample</span>
                        </>
                      )}
                    </Button>
                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadedVerifyFile(file);
                        }}
                      />
                      <Button 
                        variant="outline" 
                        className="h-24 w-full flex-col gap-2"
                        disabled={isVerifying}
                      >
                        <IconUpload className="size-6" />
                        <span>{uploadedVerifyFile ? uploadedVerifyFile.name : "Upload Audio"}</span>
                      </Button>
                    </div>
                  </div>
                  
                  {uploadedVerifyFile && (
                    <Button 
                      onClick={handleVerifyFile} 
                      disabled={isVerifying}
                      className="w-full"
                    >
                      {isVerifying ? (
                        <>
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <IconFingerprint className="mr-2 size-4" />
                          Verify Uploaded File
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {isVerifying && (
                  <div className="text-center p-4">
                    <IconLoader2 className="size-8 mx-auto animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Analyzing voice pattern...</p>
                  </div>
                )}

                {verificationResult && !isVerifying && (
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
                    <AlertDescription className="space-y-2">
                      <p>
                        {verificationResult.match
                          ? `Identified as "${verificationResult.voiceName}" with ${verificationResult.confidence.toFixed(1)}% confidence`
                          : "Voice does not match any enrolled signatures"}
                      </p>
                      {verificationResult.antiSpoofing && (
                        <div className="flex gap-2 mt-2">
                          <Badge variant={verificationResult.antiSpoofing.liveness_verified ? "default" : "destructive"}>
                            {verificationResult.antiSpoofing.liveness_verified ? "Liveness ✓" : "Liveness ✗"}
                          </Badge>
                          <Badge variant={!verificationResult.antiSpoofing.replay_detected ? "default" : "destructive"}>
                            {verificationResult.antiSpoofing.replay_detected ? "Replay Detected" : "No Replay"}
                          </Badge>
                          <Badge variant={!verificationResult.antiSpoofing.ai_generated ? "default" : "destructive"}>
                            {verificationResult.antiSpoofing.ai_generated ? "AI Generated" : "Natural Voice"}
                          </Badge>
                        </div>
                      )}
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
                {verificationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No verification attempts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verificationHistory.slice(0, 5).map((item: any, i: number) => (
                      <div
                        key={item.id || i}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {item.match ? (
                            <IconCheck className="size-4 text-green-600" />
                          ) : (
                            <IconX className="size-4 text-red-600" />
                          )}
                          <div>
                            <span className="text-sm font-medium">
                              {item.signature_name || "Unknown"}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(item.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={item.match ? "default" : "destructive"}>
                          {item.confidence?.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
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
