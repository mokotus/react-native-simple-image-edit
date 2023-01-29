import React from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import useResizeHandler from '../useResizeHandler';
import { Sides } from '../Utils';

interface Props {
  sides: Sides;
}

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
  },
});

export default function CropperHandle({ sides }: Props) {
  const { left, right, top, bottom } = sides;

  const panHandler = useResizeHandler(sides);

  const size = 15;

  return (
    <PanGestureHandler onGestureEvent={panHandler}>
      <Animated.View
        style={[
          styles.handle,
          {
            bottom: bottom && -size,
            left: left && -size,
            top: top && -size,
            right: right && -size,
            width: size * 2,
            height: size * 2,
          },
        ]}
      />
    </PanGestureHandler>
  );
}
