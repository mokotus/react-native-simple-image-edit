import { Animated } from 'react-native';
import React, { useMemo } from 'react';
import { createPanResponder, Sides, Value } from '../Util';
import { CropBounds } from './Cropper';

interface Props {
  sides: Sides;
  onCropUpdate?: () => void;
  dimensions: { w: number; h: number };
}

export default function CropperHandle({
  sides,
  onCropUpdate,
  dimensions,
}: Props) {
  const { left, right, top, bottom } = sides;

  const responder = useMemo(
    () =>
      createPanResponder({
        onCropUpdate,
        dimensions,
        sides,
      }),
    [dimensions, onCropUpdate, sides],
  );

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: bottom && -20,
        left: left && -20,
        top: top && -20,
        right: right && -20,
        width: 40,
        height: 40,
        backgroundColor: 'gray',
        borderRadius: 100,
      }}
      {...responder.panHandlers}
    />
  );
}
