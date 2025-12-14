'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

import { Button, Input, Label, cn } from '@acme/ui';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

import { 
  validateImageUrl, 
  formatGoogleDriveUrl, 
  getImageUrlHelpText,
  getGoogleDriveInstructions,
  getImgbbInstructions 
} from '@/lib/validations/image-url';

interface ImageUrlInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  showPreview?: boolean;
  previewSize?: 'small' | 'medium' | 'large';
  className?: string;
  currentImageUrl?: string; // For showing current image when clearing
  allowEmpty?: boolean;
  showServiceInstructions?: boolean;
}

export function ImageUrlInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder = '',
  showPreview = true,
  previewSize = 'medium',
  className,
  currentImageUrl,
  allowEmpty = true,
  showServiceInstructions = true,
}: ImageUrlInputProps) {
  const [tempUrl, setTempUrl] = useState(value);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setTempUrl(value);
  }, [value]);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (tempUrl && tempUrl.trim() && tempUrl !== value) {
        setIsValidating(true);
        
        // Format Google Drive URLs automatically
        const formattedUrl = formatGoogleDriveUrl(tempUrl.trim()) || tempUrl.trim();
        
        const result = await validateImageUrl(formattedUrl);
        setValidationResult(result);
        setIsValidating(false);
        
        // Update parent with formatted URL if valid
        if (result.isValid) {
          onChange(formattedUrl);
        }
      } else {
        setValidationResult(null);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [tempUrl, value, onChange]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setTempUrl(newUrl);
    
    // Clear validation when user is typing
    if (validationResult) {
      setValidationResult(null);
    }
  };

  const handleBlur = () => {
    // Final validation on blur
    const trimmedUrl = tempUrl.trim();
    if (trimmedUrl) {
      // Already validated in debounced effect
      onBlur?.();
    } else if (allowEmpty) {
      onChange('');
      onBlur?.();
    }
  };

  const handleClear = () => {
    setTempUrl('');
    setValidationResult(null);
    setImageError(false);
    onChange('');
  };

  const getPreviewSize = () => {
    switch (previewSize) {
      case 'small':
        return { width: 64, height: 64 };
      case 'large':
        return { width: 192, height: 192 };
      default:
        return { width: 96, height: 96 };
    }
  };

  const previewDimensions = getPreviewSize();

  const hasImage = value && !imageError;
  const showImagePreview = showPreview && (hasImage || imageError);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`${label}-url`} className="text-sm font-medium">
          {label}
        </Label>
        {showServiceInstructions && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Help
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Input
              id={`${label}-url`}
              type="url"
              value={tempUrl}
              onChange={handleUrlChange}
              onBlur={handleBlur}
              placeholder={placeholder || 'https://example.com/image.jpg'}
              className={cn(
                'sm:pr-10',
                validationResult?.isValid === false && 'border-red-500',
                validationResult?.isValid === true && 'border-green-500'
              )}
            />
            {isValidating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            )}
            {!isValidating && validationResult?.isValid === true && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
            {!isValidating && validationResult?.isValid === false && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
            )}
          </div>
          
          {value && allowEmpty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="w-full sm:w-auto shrink-0"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Validation feedback */}
        {!isValidating && validationResult?.error && (
          <p className="text-xs text-red-600 flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
            {validationResult.error}
          </p>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          {getImageUrlHelpText()}
        </p>

        {/* Service-specific instructions */}
        {showInstructions && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-2">
            <p className="text-xs font-medium text-muted-foreground">How to get image URLs:</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>
                <p className="font-medium">Google Drive:</p>
                <p>{getGoogleDriveInstructions()}</p>
              </div>
              <div>
                <p className="font-medium">ImgBB:</p>
                <p>{getImgbbInstructions()}</p>
              </div>
              <div>
                <p className="font-medium">Other services:</p>
                <p>Upload to Imgur, use any public image URL, or right-click images on websites and select "Copy image address"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image preview */}
      {showImagePreview && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div
              className={cn(
                'relative overflow-hidden rounded-md border self-start',
                previewSize === 'small' && 'h-16 w-16',
                previewSize === 'medium' && 'h-24 w-24',
                previewSize === 'large' && 'h-48 w-48'
              )}
            >
              {hasImage ? (
                <Image
                  src={value}
                  alt={`${label} preview`}
                  width={previewDimensions.width}
                  height={previewDimensions.height}
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized={value.startsWith('http')} // Don't optimize external URLs
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                  <AlertCircle className="h-8 w-8" />
                </div>
              )}
            </div>
            {imageError && (
              <div className="text-xs text-red-600">
                <p className="font-medium">Image failed to load</p>
                <p>Check that the URL is correct and the image is publicly accessible</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}