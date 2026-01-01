"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconFileAnalytics,
  IconDownload,
  IconEye,
  IconTrash,
  IconPdf,
  IconBraces,
  IconTable,
  IconCalendar,
} from "@tabler/icons-react";

// Mock reports data
const reports = [
  {
    id: "1",
    filename: "voice_analysis_report.pdf",
    audioFile: "sample_voice.wav",
    type: "analysis" as const,
    sweetSpotScore: 76.3,
    createdAt: "2024-01-15 14:30",
    size: "1.2 MB",
  },
  {
    id: "2",
    filename: "biometric_enrollment.pdf",
    audioFile: "enrollment_samples",
    type: "biometric" as const,
    sweetSpotScore: null,
    createdAt: "2024-01-14 10:15",
    size: "0.8 MB",
  },
  {
    id: "3",
    filename: "batch_analysis_01.pdf",
    audioFile: "10 files",
    type: "batch" as const,
    sweetSpotScore: 72.1,
    createdAt: "2024-01-12 16:45",
    size: "4.5 MB",
  },
];

export default function ReportsPage() {
  const [exportFormat, setExportFormat] = React.useState("pdf");

  return (
    <DashboardLayout
      title="Reports & Export"
      description="View and download analysis reports"
    >
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="biometric">Biometric</TabsTrigger>
            <TabsTrigger value="batch">Batch</TabsTrigger>
          </TabsList>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <IconFileAnalytics className="mr-2 size-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Report</DialogTitle>
                <DialogDescription>
                  Create a new report from your analysis results
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Analysis</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an analysis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">sample_voice.wav - Jan 15</SelectItem>
                      <SelectItem value="2">recording_02.mp3 - Jan 14</SelectItem>
                      <SelectItem value="3">singing_sample.wav - Jan 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={exportFormat === "pdf" ? "default" : "outline"}
                      className="flex-col h-20 gap-2"
                      onClick={() => setExportFormat("pdf")}
                    >
                      <IconPdf className="size-6" />
                      <span>PDF</span>
                    </Button>
                    <Button
                      variant={exportFormat === "json" ? "default" : "outline"}
                      className="flex-col h-20 gap-2"
                      onClick={() => setExportFormat("json")}
                    >
                      <IconBraces className="size-6" />
                      <span>JSON</span>
                    </Button>
                    <Button
                      variant={exportFormat === "csv" ? "default" : "outline"}
                      className="flex-col h-20 gap-2"
                      onClick={() => setExportFormat("csv")}
                    >
                      <IconTable className="size-6" />
                      <span>CSV</span>
                    </Button>
                  </div>
                </div>
                <Button className="w-full">Generate Report</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>
                Complete list of generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <IconPdf className="size-4 text-red-500" />
                          {report.filename}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.audioFile}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.sweetSpotScore ? (
                          <span className="font-medium">{report.sweetSpotScore}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.createdAt}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.size}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <IconEye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <IconDownload className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Showing analysis reports only
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometric">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Showing biometric reports only
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Showing batch analysis reports only
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Preview Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>
            Preview of the most recent report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-[8.5/11] bg-muted/50 border-2 border-dashed flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <IconFileAnalytics className="size-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Report Preview</p>
              <p className="text-sm">Select a report to preview</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
