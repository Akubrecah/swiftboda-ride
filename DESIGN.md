---
version: 1.0.0
name: Swift Boda Obsidian & Emerald
description: Production design system tokens and visual guidelines for Swift Boda ride-hailing mobile and web apps.
colors:
  primary: "#10B981"
  primary_dark: "#059669"
  secondary: "#F59E0B"
  background: "#070A0F"
  surface: "#0E141F"
  surface_elevated: "#162031"
  surface_active: "#1E293B"
  border: "rgba(255, 255, 255, 0.08)"
  border_focus: "#10B981"
  text_primary: "#F8FAFC"
  text_secondary: "#94A3B8"
  text_muted: "#64748B"
  sos_red: "#EF4444"
  sos_red_surface: "rgba(239, 68, 68, 0.15)"
typography:
  font_family: "System"
  scale:
    xs: 11
    sm: 13
    md: 15
    lg: 18
    xl: 22
    xxl: 28
spacing:
  unit: 4
  scale:
    xs: 4
    sm: 8
    md: 16
    lg: 24
    xl: 32
rounded:
  sm: 8
  md: 12
  lg: 16
  xl: 24
  full: 9999
---

# Swift Boda - Enterprise Mobile Design System

## Overview
Swift Boda's visual language is tailored for high-contrast visibility in bright outdoor sunlight and dark nighttime rides across East Africa. It blends deep midnight obsidian dark mode with electric Nairobi emerald green and warm amber accents.

## Colors
- **Primary Emerald (`#10B981`)**: The heart of the brand. Represents speed, safety, and online status.
- **Warm Amber (`#F59E0B`)**: Ride surge indicators, ratings, and vehicle badges.
- **Deep Obsidian (`#070A0F`)**: Core canvas background ensuring high contrast and battery efficiency on OLED displays.
- **Card Surface (`#0E141F`)**: Soft elevated container for bottom sheets, booking tiles, and driver metric cards.
- **SOS Emergency Crimson (`#EF4444`)**: Reserved exclusively for panic alerts, emergency assistance, and critical ride issues.

## Elevation & Depth
- **Tactile Depth**: 1px subtle borders (`rgba(255, 255, 255, 0.08)`) with soft negative offset box shadows for true depth without jarring gradients.
- **Edge-to-Edge Safe Padding**: Tab bar and bottom action sheets dynamically adapt to hardware navigation bars and gesture insets using `react-native-safe-area-context`.

## Components
- **Tab Bar Navigation**: Semi-translucent dark glass (`#0E141F`), floating elevation, with minimum 64px touch target height plus hardware safe area inset. Active tab illuminated in Emerald (`#10B981`) with micro-dot indicator.
- **Ride Sheet**: Accessible touch targets (min 48dp), clear typography, vehicle category selection chips with price badges.
- **Action Buttons**: Full-width high-contrast emerald action buttons with haptic feedback readiness.
