/**
 * Enhanced Resume Download Handler
 * 
 * This script improves the resume download experience by:
 * 1. Prioritizing cloud-hosted URLs for faster downloads
 * 2. Falling back to API endpoint URLs if cloud hosting isn't available
 * 3. Adding download status indicators and error handling
 * 
 * Add this script to your frontend codebase and call handleResumeDownload()
 * from your download buttons.
 */

/**
 * Handle resume download with enhanced cloud URL support
 * @param {Object} resumeData - The resume data from the API
 * @param {string} resumeData.cloudUrl - The BunnyCDN cloud URL (if available)
 * @param {string} resumeData.downloadUrl - The fallback API download URL
 * @param {string} resumeData.resumeId - The unique resume ID
 * @param {string} resumeData.jobTitle - The job title for the resume
 */
function handleResumeDownload(resumeData) {
  // Show download status
  const statusElement = document.getElementById('download-status');
  if (statusElement) {
    statusElement.textContent = 'Starting download...';
    statusElement.className = 'status-downloading';
  }
  
  console.log('Download requested for resume:', resumeData.resumeId);
  
  // Determine best download URL
  const downloadUrl = resumeData.cloudUrl || resumeData.downloadUrl;
  const isCloudUrl = !!resumeData.cloudUrl;
  
  console.log(`Using ${isCloudUrl ? 'cloud' : 'API'} URL for download:`, downloadUrl);
  
  if (!downloadUrl) {
    console.error('No download URL available');
    if (statusElement) {
      statusElement.textContent = 'Download failed: No URL available';
      statusElement.className = 'status-error';
    }
    return;
  }
  
  // Create hidden download link
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.target = '_blank';
  link.download = `${resumeData.jobTitle || 'Resume'}_${resumeData.resumeId}.pdf`;
  
  // Track download status
  link.onclick = () => {
    if (statusElement) {
      statusElement.textContent = 'Download started...';
    }
    
    // For API URLs, we can't easily track completion
    // For cloud URLs, we can assume faster completion
    setTimeout(() => {
      if (statusElement) {
        statusElement.textContent = 'Download complete';
        statusElement.className = 'status-complete';
        
        // Reset status after a delay
        setTimeout(() => {
          statusElement.textContent = '';
          statusElement.className = '';
        }, 3000);
      }
    }, isCloudUrl ? 1500 : 3000); // Assume cloud downloads are faster
  };
  
  // Start download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Handle resume sharing via WhatsApp
 * @param {Object} resumeData - The resume data from the API
 */
function handleWhatsAppShare(resumeData) {
  // Determine best URL to share (prefer cloud URL)
  const shareUrl = resumeData.cloudUrl || resumeData.downloadUrl;
  
  if (!shareUrl) {
    console.error('No URL available for sharing');
    return;
  }
  
  const message = encodeURIComponent(
    `📄 Check out my resume for ${resumeData.jobTitle || 'this position'}!\n\n` +
    `📥 Download: ${shareUrl}`
  );
  
  // Open WhatsApp sharing
  window.open(`https://wa.me/?text=${message}`, '_blank');
}

// Export functions for use in React, Vue, or other frameworks
if (typeof module !== 'undefined') {
  module.exports = {
    handleResumeDownload,
    handleWhatsAppShare
  };
}
