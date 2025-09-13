import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ImageContext } from '../Main';
import useResizeHandler from '../useResizeHandler';
import CropperHandle from './CropperHandle';

export interface CropBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Props {
  left: SharedValue<number>;
  right: SharedValue<number>;
  top: SharedValue<number>;
  bottom: SharedValue<number>;
}

const HANDLE_THICKNESS = 4;
const HANDLE_WIDTH = 16;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    flex: 1,
  },
  gridCell: {
    borderWidth: 1,
    borderColor: 'white',
    flex: 1,
  },
  handleColumn: {
    justifyContent: 'space-between',
    flexShrink: 1,
  },
  handleRight: {
    flexShrink: 1,
    borderColor: 'white',
    width: HANDLE_WIDTH,
    height: HANDLE_WIDTH,
    borderRightWidth: HANDLE_THICKNESS,
  },
  handleLeft: {
    flexShrink: 1,
    borderColor: 'white',
    width: HANDLE_WIDTH,
    height: HANDLE_WIDTH,
    borderLeftWidth: HANDLE_THICKNESS,
  },
  handleTop: {
    flexShrink: 1,
    borderColor: 'white',
    width: HANDLE_WIDTH,
    height: HANDLE_WIDTH,
    borderTopWidth: HANDLE_THICKNESS,
  },
  handleBottom: {
    flexShrink: 1,
    borderColor: 'white',
    width: HANDLE_WIDTH,
    height: HANDLE_WIDTH,
    borderBottomWidth: HANDLE_THICKNESS,
  },
  handleRowLeft: {},
});

export default function Cropper({ left, right, top, bottom }: Props) {
  const context = useContext(ImageContext);

  const mainPanHandler = useResizeHandler({ left, right, top, bottom });

  const cropperStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value,
    right: right.value,
    top: top.value,
    bottom: bottom.value,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'white',
  }));

  if (!context) {
    return null;
  }

  return (
    <GestureDetector gesture={mainPanHandler}>
      <Animated.View style={cropperStyle} collapsable={false}>
        <Animated.View style={styles.overlay}>
          <View style={styles.gridColumn}>
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
          </View>
          <View style={styles.gridColumn}>
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
          </View>
          <View style={styles.gridColumn}>
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
          </View>
        </Animated.View>
        <Animated.View style={styles.overlay}>
          <View style={styles.handleColumn}>
            <View style={[styles.handleLeft, styles.handleTop]} />
            <View style={[styles.handleLeft]} />
            <View style={[styles.handleLeft, styles.handleBottom]} />
          </View>
          <View style={styles.handleColumn}>
            <View style={styles.handleTop} />
            <View style={styles.handleBottom} />
          </View>
          <View style={styles.handleColumn}>
            <View style={[styles.handleRight, styles.handleTop]} />
            <View style={[styles.handleRight]} />
            <View style={[styles.handleRight, styles.handleBottom]} />
          </View>
        </Animated.View>
        {/* Top row */}
        <CropperHandle sides={{ top, left }} />
        <CropperHandle sides={{ top }} />
        <CropperHandle sides={{ top, right }} />
        {/* Mid row */}
        <CropperHandle sides={{ left }} />
        <CropperHandle sides={{ right }} />
        {/* Bottom row */}
        <CropperHandle sides={{ bottom, left }} />
        <CropperHandle sides={{ bottom }} />
        <CropperHandle sides={{ bottom, right }} />
      </Animated.View>
    </GestureDetector>
  );
}
