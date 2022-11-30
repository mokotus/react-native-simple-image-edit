import ImageResizer from '@bam.tech/react-native-image-resizer';
import ImageEditor from '@react-native-community/image-editor';
import { CropBounds } from './components/CropOverlay';

interface EditedImageValues {
  originalWidth: number;
  originalHeight: number;
  quality?: number;
  rotation?: number;
  cropBounds: CropBounds;
}

export async function applyImageEdits(
  uri: string,
  {
    originalWidth,
    originalHeight,
    quality,
    rotation,
    cropBounds,
  }: EditedImageValues,
) {
  const { uri: rotatedUri } = await ImageResizer.createResizedImage(
    uri,
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

  const finalUri = await ImageEditor.cropImage(rotatedUri, {
    offset: {
      x: cropBounds.x,
      y: cropBounds.y,
    },
    size: {
      width: cropBounds.width,
      height: cropBounds.height,
    },
  });

  return finalUri;
}
