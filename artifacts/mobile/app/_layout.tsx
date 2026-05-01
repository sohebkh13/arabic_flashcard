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
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Ensure icon glyphs are available on all platforms, including web.
Feather.loadFont().catch(() => {});

function KeyboardProviderCompat({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }
  return <KeyboardProvider>{children}</KeyboardProvider>;
}

function AppShell() {
  const colors = useColors();
  const { resolvedTheme, ready } = useTheme();

  React.useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ThemeToggleButton />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="deck/[id]" options={{ headerShown: false, presentation: "card" }} />
          <Stack.Screen name="create-card" options={{ headerShown: false, presentation: "modal" }} />
          <Stack.Screen name="review" options={{ headerShown: false, presentation: "fullScreenModal" }} />
          <Stack.Screen name="card/[id]" options={{ headerShown: false, presentation: "card" }} />
        </Stack>
      </View>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProviderCompat>
              <ThemeProvider>
                <AppProvider>
                  <AppShell />
                </AppProvider>
              </ThemeProvider>
            </KeyboardProviderCompat>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
