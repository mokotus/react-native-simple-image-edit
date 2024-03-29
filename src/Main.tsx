import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
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

export type ImageSaveOptions = {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
};

export interface ImageEditorRef {
  rotateLeft: () => void;
  rotateRight: () => void;
  hasPendingChanges: () => boolean;
  save: (options?: ImageSaveOptions) => Promise<string>;
}
interface Props {
  ref: React.RefObject<ImageEditorRef>;
  imageSource?: ImageURISource;
  onError?: (error: ImageEditorError) => void;
  loadingIndicator?: React.ReactNode;
}

interface ImageContextProps {
  imageViewSize: SharedValue<Size | null>;
  dimensions: Size | null;
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
  loadingIndicatorContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,

    justifyContent: 'center',
    alignItems: 'center',
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
  ({ imageSource, onError, loadingIndicator }: Props, ref) => {
    const cropperLeft = useSharedValue(0);
    const cropperRight = useSharedValue(0);
    const cropperTop = useSharedValue(0);
    const cropperBottom = useSharedValue(0);

    // const imageSourceSize = useSharedValue<Size | null>(null);
    const [imageSourceSize, setImageSourceSize] = useState<Size | null>(null);

    const [imageLoading, setImageLoading] = useState<boolean>(false);

    // const containerSize = useSharedValue<Size | null>(null);
    const [containerSize, setContainerSize] = useState<Size | null>(null);

    const aspectRatio = useDerivedValue(() => {
      return (imageSourceSize?.w || 1) / (imageSourceSize?.h || 1);
    });

    const imageViewSize = useDerivedValue<Size | null>(() => {
      if (containerSize === null) return null;
      const w = Math.min(containerSize.w, containerSize.h * aspectRatio.value);
      const h = Math.min(containerSize.h, containerSize.w / aspectRatio.value);
      return { w, h };
    });

    const loadSize = (c: number = 0) => {
      if (imageSource?.uri !== undefined) {
        Image.getSize(
          imageSource.uri,
          (w, h) => {
            // iOS sometimes returns 0 for width and height. Retry.
            if ((w === 0 || h === 0) && c < 2) {
              setTimeout(() => loadSize(c + 1), 100);
            } else {
              setImageSourceSize({ w, h });
            }
          },
          () => {
            onError?.({
              name: 'ImageSizeLoadError',
              message: 'Loading image size failed',
            });
          },
        );
      }
    };

    useEffect(() => {
      loadSize();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSource?.uri]);

    const rotationTarget = useSharedValue(0);
    const rotation = useDerivedValue(() => withTiming(rotationTarget.value));

    const scale = useDerivedValue(() => {
      if (containerSize === null || imageViewSize.value === null) return 1;
      const hs = containerSize.w / imageViewSize.value.h; // Horizontal scale
      const vs = containerSize.h / imageViewSize.value.w; // Vertical scale
      const s = Math.min(hs, vs);
      return interpolate(
        Math.abs(rotation.value) % 1,
        [0, 0.25, 0.5, 0.75, 1],
        [1, s, 1, s, 1],
        Extrapolate.CLAMP,
      );
    });

    const imageValues = useMemo(
      () => ({
        imageViewSize,
        dimensions: imageSourceSize,
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
        imageSourceSize,
        rotationTarget,
        rotation,
        scale,
        imageViewSize,
        cropperLeft,
        cropperRight,
        cropperBottom,
        cropperTop,
      ],
    );

    const imageStyle = useAnimatedStyle(() => {
      return {
        width: imageViewSize.value?.w,
        height: imageViewSize.value?.h,
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

    const [oldValues, setOldValues] = useState<{
      left: number;
      right: number;
      top: number;
      bottom: number;
      rotation: number;
    } | null>(null);

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
          if (
            oldValues !== null &&
            oldValues.rotation === rotationTarget.value &&
            oldValues.left === cropperLeft.value &&
            oldValues.right === cropperRight.value &&
            oldValues.top === cropperTop.value &&
            oldValues.bottom === cropperBottom.value
          ) {
            return false;
          }
          return (
            rotationTarget.value % 1 !== 0 ||
            cropperLeft.value > 0 ||
            cropperRight.value > 0 ||
            cropperTop.value > 0 ||
            cropperBottom.value > 0
          );
        },
        async save(options?: ImageSaveOptions) {
          if (imageSource?.uri === undefined)
            return Promise.reject('Cannot save: No image URI set');
          if (imageSourceSize === null || imageViewSize.value === null)
            return Promise.reject(
              'Cannot save: Image dimensions not loaded yet',
            );

          const values = {
            rotation: rotationTarget.value,
            left: cropperLeft.value,
            right: cropperRight.value,
            top: cropperTop.value,
            bottom: cropperBottom.value,
          };

          return applyImageEdits(imageSource.uri, {
            originalWidth: imageSourceSize.w,
            originalHeight: imageSourceSize.h,
            imageWidth: imageViewSize.value.w,
            imageHeight: imageViewSize.value.h,
            rotation: values.rotation * 360,
            quality: options?.quality,
            maxWidth: options?.maxWidth,
            maxHeight: options?.maxHeight,
            cropBounds: {
              left: values.left,
              right: values.right,
              top: values.top,
              bottom: values.bottom,
            },
          }).then((url) => {
            setOldValues(values);
            return url;
          });
        },
      }),
      [
        cropperLeft,
        cropperRight,
        cropperTop,
        cropperBottom,
        imageSourceSize,
        imageSource?.uri,
        rotationTarget,
        imageViewSize?.value,
        oldValues,
      ],
    );

    return (
      <GestureHandlerRootView style={styles.gestureHandlerRoot}>
        <ImageContext.Provider value={imageValues}>
          <View
            style={styles.container}
            onLayout={(e) => {
              setContainerSize({
                w: e.nativeEvent.layout.width,
                h: e.nativeEvent.layout.height,
              });
            }}
          >
            {imageSource && (
              <Animated.Image
                source={imageSource}
                resizeMode="contain"
                style={imageStyle}
                onLoadStart={() => {
                  setImageLoading(true);
                }}
                onLoadEnd={() => {
                  setImageLoading(false);
                }}
              />
            )}
            {imageViewSize === null || imageLoading ? (
              <View style={styles.loadingIndicatorContainer}>
                {loadingIndicator}
              </View>
            ) : (
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
            )}
          </View>
        </ImageContext.Provider>
      </GestureHandlerRootView>
    );
  },
);

export default Main;
