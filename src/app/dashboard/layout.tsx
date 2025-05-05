
"use client"; // Add this directive

import type React from 'react';
import Link from 'next/link'; // Import Link
import { usePathname } from 'next/navigation'; // Import usePathname
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { FileInput, BarChartBig } from 'lucide-react'; // Import BarChartBig icon

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current pathname to determine active state
  // Note: This hook only works in Client Components.
  // The Sidebar components themselves are client components, so this is okay.
  // However, if this layout itself needed to be purely Server Component,
  // we'd need a different approach (like passing props down).
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary">
                <path fillRule="evenodd" d="M2.25 4.5A.75.75 0 0 1 3 3.75h14.25a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm0 4.5A.75.75 0 0 1 3 8.25h9.75a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 2.25 9Zm15-.75A.75.75 0 0 1 18 9v10.19l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0l-3.75-3.75a.75.75 0 1 1 1.06-1.06l2.47 2.47V9a.75.75 0 0 1 .75-.75Zm-15 5.25a.75.75 0 0 1 .75-.75h9.75a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
             </svg>
             <span className="font-semibold text-lg">Data Scrub</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              {/* Remove legacyBehavior and asChild */}
              <Link href="/dashboard" passHref>
                <SidebarMenuButton isActive={pathname === '/dashboard'}>
                  <FileInput />
                  <span>Data Cleaning</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {/* Remove legacyBehavior and asChild */}
              <Link href="/dashboard/visualization" passHref>
                <SidebarMenuButton isActive={pathname === '/dashboard/visualization'}>
                  <BarChartBig />
                  <span>Data Visualization</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        {/* <SidebarFooter>Optional Footer</SidebarFooter> */}
      </Sidebar>
      <SidebarInset>
         <header className="flex items-center justify-between p-4 border-b bg-background md:justify-start">
             <SidebarTrigger className="md:hidden"/> {/* Mobile trigger */}
            <h2 className="text-xl font-semibold ml-4 md:ml-0">
              {pathname === '/dashboard/visualization' ? 'Data Visualization' : 'Data Cleaning Dashboard'}
            </h2>
         </header>
         <main className="p-4 md:p-6 lg:p-8">
           {children}
         </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

