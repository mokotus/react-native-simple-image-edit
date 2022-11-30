import {
  Animated,
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
} from 'react';
import { clamp, createPanResponder, Value } from '../Util';
import CropperHandle from './CropperHandle';

export interface CropBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Props {
  imageSource?: ImageURISource;
  dimensions: { w: number; h: number };
  position: { x: number; y: number };
  onBoundsChanged?: (bounds: CropBounds) => void;
}

type ValueXY = Animated.ValueXY & { _value: number };

type Side = 'all' | 'left' | 'right' | 'top' | 'bottom';

export default function Cropper({
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

  const left = useMemo(() => new Animated.Value(10), []) as Value;
  const right = useMemo(() => new Animated.Value(10), []) as Value;
  const top = useMemo(() => new Animated.Value(10), []) as Value;
  const bottom = useMemo(() => new Animated.Value(10), []) as Value;

  const minW = 200;
  const minH = 200;

  const updateBounds = useCallback(() => {
    onBoundsChanged?.({
      left: (left as Value)._value,
      right: (right as Value)._value,
      top: (top as Value)._value,
      bottom: (bottom as Value)._value,
    });
  }, [onBoundsChanged, left, right, top, bottom]);

  // const createPanResponder = useCallback(
  //   (sides: Side[]) => {
  //     const l = sides.some((side) => side === 'left' || side === 'all');
  //     const r = sides.some((side) => side === 'right' || side === 'all');
  //     const t = sides.some((side) => side === 'top' || side === 'all');
  //     const b = sides.some((side) => side === 'bottom' || side === 'all');

  //     return PanResponder.create({
  //       onMoveShouldSetPanResponder: () => true,
  //       onPanResponderGrant: () => {
  //         left.setOffset((left as Value)._value);
  //         right.setOffset((right as Value)._value);
  //         top.setOffset((top as Value)._value);
  //         bottom.setOffset((bottom as Value)._value);
  //       },
  //       onPanResponderMove: (e, gestureState) => {
  //         const { dx, dy } = gestureState;

  //         const lv = (left as Value)._offset;
  //         const tv = (top as Value)._offset;
  //         const rv = (right as Value)._offset;
  //         const bv = (bottom as Value)._offset;

  //         // Clamp values within bounds
  //         let dl = l ? clamp(dx, -lv, dimensions.w - lv) : 0;
  //         let dr = r ? clamp(-dx, -rv, dimensions.w - rv) : 0;
  //         let dt = t ? clamp(dy, -tv, dimensions.h - tv) : 0;
  //         let db = b ? clamp(-dy, -bv, dimensions.h - bv) : 0;

  //         // Preserve width if both horizontal edges are active
  //         if (l && r) {
  //           if (Math.abs(dl) > Math.abs(dr)) {
  //             dl = -dr;
  //           } else {
  //             dr = -dl;
  //           }
  //         }

  //         // Preserve height if both vertical edges are active
  //         if (t && b) {
  //           if (Math.abs(dt) > Math.abs(db)) {
  //             dt = -db;
  //           } else {
  //             db = -dt;
  //           }
  //         }

  //         return Animated.event(
  //           [{ dl: left, dr: right, dt: top, db: bottom }],
  //           {
  //             useNativeDriver: false,
  //           },
  //         )({
  //           dl,
  //           dr,
  //           dt,
  //           db,
  //         });
  //       },
  //       onPanResponderRelease: () => {
  //         left.flattenOffset();
  //         right.flattenOffset();
  //         top.flattenOffset();
  //         bottom.flattenOffset();

  //         updateBounds();
  //       },
  //     });
  //   },
  //   [updateBounds, top, left, right, bottom, dimensions],
  // );

  // const responders = useMemo<{ [s: string]: PanResponderInstance }>(
  //   () => ({
  //     general: createPanResponder(['all']),
  //     topRight: createPanResponder(['top', 'right']),
  //     bottomRight: createPanResponder(['bottom', 'right']),
  //   }),
  //   [createPanResponder],
  // );

  // const responders = useMemo(
  //   () => ({
  //     general: createPanResponder(['all']),
  //     topLeft: createPanResponder(['top', 'left']),
  //     topRight: createPanResponder(['top', 'right']),
  //   }),
  //   [createPanResponder],
  // );

  const [yy, setYy] = useState(0);
  useEffect(() => {
    const listener = pan.addListener((xy) => {
      // setYy(xy.y);
    });

    return () => pan.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const [limits, setLimits] = useState({

  // })

  const [w, setW] = useState(400);
  const [h, setH] = useState(400);

  useEffect(() => {
    const listener = dims.addListener((val) => {
      setW(clamp(val.x, 0, dimensions.w - position.x));
      setYy(new Date().getSeconds());
      setH(clamp(val.y, 0, dimensions.h - position.y));
    });

    return () => dims.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const w =
  //   position && dimensions
  //     ? dims.x.interpolate({
  //         inputRange: [0, Math.max(dimensions.w - position.x, 0)],
  //         outputRange: [0, Math.max(dimensions.w - position.x, 0)],
  //         extrapolate: 'clamp',
  //       })
  //     : dims.x;

  // const h =
  //   position && dimensions
  //     ? dims.y.interpolate({
  //         inputRange: [0, Math.max(dimensions.h - position.y, 0)],
  //         outputRange: [0, Math.max(dimensions.h - position.y, 0)],
  //         extrapolate: 'clamp',
  //       })
  //     : dims.y;

  // const x =
  //   position && dimensions
  //     ? pan.x.interpolate({
  //         inputRange: [0, Math.max(dimensions.w - w, 0)],
  //         outputRange: [0, Math.max(dimensions.w - w, 0)],
  //         extrapolate: 'clamp',
  //       })
  //     : pan.x;

  // const y =
  //   position && dimensions
  //     ? pan.y.interpolate({
  //         inputRange: [0, Math.max(dimensions.h - h, 0)],
  //         outputRange: [0, Math.max(dimensions.h - h, 0)],
  //         extrapolate: 'clamp',
  //       })
  //     : pan.y;

  const generalPan = useMemo(
    () =>
      createPanResponder({
        onCropUpdate: updateBounds,
        dimensions,
        sides: {
          left,
          right,
          top,
          bottom,
        },
      }),
    [updateBounds, left, right, top, bottom, dimensions],
  );

  return (
    <>
      <Animated.View // TODO:
        style={[
          {
            position: 'absolute',
            left,
            top,
            right,
            bottom,
            borderColor: 'red',
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            overflow: 'hidden',
          }}
          {...generalPan.panHandlers}
        >
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
            ]}
          />
        </Animated.View>
        {/* Top row */}
        <CropperHandle
          sides={{ top, left }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        <CropperHandle
          sides={{ top }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        <CropperHandle
          sides={{ top, right }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        {/* Mid row */}
        <CropperHandle
          sides={{ left }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        <CropperHandle
          sides={{ right }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        {/* Bottom row */}
        <CropperHandle
          sides={{ bottom, left }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        <CropperHandle
          sides={{ bottom }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        <CropperHandle
          sides={{ bottom, right }}
          onCropUpdate={updateBounds}
          dimensions={dimensions}
        />
        <Text>{yy}</Text>
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
    </>
  );
}
