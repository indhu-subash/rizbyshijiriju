import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Helper to resolve Cloudflare R2 credentials dynamically per request
function getR2Config() {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    process.env.ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID;

  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.R2_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET ||
    process.env.AWS_SECRET_ACCESS_KEY;

  const bucketName =
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET ||
    process.env.R2_BUCKET ||
    process.env.BUCKET_NAME ||
    'rizbyshijiriju-images';

  const publicUrl =
    process.env.R2_PUBLIC_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    process.env.PUBLIC_URL ||
    'https://pub-522048b574af4e7aa4d991056322b29a.r2.dev';

  const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey && bucketName && publicUrl);

  const maskedAccountId = accountId
    ? `${accountId.substring(0, 4)}...${accountId.substring(Math.max(0, accountId.length - 4))}`
    : 'MISSING';

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
    isConfigured,
    maskedAccountId,
  };
}

function getS3Client() {
  const config = getR2Config();
  if (!config.isConfigured) {
    return null;
  }

  try {
    return new S3Client({
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId!,
        secretAccessKey: config.secretAccessKey!,
      },
      region: 'auto',
      forcePathStyle: true,
    });
  } catch (err) {
    console.error('[R2 S3Client Init Error]', err);
    return null;
  }
}

// Ensure local uploads directory exists for development fallback
const localUploadsDir = path.join(__dirname, '../../public/uploads');
try {
  if (!fs.existsSync(localUploadsDir)) {
    fs.mkdirSync(localUploadsDir, { recursive: true });
  }
} catch (err) {
  // Ignore in read-only filesystems
}

export async function uploadImage(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  // 1. Image Validation (MIME type & Size Limit)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed limit of 50 MB. Received ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB.`);
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  const normalizedMime = (mimeType || 'image/jpeg').toLowerCase();
  if (!allowedMimeTypes.includes(normalizedMime)) {
    throw new Error(`Unsupported image MIME type '${mimeType}'. Allowed types: JPEG, PNG, WebP, AVIF, GIF.`);
  }

  const isServerProduction =
    process.env.NODE_ENV === 'production' ||
    !!process.env.RAILWAY_ENVIRONMENT ||
    !!process.env.RAILWAY_STATIC_URL ||
    process.env.PORT !== undefined;

  const config = getR2Config();

  // SAFE DIAGNOSTIC LOGGING (NO SECRETS LOGGED)
  console.log('[R2 DIAGNOSTIC AUDIT]', {
    hasAccountId: !!config.accountId,
    maskedAccountId: config.maskedAccountId,
    hasAccessKeyId: !!config.accessKeyId,
    hasSecretAccessKey: !!config.secretAccessKey,
    bucketName: config.bucketName,
    publicUrl: config.publicUrl,
    isConfigured: config.isConfigured,
    isServerProduction,
  });

  const client = getS3Client();

  const fileExt = path.extname(originalName) || '.webp';
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const objectKey = `products/${Date.now()}-${uniqueId}${fileExt}`;

  // 2. Upload directly to Cloudflare R2 if client is configured
  if (client && config.bucketName && config.publicUrl) {
    console.log('[R2 UPLOAD STARTED]', {
      bucket: config.bucketName,
      objectKey,
      contentType: normalizedMime,
      fileSizeBytes: fileBuffer.length,
      endpoint: `https://${config.maskedAccountId}.r2.cloudflarestorage.com`,
    });

    try {
      const uploadParams = {
        Bucket: config.bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: normalizedMime,
      };

      console.log('[R2 PutObjectCommand STARTED]', { bucket: config.bucketName, key: objectKey });
      const commandResult = await client.send(new PutObjectCommand(uploadParams));

      const r2Domain = config.publicUrl.replace(/\/$/, '');
      const finalUrl = `${r2Domain}/${objectKey}`;

      console.log('[R2 PutObjectCommand SUCCEEDED]', {
        bucket: config.bucketName,
        key: objectKey,
        etag: commandResult?.ETag,
        returnedPublicUrl: finalUrl,
      });

      return finalUrl;
    } catch (error: any) {
      console.error('[R2 PutObjectCommand FAILED]', {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        statusCode: error?.$metadata?.httpStatusCode,
        bucket: config.bucketName,
        key: objectKey,
      });

      throw new Error(`Cloudflare R2 upload failed [${error?.name || 'Error'}]: ${error?.message || 'Storage service error.'}`);
    }
  }

  // 3. In server / production / Railway environment, throw explicit error if R2 credentials missing (NO FALLBACK)
  if (isServerProduction || !config.isConfigured) {
    console.error('[R2 CONFIG FAILURE] Missing or invalid R2 credentials on Railway server.', {
      hasAccountId: !!config.accountId,
      hasAccessKeyId: !!config.accessKeyId,
      hasSecretKey: !!config.secretAccessKey,
      bucketName: config.bucketName,
      publicUrl: config.publicUrl,
    });
    throw new Error(
      `R2 Configuration Error: Cloudflare R2 credentials (${
        !config.accountId
          ? 'Account ID'
          : !config.accessKeyId
          ? 'Access Key'
          : !config.secretAccessKey
          ? 'Secret Key'
          : 'Config'
      }) are missing or incomplete on Railway.`
    );
  }

  // 4. Pure local development fallback ONLY when running locally without R2 env vars
  const fileNameOnly = path.basename(objectKey);
  const filePath = path.join(localUploadsDir, fileNameOnly);
  await fs.promises.writeFile(filePath, fileBuffer);
  
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}/uploads/${fileNameOnly}`;
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';
  const config = getR2Config();
  const client = getS3Client();

  if (client && config.bucketName && config.publicUrl && imageUrl.startsWith(config.publicUrl)) {
    const key = imageUrl.replace(`${config.publicUrl.replace(/\/$/, '')}/`, '');
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        })
      );
      console.log(`[R2 DELETE SUCCESS] Object deleted from R2: ${key}`);
      return;
    } catch (error: any) {
      console.error('[R2 DELETE FAILURE]', {
        message: error?.message,
        bucket: config.bucketName,
        key,
      });
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
