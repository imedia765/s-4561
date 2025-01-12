export interface WebsiteMetrics {
  metric: string;
  value: string;
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const analyzeWebsite = async (url: string): Promise<WebsiteMetrics[]> => {
  const startTime = performance.now();
  
  try {
    // Fetch the website
    const response = await fetch(url);
    const html = await response.text();
    
    // Calculate load time
    const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
    
    // Basic metrics
    const metrics: WebsiteMetrics[] = [
      { metric: "Page Load Time", value: `${loadTime}s` },
      { metric: "Page Size", value: `${(html.length / 1024).toFixed(2)}KB` },
      { metric: "HTTPS", value: url.startsWith("https") ? "Yes" : "No" },
    ];
    
    // Parse HTML for additional metrics
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Meta description
    const metaDesc = doc.querySelector('meta[name="description"]');
    metrics.push({ 
      metric: "Meta Description", 
      value: metaDesc ? "Present" : "Missing" 
    });
    
    // H1 tag
    const h1 = doc.querySelector('h1');
    metrics.push({ 
      metric: "H1 Tag", 
      value: h1 ? "Present" : "Missing" 
    });
    
    // Image alt tags
    const images = doc.querySelectorAll('img');
    const imagesWithAlt = Array.from(images).filter(img => img.hasAttribute('alt'));
    metrics.push({ 
      metric: "Image Alt Tags", 
      value: imagesWithAlt.length === images.length ? "All Present" : 
             imagesWithAlt.length > 0 ? "Partially Present" : "Missing"
    });
    
    return metrics;
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw new Error('Failed to analyze website');
  }
};