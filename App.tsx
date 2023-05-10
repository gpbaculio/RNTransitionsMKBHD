import 'react-native-gesture-handler';
import 'react-native-reanimated';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import React from 'react';

import {Transitions} from './Transitions';

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Transitions />
    </GestureHandlerRootView>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
