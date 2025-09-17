import React, {memo} from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import FastImage, {FastImageProps} from 'react-native-fast-image';

interface OptimizedImageProps extends Omit<FastImageProps, 'style'> {
  style?: ViewStyle;
  lazy?: boolean;
}

const OptimizedImage = memo<OptimizedImageProps>(({style, lazy = true, ...props}) => {
  const imageProps: FastImageProps = {
    ...props,
    style: [styles.image, style],
    resizeMode: props.resizeMode || FastImage.resizeMode.cover,
    priority: lazy ? FastImage.priority.normal : FastImage.priority.high,
  };

  return <FastImage {...imageProps} />;
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f0f0f0',
  },
});

export default OptimizedImage;