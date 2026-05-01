import { Feather } from "@expo/vector-icons";
import React from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface HeaderProps {
  onProfilePress?: () => void;
  onLogoPress?: () => void;
}

export function Header({ onProfilePress, onLogoPress }: HeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

        {/* Profile Placeholder */}
        <TouchableOpacity
          onPress={onProfilePress}
          style={[styles.profileBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.7}
        >
          <Feather name="user" size={18} color={colors.foreground} />
        </TouchableOpacity>
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
  logo: {
    width: 36,
    height: 36,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
