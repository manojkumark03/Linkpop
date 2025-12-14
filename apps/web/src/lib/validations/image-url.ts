/**
 * Validates if a URL is accessible and points to a valid image
 */
export async function validateImageUrl(url: string): Promise<{
  isValid: boolean;
  error?: string;
  preview?: string;
}> {
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Check if URL uses allowed protocols
  const urlObj = new URL(url);
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
  }

  // Check if URL has valid image extension (basic check)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const hasImageExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );

  // Additional check for common image hosting services
  const imageHosts = [
    'imgur.com', 'i.imgur.com', 'imgbb.com', 'i.ibb.co',
    'drive.google.com', 'github.com', 'githubusercontent.com',
    'unsplash.com', 'images.unsplash.com', 'picsum.photos'
  ];
  
  const isFromImageHost = imageHosts.some(host => 
    urlObj.hostname.includes(host)
  );

  if (!hasImageExtension && !isFromImageHost) {
    return { 
      isValid: false, 
      error: 'URL should point to an image file or image hosting service' 
    };
  }

  // Try to validate by making a HEAD request
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return { 
        isValid: false, 
        error: 'Unable to access image URL (HTTP ' + response.status + ')' 
      };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      return { 
        isValid: false, 
        error: 'URL does not point to a valid image' 
      };
    }

    return { isValid: true, preview: url };
  } catch (error) {
    // If HEAD request fails, try with GET but limit the response
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'Range': 'bytes=0-1023' } // Only get first 1KB
      });
      
      if (!response.ok) {
        return { 
          isValid: false, 
          error: 'Unable to access image URL' 
        };
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        return { 
          isValid: false, 
          error: 'URL does not point to a valid image' 
        };
      }

      return { isValid: true, preview: url };
    } catch {
      return { 
        isValid: false, 
        error: 'Unable to validate image URL - it may be blocked by CORS' 
      };
    }
  }
}

/**
 * Formats Google Drive URL to get direct image link
 */
export function formatGoogleDriveUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Google Drive file URLs
    if (urlObj.hostname.includes('drive.google.com')) {
      // Convert from: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      // To: https://drive.google.com/uc?id=FILE_ID&export=view
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (fileMatch) {
        const fileId = fileMatch[1];
        return `https://drive.google.com/uc?id=${fileId}&export=view`;
      }
    }
    
    return url;
  } catch {
    return null;
  }
}

/**
 * Helper function to provide helpful text for different image hosting services
 */
export function getImageUrlHelpText(): string {
  return 'Paste image URL from Google Drive, ImgBB, Imgur, or any public image link';
}

/**
 * Google Drive specific instructions
 */
export function getGoogleDriveInstructions(): string {
  return `For Google Drive images:
1. Right-click your image and select "Get link"
2. Change permissions to "Anyone with the link can view"
3. Copy the link and paste it above
4. We'll automatically format it to work properly`;
}

/**
 * ImgBB specific instructions  
 */
export function getImgbbInstructions(): string {
  return `For ImgBB:
1. Upload your image at imgbb.com
2. After upload, right-click the image and select "Copy image address"
3. Paste the direct image URL above`;
}