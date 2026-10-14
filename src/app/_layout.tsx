import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initDatabase } from "../db/database";

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  // se asegura que la bd este lista antes de usar.
  useEffect(() => {
    initDatabase()
      .then(() => setIsDbReady(true))
      .catch((err) => console.error("Error inicializando SQLite:", err));
  }, []);

  if (!isDbReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
