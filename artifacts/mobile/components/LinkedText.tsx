import React from "react";
import { Linking, Platform, StyleProp, Text, TextStyle } from "react-native";
import * as WebBrowser from "expo-web-browser";

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

function openUrl(url: string) {
  if (Platform.OS === "web") {
    Linking.openURL(url);
  } else {
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
  }
}

export function LinkedText({ children, style, linkStyle, numberOfLines }: Props) {
  const text = children ?? "";

  if (!text.includes("](")) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;

  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const [full, label, url] = match;
    parts.push(
      <Text key={match.index} style={linkStyle} onPress={() => openUrl(url)} suppressHighlighting>
        {label}
      </Text>
    );
    last = match.index + full.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts}
    </Text>
  );
}
