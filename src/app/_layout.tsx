import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="tile" options={{ presentation: 'modal', title: 'Pictogramme' }} />
        <Stack.Screen name="about" options={{ title: 'À propos' }} />
      </Stack>
    </ThemeProvider>
  );
}
