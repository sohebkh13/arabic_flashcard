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
      params: { deckId: deck.id, mode: dueCount > 0 ? "review" : "revision" },
    });
  }

  const accentColor = dueCount > 0 ? colors.primary : (colors.success ?? "#4caf7d");

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.foreground,
        },
      ]}
      onPress={handlePress}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      {/* Main content column: body + review button */}
      <View style={styles.mainContent}>
        <View style={styles.cardBody}>
          <View style={styles.cardContent}>
            <View style={styles.top}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {deck.name}
              </Text>
              <View style={[styles.dialectBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.dialectText, { color: colors.mutedForeground }]}>{deck.dialect}</Text>
              </View>
            </View>

            <View style={styles.bottom}>
              <View style={styles.stat}>
                <Feather name="layers" size={13} color={colors.mutedForeground} />
                <Text style={[styles.statText, { color: colors.mutedForeground }]}>{cardCount} cards</Text>
              </View>
              {dueCount > 0 ? (
                <View style={[styles.dueBadge, { backgroundColor: colors.primary + "22" }]}>
                  <View style={[styles.dueDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.dueText, { color: colors.primary }]}>{dueCount} due</Text>
                </View>
              ) : (
                <View style={[styles.doneBadge, { backgroundColor: (colors.success ?? "#4caf7d") + "18" }]}>
                  <Feather name="check-circle" size={12} color={colors.success ?? "#4caf7d"} />
                  <Text style={[styles.doneText, { color: colors.success ?? "#4caf7d" }]}>Up to date</Text>
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Added {addedLabel}</Text>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Updated {updatedLabel}</Text>
            </View>
          </View>

          <Feather name="chevron-right" size={17} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
        </View>

        {/* Review button — full width at the bottom */}
        {cardCount > 0 && (
          <Pressable
            style={[
              styles.reviewBtn,
              dueCount > 0
                ? { backgroundColor: accentColor }
                : { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleReview();
            }}
          >
            <Feather
              name="zap"
              size={13}
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  accent: {
    width: 4,
  },
  mainContent: {
    flex: 1,
    flexDirection: "column",
  },
  cardBody: {
    padding: 14,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    gap: 9,
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
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dialectText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
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
  },
  metaText: {
    fontSize: 11,
    fontWeight: "500",
  },
  dueBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  reviewBtn: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 10,
    paddingVertical: 9,
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
