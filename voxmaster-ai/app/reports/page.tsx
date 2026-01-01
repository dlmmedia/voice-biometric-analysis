"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useReports, useAnalysis, useApp } from "@/lib/context/app-context";
import {
  IconFileAnalytics,
  IconDownload,
  IconEye,
  IconTrash,
  IconPdf,
  IconBraces,
  IconTable,
  IconCalendar,
  IconLoader2,
} from "@tabler/icons-react";

export default function ReportsPage() {
  const { isBackendConnected, apiUrl } = useApp();
  const { listReports, downloadReport, deleteReport, createReport } = useReports();
  const { listAnalyses } = useAnalysis();
  
  const [reports, setReports] = React.useState<any[]>([]);
  const [analyses, setAnalyses] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = React.useState<string>("");
  const [exportFormat, setExportFormat] = React.useState("pdf");
  const [isCreatingReport, setIsCreatingReport] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  // Load reports and analyses on mount
  React.useEffect(() => {
    const loadData = async () => {
      if (!isBackendConnected) {
        setIsLoading(false);
        return;
      }
      
      try {
        const [reportsList, analysesList] = await Promise.all([
          listReports(),
          listAnalyses(50),
        ]);
        setReports(reportsList || []);
        setAnalyses(analysesList || []);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [isBackendConnected, listReports, listAnalyses]);
  
  // Create new report
  const handleCreateReport = async () => {
    if (!selectedAnalysis) {
      toast.error("Please select an analysis");
      return;
    }
    
    setIsCreatingReport(true);
    try {
      await createReport(selectedAnalysis, exportFormat);
      toast.success("Report generated successfully!");
      
      // Refresh reports list
      const reportsList = await listReports();
      setReports(reportsList || []);
      
      setIsDialogOpen(false);
      setSelectedAnalysis("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create report");
    } finally {
      setIsCreatingReport(false);
    }
  };
  
  // Download report
  const handleDownload = async (report: any) => {
    try {
      const blob = await downloadReport(report.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch (error) {
      toast.error("Failed to download report");
    }
  };
  
  // Delete report
  const handleDelete = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      toast.success("Report deleted");
      
      // Refresh reports list
      const reportsList = await listReports();
      setReports(reportsList || []);
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };
  
  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Label>Select Analysis</Label>
                  {analyses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No analyses available. Run an analysis first.
                    </p>
                  ) : (
                    <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an analysis" />
                      </SelectTrigger>
                      <SelectContent>
                        {analyses.map((analysis: any) => (
                          <SelectItem key={analysis.id} value={analysis.id}>
                            {analysis.filename} - {formatDate(analysis.created_at)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Export Format</Label>
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
              </div>
              <DialogFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCreateReport}
                  disabled={isCreatingReport || !selectedAnalysis}
                >
                  {isCreatingReport ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </Button>
              </DialogFooter>
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
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <IconFileAnalytics className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first report from an analysis.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <IconFileAnalytics className="mr-2 size-4" />
                    New Report
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {report.filename?.endsWith('.pdf') ? (
                              <IconPdf className="size-4 text-red-500" />
                            ) : report.filename?.endsWith('.json') ? (
                              <IconBraces className="size-4 text-blue-500" />
                            ) : (
                              <IconTable className="size-4 text-green-500" />
                            )}
                            {report.filename}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {report.audio_file || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {report.report_type || "analysis"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(report.created_at)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatSize(report.size_bytes || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDownload(report)}
                            >
                              <IconDownload className="size-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(report.id)}
                            >
                              <IconTrash className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
