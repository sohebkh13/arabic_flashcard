import React from "react";
import { View, StyleSheet } from "react-native";
import { UserProfile } from "@clerk/clerk-expo";
import { useColors } from "@/hooks/useColors";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountScreen() {
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <UserProfile
        routing="path"
        path="/account"
        appearance={{
          elements: {
            rootBox: "clerk-root-box",
            avatarBox: "clerk-avatar-box",
            avatarImage: "clerk-avatar-image",
            name: "clerk-name",
            email: "clerk-email",
            navbar: "clerk-navbar",
            navbarButton: "clerk-navbar-button",
            navbarButtonText: "clerk-navbar-button-text",
            form: "clerk-form",
            formField: "clerk-form-field",
            formFieldLabel: "clerk-form-label",
            formFieldInput: "clerk-form-input",
            formButton: "clerk-form-button",
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
