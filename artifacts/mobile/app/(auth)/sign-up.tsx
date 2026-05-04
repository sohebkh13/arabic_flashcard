import { Feather } from "@expo/vector-icons";
import { useOAuth, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: "oauth_facebook" });
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!isLoaded || !email.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else if (result.status === "missing_requirements") {
        router.push("/(auth)/verify-email");
      } else {
        setError("Sign-up incomplete. Please try again.");
      }
    } catch (e: unknown) {
      const err = e as any;
      setError(err?.errors?.[0]?.message || err?.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    setError("");
    try {
      const { createdSessionId, setActive: oauthSetActive } = await startGoogleOAuth();
      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: unknown) {
      const err = e as any;
      setError(err?.errors?.[0]?.message || err?.message || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignUp() {
    setLoading(true);
    setError("");
    try {
      const { createdSessionId, setActive: oauthSetActive } = await startAppleOAuth();
      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: unknown) {
      const err = e as any;
      setError(err?.errors?.[0]?.message || err?.message || "Apple sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebookSignUp() {
    setLoading(true);
    setError("");
    try {
      const { createdSessionId, setActive: oauthSetActive } = await startFacebookOAuth();
      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: unknown) {
      const err = e as any;
      setError(err?.errors?.[0]?.message || err?.message || "Facebook sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: Platform.OS === "web" ? colors.card : "transparent" }]}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.form}>
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Create Account</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
                Sign up to save your decks and sync across devices
              </Text>
            </View>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>First Name (optional)</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 characters"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading || !isLoaded ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={loading || !isLoaded || !email.trim() || !password}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or continue with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: "#fff", borderColor: colors.border }]}
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <View style={styles.socialBtnInner}>
                <Feather name="chrome" size={20} color="#EA4335" />
                <Text style={[styles.socialBtnText, { color: "#333" }]}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: "#000", borderColor: "#000" }]}
              onPress={handleAppleSignUp}
              disabled={loading}
            >
              <View style={styles.socialBtnInner}>
                <Feather name="smartphone" size={20} color="#fff" />
                <Text style={[styles.socialBtnText, { color: "#fff" }]}>Continue with Apple</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: "#1877F2", borderColor: "#1877F2" }]}
              onPress={handleFacebookSignUp}
              disabled={loading}
            >
              <View style={styles.socialBtnInner}>
                <Feather name="facebook" size={20} color="#fff" />
                <Text style={[styles.socialBtnText, { color: "#fff" }]}>Continue with Facebook</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")} style={styles.linkBtn}>
              <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
                Already have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Creating account...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  form: { paddingHorizontal: 20, gap: 16, paddingTop: 12 },
  welcomeTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 15, marginTop: 4, lineHeight: 20 },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontSize: 14 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: "700" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "500" },
  socialBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  socialBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialBtnText: { fontSize: 14, fontWeight: "600" },
  linkBtn: { alignItems: "center", marginTop: 8 },
  linkText: { fontSize: 14 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  overlayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
});
