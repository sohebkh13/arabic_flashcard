import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Deck } from "@/lib/storage";

interface DeckCardProps {
  deck: Deck;
  cardCount: number;
  dueCount: number;
  addedLabel: string;
  updatedLabel: string;
}

export function DeckCard({ deck, cardCount, dueCount, addedLabel, updatedLabel }: DeckCardProps) {
  const colors = useColors();
  const router = useRouter();

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/deck/[id]", params: { id: deck.id } });
  }

  function handleReview() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ 
      pathname: "/review", 
      params: { deckId: deck.id, mode: dueCount > 0 ? "review" : "revision" } 
    });
  }

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
    >
      <View style={styles.cardInner}>
        <View style={styles.cardContent}>
          <View style={styles.top}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {deck.name}
            </Text>
            <View style={[styles.dialectBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.dialectText, { color: colors.mutedForeground }]}>{deck.dialect}</Text>
            </View>
          </View>

          <View style={styles.bottom}>
            <View style={styles.stat}>
              <Feather name="layers" size={14} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>{cardCount} cards</Text>
            </View>
            {dueCount > 0 ? (
              <View style={[styles.dueBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.dueText, { color: colors.primaryForeground }]}>
                  {dueCount} due
                </Text>
              </View>
            ) : (
              <View style={[styles.doneBadge, { backgroundColor: (colors.success || "#4caf7d") + "22" }]}>
                <Feather name="check" size={12} color={colors.success || "#4caf7d"} />
                <Text style={[styles.doneText, { color: colors.success || "#4caf7d" }]}>Up to date</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Added {addedLabel}</Text>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Updated {updatedLabel}</Text>
          </View>
        </View>

        <View style={styles.chevronWrap}>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </View>

      {/* Review button */}
      {cardCount > 0 && (
        <Pressable
          style={[
            styles.reviewBtn,
            dueCount > 0
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleReview();
          }}
        >
          <Feather
            name="zap"
            size={14}
            color={dueCount > 0 ? colors.primaryForeground : colors.mutedForeground}
          />
          <Text
            style={[
              styles.reviewBtnText,
              { color: dueCount > 0 ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            {dueCount > 0 ? `Review now · ${dueCount} due` : "Review all"}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    gap: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  dialectBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dialectText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "500",
  },
  dueBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dueText: {
    fontSize: 12,
    fontWeight: "700",
  },
  doneBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  doneText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chevronWrap: {
    paddingLeft: 8,
    justifyContent: "center",
  },
  reviewBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
