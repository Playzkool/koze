import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    // Required by react-native-sortables (tile reordering).
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* title: used as the back button label on pushed screens. */}
          <Stack.Screen name="index" options={{ headerShown: false, title: 'Tableaux' }} />
          <Stack.Screen name="tile" options={{ presentation: 'modal', title: 'Pictogramme' }} />
          <Stack.Screen name="about" options={{ title: 'Sauvegarde et infos' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
