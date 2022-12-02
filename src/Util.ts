import ImageResizer from '@bam.tech/react-native-image-resizer';
import ImageEditor from '@react-native-community/image-editor';
import { Animated, PanResponder } from 'react-native';
import { CropBounds } from './components/Cropper';

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

export function clamp(n: number, min: number, max: number) {
  return n > max ? max : n < min ? min : n;
}

export type Value = Animated.Value & { _value: number; _offset: number };
export type ValueXY = Animated.ValueXY & { x: Value; y: Value };

export interface Sides {
  left?: Value;
  right?: Value;
  top?: Value;
  bottom?: Value;
}

export const createPanResponder = ({
  onCropUpdate,
  dimensions,
  scale,
  rotation,
  sides,
  onDebug,
}: {
  onCropUpdate?: () => void;
  dimensions: { w: number; h: number };
  rotation: Value;
  scale: Value;
  sides: Sides;
  onDebug?: typeof console.log;
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
      const { dx: rawDx, dy: rawDy } = gestureState;

      const s = scale._value;

      let dx = rawDx;
      let dy = rawDy;
      const r = Math.round(rotation._value * 4) % 4;
      if (r === 1) {
        dx = rawDy;
        dy = -rawDx;
      } else if (r === 2) {
        dx = -rawDx;
        dy = -rawDy;
      } else if (r === 3) {
        dx = -rawDy;
        dy = rawDx;
      }

      dx /= s;
      dy /= s;

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

      // dl /= s;
      // dr /= s;
      // dt /= s;
      // db /= s;

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
