import React from 'react';
import { Pressable, ViewStyle, Animated, StyleProp } from 'react-native';

interface ScalePressProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    scaleTo?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ScalePress = ({ children, style, onPress, scaleTo = 0.96 }: ScalePressProps) => {
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleValue, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[style, { transform: [{ scale: scaleValue }] }]}
        >
            {children}
        </AnimatedPressable>
    );
};
