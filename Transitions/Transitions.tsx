import React, {useCallback, useMemo, useState} from 'react';
import {Dimensions, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Fill,
  ImageShader,
  Shader,
  SkRuntimeEffect,
  clamp,
} from '@shopify/react-native-skia';

import {snapPoint} from './Math';
import {
  transition,
  cube,
  pageCurl,
  glitchMemories,
  swirl,
  swap,
} from './transitions/index';
import {useAssets} from './Assets';

const {width, height} = Dimensions.get('window');
const transitions = [
  cube,
  pageCurl,
  cube,
  glitchMemories,
  swirl,
  swap,
  cube,
].map(t => transition(t));

/*
 // Example usage:
const arr = [1, 2, 3, 4, 5];
console.log(getElementAtIndex(arr, 7)); // Output: 3
console.log(getElementAtIndex(arr, -2)); // Output: 4
*/
const at = <T,>(array: T[], index: number) => {
  'worklet';
  if (array === null) {
    return null;
  }
  if (array.length === 0) {
    throw new Error('Array is empty.');
  }
  const result = ((index % array.length) + array.length) % array.length;
  return array[result];
};

export const Transitions = () => {
  const offset = useSharedValue(0);
  const progressLeft = useSharedValue(0);
  const progressRight = useSharedValue(0);
  const assets = useAssets();
  const panRight = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(5)
        .onChange(pos => {
          progressRight.value = clamp(
            progressRight.value + pos.changeX / width,
            0,
            1,
          );
          console.log('onRight');
        })
        .onEnd(({velocityX}) => {
          const dst = snapPoint(progressRight.value, velocityX / width, [0, 1]);
          progressRight.value = withTiming(dst, {duration: 250}, () => {
            if (dst === 1) {
              offset.value -= 1;
              progressRight.value = 0;
            }
          });
        }),
    [offset, progressRight],
  );
  const panLeft = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(-5)
        .onChange(pos => {
          progressLeft.value = clamp(
            progressLeft.value - pos.changeX / width,
            0,
            1,
          );
          console.log('onLeft');
        })
        .onEnd(({velocityX}) => {
          const dst = snapPoint(progressLeft.value, -velocityX / width, [0, 1]);
          progressLeft.value = withTiming(dst, {duration: 250}, () => {
            if (dst === 1) {
              offset.value += 1;
              progressLeft.value = 0;
            }
          });
        }),
    [offset, progressLeft],
  );

  const uniformsLeft = useDerivedValue(() => {
    return {
      progress: progressLeft.value,
      resolution: [width, height],
    };
  });

  const uniformsRight = useDerivedValue(() => {
    return {
      progress: progressRight.value,
      resolution: [width, height],
    };
  });

  const transition1 = useDerivedValue(() => {
    return at(transitions, offset.value - 1);
  });

  const transition2 = useDerivedValue(() => {
    return at(transitions, offset.value);
  });

  const asset1 = useDerivedValue(() => {
    return at(assets!, offset.value - 1);
  });
  const asset2 = useDerivedValue(() => {
    return at(assets!, offset.value);
  });
  const asset3 = useDerivedValue(() => {
    return at(assets!, offset.value + 1);
  });

  if (!assets) {
    return null;
  }
  return (
    <Animated.View style={{flex: 1}}>
      <GestureDetector gesture={Gesture.Race(panLeft, panRight)}>
        <Canvas style={{flex: 1}}>
          <Fill>
            <Shader
              source={
                transition1! as Readonly<Animated.SharedValue<SkRuntimeEffect>>
              }
              uniforms={uniformsRight}>
              <Shader
                source={
                  transition2! as Readonly<
                    Animated.SharedValue<SkRuntimeEffect>
                  >
                }
                uniforms={uniformsLeft}>
                <ImageShader
                  image={asset2}
                  fit="cover"
                  width={width}
                  height={height}
                />
                <ImageShader
                  image={asset3}
                  fit="cover"
                  width={width}
                  height={height}
                />
              </Shader>
              <ImageShader
                image={asset1}
                fit="cover"
                width={width}
                height={height}
              />
            </Shader>
          </Fill>
        </Canvas>
      </GestureDetector>
    </Animated.View>
  );
};
