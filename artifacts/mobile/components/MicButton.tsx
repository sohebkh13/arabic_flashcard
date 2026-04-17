import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { transcribeAudio } from "@/lib/whisper";

interface MicButtonProps {
  onTranscription: (text: string) => void;
  onError?: (err: string) => void;
  size?: number;
}

export function MicButton({ onTranscription, onError, size = 48 }: MicButtonProps) {
  const colors = useColors();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (recording) {
      scale.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [recording, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    if (Platform.OS === "web") {
      onError?.("Voice input is not available on web.");
      return;
    }
    if (processing) return;

    if (!recording) {
      try {
        const status = await requestRecordingPermissionsAsync();
        if (!status.granted) {
          onError?.("Microphone permission denied");
          return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
        recorder.record();
        setRecording(true);
      } catch (e: unknown) {
        onError?.((e as Error).message || "Could not start recording");
      }
    } else {
      setRecording(false);
      setProcessing(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          const text = await transcribeAudio(uri);
          onTranscription(text);
        }
      } catch (e: unknown) {
        onError?.((e as Error).message || "Could not process recording");
      } finally {
        setProcessing(false);
      }
    }
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: recording ? colors.destructive : colors.primary,
          },
        ]}
      >
        {processing ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <Feather
            name={recording ? "square" : "mic"}
            size={size * 0.42}
            color={colors.primaryForeground}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
