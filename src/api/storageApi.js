import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { firebaseStorage } from '../firebase';
import { getCurrentUser } from './firebaseHelpers';

const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB
const MAX_DIMENSION = 1920;

const sanitizeFileName = (fileName = 'image') =>
  String(fileName)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'image';

const getImageExtension = (contentType = '') => {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  return 'jpg';
};

const appendCacheVersion = (url, version) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
};

export const assertImageFile = (file) => {
  if (!file) throw new Error('업로드할 이미지 파일을 선택해주세요.');
  if (!file.type?.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있습니다.');
};

export const compressImageFile = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth;
      let height = img.naturalHeight;
      const shouldResize = width > MAX_DIMENSION || height > MAX_DIMENSION;

      if (!shouldResize && file.size <= MAX_UPLOAD_BYTES) {
        resolve(file);
        return;
      }

      if (shouldResize) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('이미지 압축을 처리할 수 없습니다.'));
        return;
      }
      context.drawImage(img, 0, 0, width, height);

      let quality = 0.85;
      const tryBlob = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('이미지 압축에 실패했습니다.'));
            return;
          }

          if (blob.size <= MAX_UPLOAD_BYTES) {
            resolve(new File([blob], `${sanitizeFileName(file.name)}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
            return;
          }

          if (quality < 0.1) {
            reject(new Error('이미지 용량은 1MB 이하로 업로드해주세요.'));
            return;
          }

          quality = Math.max(0.05, quality - 0.1);
          tryBlob();
        }, 'image/jpeg', quality);
      };

      tryBlob();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 파일을 읽을 수 없습니다.'));
    };

    img.src = objectUrl;
  });

export const uploadUserImage = async (file, folder, options = {}) => {
  assertImageFile(file);
  const user = await getCurrentUser();
  const compressed = await compressImageFile(file);
  const extension = getImageExtension(compressed.type);
  const uploadedAt = Date.now();
  const fileName = options.fixedFileName
    ? options.fixedFileName
    : `${uploadedAt}-${sanitizeFileName(compressed.name)}.${extension}`;
  const path = `users/${user.id}/${folder}/${fileName}`;
  const imageRef = storageRef(firebaseStorage, path);

  const snapshot = await uploadBytes(imageRef, compressed, {
    contentType: compressed.type || 'image/jpeg',
    customMetadata: {
      owner: user.id,
      source: 'codetrip',
      uploadedAt: String(uploadedAt),
    },
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return options.cacheBust ? appendCacheVersion(downloadUrl, uploadedAt) : downloadUrl;
};

export const uploadProfileImage = (file) =>
  uploadUserImage(file, 'profile', {
    fixedFileName: 'avatar',
    cacheBust: true,
  });

export const uploadBoardImage = (file) => uploadUserImage(file, 'board');
