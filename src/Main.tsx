import {
  View,
  Image,
  StyleSheet,
  ImageURISource,
  Animated,
  // Text,
  Button,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import CropOverlay from './components/CropOverlay';
interface Props {
  imageSource?: ImageURISource;
}

export default function Main({ imageSource }: Props) {
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null,
  );

  // Load image dimensions
  useEffect(() => {
    if (!dimensions && imageSource?.uri) {
      Image.getSize(
        imageSource.uri,
        (w, h) => {
          setDimensions({ w, h });
        },
        () => {
          // TODO: Error
        },
      );
    }
  }, [dimensions, setDimensions, imageSource?.uri]);

  const rotation = useRef(new Animated.Value(0)).current;
  const [rotationTarget, setRotationTarget] = useState(0);

  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Apply image spin animation
  useEffect(() => {
    Animated.timing(rotation, {
      toValue: rotationTarget,
      duration: 300,
      easing: (x) => 1 - (1 - x) ** 3,
      useNativeDriver: true,
    }).start(() => {
      if (rotationTarget >= 1) {
        rotation.setValue(rotationTarget % 1);
        setRotationTarget((rotTarget) => rotTarget % 1);
      }
    });
  }, [rotation, rotationTarget]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'black',
      }}
    >
      <View style={{ minHeight: 80, flexDirection: 'row' }}>
        <Button
          title="left"
          onPress={() => {
            setRotationTarget((rt) => rt + 0.25);
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
      <Animated.Image
        source={imageSource}
        onLayout={(e) => {
          setPosition({
            x: e.nativeEvent.layout.x,
            y: e.nativeEvent.layout.y,
          });
        }}
        style={[
          { width: dimensions?.w, height: dimensions?.h, opacity: 0.3 },
          {
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      />
      <CropOverlay
        imageSource={imageSource}
        dimensions={dimensions || undefined}
        position={position}
      />
    </View>
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
