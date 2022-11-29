import {
  View,
  Image,
  StyleSheet,
  ImageURISource,
  Animated,
  Button,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

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
    <View style={styles.container}>
      <Animated.Image
        source={imageSource}
        style={[
          { width: dimensions?.w, height: dimensions?.h },
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
        resizeMode="contain"
      />
      <View style={styles.buttonRow}>
        <Button
          title="rotate"
          onPress={() => {
            setRotationTarget((rotTarget) => rotTarget + 0.25);
          }}
        />
      </View>
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
