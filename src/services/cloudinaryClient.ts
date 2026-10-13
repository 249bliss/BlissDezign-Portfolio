/**
 * Cloudinary Upload Service
 * Cloud Name: adfxi8js
 * Preset: bliss_uploads (Unsigned)
 * High-speed CDN media delivery with Retina sharpness and zero egress bandwidth bottlenecks.
 */

const CLOUDINARY_CLOUD_NAME = 'adfxi8js';
const CLOUDINARY_UPLOAD_PRESET = 'bliss_uploads';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Only optimizes an image client-side if it exceeds Cloudinary's unsigned 10MB limit (maxBytes = 9.8MB).
 * CRITICAL FOR CASE STUDIES: Never constrains height, ensuring long vertical infographics (e.g. 15,000px tall)
 * maintain 100% of their full horizontal width (up to 3200px Retina) with crisp, uncompressed typography.
 */
async function optimizeImageIfNeeded(file: File, maxBytes = 9.8 * 1024 * 1024): Promise<File | Blob> {
  // If not in a browser environment, or not an image, or SVG, or already within the 10MB limit, keep original untouched bytes!
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !file.type.startsWith('image/') ||
    file.type.includes('svg') ||
    file.size <= maxBytes
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 3200; // Ultra 4K Retina width
      let { width, height } = img;

      // Only constrain if horizontal width exceeds 3200px (NEVER constrain by height!)
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const cleanName = file.name.replace(/\.[^.]+$/, '.webp');
            resolve(new File([blob], cleanName, { type: 'image/webp' }));
          } else {
            resolve(file);
          }
        },
        'image/webp',
        0.94
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads an image or video directly to Cloudinary from the browser without serverless bandwidth costs.
 * @param file File object from file input
 * @param folder Optional folder name (e.g., 'projects', 'case_studies', 'reviews')
 */
export async function uploadAssetToCloudinary(
  file: File,
  folder: string = 'projects'
): Promise<string> {
  const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);
  
  if (isVideo && file.size > 100 * 1024 * 1024) {
    throw new Error(`Video "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum supported video upload size is 100MB.`);
  }

  // Auto-optimize large images to prevent "File size too large. Maximum is 10485760" error
  const uploadPayload = await optimizeImageIfNeeded(file);

  const resourceType = isVideo ? 'video' : 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', uploadPayload);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message || `Upload failed with status ${response.status}`;
    console.error('Cloudinary upload error:', message);
    throw new Error(message);
  }

  const data: CloudinaryUploadResponse = await response.json();
  
  // Return secure HTTPS delivery URL
  return data.secure_url;
}

/**
 * Auto-Slices giant case study infographics (e.g., tall Figma exports 8,000px - 40,000px)
 * into seamless, manageable vertical chunks (max 5000px height per slice).
 * This prevents browser canvas memory limits, iOS Safari crashes, and Cloudinary 16K dimension truncations.
 * Returns an array of Cloudinary URLs in exact vertical sequence [slice_0, slice_1, ...].
 */
export async function sliceAndUploadCaseStudyImage(
  file: File,
  onProgress?: (status: string) => void
): Promise<string[]> {
  const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);
  if (isVideo) {
    const url = await uploadAssetToCloudinary(file, 'case_studies');
    return [url];
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const CHUNK_HEIGHT = 5000;
          const { width, height } = img;

          // If image is reasonable height (<= 5500px), upload directly as single asset
          if (height <= 5500) {
            onProgress?.(`Uploading ${file.name}...`);
            const url = await uploadAssetToCloudinary(file, 'case_studies');
            resolve([url]);
            return;
          }

          const totalChunks = Math.ceil(height / CHUNK_HEIGHT);
          onProgress?.(`Auto-slicing tall image (${width}x${height}) into ${totalChunks} seamless sections...`);

          const uploadedUrls: string[] = [];

          for (let i = 0; i < totalChunks; i++) {
            const sliceY = i * CHUNK_HEIGHT;
            const sliceH = Math.min(CHUNK_HEIGHT, height - sliceY);

            onProgress?.(`Slicing & uploading section ${i + 1} of ${totalChunks}...`);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = sliceH;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not create 2D canvas for image slicing.');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, sliceY, width, sliceH, 0, 0, width, sliceH);

            const blob = await new Promise<Blob | null>((res) => {
              canvas.toBlob((b) => res(b), 'image/webp', 0.94);
            });

            if (!blob) throw new Error(`Failed to generate slice ${i + 1}`);

            const chunkFile = new File(
              [blob],
              `${file.name.replace(/\.[^.]+$/, '')}_slice_${i + 1}.webp`,
              { type: 'image/webp' }
            );

            const sliceUrl = await uploadAssetToCloudinary(chunkFile, 'case_studies');
            uploadedUrls.push(sliceUrl);
          }

          onProgress?.(`Successfully uploaded all ${totalChunks} slices!`);
          resolve(uploadedUrls);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for slicing.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}


