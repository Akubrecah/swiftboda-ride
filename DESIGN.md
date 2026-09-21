---
version: 1.1.0
name: Swift Boda Obsidian Emerald & Daylight Pearl
description: Production design system tokens and visual guidelines for Swift Boda ride-hailing mobile application supporting dynamic Light, Dark, and System appearance modes.
colors:
  dark:
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
    card_bg: "#0E141F"
    card_border: "rgba(255, 255, 255, 0.08)"
    input_bg: "#090D16"
    input_border: "rgba(255, 255, 255, 0.12)"
    badge_bg: "rgba(16, 185, 129, 0.12)"
    sos_red: "#EF4444"
    sos_red_surface: "rgba(239, 68, 68, 0.15)"
  light:
    primary: "#059669"
    primary_dark: "#047857"
    secondary: "#D97706"
    background: "#F8FAFC"
    surface: "#FFFFFF"
    surface_elevated: "#F1F5F9"
    surface_active: "#E2E8F0"
    border: "rgba(0, 0, 0, 0.08)"
    border_focus: "#059669"
    text_primary: "#0F172A"
    text_secondary: "#475569"
    text_muted: "#64748B"
    card_bg: "#FFFFFF"
    card_border: "rgba(0, 0, 0, 0.08)"
    input_bg: "#F1F5F9"
    input_border: "rgba(0, 0, 0, 0.12)"
    badge_bg: "rgba(5, 150, 105, 0.12)"
    sos_red: "#DC2626"
    sos_red_surface: "rgba(220, 38, 38, 0.12)"
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
Swift Boda's visual language is tailored for high-contrast visibility in bright outdoor equatorial sunlight and dark nighttime rides across East Africa. It provides dual curated themes:
1. **Obsidian & Emerald (Dark Mode)**: Deep midnight canvas (`#070A0F`), soft elevated surfaces (`#0E141F`), and electric Nairobi emerald accents (`#10B981`) for battery-efficient OLED displays.
2. **Daylight Pearl & Forest (Light Mode)**: Crisp porcelain backdrop (`#F8FAFC`), pure white elevated cards (`#FFFFFF`), rich slate typography (`#0F172A`), and high-contrast forest emerald (`#059669`) for glaring daylight visibility.

## Color Tokens Specification

| Token | Dark Mode Value | Light Mode Value | Usage |
|---|---|---|---|
| `primary` | `#10B981` | `#059669` | Primary action buttons, active tabs, brand indicators |
| `primary_dark` | `#059669` | `#047857` | Pressed states, active pill backgrounds |
| `secondary` | `#F59E0B` | `#D97706` | Ratings, surge multiplier chips, warning badges |
| `background` | `#070A0F` | `#F8FAFC` | Root app viewport canvas |
| `surface` | `#0E141F` | `#FFFFFF` | Primary card containers, modals, bottom sheets |
| `surface_elevated` | `#162031` | `#F1F5F9` | Secondary cards, pill buttons, search bars |
| `surface_active` | `#1E293B` | `#E2E8F0` | Selected list items, highlighted segments |
| `border` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` | Subtle container outline borders |
| `border_focus` | `#10B981` | `#059669` | Active input borders, highlighted boundaries |
| `text_primary` | `#F8FAFC` | `#0F172A` | Screen headers, titles, high-emphasis text |
| `text_secondary` | `#94A3B8` | `#475569` | Sub-labels, secondary descriptions, metadata |
| `text_muted` | `#64748B` | `#64748B` | Timestamps, placeholder text, hints |
| `sos_red` | `#EF4444` | `#DC2626` | Emergency SOS triggers, critical errors |
| `sos_red_surface` | `rgba(239, 68, 68, 0.15)` | `rgba(220, 38, 38, 0.12)` | SOS alert backgrounds |

## Elevation & Depth
- **Tactile Depth**: 1px borders with subtle box-shadows tuned per mode. In Dark Mode, glowing emerald accents provide contrast; in Light Mode, soft ambient shadows (`rgba(0, 0, 0, 0.06)`) define elevation.
- **Edge-to-Edge Safe Padding**: Top headers and bottom tab bars dynamically adapt to hardware status bar and gesture navigation insets using `react-native-safe-area-context`.

## Theme Switcher Experience
The user can select from three modes in Account Settings:
- **System (Default)**: Automatically tracks Android device OS dark/light appearance.
- **Light**: Forces clean high-contrast daytime pearl theme.
- **Dark**: Forces pitch-black obsidian theme.
All selections persist in local secure storage (`@swiftboda_theme_mode`) across app backgrounding and process recreation.

