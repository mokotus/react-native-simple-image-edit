import ImageResizer from '@bam.tech/react-native-image-resizer';
import ImageEditor from '@react-native-community/image-editor';
import { Animated, PanResponder } from 'react-native';
import { CropBounds } from './components/Cropper';

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
      x: cropBounds.left,
      y: cropBounds.top,
    },
    size: {
      width: originalWidth - cropBounds.left - cropBounds.right,
      height: originalHeight - cropBounds.top - cropBounds.bottom,
    },
  });

  return finalUri;
}

export function clamp(n: number, min: number, max: number) {
  return n > max ? max : n < min ? min : n;
}

export type Value = Animated.Value & { _value: number; _offset: number };

export interface Sides {
  left?: Value;
  right?: Value;
  top?: Value;
  bottom?: Value;
}

export const createPanResponder = ({
  onCropUpdate,
  dimensions,
  sides,
}: {
  onCropUpdate?: () => void;
  dimensions: { w: number; h: number };
  sides: Sides;
}) => {
  const { left, right, top, bottom } = sides;

  return PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      left?.setOffset((left as Value)._value);
      right?.setOffset((right as Value)._value);
      top?.setOffset((top as Value)._value);
      bottom?.setOffset((bottom as Value)._value);
    },
    onPanResponderMove: (e, gestureState) => {
      const { dx, dy } = gestureState;

      // Clamp values within bounds
      let dl = left ? clamp(dx, -left._offset, dimensions.w - left._offset) : 0;
      let dr = right
        ? clamp(-dx, -right._offset, dimensions.w - right._offset)
        : 0;
      let dt = top ? clamp(dy, -top?._offset, dimensions.h - top?._offset) : 0;
      let db = bottom
        ? clamp(-dy, -bottom?._offset, dimensions.h - bottom?._offset)
        : 0;

      // Preserve width if both horizontal edges are active
      if (left && right) {
        if (Math.abs(dl) > Math.abs(dr)) {
          dl = -dr;
        } else {
          dr = -dl;
        }
      }

      // Preserve height if both vertical edges are active
      if (top && bottom) {
        if (Math.abs(dt) > Math.abs(db)) {
          dt = -db;
        } else {
          db = -dt;
        }
      }

      return Animated.event(
        [
          left ? { dl: left } : null,
          right ? { dr: right } : null,
          top ? { dt: top } : null,
          bottom ? { db: bottom } : null,
        ],
        {
          useNativeDriver: false,
        },
      )({ dl }, { dr }, { dt }, { db });
    },
    onPanResponderRelease: () => {
      left?.flattenOffset();
      right?.flattenOffset();
      top?.flattenOffset();
      bottom?.flattenOffset();

      onCropUpdate?.();
    },
  });
};
