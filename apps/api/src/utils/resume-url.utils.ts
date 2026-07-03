/**
 * Resume URL utilities for consistent Bunny.net URL handling
 */

export class ResumeUrlUtils {
  
  /**
   * Get the primary download URL, prioritizing Bunny.net cloud URL
   * @param cloudUrl - Bunny.net CDN URL
   * @param resumeId - Resume ID for fallback URL
   * @param apiType - API type for fallback ('ai-resume-builder' or 'generated-resume')
   * @returns The best available download URL
   */
  static getPrimaryDownloadUrl(
    cloudUrl: string | null | undefined, 
    resumeId: string, 
    apiType: 'ai-resume-builder' | 'generated-resume' = 'generated-resume'
  ): string {
    // Prioritize Bunny.net cloud URL
    if (cloudUrl && cloudUrl.startsWith('https://campuspe-resumes-cdn-v2.b-cdn.net/')) {
      return cloudUrl;
    }
    
    // Fallback to API endpoint
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
    return `${apiBaseUrl}/api/${apiType}/download-public/${resumeId}`;
  }
  
  /**
   * Validate if URL is a Bunny.net CDN URL
   * @param url - URL to validate
   * @returns True if it's a valid Bunny.net CDN URL
   */
  static isBunnyNetUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('https://campuspe-resumes-cdn-v2.b-cdn.net/resumes/');
  }
  
  /**
   * Generate the expected Bunny.net URL pattern
   * @param resumeId - Resume ID
   * @param fileName - File name
   * @returns Expected Bunny.net URL
   */
  static generateExpectedBunnyUrl(resumeId: string, fileName: string): string {
    const cdnBaseUrl = process.env.BUNNY_CDN_URL || 'https://campuspe-resumes-cdn-v2.b-cdn.net/';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${cdnBaseUrl}resumes/${resumeId}/${sanitizedFileName}`;
  }
  
  /**
   * Check if the resume URL is using the new Bunny.net format
   * @param url - URL to check
   * @returns True if using the correct format
   */
  static isCorrectFormat(url: string | null | undefined): boolean {
    if (!url) return false;
    
    // Check for Bunny.net CDN format
    if (this.isBunnyNetUrl(url)) {
      return true;
    }
    
    // Check for API download endpoint (acceptable fallback)
    const apiPattern = /\/api\/(ai-resume-builder|generated-resume)\/download-public\//;
    return apiPattern.test(url);
  }
  
  /**
   * Log URL usage for monitoring
   * @param resumeId - Resume ID
   * @param url - URL being used
   * @param context - Context where URL is used
   */
  static logUrlUsage(resumeId: string, url: string, context: string): void {
    const isBunnyNet = this.isBunnyNetUrl(url);
    const status = isBunnyNet ? '✅ BUNNY.NET' : '⚠️ FALLBACK';
    console.log(`📊 [URL USAGE] ${status} | ${context} | Resume: ${resumeId} | URL: ${url}`);
  }
}
