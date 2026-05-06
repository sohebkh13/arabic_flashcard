import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
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

  const file = new File(Paths.cache, filename);
  file.write(content);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: "Export Flashcards Backup",
  });
}

function readWebFileText(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  });
}

export async function pickJsonFileText(): Promise<string | null> {
  const file = await pickImportFile();
  return file ? file.text : null;
}

export async function pickImportFile(): Promise<{ text: string; name: string } | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json,text/plain,.txt,.tsv";
      input.onchange = async () => {
        const webFile = input.files?.[0];
        if (!webFile) {
          resolve(null);
          return;
        }
        try {
          const text = await readWebFileText(webFile);
          resolve({ text, name: webFile.name });
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "text/tab-separated-values", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];
  const fsFile = new File(asset.uri);
  const text = await fsFile.text();
  return { text, name: asset.name || "import.txt" };
}
