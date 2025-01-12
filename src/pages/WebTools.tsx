import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { WebMetricsForm } from "@/components/web-tools/WebMetricsForm";
import { MetricsDisplay } from "@/components/web-tools/MetricsDisplay";
import { ConsoleOutput } from "@/components/web-tools/ConsoleOutput";
import { MonitoringPanel } from "@/components/web-tools/MonitoringPanel";
import { useToast } from "@/components/ui/use-toast";
import { isValidUrl, analyzeWebsite, WebsiteMetrics } from "@/utils/websiteAnalyzer";

const WebTools = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<WebsiteMetrics[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Health check performed`]);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const handleAnalyze = async (url: string) => {
    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLogs([`[${new Date().toLocaleTimeString()}] Starting analysis of ${url}...`]);

    try {
      const results = await analyzeWebsite(url);
      setMetrics(results);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Analysis completed successfully`]);
      toast({
        title: "Analysis Complete",
        description: "Website metrics have been updated",
      });
    } catch (error) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${error}`]);
      toast({
        title: "Error",
        description: "Failed to analyze website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Web Development Tools</h1>
              <SidebarTrigger className="md:hidden" />
            </div>
            <div className="grid gap-6">
              <WebMetricsForm onAnalyze={handleAnalyze} isLoading={isLoading} />
              <MonitoringPanel 
                isMonitoring={isMonitoring} 
                onToggleMonitoring={() => setIsMonitoring(!isMonitoring)} 
              />
              <MetricsDisplay metrics={metrics} />
              <ConsoleOutput logs={logs} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WebTools;