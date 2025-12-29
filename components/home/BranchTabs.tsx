import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/design';
import { DEFAULT_BRANCHES } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface BranchTabsProps {
    selectedBranch: string;
    onSelect: (branch: string) => void;
    branches?: string[];
}

export const BranchTabs = ({ selectedBranch, onSelect, branches }: BranchTabsProps) => {
    const { theme, mode } = useTheme();
    const [containerWidth, setContainerWidth] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const TABS = useMemo(() => [...(branches || DEFAULT_BRANCHES || []), 'Together'], [branches]);
    const activeIndex = TABS.indexOf(selectedBranch);
    const padding = 4;

    useEffect(() => {
        if (containerWidth > 0) {
            const availableWidth = containerWidth - (padding * 2);
            const tabWidth = availableWidth / TABS.length;

            Animated.spring(slideAnim, {
                toValue: tabWidth * activeIndex,
                useNativeDriver: true,
                speed: 15,
                bounciness: 6,
            }).start();
        }
    }, [activeIndex, containerWidth]);

    return (
        <View
            style={[styles.container, {
                backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.5)',
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.3)',
            }]}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            {/* Sliding Indicator */}
            {containerWidth > 0 && (
                <Animated.View
                    style={[
                        styles.activeTabIndicator,
                        {
                            width: (containerWidth - (padding * 2)) / TABS.length,
                            transform: [{ translateX: slideAnim }]
                        }
                    ]}
                />
            )}

            {TABS.map((tab) => {
                const isActive = selectedBranch === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => onSelect(tab)}
                        style={styles.tab}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: isActive ? COLORS.white : theme.textSecondary },
                            isActive && styles.activeTabText
                        ]}>
                            {tab === 'Together' ? 'Together' : tab.replace(' Stadium', '').replace(' Sports', '')}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 25,
        padding: 4,
        borderWidth: 1,
        position: 'relative',
    },
    activeTabIndicator: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        backgroundColor: COLORS.indigo600,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activeTabText: {
        fontWeight: '700',
    },
});
