import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn, isLoaded, user, signOut } = useAuth();
  const { cards, decks } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/(auth)/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect
  }

  function getDisplayName(): string {
    if (!user) return "User";
    const firstName = user.firstName;
    const lastName = user.lastName;
    const fallback = user.username || user.emailAddresses[0]?.emailAddress || "User";
    return [firstName, lastName].filter(Boolean).join(" ") || fallback;
  }

  function getInitials(): string {
    if (!user) return "U";
    const firstName = user.firstName?.[0] || "";
    const lastName = user.lastName?.[0] || "";
    if (firstName && lastName) return `${firstName}${lastName}`.toUpperCase();
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) return email[0].toUpperCase();
    return "U";
  }

  async function handleSignOut() {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Sign out of your account?");
      if (!confirmed) return;
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: performSignOut },
      ]);
      return;
    }
    await performSignOut();
  }

  async function performSignOut() {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  }

  function openEmailClient() {
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) return;
    // For native apps, you could use Linking.openURL(`mailto:${email}...`)
    // For now, we'll just copy to clipboard or show an alert
    Alert.alert("Contact Support", `Email: ${email}\n\nWe'll add full contact functionality soon.`);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Account</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 24 }]}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{getInitials()}</Text>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>{getDisplayName()}</Text>
          {user?.emailAddresses[0]?.emailAddress && (
            <Text style={[styles.email, { color: colors.mutedForeground }]}>
              {user.emailAddresses[0].emailAddress}
            </Text>
          )}
        </View>

        {/* Account Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{cards.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{decks.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Decks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>--</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Settings / Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/(tabs)/settings")}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={20} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Settings</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={openEmailClient}
            activeOpacity={0.7}
          >
            <Feather name="mail" size={20} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Contact Support</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.destructive }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>Tarjim v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
  },
  statsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  actionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    marginTop: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  version: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
