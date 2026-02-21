import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export type RulerConfig = {
  start: number;
  end: number;
  major: number;
  minor: number[];
  width: number;
  renderValue: (value: number) => string;
  markColor?: string;
  labelColor?: string;
  indicatorColor?: string;
  valueColor?: string;
};

export type RulerValue = {
  value: number;
  major: number;
  minor: number;
};

type Props = {
  value: number;
  onChange: (value: number) => void;
  config: RulerConfig;
};

const RulerPicker: FC<Props> = ({ value, onChange, config }) => {
  const { major, minor, width: cmPerMark, start, end } = config;
  const minorLength = minor.length;
  const [internalValue, setInternalValue] = useState(value);
  const rulerRef = useRef<ScrollView>(null);
  const [nextScroll, setNextScroll] = useState<number>(0);
  const [nextScrollRefresh, setNextScrollRefresh] = useState<number>(0);

  const screenWidth = Dimensions.get('window').width;

  const calculateValue = useCallback(
    (tick: number) => {
      return start + (tick / minorLength) * major;
    },
    [major, minorLength, start],
  );

  useEffect(() => {
    // Scroll to the initial value when the component mounts
    scrollToValue(internalValue);
    setTimeout(() => scrollToValue(internalValue), 200);
  }, []);

  useEffect(() => {
    // Adjust when external value changes
    if (value !== internalValue) {
      setInternalValue(value);
      scrollToValue(value);
    }
  }, [value]);

  const scrollToValue = (val: number) => {
    setNextScroll(val);
    setNextScrollRefresh((prevState) => prevState + 1);
  };

  useEffect(() => {
    if (nextScrollRefresh > 0) {
      const scrollX = (nextScroll * minorLength * cmPerMark) / major;
      rulerRef.current?.scrollTo({ x: scrollX, animated: true });
    }
  }, [cmPerMark, major, minorLength, nextScroll, nextScrollRefresh]);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const newValue = calculateValue(Math.round(scrollX / cmPerMark));
    if (newValue !== internalValue) {
      setInternalValue(newValue);
      onChange(newValue);
      const options = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      };
      ReactNativeHapticFeedback.trigger('rigid', options);
    }
  };

  const renderRulerMarks = () => {
    const marks = [];
    const rulerLength = ((end - start) * minorLength) / major;
    for (let i = 0; i <= rulerLength; i += 1) {
      const height = minor[i % minorLength];
      marks.push(
        <View
          key={i}
          style={[
            styles.mark,
            { height, marginRight: config.width - 1, backgroundColor: config.markColor ?? '#000000' },
          ]}
        >
          {i % minorLength === 0 && (
            <Text style={[styles.markLabel, { color: config.labelColor ?? '#000000' }]}>
              {calculateValue(i)}
            </Text>
          )}
        </View>,
      );
    }
    return marks;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        snapToInterval={config.width}
        ref={rulerRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollStyle, { paddingHorizontal: screenWidth / 2 }]}
      >
        {renderRulerMarks()}
      </ScrollView>
      <View style={[styles.indicator, { backgroundColor: config.indicatorColor ?? 'red' }]} />
      <Text style={[styles.valueDisplay, { color: config.valueColor ?? '#000000' }]}>
        {config.renderValue(internalValue)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    width: '100%',
  },
  scrollStyle: {
    alignItems: 'flex-end',
  },
  mark: {
    overflow: 'visible',
    height: 20,
    width: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  majorMark: {
    height: 40,
  },
  minorMark: {
    height: 20,
  },
  markLabel: {
    left: -25,
    top: -20,
    textAlign: 'center',
    position: 'absolute',
    fontSize: 14,
    color: '#000000',
    width: 50,
    height: 20,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -1,
    height: 70,
    width: 2,
    backgroundColor: 'red',
  },
  valueDisplay: {
    position: 'absolute',
    top: 0,
    fontSize: 24,
    marginVertical: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default RulerPicker;
