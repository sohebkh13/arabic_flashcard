import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";

export default function CreateCardScreen() {
  const params = useLocalSearchParams<{ arabic?: string; english?: string; deckId?: string }>();
  return <Redirect href={{ pathname: "/(tabs)/create-card", params }} />;
}
