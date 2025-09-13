import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Sides } from './Utils';
import { useContext } from 'react';
import { ImageContext } from './Main';

export default function useResizeHandler(sides: Sides) {
  const { left, right, top, bottom } = sides;

  const imageContext = useContext(ImageContext);

  const contextRef = useSharedValue({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  return Gesture.Pan()
    .onBegin(() => {
      'worklet';
      contextRef.value = {
        left: left?.value || 0,
        right: right?.value || 0,
        top: top?.value || 0,
        bottom: bottom?.value || 0,
      };
    })
    .onUpdate((event) => {
      'worklet';
      const ctx = contextRef.value;
      const rawDx = event.translationX;
      const rawDy = event.translationY;

      if (!imageContext) return;
      const {
        scale,
        rotation,
        rotationTarget,
        dimensions,
        minCropperSize,
        imageViewSize,
        cropperSides,
      } = imageContext;
      if (dimensions === null) return;
      if (rotation.value !== rotationTarget.value) return;
      if (imageViewSize.value === null) return;

      const clamp = (n: number, min: number, max: number) =>
        n > max ? max : n < min ? min : n;

      let dx = rawDx;
      let dy = rawDy;
      const r = Math.round(rotationTarget.value * 4) % 4;

      if (r === 1 || r === -3) {
        dx = rawDy;
        dy = -rawDx;
      } else if (r === 2 || r === -2) {
        dx = -rawDx;
        dy = -rawDy;
      } else if (r === 3 || r === -1) {
        dx = -rawDy;
        dy = rawDx;
      }

      dx /= scale.value;
      dy /= scale.value;

      const { w, h } = minCropperSize;

      // Clamp values within bounds
      let dl = left
        ? clamp(
            dx,
            -ctx.left,
            -ctx.left +
              imageViewSize.value.w -
              (right ? 0 : cropperSides.right.value + w),
          )
        : 0;
      let dr = right
        ? clamp(
            -dx,
            -ctx.right,
            -ctx.right +
              imageViewSize.value.w -
              (left ? 0 : cropperSides.left.value + w),
          )
        : 0;
      let dt = top
        ? clamp(
            dy,
            -ctx.top,
            -ctx.top +
              imageViewSize.value.h -
              (bottom ? 0 : cropperSides.bottom.value + h),
          )
        : 0;
      let db = bottom
        ? clamp(
            -dy,
            -ctx.bottom,
            -ctx.bottom +
              imageViewSize.value.h -
              (top ? 0 : cropperSides.top.value + h),
          )
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

      if (left) left.value = ctx.left + dl;
      if (right) right.value = ctx.right + dr;
      if (top) top.value = ctx.top + dt;
      if (bottom) bottom.value = ctx.bottom + db;
    });
}
