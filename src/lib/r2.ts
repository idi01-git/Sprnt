export const Bucket = { PRIVATE: 'private', PUBLIC: 'public' } as const
export const KeyPrefix = { NOTES: 'notes/', THUMBNAILS: 'thumbnails/', AVATARS: 'avatars/', PROBLEM_STATEMENTS: 'problem-statements/' } as const
export const Expiry = { DOWNLOAD: 3600, UPLOAD: 3600 } as const
export async function generatePresignedUploadUrl(bucket: string, key: string, contentType: string) {
  return { url: `https://stub.example.com/upload?key=${key}`, expiresAt: new Date(Date.now() + 3600000) }
}
export async function generatePresignedDownloadUrl(bucket: string, key: string, expiry?: number) {
  return { url: `https://stub.example.com/download?key=${key}`, expiresAt: new Date(Date.now() + (expiry ?? 3600) * 1000) }
}
export async function deleteFile(bucket: string, key: string): Promise<void> {}
