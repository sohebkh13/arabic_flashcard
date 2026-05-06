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
          borderColor: colors.primary + "40",
          shadowColor: colors.primary,
        },
      ]}
      onPress={handlePress}
    >
      {/* Top accent strip */}
      <View style={[styles.topStrip, { backgroundColor: colors.primary }]}>
        <View style={[styles.stripBadge, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
          <Text style={styles.stripBadgeText}>COLLECTION</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="folder" size={20} color={colors.primary} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {collection.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="layers" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {deckCount} deck{deckCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <Feather name="book-open" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {cardCount} card{cardCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.chevronWrap, { backgroundColor: colors.secondary }]}>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topStrip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  stripBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stripBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#fff",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
