import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pictoUrl, type PictoResult, searchPictos } from '@/utils/arasaac';

type Status = 'idle' | 'loading' | 'error' | 'done';

type Props = {
  selectedId?: number;
  /** Pre-fills the search (e.g. with the tile label). */
  initialQuery?: string;
  onSelect: (picto: PictoResult) => void;
};

/**
 * ARASAAC search grid. Not virtualized on purpose: it is embedded in a
 * ScrollView form and results are capped at 40.
 */
export function PictoSearch({ selectedId, initialQuery = '', onSelect }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PictoResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');

  const term = query.trim();
  const searchable = term.length >= 2;

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        setResults(await searchPictos(term, { signal: controller.signal }));
        setStatus('done');
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, searchable]);

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Chercher un pictogramme (ex : piscine)"
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Rechercher un pictogramme"
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
      />

      {searchable && status === 'loading' && <ActivityIndicator />}
      {searchable && status === 'error' && (
        <Text style={[styles.feedback, { color: theme.danger }]}>
          Recherche impossible. Vérifiez la connexion internet.
        </Text>
      )}
      {searchable && status === 'done' && results.length === 0 && (
        <Text style={[styles.feedback, { color: theme.textSecondary }]}>Aucun pictogramme trouvé.</Text>
      )}

      <View style={styles.grid}>
        {searchable &&
          results.map((item) => {
            const active = selectedId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={[
                  styles.result,
                  { borderColor: active ? theme.accent : theme.border, borderWidth: active ? 4 : 2 },
                ]}>
                <Image source={pictoUrl(item.id)} style={styles.resultImage} contentFit="contain" />
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  input: {
    height: 52,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
  },
  feedback: { textAlign: 'center', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  result: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: Radius.tile,
    backgroundColor: '#FFFFFF',
    padding: Spacing.one,
  },
  resultImage: { flex: 1 },
});
