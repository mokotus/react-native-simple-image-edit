import {
  View,
  Image,
  StyleSheet,
  ImageURISource,
  // Text,
  Button,
  Text,
} from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { CropBounds } from './components/Cropper';
import { applyImageEdits } from './Utils';
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
interface Props {
  imageSource?: ImageURISource;
  afterSave: (uri: string) => void;
  onDebug?: typeof console.log;
}

interface ImageContextProps {
  imageWidth: SharedValue<number>;
  imageHeight: SharedValue<number>;
  dimensions: SharedValue<Size | null>;
  rotationTarget: SharedValue<number>;
  rotation: SharedValue<number>;
  scale: SharedValue<number>;
  minCropperSize: Size;
  cropperSides: {
    left: SharedValue<number>;
    right: SharedValue<number>;
    top: SharedValue<number>;
    bottom: SharedValue<number>;
  };
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  w: number;
  h: number;
}

export const ImageContext = React.createContext<ImageContextProps | null>(null);

export default function Main({ imageSource, afterSave }: Props) {
  // const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
  //   null,
  // );

  const cropperLeft = useSharedValue(0);
  const cropperRight = useSharedValue(0);
  const cropperTop = useSharedValue(0);
  const cropperBottom = useSharedValue(0);

  const dimensions = useSharedValue<Size | null>(null);

  // const [containerDims, setContainerDims] = useState({ w: 1, h: 1 });
  const containerDims = useSharedValue<Size>({
    w: 1,
    h: 1,
  });

  const aspectRatio = useDerivedValue(() => {
    return (dimensions.value?.w || 1) / (dimensions.value?.h || 1);
  });

  const imageWidth = useDerivedValue(() => {
    return Math.min(
      containerDims.value.w,
      containerDims.value.h * aspectRatio.value,
    );
  });

  const imageHeight = useDerivedValue(() => {
    return Math.min(
      containerDims.value.h,
      containerDims.value.w / aspectRatio.value,
    );
  });

  // const resizedDimensions = useMemo(
  //   () => new Animated.ValueXY(),
  //   [],
  // ) as ValueXY;

  const resizedDimensions = useSharedValue<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  // const scale = useMemo(() => new Animated.Value(1), []) as Value;

  // Load image dimensions
  useEffect(() => {
    if (dimensions.value === null && imageSource?.uri) {
      Image.getSize(
        imageSource.uri,
        (w, h) => {
          console.log('LOAD', w, h);
          // setDimensions({ w, h });
          dimensions.value = { w, h };
          // resizedDimensions.setValue({ x: w, y: h });
          resizedDimensions.value = { w, h };
        },
        () => {
          // TODO: Error
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSource?.uri]);

  // const rotation = useMemo(() => new Animated.Value(0), []) as Value;
  // const [rotationTarget, setRotationTarget] = useState(0);
  const rotationTarget = useSharedValue(0);
  // const rotation = useSharedValue(0);
  const rotation = useDerivedValue(() => withTiming(rotationTarget.value));
  // const rotation = useDerivedValue(() =>
  //   withTiming(rotationTarget.value, {}, (finished) => {
  //     if (finished) rotationTarget.value = rotationTarget.value % 1;
  //   }),
  // )
  // const rotation = useDerivedValue(() => );
  // const rotation = useDerivedValue(() => {
  //   return withTiming(rotationTarget.value);
  // });

  const position = useSharedValue<Position>({ x: 0, y: 0 });
  // const [position, setPosition] = useState({ x: 0, y: 0 });

  // Apply image spin animation
  // useEffect(() => {
  //   Animated.timing(rotation, {
  //     toValue: rotationTarget,
  //     duration: 300,
  //     easing: (x) => 1 - (1 - x) ** 3,
  //     useNativeDriver: false,
  //   }).start(() => {
  //     if (rotationTarget >= 1) {
  //       rotation.setValue(rotationTarget % 1);
  //       setRotationTarget((rotTarget) => rotTarget % 1);
  //     }
  //   });
  // }, [rotation, rotationTarget]);

  // useEffect(() => {
  //   if (!dimensions) {
  //     return;
  //   }

  //   // const flipped = Math.round((rotationTarget % 1) * 4) % 2 === 1;

  //   // onDebug?.('rot', rotationTarget);

  //   // Animated.timing(scale, {
  //   //   toValue: flipped ? containerDims.h / imageWidth : 1,
  //   //   duration: 300,
  //   //   easing: (x) => 1 - (1 - x) ** 3,
  //   //   useNativeDriver: false,
  //   // }).start();

  //   // Animated.timing(resizedDimensions, {
  //   //   toValue: { x: flipped ? h : w, y: flipped ? w : h },
  //   //   duration: 300,
  //   //   easing: (x) => 1 - (1 - x) ** 3,
  //   //   useNativeDriver: false,
  //   // }).start();
  // }, [rotationTarget, dimensions, scale, containerDims, imageWidth]);

  // const [cropBounds, setCropBounds] = useState<CropBounds | null>(null);

  const scale = useDerivedValue(() => {
    const vs = containerDims.value.h / imageWidth.value; // Vertical scale
    return interpolate(
      rotation.value % 1,
      [0, 0.25, 0.5, 0.75, 1],
      [1, vs, 1, vs, 1],
      Extrapolate.CLAMP,
    );
  });

  const imageValues = useMemo(
    () => ({
      imageWidth,
      imageHeight,
      dimensions,
      rotationTarget,
      rotation,
      scale,
      minCropperSize: { w: 40, h: 40 },
      cropperSides: {
        left: cropperLeft,
        right: cropperRight,
        top: cropperTop,
        bottom: cropperBottom,
      },
    }),
    [
      dimensions,
      rotationTarget,
      rotation,
      scale,
      imageWidth,
      imageHeight,
      cropperLeft,
      cropperRight,
      cropperBottom,
      cropperTop,
    ],
  );

  const imageStyle = useAnimatedStyle(() => {
    return {
      // width: 100,
      // height: 100,
      width: imageWidth.value,
      height: imageHeight.value,
      // flex: 1,
      // width: '100%',
      // height: '100%',
      position: 'relative',
      borderColor: 'yellow',
      borderWidth: 2,
      transform: [
        {
          rotate: interpolate(rotation.value, [0, 1], [0, 360]) + 'deg',
          // rotate: rotation.value,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  const shadowStyles = useAnimatedStyle(() => ({
    position: 'absolute',
    backgroundColor: 'black',
    opacity: 0.5,
  }));

  const shadowLeftStyle = useAnimatedStyle(() => ({
    width: cropperLeft.value,
    left: 0,
    top: 0,
    bottom: 0,
  }));

  const shadowRightStyle = useAnimatedStyle(() => ({
    width: cropperRight.value,
    right: 0,
    top: 0,
    bottom: 0,
  }));

  const shadowTopStyle = useAnimatedStyle(() => ({
    height: cropperTop.value,
    right: cropperRight.value,
    left: cropperLeft.value,
    top: 0,
  }));

  const shadowBottomStyle = useAnimatedStyle(() => ({
    height: cropperBottom.value,
    right: cropperRight.value,
    left: cropperLeft.value,
    bottom: 0,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageContext.Provider value={imageValues}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'black',
          }}
        >
          <View style={{ minHeight: 80, flexDirection: 'row' }}>
            <Button
              title="right"
              onPress={() => {
                console.log('right');
                rotationTarget.value = rotationTarget.value + 0.25;
              }}
            />
            <Button
              title="save"
              onPress={() => {
                if (imageSource?.uri && dimensions.value) {
                  applyImageEdits(imageSource.uri, {
                    originalWidth: dimensions.value.w,
                    originalHeight: dimensions.value.h,
                    imageWidth: imageWidth.value,
                    imageHeight: imageHeight.value,
                    rotation: rotationTarget.value * 360,
                    cropBounds: {
                      left: cropperLeft.value,
                      right: cropperRight.value,
                      top: cropperTop.value,
                      bottom: cropperBottom.value,
                    },
                  }).then(afterSave);
                }
              }}
            />
          </View>
          {/* <MaskedView
        androidRenderingMode="software"
        style={{
          flex: 1,
          flexDirection: 'row',
        }}
        maskElement={
          <View
            style={{
              // Transparent background because mask is based off alpha channel.
              backgroundColor: 'transparent',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: 'black',
                opacity: 0.1,
              }}
            />
            <View
              style={{
                width: 150,
                height: 150,
                backgroundColor: 'black',
              }}
            ></View>
          </View>
        }
      >
              </MaskedView> */}
          <View
            style={{
              borderWidth: 1,
              borderColor: 'red',
              flex: 1,
              margin: 40,
              // marginHorizontal: 200,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onLayout={(e) => {
              containerDims.value = {
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              };
            }}
          >
            {imageSource && (
              <Animated.Image
                source={imageSource}
                resizeMode="contain"
                style={imageStyle}
              />
            )}

            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                borderColor: 'green',
                borderWidth: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Animated.View style={imageStyle}>
                <Animated.View style={[shadowStyles, shadowLeftStyle]} />
                <Animated.View style={[shadowStyles, shadowRightStyle]} />
                <Animated.View style={[shadowStyles, shadowTopStyle]} />
                <Animated.View style={[shadowStyles, shadowBottomStyle]} />
                <Cropper
                  imageSource={imageSource}
                  left={cropperLeft}
                  right={cropperRight}
                  top={cropperTop}
                  bottom={cropperBottom}
                  // onBoundsChanged={setCropBounds}
                />
              </Animated.View>
            </View>
          </View>
        </View>
      </ImageContext.Provider>
    </GestureHandlerRootView>
  );
}
