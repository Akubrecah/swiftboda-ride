import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Ensure comfortable clearance above hardware buttons / gesture navigation on modern Android & iOS
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const tabHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#0E141F',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          position: 'relative',
          elevation: 25,
          zIndex: 999,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ride',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconGlow]}>
              <Ionicons name={focused ? 'bicycle' : 'bicycle-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconGlow]}>
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconGlow]}>
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconGlow]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 30,
    borderRadius: 15,
  },
  activeIconGlow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
});
