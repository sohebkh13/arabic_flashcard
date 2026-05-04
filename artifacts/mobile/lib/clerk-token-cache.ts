import AsyncStorage from "@react-native-async-storage/async-storage";

export const clerkTokenCache = {
  async getToken(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async saveToken(key: string, token: string): Promise<void> {
    return AsyncStorage.setItem(key, token);
  },
};
