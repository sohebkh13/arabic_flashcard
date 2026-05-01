import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TranslationPanel } from "@/components/TranslationPanel";
import { useColors } from "@/hooks/useColors";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Header } from "@/components/Header";

export default function TranslateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string }>();

  const [initialText] = useState(params.text || "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleSave(arabic: string, english: string) {
    router.push({ pathname: "/create-card", params: { arabic, english } });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header 
        onProfilePress={() => router.push("/profile")}
        onLogoPress={() => {
          AsyncStorage.setItem("tarjim_seen_landing", "false").catch(() => {});
          router.push("/(tabs)");
        }}
      />
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Translate</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Live translation updates as you type, with transliteration for Arabic results
        </Text>
      </View>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <TranslationPanel
          initialText={initialText}
          onSaveFlashcard={handleSave}
        />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  content: {
    padding: 20,
    gap: 16,
  },
});
