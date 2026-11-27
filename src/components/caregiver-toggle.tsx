import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { MinTouch, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HOLD_MS = 1000;

type Props = {
  active: boolean;
  onChange: (active: boolean) => void;
};

/**
 * Entering the caregiver mode needs a 1 s hold (guards against accidental
 * entry by the user), with a fill showing progress. A simple tap explains it.
 * Leaving is a simple tap.
 */
export function CaregiverToggle({ active, onChange }: Props) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(0));
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 3000);
    return () => clearTimeout(t);
  }, [hint]);

  function pressIn() {
    if (active) return;
    setHint(false);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }

  function resetProgress() {
    progress.stopAnimation();
    progress.setValue(0);
  }

  if (active) {
    return (
      <Pressable
        onPress={() => onChange(false)}
        accessibilityRole="button"
        accessibilityLabel="Quitter le mode aidant"
        style={[styles.button, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
        <Text style={[styles.done, { color: theme.accentText }]}>Terminé</Text>
      </Pressable>
    );
  }

  return (
    <View>
      <Pressable
        onPress={() => setHint(true)}
        onPressIn={pressIn}
        onPressOut={resetProgress}
        onLongPress={() => {
          // Reset now: this Pressable unmounts when `active` flips, so its
          // onPressOut never fires and the fill would stay half-way.
          resetProgress();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onChange(true);
        }}
        delayLongPress={HOLD_MS}
        accessibilityRole="button"
        accessibilityLabel="Mode aidant"
        accessibilityHint="Maintenir appuyé une seconde pour activer"
        style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              backgroundColor: theme.accent,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
        <Icon name="settings" size={24} color={theme.textSecondary} />
      </Pressable>

      {hint && (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.hint, { backgroundColor: theme.text }]}>
          <Text style={[styles.hintText, { color: theme.background }]}>
            Maintenez appuyé 1 seconde pour le mode aidant
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MinTouch,
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.35 },
  done: { fontSize: 18, fontWeight: '600' },
  hint: {
    position: 'absolute',
    top: 56,
    right: 0,
    width: 220,
    padding: Spacing.three,
    borderRadius: 14,
    zIndex: 10,
  },
  hintText: { fontSize: 15, fontWeight: '600' },
});
