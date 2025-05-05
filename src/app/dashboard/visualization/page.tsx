"use client";

import type React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DataPreview, type ParsedCsvRow } from '@/components/DataPreview';
import { Separator } from '@/components/ui/separator';
import { generateDataReport } from '@/ai/flows/generate-data-report';
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';
import { ArrowUp, ArrowDown, Users, BarChartHorizontalBig, PieChart as PieChartIcon, FileText, Download, Image as ImageIcon, RefreshCw } from 'lucide-react'; // Added Icons
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown'; // Added for safe markdown rendering

// Import ShadCN Chart Components
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart as RechartsBarChart, // Alias Recharts components
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip as RechartsTooltip, // Import Recharts Tooltip if needed for customization beyond ShadCN's
  LabelList, // For labels on bars/pies
} from "recharts";

// Define a type for parsed data suitable for charts
type ChartData = Record<string, string | number>;

// Define distinct colors for charts (using HSL strings from globals.css or similar)
const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(190 67% 93%)', // secondary
    'hsl(174 100% 29%)', // primary
];

// Helper function to calculate basic stats (can be expanded)
const calculateStats = (data: ChartData[] | null) => {
    if (!data || data.length === 0) {
        return {
            totalRows: 0,
            averageFirstNumeric: null,
            firstCategoryCounts: {},
            firstNumericColumn: null,
            firstCategoryColumn: null,
        };
    }

    const headers = Object.keys(data[0]);
    const firstNumericColumn = headers.find(h => typeof data[0][h] === 'number');
    const firstCategoryColumn = headers.find(h => typeof data[0][h] === 'string');

    let sum = 0;
    let count = 0;
    const categoryCounts: Record<string, number> = {};

    data.forEach(row => {
        if (firstNumericColumn && typeof row[firstNumericColumn] === 'number') {
            sum += row[firstNumericColumn] as number;
            count++;
        }
        if (firstCategoryColumn && typeof row[firstCategoryColumn] === 'string') {
            const category = row[firstCategoryColumn] as string;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
    });

    // Prepare data for pie chart (top 5 categories + Other)
    const sortedCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a);
    const topCategories = sortedCategories.slice(0, 5);
    const otherCount = sortedCategories.slice(5).reduce((acc, [, count]) => acc + count, 0);
    const pieChartData = topCategories.map(([name, value]) => ({ name, value }));
    if (otherCount > 0) {
        pieChartData.push({ name: 'Other', value: otherCount });
    }


    return {
        totalRows: data.length,
        averageFirstNumeric: count > 0 ? (sum / count).toFixed(2) : null,
        firstCategoryCounts: pieChartData, // Use pie chart data format
        firstNumericColumn,
        firstCategoryColumn,
    };
};


export default function VisualizationPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvDataString, setCsvDataString] = useState<string | null>(null);
  const [parsedChartData, setParsedChartData] = useState<ChartData[] | null>(null);
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: ParsedCsvRow[] } | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false); // State for parsing
  const [isDownloading, setIsDownloading] = useState<boolean>(false); // State for downloading
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null); // Ref for the report container

  // Calculate stats memoized
  const stats = useMemo(() => calculateStats(parsedChartData), [parsedChartData]);

  // Parse CSV for preview
  const parsePreview = useCallback((csvString: string) => {
    Papa.parse(csvString, {
      header: true,
      preview: 10,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV Preview errors:", results.errors);
          toast({ title: "CSV Preview Error", description: `Could not parse preview: ${results.errors[0].message}`, variant: "destructive" });
          setPreviewData(null);
        } else if (results.meta.fields && results.data.length > 0) {
          const validData = results.data.filter((row: unknown): row is ParsedCsvRow => typeof row === 'object' && row !== null);
          if (validData.length > 0) {
             setPreviewData({ headers: results.meta.fields, rows: validData });
          } else {
             setPreviewData(null);
          }
        } else {
          setPreviewData(null);
        }
      },
      error: (error: Error) => {
        console.error("CSV Preview failed:", error);
        toast({ title: "CSV Preview Error", description: "Failed to parse CSV for preview.", variant: "destructive" });
        setPreviewData(null);
      }
    });
  }, [toast]);

  // Parse CSV for chart data
 const parseForCharts = useCallback((csvString: string): ChartData[] | null => {
    let data: ChartData[] = [];
    let errorOccurred = false;
    let parseErrors: Papa.ParseError[] = [];

    Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Process types manually
      complete: (results) => {
        if (results.errors.length > 0) {
            parseErrors = results.errors;
            errorOccurred = true;
            console.warn("CSV Chart Parsing errors detected:", parseErrors); // Log errors
        }

        if (results.data.length > 0) {
          data = results.data.map(row => {
            const processedRow: ChartData = {};
            for (const key in row) {
                // Only process own properties and non-empty keys
                if (Object.prototype.hasOwnProperty.call(row, key) && key && key.trim() !== '') {
                    const value = row[key];
                    // Skip null or undefined values entirely
                    if (value === null || value === undefined) continue;

                    const trimmedValue = String(value).trim();
                    // Skip empty string values
                    if (trimmedValue === '') continue;

                    // Attempt to parse as number if it looks like one
                    if (!isNaN(parseFloat(trimmedValue)) && isFinite(parseFloat(trimmedValue))) {
                       processedRow[key.trim()] = parseFloat(trimmedValue);
                    } else {
                       processedRow[key.trim()] = trimmedValue; // Keep as string otherwise
                    }
              }
            }
            // Only return rows that have at least one property after processing
            return Object.keys(processedRow).length > 0 ? processedRow : null;
          }).filter(row => row !== null) as ChartData[]; // Filter out null rows
        }

        if (data.length === 0 && !errorOccurred) {
             toast({ title: "Data Parsing Info", description: "CSV parsed, but no valid data rows found for charts.", variant: "default" });
             // Don't set errorOccurred true here, it's just empty data
        } else if (errorOccurred) {
             toast({
               title: "CSV Parsing Warning",
               description: `Some rows encountered errors during parsing: ${parseErrors[0].message}. Chart data might be incomplete.`,
               variant: "default",
               duration: 7000,
             });
        }
      },
      error: (error: Error) => {
        console.error("CSV Chart Parsing failed:", error);
        toast({ title: "CSV Parsing Error", description: `Failed to parse CSV data for charts: ${error.message}`, variant: "destructive" });
        errorOccurred = true;
      }
    });
    // Return null only if a hard error occurred AND no data was parsed
    return errorOccurred && data.length === 0 ? null : data;
  }, [toast]);


  const handleFileUpload = useCallback(async (file: File, fileContent: string) => {
    setIsParsing(true);
    setUploadedFile(file);
    setCsvDataString(fileContent);
    setParsedChartData(null);
    setPreviewData(null);
    setReportMarkdown(null); // Reset report on new upload

    // Parse preview immediately
    parsePreview(fileContent);

    // Simulate async parsing for charts (though PapaParse is sync, this helps show loading)
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay

    const chartData = parseForCharts(fileContent);
    setParsedChartData(chartData);

    setIsParsing(false);

    toast({
      title: "File Uploaded",
      description: `Successfully uploaded ${file.name}. You can now generate a report or view the dashboard.`,
      // Base variant on whether *any* chart data was parsed, even if there were warnings
      variant: chartData !== null ? "default" : "destructive",
    });
  }, [toast, parsePreview, parseForCharts]);

  // Handle generating the data report
  const handleGenerateReport = async () => {
    if (!csvDataString) {
        toast({
            title: "No Data",
            description: "Please upload a CSV file first.",
            variant: "destructive",
        });
        return;
    }

    setIsGeneratingReport(true);
    setReportMarkdown(null); // Clear previous report

    try {
        toast({
            title: "Report Generation Started",
            description: "Generating data report...",
        });
        const result = await generateDataReport({ csvData: csvDataString });
        setReportMarkdown(result.report);
        toast({
            title: "Report Generation Complete",
            description: "Data report generated successfully.",
        });
    } catch (error) {
        console.error("Error generating data report:", error);
        toast({
            title: "Report Generation Error",
            description: "Failed to generate data report. Please try again.",
            variant: "destructive",
        });
        setReportMarkdown("Error generating report."); // Show error message in report area
    } finally {
        setIsGeneratingReport(false);
    }
  };

  // Handle downloading the report as an image
   const handleDownloadReportImage = useCallback(async () => {
    if (!reportRef.current || !reportMarkdown) {
      toast({
        title: "No Report",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }
    setIsDownloading(true); // Set downloading state
    toast({
        title: "Preparing Download",
        description: "Generating report image...",
    });

    try {
      // Ensure the ref is correctly attached to a DOM element
      if (reportRef.current === null) {
        throw new Error("Report container is not available.");
      }

      // Check for dark mode to set appropriate background color for canvas
      const isDarkMode = document.documentElement.classList.contains('dark');
      const backgroundColor = isDarkMode ? '#111827' : '#ffffff'; // Dark gray for dark, white for light

      const canvas = await html2canvas(reportRef.current, {
        useCORS: true, // If report includes external images/styles
        backgroundColor: backgroundColor, // Use simple hex color code
        scale: 2, // Increase resolution
        logging: true, // Enable html2canvas logging for debugging
        onclone: (clonedDoc) => {
           // You can potentially modify the cloned document here if needed
           // e.g., force certain styles before capture
        }
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');

      const fileName = uploadedFile?.name.replace(/\.[^/.]+$/, "") || "data_report";
      link.download = `${fileName}_report.png`;
      link.href = image;
      document.body.appendChild(link); // Append link to body
      link.click();
      document.body.removeChild(link); // Clean up link
       toast({
        title: "Download Started",
        description: "Report image download initiated.",
      });
    } catch (error: any) {
      console.error("Error generating report image:", error);
      toast({
        title: "Download Error",
        description: `Failed to generate report image: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
        setIsDownloading(false); // Reset downloading state
    }
   }, [reportMarkdown, toast, uploadedFile]); // Added uploadedFile dependency

  // Tooltip renderer
  const renderTooltipContent = (props: any) => {
      if (!props.payload || props.payload.length === 0) return null;
      // Custom tooltip to handle potential null/undefined values better
      const { payload } = props;
      const firstPayload = payload[0]?.payload; // Access the underlying data object

      if (!firstPayload) return null;

      const label = props.label ?? firstPayload.name ?? 'Category'; // Determine label based on chart type or context
      const value = payload[0]?.value; // Get the value being hovered

      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm text-foreground text-xs">
          <div className="font-medium mb-1">{label}</div>
           {payload.map((entry: any, index: number) => (
             <div key={`item-${index}`} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
                <span>{entry.name}:</span>
                <span className="ml-auto font-medium">
                  {entry.value !== null && entry.value !== undefined ? entry.value.toLocaleString() : 'N/A'}
                </span>
            </div>
           ))}
        </div>
      );
      // Original simple tooltip:
      // return <ChartTooltipContent {...props} hideLabel={false} />;
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Upload your CSV dataset to generate a data report or view an interactive dashboard.
      </p>

       <div className="flex flex-col sm:flex-row gap-4">
           <FileUpload onFileUpload={handleFileUpload} disabled={isParsing || isGeneratingReport || isDownloading} />
            <div className="flex flex-col gap-2 sm:w-1/4">
                 <Button
                   onClick={handleGenerateReport}
                   disabled={!uploadedFile || isGeneratingReport || isParsing || isDownloading}
                   className="w-full"
                 >
                   {isGeneratingReport ? (
                     <>
                       <LoadingSpinner className="mr-2" size={16} /> Generating Report...
                     </>
                   ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" /> Generate Report
                      </>
                   )}
                 </Button>
                <Button
                  variant="secondary"
                  onClick={handleDownloadReportImage}
                  disabled={!reportMarkdown || isGeneratingReport || isDownloading}
                  className="w-full"
                >
                   {isDownloading ? (
                       <>
                           <LoadingSpinner className="mr-2" size={16} /> Downloading...
                       </>
                   ) : (
                       <>
                           <ImageIcon className="mr-2 h-4 w-4" /> Download Report Image
                       </>
                   )}
                </Button>
           </div>
       </div>

       {(isParsing || isGeneratingReport || isDownloading) && (
           <div className="flex justify-center items-center py-4">
               <LoadingSpinner />
               <span className="ml-2 text-muted-foreground">
                   {isParsing ? 'Parsing data...' : isGeneratingReport ? 'Generating report...' : 'Downloading image...'}
                </span>
           </div>
       )}


      {previewData && !isParsing && !isGeneratingReport && !isDownloading && (
        <>
          <Separator />
          <DataPreview
             headers={previewData.headers}
             rows={previewData.rows}
             title="Uploaded Data Preview"
             maxHeight="300px"
          />
        </>
      )}

      {/* Display the generated report */}
      {reportMarkdown && !isGeneratingReport && !isDownloading && (
         <>
           <Separator />
           {/* Add overflow-hidden to Card for better html2canvas capture */}
           <Card ref={reportRef} className="prose dark:prose-invert max-w-none p-6 border shadow-md overflow-hidden">
              <CardHeader className="p-0 pb-4 mb-4 border-b">
                <CardTitle className="text-2xl">Generated Data Report</CardTitle>
                <CardDescription>Summary and analysis of the uploaded dataset.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                 {/* Use ReactMarkdown for safe rendering */}
                 <ReactMarkdown
                    className="prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none"
                    components={{
                        // Customize rendering if needed, e.g., for tables:
                        table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="table-auto w-full text-sm border-collapse border border-border" {...props} /></div>,
                        thead: ({node, ...props}) => <thead className="bg-muted/50" {...props} />,
                        th: ({node, ...props}) => <th className="border border-border px-3 py-2 text-left font-medium whitespace-nowrap" {...props} />,
                        td: ({node, ...props}) => <td className="border border-border px-3 py-2 align-top" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-xl font-semibold mt-6 mb-3 border-b pb-1" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-5 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        code: ({node, inline, className, children, ...props}) => {
                           const match = /language-(\w+)/.exec(className || '')
                           // Ensure code blocks have background for capture
                           return !inline ? (
                             <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm my-3 text-foreground"><code className={className} {...props}>{children}</code></pre>
                           ) : (
                             <code className="bg-muted/80 px-1 py-0.5 rounded text-sm font-mono text-foreground" {...props}>{children}</code>
                           )
                         },
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props} />,
                    }}
                 >
                   {reportMarkdown}
                 </ReactMarkdown>
              </CardContent>
           </Card>
         </>
      )}


      {/* Display the dashboard if data is parsed AND no report is being shown/generated/downloaded */}
      {!isParsing && !isGeneratingReport && !isDownloading && !reportMarkdown && parsedChartData && (
        <>
          <Separator />
          <Card>
              <CardHeader>
                  <CardTitle>Interactive Dashboard</CardTitle>
                  <CardDescription>Visual overview of the key metrics from your data.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                   {/* KPI Cards */}
                   <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                       <FileText className="h-4 w-4 text-muted-foreground" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold">{stats.totalRows.toLocaleString()}</div>
                       <p className="text-xs text-muted-foreground">Total rows in the dataset</p>
                     </CardContent>
                   </Card>

                   <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">{stats.firstNumericColumn ? `Avg ${stats.firstNumericColumn}` : 'Avg Value'}</CardTitle>
                       <BarChartHorizontalBig className="h-4 w-4 text-muted-foreground" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold">{stats.averageFirstNumeric ?? 'N/A'}</div>
                       <p className="text-xs text-muted-foreground truncate">
                          {stats.firstNumericColumn ? `Average of '${stats.firstNumericColumn}'` : 'No numeric column found'}
                       </p>
                     </CardContent>
                   </Card>

                   <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Placeholder KPI 1</CardTitle>
                       <ArrowUp className="h-4 w-4 text-green-500" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold">+15%</div>
                       <p className="text-xs text-muted-foreground">Compared to last period</p>
                     </CardContent>
                   </Card>

                   <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Placeholder KPI 2</CardTitle>
                       <ArrowDown className="h-4 w-4 text-red-500" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold">-5%</div>
                       <p className="text-xs text-muted-foreground">Compared to last period</p>
                     </CardContent>
                   </Card>

                   {/* Charts - Span across columns */}
                   {/* Bar Chart Example (using category counts) */}
                   {stats.firstCategoryColumn && stats.firstCategoryCounts && Array.isArray(stats.firstCategoryCounts) && stats.firstCategoryCounts.length > 0 && (
                       <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
                           <CardHeader>
                               <CardTitle className="truncate">Distribution by {stats.firstCategoryColumn}</CardTitle>
                               <CardDescription>Count per category (Top 5 + Other)</CardDescription>
                           </CardHeader>
                           <CardContent className="pl-2">
                               <ChartContainer config={{
                                    value: { label: 'Count' },
                                    name: { label: stats.firstCategoryColumn }
                                  }} className="h-[300px] w-full">
                                   <RechartsBarChart
                                      data={stats.firstCategoryCounts}
                                      layout="vertical"
                                      margin={{ left: 30, right: 30 }} // Add more right margin for labels
                                      barCategoryGap={10} // Add gap between bars
                                   >
                                       <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                       <XAxis type="number" hide />
                                       <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} interval={0} tick={{ transform: 'translate(0, 0)' }} />
                                        <RechartsTooltip content={renderTooltipContent} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}/>
                                       <Bar dataKey="value" fill="hsl(var(--primary))" radius={4}>
                                           <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={10} formatter={(value: number) => value.toLocaleString()}/>
                                       </Bar>
                                   </RechartsBarChart>
                               </ChartContainer>
                           </CardContent>
                       </Card>
                   )}

                  {/* Pie Chart Example (using category counts) */}
                   {stats.firstCategoryColumn && stats.firstCategoryCounts && Array.isArray(stats.firstCategoryCounts) && stats.firstCategoryCounts.length > 0 && (
                       <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
                           <CardHeader>
                               <CardTitle className="truncate">Proportion ({stats.firstCategoryColumn})</CardTitle>
                               <CardDescription>Category proportion (Top 5 + Other)</CardDescription>
                           </CardHeader>
                           <CardContent className="flex items-center justify-center [&>div]:h-[300px]">
                               <ChartContainer config={{
                                     value: { label: 'Count' },
                                     name: { label: stats.firstCategoryColumn }
                                   }} className="mx-auto aspect-square h-full">
                                 <RechartsPieChart>
                                   <RechartsTooltip content={renderTooltipContent} />
                                   <Pie data={stats.firstCategoryCounts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2} >
                                      {stats.firstCategoryCounts?.map((entry, idx) => (
                                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} stroke={'hsl(var(--background))'} strokeWidth={1} />
                                      ))}
                                      <LabelList
                                          dataKey="value"
                                          className="fill-background dark:fill-foreground"
                                          stroke="none"
                                          fontSize={10}
                                          formatter={(value: number) => value.toLocaleString()} // Format value
                                      />
                                   </Pie>
                                   <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
                                 </RechartsPieChart>
                               </ChartContainer>
                           </CardContent>
                       </Card>
                   )}


                   {/* Placeholder Text/Definition Card */}
                    <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
                     <CardHeader>
                       <CardTitle>Definitions</CardTitle>
                     </CardHeader>
                     <CardContent className="text-sm space-y-2">
                       <p><strong>KPI 1:</strong> Placeholder description for the first Key Performance Indicator.</p>
                       <p><strong>KPI 2:</strong> Placeholder description for the second Key Performance Indicator.</p>
                       <p><strong>Dataset Notes:</strong> This dashboard provides a basic overview based on the uploaded CSV.</p>
                     </CardContent>
                   </Card>

                   {/* Placeholder Bar Chart 1 */}
                    <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
                       <CardHeader>
                           <CardTitle>Placeholder Bar Chart 1</CardTitle>
                           <CardDescription>Example visualization over time/categories.</CardDescription>
                       </CardHeader>
                       <CardContent className="pl-2">
                            <ChartContainer config={{value: {label: 'Value'}, category: {label: 'Category'}}} className="h-[300px] w-full">
                                 {/* Placeholder content or a simple message */}
                                 <div className="flex items-center justify-center h-full text-muted-foreground">Bar Chart Placeholder</div>
                                 {/* Replace above div with actual Recharts Bar Chart if data exists */}
                           </ChartContainer>
                       </CardContent>
                   </Card>

                   {/* Placeholder Bar Chart 2 */}
                   <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
                       <CardHeader>
                           <CardTitle>Placeholder Bar Chart 2</CardTitle>
                           <CardDescription>Another example visualization.</CardDescription>
                       </CardHeader>
                       <CardContent className="pl-2">
                            <ChartContainer config={{value: {label: 'Value'}, category: {label: 'Category'}}} className="h-[300px] w-full">
                                 {/* Placeholder content or a simple message */}
                                 <div className="flex items-center justify-center h-full text-muted-foreground">Bar Chart Placeholder</div>
                                 {/* Replace above div with actual Recharts Bar Chart if data exists */}
                           </ChartContainer>
                       </CardContent>
                   </Card>
                </div>
              </CardContent>
          </Card>
        </>
      )}

       {/* Show message if file uploaded but parsing failed and no report */}
       {uploadedFile && !isParsing && !isGeneratingReport && !isDownloading && !reportMarkdown && !parsedChartData && (
         <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Error Displaying Dashboard</CardTitle>
              <CardDescription>Could not parse the data for dashboard display. Please check the CSV file format or content. You can still try generating a report.</CardDescription>
            </CardHeader>
          </Card>
        </>
       )}

       {/* Initial state message */}
       {!uploadedFile && !isParsing && !isGeneratingReport && !isDownloading && (
          <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
            Upload a CSV file to generate a report or view the dashboard.
          </div>
       )}

    </div>
  );
}
