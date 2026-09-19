import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey && bucketName && publicUrl);

let s3Client: S3Client | null = null;
if (isR2Configured) {
  try {
    s3Client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
      region: 'auto',
    });
  } catch (err) {
    console.warn('Failed to initialize S3Client for Cloudflare R2:', err);
  }
}

// Ensure local uploads directory exists
const localUploadsDir = path.join(__dirname, '../../public/uploads');
try {
  if (!fs.existsSync(localUploadsDir)) {
    fs.mkdirSync(localUploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create local uploads directory:', err);
}

export async function uploadImage(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  baseUrl?: string
): Promise<string> {
  const fileExt = path.extname(originalName) || '.jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExt}`;

  // 1. Try Cloudflare R2 if configured
  if (s3Client && bucketName && publicUrl) {
    try {
      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      const r2Domain = publicUrl.replace(/\/$/, '');
      return `${r2Domain}/${fileName}`;
    } catch (error) {
      console.error('Cloudflare R2 upload failed, using fallback:', error);
    }
  }

  // 2. Try Local static file storage
  try {
    const filePath = path.join(localUploadsDir, fileName);
    await fs.promises.writeFile(filePath, fileBuffer);

    // Determine host prefix for served static image
    const backendDomain =
      process.env.RAILWAY_PUBLIC_DOMAIN ||
      process.env.BACKEND_URL ||
      process.env.PUBLIC_URL ||
      baseUrl ||
      'https://rizbyshijiriju-production-2116.up.railway.app';

    const normalizedDomain = backendDomain.startsWith('http')
      ? backendDomain
      : `https://${backendDomain}`;

    return `${normalizedDomain.replace(/\/$/, '')}/uploads/${fileName}`;
  } catch (diskErr) {
    console.error('Disk upload fallback failed, using Base64 Data URL fallback:', diskErr);
  }

  // 3. Fallback: Base64 Data URL (guaranteed to succeed anywhere)
  const base64Str = fileBuffer.toString('base64');
  return `data:${mimeType || 'image/jpeg'};base64,${base64Str}`;
}

export async function deleteImage(imageUrl: string): Promise<void> {
  if (s3Client && bucketName && publicUrl && imageUrl.startsWith(publicUrl)) {
    const key = imageUrl.replace(`${publicUrl.replace(/\/$/, '')}/`, '');
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
      return;
    } catch (error) {
      console.error('R2 delete failed:', error);
    }
  }

  // Dev local delete fallback
  if (imageUrl.includes('/uploads/')) {
    const parts = imageUrl.split('/uploads/');
    if (parts.length > 1) {
      const fileName = parts[1];
      const filePath = path.join(localUploadsDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.error('Local delete failed:', error);
        }
      }
    }
  }
}
