import { Animated } from 'react-native';
import React, { useMemo, useContext } from 'react';
import { createPanResponder, Sides, Value } from '../Util';
import { ImageContext } from '../Main';

interface Props {
  sides: Sides;
  onCropUpdate?: () => void;
  color?: boolean;
}

export default function CropperHandle({ sides, onCropUpdate, color }: Props) {
  const { left, right, top, bottom } = sides;

  const { dimensions, rotation, scale, onDebug } = useContext(ImageContext);

  const responder = useMemo(() => {
    return (
      rotation &&
      scale &&
      createPanResponder({
        onCropUpdate,
        dimensions,
        rotation,
        scale,
        sides,
        onDebug,
      })
    );
  }, [dimensions, onCropUpdate, rotation, scale]);

  // onDebug?.('handle');

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
        backgroundColor: color ? 'orange' : 'gray',
        borderRadius: 100,
      }}
      {...responder?.panHandlers}
    />
  );
}
