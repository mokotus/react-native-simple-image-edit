import ImageResizer from '@bam.tech/react-native-image-resizer';
import ImageEditor from '@react-native-community/image-editor';
import { SharedValue } from 'react-native-reanimated';
import { CropBounds } from './components/Cropper';
import ReactNativeBlobUtil from 'react-native-blob-util';
//@ts-ignore
import Exif from 'react-native-exif';

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
  maxWidth?: number;
  maxHeight?: number;
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
    maxWidth,
    maxHeight,
  }: EditedImageValues,
) {
  const dx = originalWidth / imageWidth;
  const dy = originalHeight / imageHeight;

  // const exifData = await Exif.getExif(uri);

  // console.log('Exif', exifData);

  let finalPath: string = uri;
  let finalFile = null;

  if (!uri.startsWith('file://')) {
    finalFile = await ReactNativeBlobUtil.config({ fileCache: true }).fetch(
      'GET',
      uri,
    );
    finalPath = finalFile.path();
  }

  if (!uri.startsWith('file://')) {
    finalPath = 'file://' + finalPath;
  }

  // const dPath = Platform.OS === 'android' ? 'file:////' + finalPath : finalPath;

  const exifData = await Exif.getExif(finalPath);
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

  const croppedUri = await ImageEditor.cropImage(finalPath, {
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
    maxWidth || originalWidth,
    maxHeight || originalHeight,
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

  finalFile?.flush();

  return rotatedUri;
}

export interface Sides {
  left?: SharedValue<number>;
  right?: SharedValue<number>;
  top?: SharedValue<number>;
  bottom?: SharedValue<number>;
}
