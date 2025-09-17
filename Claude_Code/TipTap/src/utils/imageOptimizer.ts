import {Image} from 'react-native-compressor';

export interface ImageCompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png';
}

export class ImageOptimizer {
  static async compressImage(
    uri: string,
    options: ImageCompressionOptions = {},
  ): Promise<string> {
    const {
      quality = 0.8,
      maxWidth = 1024,
      maxHeight = 1024,
      format = 'jpeg',
    } = options;

    try {
      const compressedUri = await Image.compress(uri, {
        compressionMethod: 'auto',
        quality,
        maxWidth,
        maxHeight,
        format,
      });

      return compressedUri;
    } catch (error) {
      console.warn('Image compression failed:', error);
      return uri;
    }
  }

  static async getImageSize(uri: string): Promise<{width: number; height: number}> {
    return new Promise((resolve, reject) => {
      const Image = require('react-native').Image;
      Image.getSize(
        uri,
        (width: number, height: number) => resolve({width, height}),
        (error: any) => reject(error),
      );
    });
  }

  static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): {width: number; height: number} {
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }
}

export const preloadImages = (uris: string[]): Promise<void[]> => {
  const FastImage = require('react-native-fast-image').default;
  return Promise.all(
    uris.map(uri =>
      FastImage.preload([{uri, priority: FastImage.priority.normal}]),
    ),
  );
};