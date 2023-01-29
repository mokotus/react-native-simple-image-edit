import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { Image, ImageURISource, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Cropper from './components/Cropper';
import { applyImageEdits } from './Utils';

interface ImageEditorError extends Error {
  name: 'ImageSizeLoadError';
}

export interface ImageEditorRef {
  rotateLeft: () => void;
  rotateRight: () => void;
  hasPendingChanges: () => boolean;
  save: () => Promise<string>;
}
interface Props {
  ref: React.RefObject<ImageEditorRef>;
  imageSource?: ImageURISource;
  onError?: (error: ImageEditorError) => void;
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

interface Size {
  w: number;
  h: number;
}

export const ImageContext = React.createContext<ImageContextProps | null>(null);

const styles = StyleSheet.create({
  gestureHandlerRoot: {
    flex: 1,
  },
  container: {
    backgroundColor: 'black',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropperContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'black',
    opacity: 0.5,
  },
});

const Main = forwardRef<ImageEditorRef, Props>(
  ({ imageSource, onError }: Props, ref) => {
    const cropperLeft = useSharedValue(0);
    const cropperRight = useSharedValue(0);
    const cropperTop = useSharedValue(0);
    const cropperBottom = useSharedValue(0);

    const dimensions = useSharedValue<Size | null>(null);

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

    const resizedDimensions = useSharedValue<{ w: number; h: number }>({
      w: 0,
      h: 0,
    });

    // Load image dimensions
    useEffect(() => {
      if (imageSource?.uri !== undefined) {
        Image.getSize(
          imageSource.uri,
          (w, h) => {
            dimensions.value = { w, h };
            resizedDimensions.value = { w, h };
          },
          () => {
            onError?.({
              name: 'ImageSizeLoadError',
              message: 'Loading image size failed',
            });
          },
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSource?.uri]);

    const rotationTarget = useSharedValue(0);
    const rotation = useDerivedValue(() => withTiming(rotationTarget.value));

    const scale = useDerivedValue(() => {
      const hs = containerDims.value.w / imageHeight.value; // Horizontal scale
      const vs = containerDims.value.h / imageWidth.value; // Vertical scale
      const s = Math.min(hs, vs);
      return interpolate(
        rotation.value % 1,
        [0, 0.25, 0.5, 0.75, 1],
        [1, s, 1, s, 1],
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
        minCropperSize: { w: 64, h: 64 },
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
        width: imageWidth.value,
        height: imageHeight.value,
        position: 'relative',
        transform: [
          {
            rotate: interpolate(rotation.value, [0, 1], [0, 360]) + 'deg',
          },
          {
            scale: scale.value,
          },
        ],
      };
    });

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

    useImperativeHandle(
      ref,
      () => ({
        rotateRight() {
          rotationTarget.value += 0.25;
        },
        rotateLeft() {
          rotationTarget.value -= 0.25;
        },
        hasPendingChanges() {
          return (
            rotationTarget.value % 1 !== 0 ||
            cropperLeft.value > 0 ||
            cropperRight.value > 0 ||
            cropperTop.value > 0 ||
            cropperBottom.value > 0
          );
        },
        async save() {
          if (imageSource?.uri === undefined)
            return Promise.reject('Cannot save: No image URI set');
          if (dimensions.value === null)
            return Promise.reject(
              'Cannot save: Image dimensions not loaded yet',
            );
          return applyImageEdits(imageSource.uri, {
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
          });
        },
      }),
      [
        cropperLeft,
        cropperRight,
        cropperTop,
        cropperBottom,
        dimensions,
        imageSource?.uri,
        rotationTarget,
        imageWidth,
        imageHeight,
      ],
    );

    return (
      <GestureHandlerRootView style={styles.gestureHandlerRoot}>
        <ImageContext.Provider value={imageValues}>
          <View
            style={styles.container}
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
            <View style={styles.cropperContainer}>
              <Animated.View style={imageStyle}>
                <Animated.View style={[styles.shadow, shadowLeftStyle]} />
                <Animated.View style={[styles.shadow, shadowRightStyle]} />
                <Animated.View style={[styles.shadow, shadowTopStyle]} />
                <Animated.View style={[styles.shadow, shadowBottomStyle]} />
                <Cropper
                  left={cropperLeft}
                  right={cropperRight}
                  top={cropperTop}
                  bottom={cropperBottom}
                />
              </Animated.View>
            </View>
          </View>
        </ImageContext.Provider>
      </GestureHandlerRootView>
    );
  },
);

export default Main;
