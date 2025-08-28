import { Stack } from "expo-router";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './globals.css';

export default function Layout() {
  return (
    <SafeAreaProvider>
        <WebSocketProvider>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                {/* <Stack.Screen name="connect" options={{ headerShown: false }} /> */}
                <Stack.Screen name="monitor" options={{ headerShown: false }} />
            </Stack>
        </WebSocketProvider>
    </SafeAreaProvider>
  )
}