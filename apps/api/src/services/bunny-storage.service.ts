import axios from 'axios';
import fs from 'fs';
import crypto from 'crypto';

export interface BunnyUploadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

export interface BunnyConfig {
  storageZoneName: string;
  accessKey: string;
  hostname: string;
  cdnUrl: string;
}

class BunnyStorageService {
  private config: BunnyConfig;

  constructor() {
    this.config = {
      storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || '',
      accessKey: process.env.BUNNY_STORAGE_ACCESS_KEY || '',
      hostname: process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com',
      cdnUrl: process.env.BUNNY_CDN_URL || ''
    };

    if (!this.config.storageZoneName || !this.config.accessKey || !this.config.cdnUrl) {
      console.warn('⚠️ Bunny.net configuration missing. Please set environment variables:');
      console.warn('   BUNNY_STORAGE_ZONE_NAME');
      console.warn('   BUNNY_STORAGE_ACCESS_KEY'); 
      console.warn('   BUNNY_CDN_URL');
    }
  }

  /**
   * Upload PDF buffer to Bunny.net storage with retry logic
   * @param pdfBuffer - PDF file buffer
   * @param fileName - Original file name
   * @param resumeId - Unique resume identifier
   * @param retries - Number of retry attempts (default: 3)
   * @returns Upload response with CDN URL
   */
  async uploadPDFWithRetry(pdfBuffer: Buffer, fileName: string, resumeId: string, retries: number = 3): Promise<BunnyUploadResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`📤 Bunny.net upload attempt ${attempt}/${retries} for: ${resumeId}`);
      
      const result = await this.uploadPDF(pdfBuffer, fileName, resumeId);
      
      if (result.success) {
        console.log(`✅ Bunny.net upload successful on attempt ${attempt}`);
        return result;
      }
      
      if (attempt < retries) {
        console.log(`⚠️ Attempt ${attempt} failed, retrying... Error: ${result.error}`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      } else {
        console.log(`❌ All ${retries} attempts failed for Bunny.net upload`);
      }
    }
    
    return {
      success: false,
      error: `Failed after ${retries} attempts`
    };
  }

  /**
   * Upload PDF buffer to Bunny.net storage
   * @param pdfBuffer - PDF file buffer
   * @param fileName - Original file name
   * @param resumeId - Unique resume identifier
   * @returns Upload response with CDN URL
   */
  async uploadPDF(pdfBuffer: Buffer, fileName: string, resumeId: string): Promise<BunnyUploadResponse> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Bunny.net storage not configured'
        };
      }

      // Generate unique file name with resume ID
      const fileExtension = fileName.endsWith('.pdf') ? '.pdf' : '.pdf';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `resumes/${resumeId}/${sanitizedFileName}`;

      // Upload to Bunny.net storage
      const uploadUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${uniqueFileName}`;
      
      console.log(`📤 Uploading to Bunny.net: ${uniqueFileName}`);
      console.log(`🔗 Upload URL: ${uploadUrl}`);
      console.log(`🔑 Access Key Length: ${this.config.accessKey.length}`);
      console.log(`📦 Buffer Size: ${pdfBuffer.length} bytes`);
      
      const response = await axios.put(uploadUrl, pdfBuffer, {
        headers: {
          'AccessKey': this.config.accessKey,
          'Content-Type': 'application/pdf'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.status === 200 || response.status === 201) {
        const cdnUrl = `${this.config.cdnUrl}/${uniqueFileName}`;
        
        console.log(`✅ PDF uploaded successfully to Bunny.net`);
        console.log(`🔗 CDN URL: ${cdnUrl}`);
        
        return {
          success: true,
          url: cdnUrl,
          fileName: uniqueFileName
        };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Bunny.net upload failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload PDF file from local path to Bunny.net
   * @param filePath - Local file path
   * @param resumeId - Unique resume identifier  
   * @returns Upload response with CDN URL
   */
  async uploadPDFFromFile(filePath: string, resumeId: string): Promise<BunnyUploadResponse> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      const pdfBuffer = fs.readFileSync(filePath);
      const fileName = filePath.split('/').pop() || `resume_${resumeId}.pdf`;
      
      return await this.uploadPDF(pdfBuffer, fileName, resumeId);

    } catch (error) {
      console.error('❌ Error reading file for upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File read error'
      };
    }
  }

  /**
   * Delete PDF from Bunny.net storage
   * @param fileName - File name in storage (e.g., "resumes/resume-123/file.pdf")
   * @returns Success status
   */
  async deletePDF(fileName: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('Bunny.net not configured, skipping delete');
        return false;
      }

      const deleteUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${fileName}`;
      
      console.log(`🗑️ Deleting from Bunny.net: ${fileName}`);
      
      const response = await axios.delete(deleteUrl, {
        headers: {
          'AccessKey': this.config.accessKey
        },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 404) {
        console.log(`✅ File deleted from Bunny.net: ${fileName}`);
        return true;
      } else {
        console.error(`❌ Delete failed with status: ${response.status}`);
        return false;
      }

    } catch (error) {
      console.error('❌ Bunny.net delete error:', error);
      return false;
    }
  }

  /**
   * Generate a direct download URL for a PDF
   * @param fileName - File name in storage
   * @returns Direct CDN URL
   */
  getDirectDownloadUrl(fileName: string): string {
    if (!this.isConfigured()) {
      return '';
    }
    
    return `${this.config.cdnUrl}/${fileName}`;
  }

  /**
   * Generate secure download URL with token (if needed)
   * @param fileName - File name in storage
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Secure download URL
   */
  getSecureDownloadUrl(fileName: string, expiresIn: number = 3600): string {
    // For basic implementation, return direct URL
    // You can implement token-based security if needed
    return this.getDirectDownloadUrl(fileName);
  }

  /**
   * Check if Bunny.net is properly configured
   * @returns Configuration status
   */
  isConfigured(): boolean {
    return !!(
      this.config.storageZoneName && 
      this.config.accessKey && 
      this.config.cdnUrl
    );
  }

  /**
   * Get storage statistics (if available)
   * @returns Storage usage info
   */
  async getStorageStats(): Promise<any> {
    try {
      if (!this.isConfigured()) {
        return { configured: false };
      }

      // Note: Bunny.net API for storage stats requires different endpoints
      // This is a placeholder for future implementation
      return {
        configured: true,
        storageZone: this.config.storageZoneName,
        cdnUrl: this.config.cdnUrl
      };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { configured: true, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test the connection to Bunny.net storage
   * @returns Connection test result
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Bunny.net storage not configured'
        };
      }

      // Test with a small test file
      const testBuffer = Buffer.from('Test file for Bunny.net connection');
      const testFileName = `test/connection_test_${Date.now()}.txt`;
      
      const uploadUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${testFileName}`;
      
      const response = await axios.put(uploadUrl, testBuffer, {
        headers: {
          'AccessKey': this.config.accessKey,
          'Content-Type': 'text/plain'
        },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 201) {
        // Clean up test file
        await this.deletePDF(testFileName);
        
        return {
          success: true,
          message: 'Bunny.net connection successful'
        };
      } else {
        return {
          success: false,
          message: `Connection test failed with status: ${response.status}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

export default new BunnyStorageService();
