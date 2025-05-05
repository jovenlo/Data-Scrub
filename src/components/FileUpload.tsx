
"use client";

import type React from 'react';
import { useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (file: File, fileContent: string) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileUpload, disabled = false }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

   const processFile = useCallback((file: File) => {
     console.log("Processing file:", file.name, "Type:", file.type); // Debugging log

    // Check file extension instead of MIME type for robustness
    if (!file.name || !file.name.toLowerCase().endsWith('.csv')) {
      console.error("File validation failed. Name:", file.name); // Debugging log
      toast({
        title: "Invalid File Type",
        description: `The uploaded file "${file.name}" is not a CSV file. Please ensure the file name ends with '.csv'.`,
        variant: "destructive",
      });
      setFileName(null);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileUpload(file, content);
      } else {
         toast({
            title: "Error Reading File",
            description: "Could not read the file content.",
            variant: "destructive",
         });
         setFileName(null);
      }
    };
    reader.onerror = (error) => {
        console.error("FileReader error:", error); // Log the actual error
        toast({
            title: "Error Reading File",
            description: `An error occurred while reading the file: ${error.message || 'Unknown error'}.`,
            variant: "destructive",
        });
        setFileName(null);
    };
    reader.readAsText(file);
  }, [onFileUpload, toast]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
     // Reset the input value to allow uploading the same file again
    event.target.value = '';
  }, [processFile]); // Added processFile dependency

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile, disabled]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
        setIsDragging(true);
    }
  }, [disabled]);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);


  return (
    <Card className={cn("w-full transition-colors", isDragging ? "border-primary" : "", disabled ? "opacity-50 cursor-not-allowed" : "")}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
    >
      <CardHeader>
        <CardTitle>Upload Dataset</CardTitle>
        <CardDescription>Upload your CSV dataset to analyze.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 p-6 border-2 border-dashed border-border rounded-lg bg-secondary/50">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <Label htmlFor="file-upload" className={cn("text-center", disabled ? "" : "cursor-pointer")}>
            <span className="text-primary font-semibold">Click to upload</span> or drag and drop
            <p className="text-xs text-muted-foreground">CSV files only (.csv extension)</p>
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv,text/csv" // Keep the accept attribute as a hint, added text/csv MIME type
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
            aria-label="File upload input" // Add aria-label for accessibility
          />
          {fileName && <p className="text-sm text-muted-foreground mt-2">Selected file: {fileName}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

