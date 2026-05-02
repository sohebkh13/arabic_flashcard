import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="sign-in" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="sign-up" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="sign-in-callback" options={{ presentation: "fullScreenModal" }} />
    </Stack>
  );
}
