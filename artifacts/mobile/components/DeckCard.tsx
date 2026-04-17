import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Deck } from "@/lib/storage";

interface DeckCardProps {
  deck: Deck;
  cardCount: number;
  dueCount: number;
}

export function DeckCard({ deck, cardCount, dueCount }: DeckCardProps) {
  const colors = useColors();
  const router = useRouter();

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/deck/[id]", params: { id: deck.id } });
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
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
          <View style={[styles.doneBadge, { backgroundColor: colors.success + "22" }]}>
            <Feather name="check" size={12} color={colors.success || "#4caf7d"} />
            <Text style={[styles.doneText, { color: colors.success || "#4caf7d" }]}>Up to date</Text>
          </View>
        )}
      </View>

      <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    position: "relative",
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
  chevron: {
    position: "absolute",
    right: 16,
    top: "50%",
  },
});
