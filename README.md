# Prava — Track Your Progress

> **A minimal, athletic, and private offline personal gym and progress tracker built with React Native, Expo, Expo Router, and TypeScript.**

---

## 📖 Overview

**Prava** is designed as a focused, offline-first personal health, training, and progress utility. Guided by the principles of **Discipline Builds Freedom** and **Track Your Progress**, it answers three fundamental questions:

1. **What did I train?** — Log daily workouts with multi-selectable muscle groups and optional notes in seconds.
2. **How is my body changing?** — Track body weight history, delta changes, and periodic progress photos with side-by-side Before/After comparisons.
3. **How is my training progressing over time?** — Monthly calendar overview with subtle green workout day highlights, training frequency dots, and interactive weight trend graphs.

It also includes a **Confidential Private Section** protected by a 4-digit PIN with custom daily Yes/No check-in questions that can be set as a prerequisite for logging workouts.

---

## 🛠️ Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 57)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking)
- **Aesthetics & Blur**: `expo-blur` (Apple Liquid Glass design), custom design tokens
- **Icons & Haptics**: `@expo/vector-icons`, `expo-haptics`
- **Media**: `expo-image-picker`

---

## 📱 Core Features

- **Fluid Glass Optical Navigation Bar**: Translucent floating pill bottom tab bar engineered with optical transmission principles from the Fluid Glass specification (`expo-blur` backdrop transmission, top specular curvature reflection, chromatic dispersion sheen, and active frosted liquid capsule with micro-sheen).
- **Home Dashboard**: Personalized greeting with profile name, today's workout status glass card, body weight card with change delta, and progress photo tracker.
- **Workout Logging**: Quick selection of 8 muscle groups (`Chest`, `Back`, `Biceps`, `Triceps`, `Shoulders`, `Legs`, `Forearms`, `Abs`) and optional notes.
- **Critical Private Check-in Interception**: If enabled and uncompleted for the day, logging a workout automatically requests PIN authentication and answers to active private questions before saving.
- **Monthly Workout Calendar with Green Highlighting**: Days with recorded workouts are highlighted with a calm, subtle emerald green tint and indicator dot.
- **Progress & Metrics**:
  - Weight metric summary card with height reference.
  - Interactive line chart with `30D`, `3M`, `6M`, and `1Y` range filters.
  - Quick weight update modal with direct input and `+0.1`, `-0.1`, `+0.5`, `-0.5` adjustment steppers.
  - Progress photo timeline and **Before & After side-by-side comparison mode**.
- **Expanded Profile Details**:
  - Identity Glass Card with avatar initials.
  - Editable fields for **Full Name**, **Email Address**, **Home Gym / Location**, **Training Goal**, **Target Weight (kg)**, and **Height (cm)**.
- **Confidential Private Area**: Hidden from main navigation, PIN protected with reliable device keyboard opening + Apple-style minimal on-screen keypad, custom PIN creation and verification, with full question management (Add, Edit, Toggle, Delete).
- **Appearance & Theme**: Full dynamic support for **System**, **Light**, and **Dark** modes.
- **Local Reminders & Offline Backup**: Local notification reminder settings and mock local archive export/import.

---

## 🚀 How to Run the Project

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v20.x` or `v22.x` (Recommended: Node `v22.12.0+`)
- **npm** or **yarn**

---

### Step 1: Install Dependencies

```bash
npm install
```

---

### Step 2: Start the Expo Development Server

```bash
npx expo start
```

This will launch Metro Bundler and display a QR code in your terminal.

---

### Step 3: Run on Your Preferred Platform

#### Option A: Run on Android Emulator or Physical Device

- **Physical Device**: Install the **Expo Go** app from the Google Play Store on your Android phone and scan the QR code.
- **Android Emulator**: Press <kbd>a</kbd> in the terminal or run:
  ```bash
  npx expo start --android
  ```

#### Option B: Run in Web Browser

Press <kbd>w</kbd> in the terminal or run:

```bash
npx expo start --web
```

---

## 🧪 Testing the Frontend Demo Flows

1. **Log a Workout & Test Private Prerequisite**:

   - On the **Home** screen, tap **Start Workout**.
   - Select muscle groups (e.g., `Back` and `Biceps`) and add optional notes.
   - Tap **Save Workout**.
   - The confidential PIN modal will appear.
   - Set up your 4-digit PIN (or enter your configured PIN).
   - Answer the Yes/No questions and tap **Save & Complete Workout**.
   - Notice the workout is saved and appears on the Home screen.
2. **Test Workout History & Green Calendar Days**:

   - Go to the **History** tab.
   - Look at the calendar: workout days (such as Oct 4, Oct 3, Oct 1) are visibly highlighted in calm emerald green with a matching indicator dot.
   - Tap any workout date to view details or an unrecorded date to view the rest day state.
3. **Test Expanded Profile**:

   - Go to the **Profile** tab.
   - View your Identity Glass card showing Name, Email, and Gym Name.
   - Tap **Edit** or any profile row to change your Name, Email, Gym Name, Training Goal, Target Weight, and Height.
4. **Test Weight Trend & Progress Photos**:

   - Go to the **Progress** tab.
   - Switch between `30D`, `3M`, `6M`, and `1Y` filters on the weight chart.
   - Tap **Compare** in the Progress Photos section, select 2 photos, and tap **Compare** to view the side-by-side Before/After modal.

---

## 🔒 Security & Privacy Notice

All data currently operates in an isolated mock layer in-memory on the device. When Phase 2 is connected, all storage will remain 100% local (SQLite + encrypted on-device storage) with zero third-party cloud synchronization or tracking.
