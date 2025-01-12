import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsDisplay } from "@/components/web-tools/MetricsDisplay";
import { WebMetricsForm } from "@/components/web-tools/WebMetricsForm";
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
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(() => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Health check performed`]);
      }, 30000);
    }
    return () => clearInterval(interval);
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
    setLogs([`[${new Date().toLocaleTimeString()}] Starting comprehensive analysis of ${url}...`]);

    try {
      const results = await analyzeWebsite(url);
      setMetrics(results);
      setLogs(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] Analysis completed successfully`,
        `[${new Date().toLocaleTimeString()}] Found ${results.length} metrics`
      ]);
      toast({
        title: "Analysis Complete",
        description: "Website metrics have been updated",
      });
    } catch (error) {
      console.error(error);
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
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Web Development Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <WebMetricsForm onAnalyze={handleAnalyze} isLoading={isLoading} />
          {metrics.length > 0 && <MetricsDisplay metrics={metrics} />}
          <MonitoringPanel
            isMonitoring={isMonitoring}
            onToggleMonitoring={() => setIsMonitoring(!isMonitoring)}
          />
          <ConsoleOutput logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
};

export default WebTools;