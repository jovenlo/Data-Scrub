
"use client";

import type React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Import ScrollArea

// Define a type for the row data (assuming string values for simplicity)
export type ParsedCsvRow = Record<string, string>;

interface DataPreviewProps {
  headers: string[];
  rows: ParsedCsvRow[];
  maxHeight?: string; // Optional max height for the scroll area
  title?: string; // Optional title for the card
}

export function DataPreview({ headers, rows, maxHeight = '400px', title = "Data Preview" }: DataPreviewProps) {
  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return (
       <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>No data available for preview.</CardDescription>
          </CardHeader>
       </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Showing the header and the first {rows.length} rows of your uploaded dataset.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border" style={{ maxHeight }}>
          <Table>
             {/* <TableCaption>A preview of the first {rows.length} rows.</TableCaption> */}
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="font-semibold bg-muted/50 sticky top-0 z-10">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header) => (
                    <TableCell key={`${rowIndex}-${header}`} className="truncate max-w-[200px]" title={row[header]}>
                      {row[header] ?? ''} {/* Display empty string if value is null/undefined */}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
