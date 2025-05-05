
// src/app/dashboard/visualization/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, BarChartHorizontalBig, PieChart as PieChartIcon } from "lucide-react"; // Use relevant icons

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-3/4 mb-4" /> {/* Placeholder for description */}

      {/* File Upload Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-4 p-6 border-2 border-dashed border-border rounded-lg bg-secondary/50">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </CardContent>
      </Card>

      <Separator />

       {/* Dashboard Skeleton */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
           {/* KPI Card Skeletons */}
           {[...Array(4)].map((_, index) => (
                <Card key={`kpi-${index}`}>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <Skeleton className="h-4 w-3/5" />
                     <Skeleton className="h-4 w-4 rounded" />
                   </CardHeader>
                   <CardContent>
                     <Skeleton className="h-8 w-1/2 mb-1" />
                     <Skeleton className="h-3 w-4/5" />
                   </CardContent>
                </Card>
           ))}

           {/* Chart Skeletons (adjust col-span as needed) */}
            <Card className="md:col-span-2">
                <CardHeader>
                  <Skeleton className="h-5 w-2/5 mb-1" />
                  <Skeleton className="h-4 w-4/5" />
                </CardHeader>
                <CardContent className="pt-4">
                     <Skeleton className="h-[300px] w-full" />
                 </CardContent>
             </Card>
             <Card className="md:col-span-2">
                <CardHeader>
                  <Skeleton className="h-5 w-1/3 mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="pt-4 flex items-center justify-center">
                     <Skeleton className="h-[250px] w-[250px] rounded-full" /> {/* Pie chart shape */}
                 </CardContent>
             </Card>

              {/* Placeholder Text/Definition Card Skeleton */}
              <Card className="md:col-span-2">
                 <CardHeader>
                    <Skeleton className="h-5 w-1/4" />
                 </CardHeader>
                 <CardContent className="space-y-2">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-3/4" />
                 </CardContent>
              </Card>

              {/* Placeholder Bar Chart Skeletons */}
              <Card className="md:col-span-2">
                 <CardHeader>
                    <Skeleton className="h-5 w-2/5 mb-1" />
                    <Skeleton className="h-4 w-4/5" />
                 </CardHeader>
                 <CardContent className="pt-4">
                     <Skeleton className="h-[300px] w-full" />
                 </CardContent>
              </Card>
               <Card className="md:col-span-2">
                 <CardHeader>
                     <Skeleton className="h-5 w-2/5 mb-1" />
                     <Skeleton className="h-4 w-4/5" />
                 </CardHeader>
                 <CardContent className="pt-4">
                     <Skeleton className="h-[300px] w-full" />
                 </CardContent>
              </Card>
       </div>
    </div>
  );
}

    