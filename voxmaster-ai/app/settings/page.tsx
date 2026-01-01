"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  IconSettings,
  IconKey,
  IconShield,
  IconBell,
  IconPalette,
  IconDatabase,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";

export default function SettingsPage() {
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
                <Select defaultValue="system">
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
                <Switch />
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
                <Select defaultValue="spoken">
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
                <Switch />
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
                <Label>Eleven Labs API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="font-mono"
                  />
                  <Button variant="outline">Verify</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for PersonaFlow voice generation
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>OpenAI API Key (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="font-mono"
                  />
                  <Button variant="outline">Verify</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  For enhanced AI-powered analysis features
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Gemini API Key (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="AIzaxxxxxxxxxxxxxxxx"
                    className="font-mono"
                  />
                  <Button variant="outline">Verify</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alternative AI provider for analysis
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>
                Monitor your API consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">API Calls Today</p>
                </div>
                <div className="p-4 bg-muted/50 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
                <div className="p-4 bg-muted/50 text-center">
                  <p className="text-2xl font-bold">$0.00</p>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generation Identity Token</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow voice signature use for generation
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Analytics Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Share anonymized usage data to improve VoxMaster
                  </p>
                </div>
                <Switch />
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
                <Button variant="destructive" size="sm">
                  Delete All
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export My Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download all your data in a portable format
                  </p>
                </div>
                <Button variant="outline" size="sm">
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
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generation Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when voice generation is ready
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify about suspicious verification attempts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Product Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
