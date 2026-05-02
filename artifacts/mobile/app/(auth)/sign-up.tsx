import React from "react";
import { View, StyleSheet } from "react-native";
import { SignUp } from "@clerk/clerk-expo";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SignUp
        forceRedirect
        routing="path"
        path="/sign-up"
        afterSignUpUrl="/"
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
