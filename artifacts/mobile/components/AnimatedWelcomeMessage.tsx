import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const WELCOME_MESSAGES = [
  "One flip. One word. One world unlocked.",
  "Every language begins with a single card.",
  "The world speaks many tongues. Learn one today.",
  "A new word is a new window to the world.",
  "Every great linguist started exactly where you are.",
];

const TYPING_SPEED = 50; // ms per character
const PAUSE_DURATION = 3000; // ms to show full message
const BACKSPACE_SPEED = 30; // ms per character

export function AnimatedWelcomeMessage() {
  const colors = useColors();
  const [displayText, setDisplayText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentMessage = WELCOME_MESSAGES[messageIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      // Typing phase
      if (displayText.length < currentMessage.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentMessage.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        // Finished typing, pause before backspacing
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, PAUSE_DURATION);
      }
    } else {
      // Backspace phase
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, BACKSPACE_SPEED);
      } else {
        // Move to next message
        setMessageIndex((prev) => (prev + 1) % WELCOME_MESSAGES.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, messageIndex, isTyping]);

  return (
    <View style={styles.container}>
      <Text style={[styles.message, { color: colors.foreground }]}>
        {displayText}
        <Text style={[styles.cursor, { color: colors.primary }]}>|</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    minHeight: 100,
    justifyContent: "center",
  },
  message: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  cursor: {
    fontSize: 20,
    fontWeight: "700",
    opacity: 0.6,
  },
});
