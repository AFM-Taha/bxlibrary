import { google } from 'googleapis';

// Initialize Google Drive API
let drive = null;

const initializeDrive = () => {
  if (!drive) {
    // For service account authentication
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.readonly']
        });
        
        drive = google.drive({ version: 'v3', auth });
      } catch (error) {
        console.error('Failed to initialize Google Drive API:', error);
      }
    } else {
      console.warn('Google Service Account Key not found. Drive API features will be limited.');
    }
  }
  return drive;
};

/**
 * Extract Google Drive file ID from various URL formats
 * @param {string} url - Google Drive URL
 * @returns {string|null} - File ID or null if invalid
 */
export const extractFileId = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove whitespace
  url = url.trim();

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view
  let match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    return match[1];
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID
  match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (match) {
    return match[1];
  }

  // Pattern 3: https://docs.google.com/document/d/FILE_ID/
  match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    return match[1];
  }

  // Pattern 4: Direct file ID (if already extracted)
  if (/^[a-zA-Z0-9-_]+$/.test(url) && url.length > 10) {
    return url;
  }

  return null;
};

/**
 * Generate canonical Google Drive URL from file ID
 * @param {string} fileId - Google Drive file ID
 * @returns {string} - Canonical URL
 */
export const getCanonicalUrl = (fileId) => {
  if (!fileId) return '';
  return `https://drive.google.com/file/d/${fileId}/view`;
};

/**
 * Generate embed URL for Google Drive file
 * @param {string} fileId - Google Drive file ID
 * @returns {string} - Embed URL
 */
export const getEmbedUrl = (fileId) => {
  if (!fileId) return '';
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

/**
 * Get file metadata from Google Drive API
 * @param {string} fileId - Google Drive file ID
 * @returns {Object|null} - File metadata or null if error
 */
export const getFileMetadata = async (fileId) => {
  try {
    const driveApi = initializeDrive();
    if (!driveApi) {
      throw new Error('Google Drive API not initialized');
    }

    const response = await driveApi.files.get({
      fileId,
      fields: 'id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webViewLink,webContentLink'
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    return null;
  }
};

/**
 * Get thumbnail URL for a Google Drive file
 * @param {string} fileId - Google Drive file ID
 * @returns {string|null} - Thumbnail URL or null if not available
 */
export const getThumbnailUrl = async (fileId) => {
  try {
    const metadata = await getFileMetadata(fileId);
    return metadata?.thumbnailLink || null;
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return null;
  }
};

/**
 * Check if a Google Drive file is accessible
 * @param {string} fileId - Google Drive file ID
 * @returns {boolean} - True if accessible, false otherwise
 */
export const isFileAccessible = async (fileId) => {
  try {
    const metadata = await getFileMetadata(fileId);
    return metadata !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Stream file content from Google Drive (for PDF.js mode)
 * @param {string} fileId - Google Drive file ID
 * @returns {ReadableStream|null} - File stream or null if error
 */
export const getFileStream = async (fileId) => {
  try {
    const driveApi = initializeDrive();
    if (!driveApi) {
      throw new Error('Google Drive API not initialized');
    }

    const response = await driveApi.files.get({
      fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    return response.data;
  } catch (error) {
    console.error('Error streaming file:', error);
    return null;
  }
};

/**
 * Validate Google Drive URL and extract file ID
 * @param {string} url - Google Drive URL
 * @returns {Object} - Validation result with fileId and canonical URL
 */
export const validateDriveUrl = async (url) => {
  const fileId = extractFileId(url);
  
  if (!fileId) {
    return {
      valid: false,
      error: 'Invalid Google Drive URL format',
      fileId: null,
      canonicalUrl: null
    };
  }

  // Check if file is accessible (optional - requires API)
  const isAccessible = await isFileAccessible(fileId);
  
  return {
    valid: true,
    fileId,
    canonicalUrl: getCanonicalUrl(fileId),
    embedUrl: getEmbedUrl(fileId),
    accessible: isAccessible
  };
};

/**
 * Get file download URL (requires proper permissions)
 * @param {string} fileId - Google Drive file ID
 * @returns {string} - Download URL
 */
export const getDownloadUrl = (fileId) => {
  if (!fileId) return '';
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

/**
 * Check if URL is a valid Google Drive URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if valid Google Drive URL
 */
export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const drivePatterns = [
    /drive\.google\.com/,
    /docs\.google\.com/
  ];
  
  return drivePatterns.some(pattern => pattern.test(url));
};

/**
 * Get file type from Google Drive file
 * @param {string} fileId - Google Drive file ID
 * @returns {string|null} - File type or null
 */
export const getFileType = async (fileId) => {
  try {
    const metadata = await getFileMetadata(fileId);
    return metadata?.mimeType || null;
  } catch (error) {
    console.error('Error getting file type:', error);
    return null;
  }
};

/**
 * Check if file is a PDF
 * @param {string} fileId - Google Drive file ID
 * @returns {boolean} - True if PDF
 */
export const isPdfFile = async (fileId) => {
  try {
    const fileType = await getFileType(fileId);
    return fileType === 'application/pdf';
  } catch (error) {
    return false;
  }
};

export default {
  extractFileId,
  getCanonicalUrl,
  getEmbedUrl,
  getFileMetadata,
  getThumbnailUrl,
  isFileAccessible,
  getFileStream,
  validateDriveUrl,
  getDownloadUrl,
  isGoogleDriveUrl,
  getFileType,
  isPdfFile
};