import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        strategy: "oauth_google",
        redirectUrl: "exp://localhost:8081/(auth)/sign-in-callback",
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("SignIn error:", err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Feather name="bookmark" size={56} color={colors.primary} style={styles.logo} />
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to Tarjim</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to your account and start learning Arabic
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onSignInPress}
          activeOpacity={0.8}
        >
          <Feather name="mail" size={18} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            Sign In with Google
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.linkButton]}
          onPress={() => router.push("/(auth)/sign-up")}
          activeOpacity={0.7}
        >
          <Text style={[styles.linkButtonText, { color: colors.primary }]}>
            Create a new account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
          <Text style={[styles.backButtonText, { color: colors.foreground }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 24,
  },
  logo: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: "90%",
  },
  button: {
    flexDirection: "row",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  linkButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
