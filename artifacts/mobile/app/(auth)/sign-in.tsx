import React from "react";
import { View, StyleSheet } from "react-native";
import { SignIn } from "@clerk/clerk-expo";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SignIn
        forceRedirect
        routing="path"
        path="/sign-in"
        afterSignInUrl="/"
        appearance={{
          elements: {
            rootBox: "clerk-root-box",
            card: "clerk-card",
          } as any,
          colors: {
            background: colors.background,
            text: colors.foreground,
            textSecondary: colors.mutedForeground,
            primary: colors.primary,
            primaryForeground: colors.primaryForeground,
            inputBackground: colors.card,
            inputBorder: colors.border,
            inputText: colors.foreground,
            buttonBackground: colors.primary,
            buttonText: colors.primaryForeground,
          } as any,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
});
