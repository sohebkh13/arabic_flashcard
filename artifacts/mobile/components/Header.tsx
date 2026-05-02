import { Feather } from "@expo/vector-icons";
import React from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, UserButton } from "@clerk/clerk-expo";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  onLogoPress?: () => void;
}

export function Header({ onLogoPress }: HeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  async function handleLogoPress() {
    // Notify parent that logo was pressed
    onLogoPress?.();
    // Reset landing-view flag so logo navigates back to the landing screen
    try {
      await AsyncStorage.setItem("tarjim_seen_landing", "false");
    } catch {}
  }

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Logo + App Name (clickable) */}
        <TouchableOpacity
          style={styles.branding}
          onPress={handleLogoPress}
          activeOpacity={0.7}
        >
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Tarjim
          </Text>
        </TouchableOpacity>

        {/* Right actions */}
        <View style={styles.rightActions}>
          {/* Theme Toggle */}
          <TouchableOpacity
            onPress={() => toggleTheme()}
            style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
          >
            <Feather name={isDark ? "sun" : "moon"} size={16} color={colors.foreground} />
          </TouchableOpacity>

          {/* Profile/Auth Section */}
          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/(auth)/sign-in"
              appearance={{
                elements: {
                  avatarBox: "user-button-avatar",
                  button: "user-button-button",
                } as any,
                colors: {
                  background: colors.secondary,
                  foreground: colors.foreground,
                  primary: colors.primary,
                  primaryForeground: colors.primaryForeground,
                } as any,
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              style={[styles.authBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 12, fontWeight: "700" }}>
                Sign In
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  branding: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  authBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
