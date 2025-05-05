

"use client";

import type React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DataPreview, type ParsedCsvRow } from '@/components/DataPreview'; // Import DataPreview
import { Download, Trash2 } from 'lucide-react'; // Added Trash2 icon
import { Separator } from '@/components/ui/separator';
import { deduplicateRows } from '@/ai/flows/deduplicate-rows';
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse'; // Import papaparse

export default function DashboardPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalCsvData, setOriginalCsvData] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: ParsedCsvRow[] } | null>(null);
  const [cleanedCsvData, setCleanedCsvData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();

  const parsePreview = (csvString: string) => {
    Papa.parse(csvString, {
        header: true,
        preview: 10, // Show header + first 10 data rows
        skipEmptyLines: true,
        complete: (results) => {
            if (results.errors.length > 0) {
                console.error("CSV Parsing errors:", results.errors);
                toast({
                  title: "CSV Preview Error",
                  description: `Could not parse preview: ${results.errors[0].message}`,
                  variant: "destructive",
                });
                setPreviewData(null);
            } else if (results.meta.fields && results.data.length > 0) {
                // Ensure data rows are objects matching ParsedCsvRow structure
                const validData = results.data.filter((row: unknown): row is ParsedCsvRow => typeof row === 'object' && row !== null);
                setPreviewData({ headers: results.meta.fields, rows: validData });
            } else {
                 setPreviewData(null); // Handle case with no data or no headers
            }
        },
        error: (error: Error) => {
             console.error("CSV Parsing failed:", error);
             toast({
                title: "CSV Preview Error",
                description: "Failed to parse CSV for preview.",
                variant: "destructive",
             });
             setPreviewData(null);
        }
    });
  };


  const handleFileUpload = useCallback((file: File, fileContent: string) => {
    setOriginalFile(file);
    setOriginalCsvData(fileContent);
    setCleanedCsvData(null); // Reset cleaned data on new upload
    setIsProcessing(false); // Reset processing state
    parsePreview(fileContent); // Parse and set preview data
    toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name}.`,
    });
  }, [toast]); // Removed parsePreview from dependencies as it's defined outside useCallback scope but used inside. If it relies on state/props, include them.

  const handleDeduplicate = async () => {
    if (!originalCsvData) {
      toast({
        title: "No Data",
        description: "Please upload a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCleanedCsvData(null);

    try {
       toast({
        title: "Processing Started",
        description: "Removing duplicate rows...",
      });
      const result = await deduplicateRows({ csvData: originalCsvData });
      setCleanedCsvData(result.cleanedCsvData);
      toast({
        title: "Processing Complete",
        description: "Duplicate rows removed successfully.",
      });
    } catch (error) {
      console.error("Error deduplicating rows:", error);
      toast({
        title: "Processing Error",
        description: "Failed to remove duplicate rows. Please try again.",
        variant: "destructive",
      });
      setCleanedCsvData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!cleanedCsvData || !originalFile) {
      toast({
          title: "No Cleaned Data",
          description: "Please process a file first.",
          variant: "destructive",
      });
      return;
    }

    const blob = new Blob([cleanedCsvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const originalFileName = originalFile.name.replace(/\.[^/.]+$/, "");
    link.setAttribute("download", `${originalFileName}_cleaned.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
     toast({
        title: "Download Started",
        description: `Downloading ${originalFileName}_cleaned.csv`,
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Upload your uncleaned CSV dataset, preview it, and then use the AI-powered tool to remove duplicate rows.
      </p>

      <FileUpload onFileUpload={handleFileUpload} disabled={isProcessing} />

      {previewData && (
          <>
              <Separator />
              <DataPreview
                headers={previewData.headers}
                rows={previewData.rows}
                title="Uncleaned Data Preview" // Provide specific title
              />
          </>
      )}

      <Separator />

      <div className="flex flex-col items-center space-y-4">
         <Button
          onClick={handleDeduplicate}
          disabled={isProcessing || !originalCsvData}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
         >
           {isProcessing ? (
              <>
               <LoadingSpinner className="mr-2" size={18} /> Processing...
              </>
            ) : (
               <>
                 <Trash2 className="mr-2 h-5 w-5" /> Remove Duplicates
               </>
            )}
         </Button>
      </div>


      {cleanedCsvData && (
        <>
           <Separator />
           <Card className="w-full">
              <CardHeader>
                  <CardTitle>Download Cleaned Data</CardTitle>
                  <CardDescription>Your dataset has been processed. Download the cleaned version.</CardDescription>
              </CardHeader>
               <CardContent className="flex justify-center">
                  <Button onClick={handleDownload} size="lg" variant="secondary">
                    <Download className="mr-2 h-5 w-5" />
                    Download Cleaned CSV
                  </Button>
              </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
