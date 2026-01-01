"use client";

import * as React from "react";
import { IconUpload, IconFile, IconX, IconMusic } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AudioDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  className?: string;
}

export function AudioDropzone({
  onFileSelect,
  acceptedFormats = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/x-m4a"],
  maxSizeMB = 50,
  className,
}: AudioDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Notify parent when upload completes
  React.useEffect(() => {
    if (uploadProgress === 100 && selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [uploadProgress, selectedFile, onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.some((format) => file.type.includes(format.split("/")[1]))) {
      return `Invalid file type. Please upload ${acceptedFormats.map(f => f.split("/")[1]).join(", ")} files.`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed cursor-pointer transition-all",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
              error && "border-destructive"
            )}
          >
            <div
              className={cn(
                "p-4 bg-muted",
                isDragging && "bg-primary/10"
              )}
            >
              <IconUpload
                className={cn(
                  "size-8 text-muted-foreground",
                  isDragging && "text-primary"
                )}
              />
            </div>
            <div className="text-center">
              <p className="font-medium">
                {isDragging ? "Drop your audio file here" : "Drag & drop audio file"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Badge variant="secondary">WAV</Badge>
              <Badge variant="secondary">MP3</Badge>
              <Badge variant="secondary">M4A</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {maxSizeMB}MB
            </p>
            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(",")}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10">
                <IconMusic className="size-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={removeFile}
              >
                <IconX className="size-4" />
              </Button>
            </div>
            {uploadProgress < 100 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
            {uploadProgress === 100 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <IconFile className="size-4" />
                <span>File ready for analysis</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
