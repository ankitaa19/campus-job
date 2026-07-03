/**
 * Improved Bunny.net Storage Service with proper authentication
 */

import axios from 'axios';
import fs from 'fs';

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

class ImprovedBunnyStorageService {
  private config: BunnyConfig;

  constructor() {
    this.config = {
      storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || '',
      accessKey: process.env.BUNNY_STORAGE_ACCESS_KEY || '',
      hostname: process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com',
      cdnUrl: process.env.BUNNY_CDN_URL || ''
    };

    console.log('🔧 Bunny.net Configuration:');
    console.log(`   Zone: ${this.config.storageZoneName}`);
    console.log(`   Hostname: ${this.config.hostname}`);
    console.log(`   CDN URL: ${this.config.cdnUrl}`);
    console.log(`   Access Key: ${this.config.accessKey ? '[SET]' : '[MISSING]'}`);
  }

  /**
   * Test connection to Bunny.net
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Bunny.net not configured properly'
        };
      }

      // Try to list files in the storage zone (this tests authentication)
      const listUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/`;
      
      console.log('🔍 Testing connection to:', listUrl);
      
      const response = await axios.get(listUrl, {
        headers: {
          'AccessKey': this.config.accessKey
        },
        timeout: 10000
      });

      if (response.status === 200) {
        return {
          success: true,
          message: 'Connection successful'
        };
      } else {
        return {
          success: false,
          message: `Unexpected status: ${response.status}`
        };
      }

    } catch (error: any) {
      console.error('❌ Connection test failed:', error.message);
      return {
        success: false,
        message: `Connection failed: ${error.message} (Status: ${error.response?.status})`
      };
    }
  }

  /**
   * Upload PDF to Bunny.net with improved error handling
   */
  async uploadPDF(pdfBuffer: Buffer, fileName: string, resumeId: string): Promise<BunnyUploadResponse> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Bunny.net storage not configured'
        };
      }

      // Clean filename and create proper path
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `resumes/${resumeId}/${sanitizedFileName}`;
      const uploadUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${filePath}`;
      
      console.log('📤 Uploading to Bunny.net:');
      console.log(`   File: ${filePath}`);
      console.log(`   URL: ${uploadUrl}`);
      console.log(`   Size: ${pdfBuffer.length} bytes`);
      
      const response = await axios.put(uploadUrl, pdfBuffer, {
        headers: {
          'AccessKey': this.config.accessKey,
          'Content-Type': 'application/pdf'
        },
        timeout: 30000
      });

      if (response.status === 200 || response.status === 201) {
        const cdnUrl = `${this.config.cdnUrl}${filePath}`;
        
        console.log('✅ Upload successful!');
        console.log(`🔗 CDN URL: ${cdnUrl}`);
        
        return {
          success: true,
          url: cdnUrl,
          fileName: filePath
        };
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

    } catch (error: any) {
      console.error('❌ Upload failed:', error.message);
      console.error('   Status:', error.response?.status);
      console.error('   Response:', error.response?.data);
      
      return {
        success: false,
        error: `Upload failed: ${error.message} (Status: ${error.response?.status})`
      };
    }
  }

  /**
   * Upload with retry logic
   */
  async uploadPDFWithRetry(pdfBuffer: Buffer, fileName: string, resumeId: string, maxRetries: number = 3): Promise<BunnyUploadResponse> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);
      
      const result = await this.uploadPDF(pdfBuffer, fileName, resumeId);
      
      if (result.success) {
        return result;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: `Upload failed after ${maxRetries} attempts`
    };
  }

  /**
   * Check if Bunny.net is properly configured
   */
  isConfigured(): boolean {
    const configured = !!(
      this.config.storageZoneName && 
      this.config.accessKey && 
      this.config.cdnUrl &&
      this.config.hostname
    );
    
    if (!configured) {
      console.error('❌ Bunny.net not configured. Missing:');
      if (!this.config.storageZoneName) console.error('   - BUNNY_STORAGE_ZONE_NAME');
      if (!this.config.accessKey) console.error('   - BUNNY_STORAGE_ACCESS_KEY');
      if (!this.config.cdnUrl) console.error('   - BUNNY_CDN_URL');
      if (!this.config.hostname) console.error('   - BUNNY_STORAGE_HOSTNAME');
    }
    
    return configured;
  }

  /**
   * Delete file from Bunny.net
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      const deleteUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${filePath}`;
      
      const response = await axios.delete(deleteUrl, {
        headers: {
          'AccessKey': this.config.accessKey
        },
        timeout: 10000
      });

      return response.status === 200 || response.status === 404;

    } catch (error: any) {
      console.error('❌ Delete failed:', error.message);
      return false;
    }
  }
}

export default new ImprovedBunnyStorageService();
