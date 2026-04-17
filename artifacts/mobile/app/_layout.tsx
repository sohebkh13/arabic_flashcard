import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { AppProvider } from "@/context/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Explicitly load Feather icon font so icons render in Expo Go on physical devices
    Feather: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: colorScheme === "dark" ? "#0f0f1a" : "#f5f5f0",
                    },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="deck/[id]" options={{ headerShown: false, presentation: "card" }} />
                  <Stack.Screen name="create-card" options={{ headerShown: false, presentation: "modal" }} />
                  <Stack.Screen name="review" options={{ headerShown: false, presentation: "fullScreenModal" }} />
                  <Stack.Screen name="card/[id]" options={{ headerShown: false, presentation: "card" }} />
                </Stack>
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
