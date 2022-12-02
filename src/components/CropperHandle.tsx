import { Animated } from 'react-native';
import React, { useMemo } from 'react';
import { createPanResponder, Sides, Value } from '../Util';

interface Props {
  sides: Sides;
  onCropUpdate?: () => void;
  dimensions: { w: number; h: number };
  rotation: Value;
}

export default function CropperHandle({
  sides,
  onCropUpdate,
  dimensions,
  rotation,
}: Props) {
  const { left, right, top, bottom } = sides;

  const responder = useMemo(
    () =>
      createPanResponder({
        onCropUpdate,
        dimensions,
        rotation,
        sides,
      }),
    [dimensions, onCropUpdate, sides, rotation],
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
