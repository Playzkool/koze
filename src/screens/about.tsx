import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resetBoards } from '@/store/boards';

export function About() {
  const theme = useTheme();
  const p = [styles.p, { color: theme.text }];

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <Text style={[styles.h1, { color: theme.text }]}>Kozé</Text>
      <Text style={p}>
        Une application de communication par pictogrammes, gratuite pour tout le monde. Sans
        publicité, sans compte, sans collecte de données : tout reste sur cet appareil.
      </Text>

      <Text style={[styles.h2, { color: theme.text }]}>Pictogrammes</Text>
      <Text style={p}>
        Les pictogrammes utilisés sont la propriété du Gouvernement d&apos;Aragon et ont été créés
        par Sergio Palao pour ARASAAC (https://arasaac.org), qui les distribue sous licence Creative
        Commons BY-NC-SA.
      </Text>
      <Pressable onPress={() => Linking.openURL('https://arasaac.org')} accessibilityRole="link">
        <Text style={[styles.link, { color: theme.accent }]}>arasaac.org</Text>
      </Pressable>

      <Text style={[styles.h2, { color: theme.text }]}>Réinitialiser</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert('Revenir aux tableaux de départ ?', 'Les pictogrammes ajoutés seront supprimés.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Réinitialiser', style: 'destructive', onPress: resetBoards },
          ])
        }>
        <Text style={[styles.link, { color: theme.danger }]}>Réinitialiser les tableaux</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  h1: { fontSize: 32, fontWeight: '800' },
  h2: { fontSize: 20, fontWeight: '700', marginTop: Spacing.three },
  p: { fontSize: 17, lineHeight: 25 },
  link: { fontSize: 17, fontWeight: '600' },
});
