
import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LazyExport, LazyAuth, LazyHowTo } from "./components/LazyComponents";
import { Skeleton } from "@/components/ui/skeleton";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageSkeleton = () => (
  <div className="min-h-screen p-4">
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  </div>
);

const App = () => (
  <EnhancedErrorBoundary level="critical">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <EnhancedErrorBoundary level="page">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <LazyAuth />
                  </Suspense>
                } />
                <Route path="/how-to" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <LazyHowTo />
                  </Suspense>
                } />
                <Route path="/export" element={
                  <Suspense fallback={<PageSkeleton />}>
                    <LazyExport />
                  </Suspense>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </EnhancedErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </EnhancedErrorBoundary>
);

export default App;
