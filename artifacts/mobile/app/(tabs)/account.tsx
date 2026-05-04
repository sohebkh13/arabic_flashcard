import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: Platform.OS === "web" ? colors.card : "transparent" }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>Account</Text>
            </View>
            <View style={styles.emptyState}>
              <Feather name="user" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Not Signed In</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Sign in to manage your profile and sync your flashcards.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(auth)/sign-in")}
              >
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: Platform.OS === "web" ? colors.card : "transparent" }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Account</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {user?.firstName ? `${user.firstName} ${user?.lastName || ""}`.trim() : "User"}
              </Text>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>
                {user?.emailAddresses?.[0]?.emailAddress || "No email"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signOutBtn, { backgroundColor: colors.destructive }]}
            onPress={() => signOut()}
          >
            <Feather name="log-out" size={18} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: Platform.OS === "web" ? "center" : "flex-start",
    alignItems: Platform.OS === "web" ? "center" : "stretch",
    paddingVertical: Platform.OS === "web" ? 24 : 0,
  },
  card: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 420 : undefined,
    borderRadius: Platform.OS === "web" ? 16 : 0,
    padding: Platform.OS === "web" ? 32 : 0,
    shadowColor: Platform.OS === "web" ? "#000" : "transparent",
    shadowOffset: Platform.OS === "web" ? { width: 0, height: 4 } : undefined,
    shadowOpacity: Platform.OS === "web" ? 0.08 : 0,
    shadowRadius: Platform.OS === "web" ? 16 : 0,
    elevation: Platform.OS === "web" ? 4 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  title: { fontSize: 20, fontWeight: "700" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  actionBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  actionBtnText: { fontSize: 16, fontWeight: "700" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700" },
  userInfo: { gap: 4 },
  name: { fontSize: 17, fontWeight: "600" },
  email: { fontSize: 14 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 14,
  },
  signOutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
