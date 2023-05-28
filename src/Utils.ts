import ImageResizer from '@bam.tech/react-native-image-resizer';
import ImageEditor from '@react-native-community/image-editor';
import { Platform } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { CropBounds } from './components/Cropper';
//@ts-ignore
import Exif from 'react-native-exif';
import RNFetchBlob from 'rn-fetch-blob';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export type Rect = Position & Size;

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface EditedImageValues {
  originalWidth: number;
  originalHeight: number;
  imageWidth: number;
  imageHeight: number;
  quality?: number;
  rotation?: number;
  cropBounds: CropBounds;
}

export async function applyImageEdits(
  uri: string,
  {
    originalWidth,
    originalHeight,
    imageWidth,
    imageHeight,
    quality,
    rotation,
    cropBounds,
  }: EditedImageValues,
) {
  const dx = originalWidth / imageWidth;
  const dy = originalHeight / imageHeight;

  // const exifData = await Exif.getExif(uri);

  // console.log('Exif', exifData);

  const downloadedImage = await RNFetchBlob.config({ fileCache: true }).fetch(
    'GET',
    uri,
  );

  const dPath =
    Platform.OS === 'android'
      ? 'file://' + downloadedImage.path()
      : downloadedImage.path();

  const exifData = await Exif.getExif(dPath);
  const orientation = exifData.Orientation;

  let x = cropBounds.left;
  let y = cropBounds.top;
  let width = imageWidth - cropBounds.left - cropBounds.right;
  let height = imageHeight - cropBounds.top - cropBounds.bottom;
  if (orientation === 3) {
    x = cropBounds.right;
    y = cropBounds.bottom;
  } else if (orientation === 6) {
    x = cropBounds.top;
    y = cropBounds.right;
    width = imageHeight - cropBounds.top - cropBounds.bottom;
    height = imageWidth - cropBounds.left - cropBounds.right;
  } else if (orientation === 8) {
    x = cropBounds.bottom;
    y = cropBounds.left;
    width = imageHeight - cropBounds.top - cropBounds.bottom;
    height = imageWidth - cropBounds.left - cropBounds.right;
  }

  const croppedUri = await ImageEditor.cropImage(dPath, {
    offset: {
      x: x * dx,
      y: y * dy,
    },
    size: {
      width: width * dx,
      height: height * dy,
    },
  });

  const { uri: rotatedUri } = await ImageResizer.createResizedImage(
    croppedUri,
    originalWidth,
    originalHeight,
    'JPEG',
    quality || 100,
    rotation,
    undefined,
    false,
    {
      mode: 'cover',
      onlyScaleDown: true,
    },
  );

  downloadedImage.flush();

  return rotatedUri;
}

export interface Sides {
  left?: SharedValue<number>;
  right?: SharedValue<number>;
  top?: SharedValue<number>;
  bottom?: SharedValue<number>;
}
