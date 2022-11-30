import {
  Animated,
  Image,
  ImageURISource,
  PanResponder,
  Text,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  imageSource?: ImageURISource;
  dimensions?: { w: number; h: number };
  position?: { x: number; y: number };
  onBoundsChanged?: (bounds: CropBounds) => void;
}

type ValueXY = Animated.ValueXY & { _value: number };
type Value = Animated.Value & { _value: number };

export default function CropOverlay({
  imageSource,
  dimensions,
  position,
  onBoundsChanged,
}: Props) {
  const pan = useRef<ValueXY>(new Animated.ValueXY() as ValueXY).current;
  const dims = useRef<ValueXY>(
    new Animated.ValueXY({
      x: 400,
      y: 400,
    }) as ValueXY,
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as Value)._value,
          y: (pan.y as Value)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        onBoundsChanged?.({
          x: (pan.x as Value)._value,
          y: (pan.y as Value)._value,
          width: (dims.x as Value)._value,
          height: (dims.y as Value)._value,
        });
      },
    }),
  ).current;

  const bottomResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dims.setOffset({
          x: (dims.x as Value)._value,
          y: (dims.y as Value)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: dims.x, dy: dims.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        dims.flattenOffset();
      },
    }),
  ).current;

  const [yy, setYy] = useState(0);
  useEffect(() => {
    pan.addListener((xy) => {
      setYy(xy.y);
    });
  }, [pan]);

  return (
    <>
      <Animated.View // TODO:
        style={[
          {
            position: 'absolute',
            left: pan.x,
            top: pan.y,
            width: dims.x,
            height: dims.y,
            // bottom: bottom._value,
            borderColor: 'red',
            borderWidth: 1,
          },
          {
            transform: [
              // {
              //   rotate: rotation.interpolate({
              //     inputRange: [0, 1],
              //     outputRange: ['0deg', '360deg'],
              //   }),
              // },
              // {
              //   translateX: pan.x,
              // },
              // {
              //   translateY: pan.y,
              // },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            overflow: 'hidden',
          }}
        >
          {/* <Animated.Image
            source={imageSource}
            style={[
              {
                // width: '100%',
                // height: '100%',
                position: 'absolute',
                left: position?.x || 0,
                top: position?.y || 0,
                width: dimensions?.w,
                height: dimensions?.h,
                // left: -(pan.x as Value)._value,
                // top: -(pan.y as Value)._value,
              },
              {
                transform: [
                  // {
                  //   rotate: rotation.interpolate({
                  //     inputRange: [0, 1],
                  //     outputRange: ['0deg', '360deg'],
                  //   }),
                  // },
                  {
                    translateX: Animated.multiply(pan.x, -1),
                  },
                  {
                    translateY: Animated.multiply(pan.y, -1),
                  },
                ],
              },
            ]}
          /> */}
        </View>
        <Text>{yy}</Text>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: Animated.subtract(Animated.add(pan.y, dims.y), 20),
            left: Animated.subtract(Animated.add(pan.x, dims.x), 20),
            width: 40,
            height: 40,
            backgroundColor: 'red',
          },
          {
            transform: [
              // {
              //   translateX: br.x,
              // },
              // {
              //   translateY: bottom,
              // },
            ],
          },
        ]}
        {...bottomResponder.panHandlers}
      ></Animated.View>
    </>
  );
}
