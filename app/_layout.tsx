import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider } from "@/lib/language-context";
import { LicenseProvider, useLicense } from "@/lib/license-context";

SplashScreen.preventAutoHideAsync();

import { useRouter, useSegments } from "expo-router";

function RootLayoutNav() {
  const { isValid, isValidating } = useLicense();
  const segments = useSegments();
  const router = useRouter();
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkIntro() {
      try {
        const seen = await AsyncStorage.getItem("hasSeenIntro");
        setHasSeenIntro(seen === "true");
      } catch (e) {
        setHasSeenIntro(false);
      }
    }
    checkIntro();
  }, []);

  // Keep splash screen while validating
  useEffect(() => {
    if (!isValidating && hasSeenIntro !== null) {
      SplashScreen.hideAsync();
    }
  }, [isValidating, hasSeenIntro]);

  // Route guarding
  useEffect(() => {
    if (isValidating || hasSeenIntro === null) return;

    const inIntro = segments[0] === "intro";
    const inLicenseGate = segments[0] === "license-gate";

    if (!hasSeenIntro && !inIntro) {
      router.replace("/intro");
      return;
    }

    if (hasSeenIntro) {
      if (isValid === false && !inLicenseGate && !inIntro) {
        router.replace("/license-gate");
      } else if (isValid === true && (inLicenseGate || inIntro)) {
        router.replace("/login");
      }
    }
  }, [isValid, isValidating, segments, hasSeenIntro]);

  if (isValidating || hasSeenIntro === null) {
    return null; // Return nothing while splash screen is visible
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="intro" options={{ headerShown: false }} />
      <Stack.Screen name="license-gate" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Splash hide moved to RootLayoutNav to wait for license validation

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <LanguageProvider>
              <LicenseProvider>
                <AuthProvider>
                  <CartProvider>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                  </CartProvider>
                </AuthProvider>
              </LicenseProvider>
            </LanguageProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
