import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const WELCOME_MESSAGES = [
  "One flip. One card. One concept mastered.",
  "Every subject becomes easier, one card at a time.",
  "Knowledge sticks when you review it right.",
  "From vocab to formulas — anything worth knowing.",
  "Build your deck. Own the subject.",
  "Spaced repetition: the science of never forgetting.",
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
    height: 120,
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
