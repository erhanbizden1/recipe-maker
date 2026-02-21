import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const FRAME_W = W * 0.80;
const FRAME_H = FRAME_W * 0.92;
const FRAME_TOP = (H - FRAME_H) / 2;
const CORNER = 44;
const THICKNESS = 4;

export default function CameraOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.frame, { top: FRAME_TOP, width: FRAME_W, height: FRAME_H }]}>
        <Corner style={styles.tl} />
        <Corner style={styles.tr} />
        <Corner style={styles.bl} />
        <Corner style={styles.br} />
      </View>
    </View>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[styles.corner, style]} />;
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    alignSelf: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FF6B2B',
  },
  tl: { top: 0, left: 0, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderTopLeftRadius: 10 },
  tr: { top: 0, right: 0, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderTopRightRadius: 10 },
  bl: { bottom: 0, left: 0, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderBottomLeftRadius: 10 },
  br: { bottom: 0, right: 0, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderBottomRightRadius: 10 },
});
