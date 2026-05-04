import { UserProfile } from "@clerk/clerk-expo/web";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function AccountWebScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn, isLoaded, signOut } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.centeredContent}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>Account</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign in to manage your profile and sync your flashcards.
            </Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(auth)/sign-in")}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Account</Text>
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.destructive }]}
          onPress={() => signOut()}
        >
          <Feather name="log-out" size={15} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.centeredContent}>
        <UserProfile />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 32,
    gap: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: { fontSize: 18, fontWeight: "700" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  signOutText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: "700" },
});
