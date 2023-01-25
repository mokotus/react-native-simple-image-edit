import ImageResizer from '@bam.tech/react-native-image-resizer';
import ImageEditor from '@react-native-community/image-editor';
import { Animated, PanResponder } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { CropBounds } from './components/Cropper';

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

  const croppedUri = await ImageEditor.cropImage(uri, {
    offset: {
      x: cropBounds.left * dx,
      y: cropBounds.top * dy,
    },
    size: {
      width: (imageWidth - cropBounds.left - cropBounds.right) * dx,
      height: (imageHeight - cropBounds.top - cropBounds.bottom) * dy,
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

  return rotatedUri;
}

export interface Sides {
  left?: SharedValue<number>;
  right?: SharedValue<number>;
  top?: SharedValue<number>;
  bottom?: SharedValue<number>;
}
