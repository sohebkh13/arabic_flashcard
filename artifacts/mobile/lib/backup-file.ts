import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type ExportFormat = "json" | "csv" | "txt";

function sanitizeFileToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function contentTypeFor(format: ExportFormat): string {
  if (format === "csv") return "text/csv";
  if (format === "txt") return "text/plain";
  return "application/json";
}

export function buildBackupFilename(scope: "all" | "deck" | "collection", format: ExportFormat, name?: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  if ((scope === "deck" || scope === "collection") && name) {
    const token = sanitizeFileToken(name) || scope;
    return `arabic-flashcards-${token}-${stamp}.${format}`;
  }
  return `arabic-flashcards-all-${stamp}.${format}`;
}

export async function exportTextToFile(content: string, filename: string, format: ExportFormat): Promise<void> {
  const mimeType = contentTypeFor(format);
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return;
  }

  const baseDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDirectory) {
    throw new Error("No writable directory available for export");
  }

  const fileUri = `${baseDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType,
    dialogTitle: "Export Flashcards Backup",
  });
}

function readWebFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  });
}

export async function pickJsonFileText(): Promise<string | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json,text/plain";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const content = await readWebFileText(file);
          resolve(content);
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  return FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}
