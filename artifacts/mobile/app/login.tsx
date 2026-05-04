import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const LANDING_FLAG = "tarjim_seen_landing";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded } = useAuth();

  async function handleSignUp() {
    try {
      await AsyncStorage.setItem(LANDING_FLAG, "true");
    } catch {}
    router.push("/(auth)/sign-up");
  }

  async function handleSignIn() {
    try {
      await AsyncStorage.setItem(LANDING_FLAG, "true");
    } catch {}
    router.push("/(auth)/sign-in");
  }

  async function handleContinueAsGuest() {
    try {
      await AsyncStorage.setItem(LANDING_FLAG, "true");
    } catch {}
    router.push("/(tabs)");
  }

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Image source={require("@/assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background decoration */}
      <View style={[styles.bgCircle, { backgroundColor: colors.primary }]} />
      <View style={[styles.bgCircle2, { backgroundColor: colors.secondary }]} />

      {/* Logo + Title */}
      <View style={styles.headerSection}>
        <Image source={require("@/assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.foreground }]}>Tarjim</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Master Arabic vocabulary through spaced repetition
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actions, { paddingBottom: Platform.OS === "web" ? 60 : insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleSignUp}
          activeOpacity={0.8}
        >
          <Feather name="user-plus" size={20} color={colors.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleSignIn}
          activeOpacity={0.7}
        >
          <Feather name="log-in" size={20} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={handleContinueAsGuest}
          activeOpacity={0.7}
        >
          <Text style={[styles.ghostBtnText, { color: colors.mutedForeground }]}>Continue as Guest</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  bgCircle: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -100,
    left: -100,
    opacity: 0.15,
  },
  bgCircle2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: -50,
    right: -80,
    opacity: 0.12,
  },
  headerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    tintColor: "white",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: "90%",
  },
  actions: {
    paddingHorizontal: 24,
    gap: 12,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  ghostBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    paddingBottom: 12,
    paddingHorizontal: 40,
  },
});
