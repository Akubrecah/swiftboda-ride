import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Swift Boda', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="compass-outline" size={48} color="#10B981" />
        </View>
        <Text style={styles.title}>Destination Off-Route</Text>
        <Text style={styles.description}>
          This screen isn&apos;t available in Swift Boda. Let&apos;s get you back to booking your ride.
        </Text>
        <Link href="/" style={styles.link}>
          <View style={styles.btn}>
            <Ionicons name="bicycle" size={18} color="#FFF" />
            <Text style={styles.btnText}>Back to Swift Boda Home</Text>
          </View>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  link: {
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
