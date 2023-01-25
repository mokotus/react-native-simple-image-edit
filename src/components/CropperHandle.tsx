import React, { useMemo, useContext } from 'react';
import { Sides } from '../Utils';
import { ImageContext } from '../Main';
import useResizeHandler from '../useResizeHandler';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

interface Props {
  sides: Sides;
  color?: boolean;
}

export default function CropperHandle({ sides, color }: Props) {
  const { left, right, top, bottom } = sides;

  // const { dimensions, rotation, scale, onDebug } = useContext(ImageContext);
  // const context = useContext(ImageContext);

  // const responder = useMemo(() => {
  //   return (
  //     rotation &&
  //     scale &&
  //     createPanResponder({
  //       onCropUpdate,
  //       dimensions,
  //       rotation,
  //       scale,
  //       sides,
  //       onDebug,
  //     })
  //   );
  // }, [dimensions, onCropUpdate, rotation, scale]);

  // onDebug?.('handle');

  const panHandler = useResizeHandler(sides);

  const size = 15;

  return (
    <PanGestureHandler onGestureEvent={panHandler}>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: bottom && -size,
          left: left && -size,
          top: top && -size,
          right: right && -size,
          width: size * 2,
          height: size * 2,
          backgroundColor: color ? 'teal' : 'gray',
          borderRadius: 100,
        }}
        // {...responder?.panHandlers}
      />
    </PanGestureHandler>
  );
}
