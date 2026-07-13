'use client';

/**
 * MerchantLogoUpload
 *
 * Two-layer compression:
 *   Layer 1 (client, this file): browser-image-compression → WebP, max 100 KB, max 512 px
 *   Layer 2 (server, image_utils.py): Pillow enforces the same limits — the real safety net
 *
 * Storage math:
 *   Phone photos uncompressed → 2-5 MB → ~200–500 merchants in 1 GB Supabase free tier
 *   After compression → ≤100 KB → 10,000+ merchants in same 1 GB
 */

import React, { useRef, useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface MerchantLogoUploadProps {
  merchantId: string;
  currentLogoUrl?: string | null;
  merchantName: string;
  onSuccess: (newLogoUrl: string) => void;
  onError?: (error: string) => void;
}

const MAX_RAW_SIZE_MB = 10;  // Hard reject before attempting compression

const compressionOptions = {
  maxSizeMB: 0.1,            // Target 100 KB max
  maxWidthOrHeight: 512,     // Logos never need to be bigger than 512 px
  useWebWorker: true,        // Non-blocking (keeps UI responsive during compression)
  fileType: 'image/webp',    // WebP compresses far better than PNG/JPEG
  initialQuality: 0.85,
};

export const MerchantLogoUpload: React.FC<MerchantLogoUploadProps> = ({
  merchantId,
  currentLogoUrl,
  merchantName,
  onSuccess,
  onError,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProgress('');

    // Client-side size guard — reject absurdly large files before compressing
    if (file.size > MAX_RAW_SIZE_MB * 1024 * 1024) {
      const msg = `Image too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please choose an image under ${MAX_RAW_SIZE_MB} MB.`;
      setError(msg);
      onError?.(msg);
      return;
    }

    // Show instant preview from original file while compressing
    const originalPreviewUrl = URL.createObjectURL(file);
    setPreview(originalPreviewUrl);
    setUploading(true);

    try {
      // ── Layer 1: Client-side compression ────────────────────────────────────
      setProgress('Compressing image…');
      const compressedFile = await imageCompression(file, {
        ...compressionOptions,
        onProgress: (pct: number) => {
          setProgress(`Compressing… ${pct}%`);
        },
      });

      const compressedSizeKB = (compressedFile.size / 1024).toFixed(1);
      setProgress(`Uploading (${compressedSizeKB} KB)…`);

      // ── Upload compressed file to backend ───────────────────────────────────
      // Server will apply Layer 2 compression (Pillow) as final safety net
      const formData = new FormData();
      formData.append('file', compressedFile, `${merchantId}_logo.webp`);

      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/merchants/${merchantId}/logo`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Upload failed (HTTP ${response.status})`);
      }

      const merchant = await response.json();
      const newUrl = merchant.logo_url;

      // Update preview to the final Supabase Storage URL
      setPreview(newUrl);
      setProgress('');
      onSuccess(newUrl);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
      onError?.(message);
      setProgress('');
      // Revert preview to original logo on error
      setPreview(currentLogoUrl ?? null);
    } finally {
      setUploading(false);
      // Clean up the temp object URL
      URL.revokeObjectURL(originalPreviewUrl);
      // Reset file input so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [merchantId, currentLogoUrl, onSuccess, onError]);

  // Initials fallback when no logo is present
  const initials = merchantName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Logo preview circle */}
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        title="Click to upload logo"
        className="relative group"
        style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden' }}
      >
        {preview ? (
          <img
            src={preview}
            alt={`${merchantName} logo`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #C9A227, #7A5C12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 28,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {initials}
          </div>
        )}

        {/* Hover / uploading overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200"
          style={{
            background: 'rgba(0,0,0,0.55)',
            opacity: uploading ? 1 : 0,
          }}
        >
          {uploading && (
            <svg className="animate-spin" width={24} height={24} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#C9A227" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Camera icon overlay on hover when not uploading */}
        {!uploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2" />
            </svg>
            <span style={{ color: '#fff', fontSize: 9, marginTop: 3 }}>Change</span>
          </div>
        )}
      </button>

      {/* Progress / status text */}
      {progress && (
        <p style={{ color: '#C9A227', fontSize: 11, textAlign: 'center', maxWidth: 160 }}>
          {progress}
        </p>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: '#f87171', fontSize: 11, textAlign: 'center', maxWidth: 200 }}>
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Helper text */}
      {!uploading && !error && (
        <p style={{ color: 'rgba(138,138,138,0.7)', fontSize: 10, textAlign: 'center', maxWidth: 160 }}>
          JPG, PNG or WebP · Max 10 MB<br />Auto-compressed to WebP ≤ 100 KB
        </p>
      )}
    </div>
  );
};
