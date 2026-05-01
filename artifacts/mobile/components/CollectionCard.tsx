import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Collection } from "@/lib/storage";

interface CollectionCardProps {
  collection: Collection;
  deckCount: number;
  cardCount: number;
}

export function CollectionCard({ collection, deckCount, cardCount }: CollectionCardProps) {
  const colors = useColors();
  const router = useRouter();

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/collection/[id]", params: { id: collection.id } });
  }

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.primary,
          shadowColor: colors.primary,
        },
      ]}
      onPress={handlePress}
    >
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}> 
          <Feather name="folder" size={18} color={colors.primary} />
        </View>

        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}> 
            <Text style={[styles.badgeText, { color: colors.primary }]}>COLLECTION</Text>
          </View>

          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {collection.name}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="layers" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}> 
                {deckCount} deck{deckCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="book-open" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}> 
                {cardCount} card{cardCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 16,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 8,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
  },
});