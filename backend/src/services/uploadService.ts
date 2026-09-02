import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const isProd = process.env.NODE_ENV === 'production';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const isR2Configured = accountId && accessKeyId && secretAccessKey && bucketName && publicUrl;

// Check production safety
if (isProd && !isR2Configured) {
  throw new Error('Production Configuration Error: Cloudflare R2 credentials are not configured.');
}

let s3Client: S3Client | null = null;
if (isR2Configured) {
  s3Client = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    region: 'auto',
  });
}

// Ensure local uploads directory exists for development fallback
const localUploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

export async function uploadImage(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  const fileExt = path.extname(originalName) || '.jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExt}`;

  // 1. Upload to Cloudflare R2 if configured
  if (s3Client && bucketName && publicUrl) {
    try {
      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      return `${publicUrl.replace(/\/$/, '')}/${fileName}`;
    } catch (error) {
      console.error('R2 upload failed, checking fallback options:', error);
      if (isProd) {
        throw new Error('Image upload failed under production environment.');
      }
    }
  }

  // 2. Development local upload fallback
  if (isProd) {
    throw new Error('R2 configuration missing or unavailable in production.');
  }

  const filePath = path.join(localUploadsDir, fileName);
  await fs.promises.writeFile(filePath, fileBuffer);
  
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}/uploads/${fileName}`;
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
      if (isProd) {
        throw error;
      }
    }
  }

  // Dev local delete fallback
  const port = process.env.PORT || 5000;
  const localUrlPrefix = `http://localhost:${port}/uploads/`;
  if (imageUrl.startsWith(localUrlPrefix)) {
    const fileName = imageUrl.replace(localUrlPrefix, '');
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
