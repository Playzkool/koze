import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBoardOptions } from '@/store/boards';

type Props = {
  value: string;
  onChange: (boardId: string) => void;
};

/**
 * Collapsed: shows where the tile lives ("Accueil › Besoins").
 * Expanded: the whole category tree as an indented radio list.
 */
export function CategoryPicker({ value, onChange }: Props) {
  const theme = useTheme();
  const options = useBoardOptions();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);

  return (
    <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        testID="category-picker"
        accessibilityRole="button"
        accessibilityLabel={`Catégorie : ${current?.path ?? ''}`}
        accessibilityHint={open ? 'Fermer la liste' : 'Changer de catégorie'}
        accessibilityState={{ expanded: open }}
        style={styles.row}>
        <Text style={[styles.current, { color: theme.text }]} numberOfLines={2}>
          {current?.path ?? '—'}
        </Text>
        <Text style={[styles.action, { color: theme.accent }]}>{open ? 'Fermer' : 'Changer'}</Text>
      </Pressable>

      {open && (
        <View style={[styles.list, { borderColor: theme.border }]}>
          {options.map((o) => {
            const selected = o.id === value;
            return (
              <Pressable
                key={o.id}
                testID={`category-option-${o.id}`}
                onPress={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={o.path}
                style={[
                  styles.option,
                  { paddingLeft: Spacing.three + o.depth * Spacing.four },
                  selected && { backgroundColor: theme.folder },
                ]}>
                <Text
                  style={[styles.optionText, { color: theme.text, fontWeight: selected ? '700' : '500' }]}
                  numberOfLines={1}>
                  {o.depth > 0 ? '└ ' : ''}
                  {o.title}
                </Text>
                {selected && <Icon name="check" size={20} color={theme.accent} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 2, borderRadius: 14, overflow: 'hidden' },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  current: { flex: 1, fontSize: 18 },
  action: { fontSize: 16, fontWeight: '700' },
  list: { borderTopWidth: StyleSheet.hairlineWidth },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: Spacing.three,
  },
  optionText: { flex: 1, fontSize: 17 },
});
