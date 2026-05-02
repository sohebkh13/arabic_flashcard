import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

Feather.loadFont().catch(() => {});

if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @font-face {
      font-family: 'Feather';
      src: url('/fonts/Feather.ttf') format('truetype');
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

function KeyboardProviderCompat({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") return <>{children}</>;
  return <KeyboardProvider>{children}</KeyboardProvider>;
}

// Landing gate - checks if user has seen landing page
function LandingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  const [landingSeen, setLandingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.getItem("tarjim_seen_landing")
        .then((v) => setLandingSeen(v === "true"))
        .catch(() => setLandingSeen(false));
    }
  }, [isLoaded]);

  if (!isLoaded || landingSeen === null) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
        {/* Minimal splash while loading */}
      </View>
    );
  }

  if (!landingSeen) {
    return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="landing" /></Stack>;
  }

  return <>{children}</>;
}

function AppContent() {
  const colors = useColors();
  const { resolvedTheme, ready } = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="deck/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="create-card" options={{ presentation: "modal" }} />
          <Stack.Screen name="review" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="card/[id]" options={{ presentation: "card" }} />
        </Stack>
      </View>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProviderCompat>
                <ThemeProvider>
                  <AppProvider>
                    <LandingGate>
                      <AppContent />
                    </LandingGate>
                  </AppProvider>
                </ThemeProvider>
              </KeyboardProviderCompat>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}