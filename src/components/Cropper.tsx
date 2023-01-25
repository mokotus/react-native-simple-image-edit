import {
  Image,
  ImageURISource,
  PanResponder,
  PanResponderInstance,
  Text,
  View,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from 'react';
import CropperHandle from './CropperHandle';
import { ImageContext } from '../Main';
import Animated, {
  SharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import useResizeHandler from '../useResizeHandler';

export interface CropBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Props {
  imageSource?: ImageURISource;
  onBoundsChanged?: (bounds: CropBounds) => void;
  left: SharedValue<number>;
  right: SharedValue<number>;
  top: SharedValue<number>;
  bottom: SharedValue<number>;
}

export default function Cropper({
  imageSource,
  onBoundsChanged,
  left,
  right,
  top,
  bottom,
}: Props) {
  // const pan = useRef<ValueXY>(new Animated.ValueXY() as ValueXY).current;
  // const dims = useRef<ValueXY>(
  //   new Animated.ValueXY({
  //     x: 400,
  //     y: 400,
  //   }) as ValueXY,
  // ).current;

  // const left = useMemo(() => new Animated.Value(10), []) as Value;
  // const right = useMemo(() => new Animated.Value(10), []) as Value;
  // const top = useMemo(() => new Animated.Value(10), []) as Value;
  // const bottom = useMemo(() => new Animated.Value(10), []) as Value;

  const minW = 200;
  const minH = 200;

  const context = useContext(ImageContext);

  // const updateBounds = useCallback(() => {
  //   onBoundsChanged?.({
  //     left: (left as Value)._value,
  //     right: (right as Value)._value,
  //     top: (top as Value)._value,
  //     bottom: (bottom as Value)._value,
  //   });
  // }, [onBoundsChanged, left, right, top, bottom]);

  // const generalPan = useMemo(
  //   () =>
  //     rotation &&
  //     scale &&
  //     createPanResponder({
  //       onCropUpdate: updateBounds,
  //       dimensions,
  //       rotation,
  //       scale,
  //       sides: {
  //         left,
  //         right,
  //         top,
  //         bottom,
  //       },
  //     }),
  //   [updateBounds, left, right, top, bottom, dimensions, rotation, scale],
  // );

  // const mainPanHandler = useAnimatedGestureHandler<
  //   PanGestureHandlerGestureEvent,
  //   { left: number; right: number; top: number; bottom: number }
  // >({
  //   onStart: (_, ctx) => {
  //     ctx.left = left.value;
  //     ctx.right = right.value;
  //     ctx.top = top.value;
  //     ctx.bottom = bottom.value;
  //   },
  //   onActive: (event, ctx) => {
  //     left.value = ctx.left + event.translationX;
  //     right.value = ctx.right - event.translationX;
  //     top.value = ctx.top + event.translationY;
  //     bottom.value = ctx.bottom - event.translationY;
  //   },
  //   onEnd: (_) => {
  //     // x.value = withSpring(0);
  //     console.log('end', top.value, bottom.value);
  //   },
  // });

  const mainPanHandler = useResizeHandler({ left, right, top, bottom });

  const cropperStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value,
    right: right.value,
    top: top.value,
    bottom: bottom.value,
    // width: 100,
    // height: 100,
    // minHeight: 100,
    borderColor: 'white',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  }));

  if (!context) {
    return null;
  }

  return (
    <PanGestureHandler onGestureEvent={mainPanHandler}>
      <Animated.View style={cropperStyle} collapsable={false}>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            overflow: 'hidden',
          }}
        >
          {/* {imageSource && (
              <Animated.Image
                source={imageSource}
                style={[
                  {
                    position: 'absolute',
                    left: Animated.multiply(left, -1),
                    top: Animated.multiply(top, -1),
                    width: dimensions.w,
                    height: dimensions.h,
                  },
                  {
                    transform: [
                      {
                        rotate: rotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                      {
                        scale,
                      },
                    ],
                  },
                ]}
              />
            )} */}
        </Animated.View>
        {/* Top row */}
        <CropperHandle sides={{ top, left }} />
        <CropperHandle sides={{ top }} />
        <CropperHandle sides={{ top, right }} />
        {/* Mid row */}
        <CropperHandle color sides={{ left }} />
        <CropperHandle sides={{ right }} />
        {/* Bottom row */}
        <CropperHandle sides={{ bottom, left }} />
        <CropperHandle sides={{ bottom }} />
        <CropperHandle sides={{ bottom, right }} />
      </Animated.View>
      {/* <CropperHandle
          sides={{ right, top }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        <CropperHandle
          sides={{ left, top }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        /> */}
    </PanGestureHandler>
  );
}
