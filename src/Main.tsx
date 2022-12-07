import {
  View,
  Image,
  StyleSheet,
  ImageURISource,
  Animated,
  // Text,
  Button,
} from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Cropper, { CropBounds } from './components/Cropper';
import { applyImageEdits, Value, ValueXY } from './Util';
interface Props {
  imageSource?: ImageURISource;
  afterSave: () => void;
  onDebug?: typeof console.log;
}

interface ImageContextProps {
  dimensions: { w: number; h: number };
  rotationTarget: number;
  rotation?: Value;
  scale?: Value;
  onDebug?: typeof console.log;
}

export const ImageContext = React.createContext<ImageContextProps>({
  dimensions: { w: 1, h: 1 },
  rotationTarget: 0,
});

export default function Main({ imageSource, afterSave, onDebug }: Props) {
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null,
  );

  const [containerDims, setContainerDims] = useState({ w: 1, h: 1 });

  const aspectRatio = (dimensions?.w || 1) / (dimensions?.h || 1);

  const imageWidth = Math.min(containerDims.w, containerDims.h * aspectRatio);
  const imageHeight = Math.min(containerDims.h, containerDims.w / aspectRatio);

  const resizedDimensions = useMemo(
    () => new Animated.ValueXY(),
    [],
  ) as ValueXY;

  const scale = useMemo(() => new Animated.Value(1), []) as Value;

  // Load image dimensions
  useEffect(() => {
    if (!dimensions && imageSource?.uri) {
      Image.getSize(
        imageSource.uri,
        (w, h) => {
          setDimensions({ w, h });
          resizedDimensions.setValue({ x: w, y: h });
        },
        () => {
          // TODO: Error
        },
      );
    }
  }, [dimensions, setDimensions, imageSource?.uri, resizedDimensions]);

  const rotation = useMemo(() => new Animated.Value(0), []) as Value;
  const [rotationTarget, setRotationTarget] = useState(0);

  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Apply image spin animation
  useEffect(() => {
    Animated.timing(rotation, {
      toValue: rotationTarget,
      duration: 300,
      easing: (x) => 1 - (1 - x) ** 3,
      useNativeDriver: false,
    }).start(() => {
      if (rotationTarget >= 1) {
        rotation.setValue(rotationTarget % 1);
        setRotationTarget((rotTarget) => rotTarget % 1);
      }
    });
  }, [rotation, rotationTarget]);

  useEffect(() => {
    if (!dimensions) {
      return;
    }

    const flipped = Math.round((rotationTarget % 1) * 4) % 2 === 1;

    // onDebug?.('rot', rotationTarget);

    Animated.timing(scale, {
      toValue: flipped ? containerDims.h / imageWidth : 1,
      duration: 300,
      easing: (x) => 1 - (1 - x) ** 3,
      useNativeDriver: false,
    }).start();

    // Animated.timing(resizedDimensions, {
    //   toValue: { x: flipped ? h : w, y: flipped ? w : h },
    //   duration: 300,
    //   easing: (x) => 1 - (1 - x) ** 3,
    //   useNativeDriver: false,
    // }).start();
  }, [rotationTarget, dimensions, scale, containerDims, imageWidth]);

  const [cropBounds, setCropBounds] = useState<CropBounds | null>(null);

  const imageValues = useMemo(
    () => ({
      dimensions: dimensions || { w: 1, h: 1 },
      rotationTarget,
      rotation,
      scale,
      onDebug,
    }),
    [dimensions, rotationTarget, rotation, scale, onDebug],
  );

  return (
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
              setRotationTarget((rt) => rt + 0.25);
            }}
          />
          <Button
            title="save"
            onPress={() => {
              if (imageSource?.uri && dimensions && cropBounds) {
                applyImageEdits(imageSource.uri, {
                  originalWidth: dimensions.w,
                  originalHeight: dimensions.h,
                  imageWidth,
                  imageHeight,
                  rotation: rotationTarget * 360,
                  cropBounds,
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
            onDebug?.('layout');
            setPosition({
              x: e.nativeEvent.layout.x,
              y: e.nativeEvent.layout.y,
            });
            setContainerDims({
              w: e.nativeEvent.layout.width,
              h: e.nativeEvent.layout.height,
            });
          }}
        >
          {imageSource && (
            <Animated.Image
              source={imageSource}
              resizeMode="contain"
              style={[
                {
                  width: imageWidth,
                  height: imageHeight,
                  // flex: 1,
                  // width: '100%',
                  // height: '100%',
                  opacity: 0.6,
                  borderColor: 'yellow',
                  borderWidth: 1,
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
            <Animated.View
              style={[
                {
                  width: imageWidth,
                  height: imageHeight,
                  borderColor: 'blue',
                  borderWidth: 1,
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
            >
              {dimensions && position && (
                <Cropper
                  imageSource={imageSource}
                  onBoundsChanged={setCropBounds}
                />
              )}
            </Animated.View>
          </View>
        </View>
      </View>
    </ImageContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: 'black',
    flex: 1,
  },
  buttonRow: {
    width: '100%',
    minHeight: 80,
    backgroundColor: 'yellow',
    flexDirection: 'row',
  },
});
