import axios from 'axios';
import FormData from 'form-data';
import { sanitizeForLog } from '../utils/safe-logging';

// BunnyNet Configuration
const BUNNY_STORAGE_CONFIG = {
  hostname: process.env.BUNNY_STORAGE_HOSTNAME || 'sg.storage.bunnycdn.com',
  zoneName: process.env.BUNNY_STORAGE_ZONE_NAME || 'campuspe-resumes-v2',
  accessKey: process.env.BUNNY_STORAGE_ACCESS_KEY || '',
  cdnUrl: process.env.BUNNY_CDN_URL || 'https://campuspe-resumes-cdn-v2.b-cdn.net',
};

export interface BunnyNetUploadResult {
  success: boolean;
  url?: string;
  cdnUrl?: string;
  fileName?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
}

class BunnyNetService {
  private baseUrl: string;
  private accessKey: string;
  private cdnUrl: string;

  constructor() {
    this.baseUrl = `https://${BUNNY_STORAGE_CONFIG.hostname}/${BUNNY_STORAGE_CONFIG.zoneName}`;
    this.accessKey = BUNNY_STORAGE_CONFIG.accessKey;
    this.cdnUrl = BUNNY_STORAGE_CONFIG.cdnUrl;
    
    if (!this.accessKey) {
      console.error('BunnyNet access key not configured');
    }
  }

  /**
   * Upload file buffer to BunnyNet storage
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<BunnyNetUploadResult> {
    try {
      if (!this.accessKey) {
        return { success: false, error: 'BunnyNet access key not configured' };
      }

      // Validate file size
      if (options.maxSize && buffer.length > options.maxSize) {
        return { 
          success: false, 
          error: `File size exceeds maximum allowed size of ${options.maxSize} bytes` 
        };
      }

      // Create folder path
      const folder = options.folder || 'uploads';
      const finalFileName = options.fileName || fileName;
      const filePath = `${folder}/${finalFileName}`;

      // Upload to BunnyNet
      const uploadUrl = `${this.baseUrl}/${filePath}`;
      
      const response = await axios.put(uploadUrl, buffer, {
        headers: {
          'AccessKey': this.accessKey,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.status === 201) {
        const cdnUrl = `${this.cdnUrl}/${filePath}`;
        return {
          success: true,
          url: uploadUrl,
          cdnUrl: cdnUrl,
          fileName: finalFileName
        };
      } else {
        return { 
          success: false, 
          error: `Upload failed with status: ${response.status}` 
        };
      }
    } catch (error: any) {
      console.error('BunnyNet upload error:', sanitizeForLog(error));
      return { 
        success: false, 
        error: error.message || 'Upload failed' 
      };
    }
  }

  /**
   * Upload college logo
   */
  async uploadCollegeLogo(
    buffer: Buffer,
    collegeId: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const fileName = `${collegeId}-logo.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'college-logos',
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
    });
  }

  /**
   * Upload college banner
   */
  async uploadCollegeBanner(
    buffer: Buffer,
    collegeId: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${collegeId}-banner-${timestamp}.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'college-banners',
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxSize: 10 * 1024 * 1024, // 10MB
    });
  }

  /**
   * Upload college gallery image
   */
  async uploadCollegeGalleryImage(
    buffer: Buffer,
    collegeId: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${collegeId}-gallery-${timestamp}.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'college-gallery',
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
    });
  }

  /**
   * Upload achievement photo
   */
  async uploadAchievementPhoto(
    buffer: Buffer,
    collegeId: string,
    achievementId: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${collegeId}-achievement-${achievementId}-${timestamp}.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'achievement-photos',
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
    });
  }

  /**
   * Upload alumni image
   */
  async uploadAlumniImage(
    buffer: Buffer,
    collegeId: string,
    alumniId: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${collegeId}-alumni-${alumniId}-${timestamp}.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'alumni-images',
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxSize: 3 * 1024 * 1024, // 3MB
    });
  }

  /**
   * Upload virtual tour video
   */
  async uploadVirtualTourVideo(
    buffer: Buffer,
    collegeId: string,
    tourId: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${collegeId}-tour-${tourId}-${timestamp}.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'virtual-tour-videos',
      allowedTypes: ['mp4', 'webm', 'mov', 'avi'],
      maxSize: 100 * 1024 * 1024, // 100MB
    });
  }

  /**
   * Upload verification document
   */
  async uploadVerificationDocument(
    buffer: Buffer,
    collegeId: string,
    documentType: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${collegeId}-${documentType}-${timestamp}.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'verification-documents',
      allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
      maxSize: 10 * 1024 * 1024, // 10MB
    });
  }

  /**
   * Upload resume file
   */
  async uploadResume(
    buffer: Buffer,
    studentId: string,
    originalFileName: string
  ): Promise<BunnyNetUploadResult> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${studentId}-resume-${timestamp}.${fileExtension}`;
    
    return this.uploadFile(buffer, fileName, {
      folder: 'resumes',
      allowedTypes: ['pdf', 'doc', 'docx'],
      maxSize: 5 * 1024 * 1024, // 5MB
    });
  }

  /**
   * Delete file from BunnyNet storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!this.accessKey) {
        console.error('BunnyNet access key not configured');
        return false;
      }

      const deleteUrl = `${this.baseUrl}/${filePath}`;
      
      const response = await axios.delete(deleteUrl, {
        headers: {
          'AccessKey': this.accessKey,
        },
      });

      return response.status === 200;
    } catch (error: any) {
      console.error('BunnyNet delete error:', sanitizeForLog(error));
      return false;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/${filePath}`, {
        headers: {
          'AccessKey': this.accessKey,
        },
        method: 'HEAD'
      });

      return {
        exists: response.status === 200,
        size: response.headers['content-length'],
        lastModified: response.headers['last-modified'],
      };
    } catch (error: any) {
      return { exists: false };
    }
  }

  /**
   * Generate CDN URL for a file
   */
  getCdnUrl(filePath: string): string {
    return `${this.cdnUrl}/${filePath}`;
  }
}

// Export singleton instance
export const bunnyNetService = new BunnyNetService();
export default bunnyNetService;
