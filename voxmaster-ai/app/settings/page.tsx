"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSettings, useApp, useBiometrics } from "@/lib/context/app-context";
import {
  IconSettings,
  IconKey,
  IconShield,
  IconBell,
  IconPalette,
  IconDatabase,
  IconTrash,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconLoader2,
  IconDownload,
} from "@tabler/icons-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isBackendConnected } = useApp();
  const { 
    getSettings, 
    updateSettings, 
    saveApiKey, 
    verifyApiKey,
    deleteAllSignatures,
    exportData,
  } = useSettings();
  const { refreshSignatures } = useBiometrics();
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [settings, setSettings] = React.useState<any>(null);
  
  // API Key states
  const [elevenLabsKey, setElevenLabsKey] = React.useState("");
  const [openaiKey, setOpenaiKey] = React.useState("");
  const [isVerifyingElevenlabs, setIsVerifyingElevenlabs] = React.useState(false);
  const [isVerifyingOpenai, setIsVerifyingOpenai] = React.useState(false);
  const [elevenlabsVerified, setElevenlabsVerified] = React.useState<boolean | null>(null);
  const [openaiVerified, setOpenaiVerified] = React.useState<boolean | null>(null);
  const [isSavingKey, setIsSavingKey] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeletingSignatures, setIsDeletingSignatures] = React.useState(false);
  
  // Load settings on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      if (!isBackendConnected) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
      setIsLoading(false);
    };
    
    loadSettings();
  }, [isBackendConnected, getSettings]);
  
  // Update setting handler
  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const updated = await updateSettings({ [key]: value });
      setSettings(updated);
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };
  
  // Verify API key
  const handleVerifyKey = async (keyType: "elevenlabs" | "openai") => {
    const key = keyType === "elevenlabs" ? elevenLabsKey : openaiKey;
    if (!key) {
      toast.error("Please enter an API key");
      return;
    }
    
    if (keyType === "elevenlabs") {
      setIsVerifyingElevenlabs(true);
      setElevenlabsVerified(null);
    } else {
      setIsVerifyingOpenai(true);
      setOpenaiVerified(null);
    }
    
    try {
      const result = await verifyApiKey(keyType, key);
      if (result.valid) {
        if (keyType === "elevenlabs") {
          setElevenlabsVerified(true);
        } else {
          setOpenaiVerified(true);
        }
        toast.success(`${keyType === "elevenlabs" ? "ElevenLabs" : "OpenAI"} API key is valid!`);
      } else {
        if (keyType === "elevenlabs") {
          setElevenlabsVerified(false);
        } else {
          setOpenaiVerified(false);
        }
        toast.error(result.error || "Invalid API key");
      }
    } catch (error) {
      if (keyType === "elevenlabs") {
        setElevenlabsVerified(false);
      } else {
        setOpenaiVerified(false);
      }
      toast.error("Verification failed");
    } finally {
      if (keyType === "elevenlabs") {
        setIsVerifyingElevenlabs(false);
      } else {
        setIsVerifyingOpenai(false);
      }
    }
  };
  
  // Save API key
  const handleSaveKey = async (keyType: "elevenlabs" | "openai") => {
    const key = keyType === "elevenlabs" ? elevenLabsKey : openaiKey;
    if (!key) {
      toast.error("Please enter an API key");
      return;
    }
    
    setIsSavingKey(true);
    try {
      await saveApiKey(keyType, key);
      toast.success("API key saved successfully");
      
      // Refresh settings
      const data = await getSettings();
      setSettings(data);
      
      // Clear the input
      if (keyType === "elevenlabs") {
        setElevenLabsKey("");
        setElevenlabsVerified(null);
      } else {
        setOpenaiKey("");
        setOpenaiVerified(null);
      }
    } catch (error) {
      toast.error("Failed to save API key");
    } finally {
      setIsSavingKey(false);
    }
  };
  
  // Export data
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const blob = await exportData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "voxmaster_data_export.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };
  
  // Delete all signatures
  const handleDeleteAllSignatures = async () => {
    setIsDeletingSignatures(true);
    try {
      const result = await deleteAllSignatures();
      await refreshSignatures();
      toast.success(`Deleted ${result.deleted_count} voice signatures`);
    } catch (error) {
      toast.error("Failed to delete signatures");
    } finally {
      setIsDeletingSignatures(false);
    }
  };
  return (
    <DashboardLayout
      title="Settings"
      description="Configure your VoxMaster AI preferences"
    >
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPalette className="size-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how VoxMaster AI looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred color scheme
                  </p>
                </div>
                <Select 
                  value={theme} 
                  onValueChange={(value) => {
                    setTheme(value);
                    handleUpdateSetting("theme", value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a more compact interface layout
                  </p>
                </div>
                <Switch 
                  checked={settings?.compact_mode || false}
                  onCheckedChange={(checked) => handleUpdateSetting("compact_mode", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSettings className="size-5" />
                Analysis Defaults
              </CardTitle>
              <CardDescription>
                Set default options for audio analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Default Audio Type</Label>
                  <p className="text-sm text-muted-foreground">
                    Default selection for new analyses
                  </p>
                </div>
                <Select 
                  value={settings?.default_audio_type || "spoken"}
                  onValueChange={(value) => handleUpdateSetting("default_audio_type", value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spoken">Spoken</SelectItem>
                    <SelectItem value="sung">Sung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Export Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate PDF after analysis
                  </p>
                </div>
                <Switch 
                  checked={settings?.auto_export_reports || false}
                  onCheckedChange={(checked) => handleUpdateSetting("auto_export_reports", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconKey className="size-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Manage your API keys for external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>ElevenLabs API Key</Label>
                  {settings?.api_keys?.elevenlabs && (
                    <Badge variant="outline" className="text-green-600">
                      <IconCheck className="size-3 mr-1" />
                      Configured
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="xi-xxxxxxxxxxxxxxxx"
                    className="font-mono"
                    value={elevenLabsKey}
                    onChange={(e) => setElevenLabsKey(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => handleVerifyKey("elevenlabs")}
                    disabled={isVerifyingElevenlabs || !elevenLabsKey}
                  >
                    {isVerifyingElevenlabs ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : elevenlabsVerified === true ? (
                      <IconCheck className="size-4 text-green-600" />
                    ) : elevenlabsVerified === false ? (
                      <IconX className="size-4 text-red-600" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                  <Button 
                    onClick={() => handleSaveKey("elevenlabs")}
                    disabled={isSavingKey || !elevenLabsKey}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for PersonaFlow voice generation
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>OpenAI API Key (Optional)</Label>
                  {settings?.api_keys?.openai && (
                    <Badge variant="outline" className="text-green-600">
                      <IconCheck className="size-3 mr-1" />
                      Configured
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="font-mono"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => handleVerifyKey("openai")}
                    disabled={isVerifyingOpenai || !openaiKey}
                  >
                    {isVerifyingOpenai ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : openaiVerified === true ? (
                      <IconCheck className="size-4 text-green-600" />
                    ) : openaiVerified === false ? (
                      <IconX className="size-4 text-red-600" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                  <Button 
                    onClick={() => handleSaveKey("openai")}
                    disabled={isSavingKey || !openaiKey}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  For enhanced AI-powered analysis features
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <IconKey className="size-4" />
            <AlertTitle>Security Note</AlertTitle>
            <AlertDescription>
              API keys are encrypted before storage. They are never exposed in logs or responses.
              Your keys are only used to make requests to the respective services on your behalf.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Alert>
            <IconShield className="size-4" />
            <AlertTitle>Privacy First</AlertTitle>
            <AlertDescription>
              VoxMaster AI processes audio in memory and deletes raw files after
              feature extraction by default. Your voice data is never stored
              without explicit consent.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDatabase className="size-5" />
                Data Storage
              </CardTitle>
              <CardDescription>
                Control how your data is stored and processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Voice Bank</Label>
                  <p className="text-sm text-muted-foreground">
                    Store raw audio for future analysis
                  </p>
                </div>
                <Switch 
                  checked={settings?.privacy?.voice_bank || false}
                  onCheckedChange={(checked) => handleUpdateSetting("privacy", {
                    ...settings?.privacy,
                    voice_bank: checked,
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generation Identity Token</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow voice signature use for generation
                  </p>
                </div>
                <Switch 
                  checked={settings?.privacy?.generation_token !== false}
                  onCheckedChange={(checked) => handleUpdateSetting("privacy", {
                    ...settings?.privacy,
                    generation_token: checked,
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Analytics Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Share anonymized usage data to improve VoxMaster
                  </p>
                </div>
                <Switch 
                  checked={settings?.privacy?.analytics || false}
                  onCheckedChange={(checked) => handleUpdateSetting("privacy", {
                    ...settings?.privacy,
                    analytics: checked,
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <IconTrash className="size-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete All Voice Signatures</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove all enrolled voice data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeletingSignatures}>
                      {isDeletingSignatures ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : (
                        "Delete All"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all
                        your voice signatures and remove them from our database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllSignatures}>
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export My Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download all your data in a portable format
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <IconDownload className="mr-2 size-4" />
                  )}
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="size-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Analysis Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when analysis finishes processing
                  </p>
                </div>
                <Switch 
                  checked={settings?.notifications?.analysis_complete !== false}
                  onCheckedChange={(checked) => handleUpdateSetting("notifications", {
                    ...settings?.notifications,
                    analysis_complete: checked,
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generation Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when voice generation is ready
                  </p>
                </div>
                <Switch 
                  checked={settings?.notifications?.generation_complete !== false}
                  onCheckedChange={(checked) => handleUpdateSetting("notifications", {
                    ...settings?.notifications,
                    generation_complete: checked,
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify about suspicious verification attempts
                  </p>
                </div>
                <Switch 
                  checked={settings?.notifications?.security_alerts !== false}
                  onCheckedChange={(checked) => handleUpdateSetting("notifications", {
                    ...settings?.notifications,
                    security_alerts: checked,
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Product Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features
                  </p>
                </div>
                <Switch 
                  checked={settings?.notifications?.product_updates || false}
                  onCheckedChange={(checked) => handleUpdateSetting("notifications", {
                    ...settings?.notifications,
                    product_updates: checked,
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
