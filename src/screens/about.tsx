import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';

import { MinTouch, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resetBoards } from '@/store/boards';
import { applyBackup, BackupError, exportBackup, pickBackup } from '@/utils/backup';

/** Required by LICENSE-APP-STORE-EXCEPTION (condition 2): keep this link in the app. */
const SOURCE_URL = 'https://github.com/Playzkool/koze';
const PRIVACY_URL = 'https://playzkool.github.io/koze/confidentialite.html';

function errorMessage(e: unknown) {
  return e instanceof BackupError ? e.message : 'Une erreur inattendue est survenue.';
}

function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? 's' : ''}`;
}

export function About() {
  const theme = useTheme();
  const p = [styles.p, { color: theme.text }];
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  async function onExport() {
    setBusy('export');
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('Export impossible', errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function onImport() {
    setBusy('import');
    try {
      const backup = await pickBackup();
      if (!backup) return;
      const { categories, tiles, photos } = backup.stats;
      const date = backup.exportedAt ? new Date(backup.exportedAt).toLocaleDateString('fr-FR') : null;
      Alert.alert(
        'Remplacer tous les tableaux ?',
        [
          date ? `Sauvegarde du ${date} :` : 'Cette sauvegarde contient :',
          `${plural(tiles, 'pictogramme')}, ${plural(categories, 'catégorie')}, ${plural(photos, 'photo')}.`,
          '',
          'Les tableaux actuels et leurs photos seront remplacés. Exportez-les d’abord si vous voulez les garder.',
        ].join('\n'),
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Remplacer',
            style: 'destructive',
            onPress: () => {
              try {
                applyBackup(backup);
                Alert.alert('Sauvegarde importée', 'Les tableaux ont été restaurés.');
              } catch (e) {
                Alert.alert('Import impossible', errorMessage(e));
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Import impossible', errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <Text style={[styles.h2First, { color: theme.text }]}>Sauvegarde</Text>
      <Text style={p}>
        Vos tableaux et vos photos existent uniquement sur ce téléphone. Exportez-les
        régulièrement (Fichiers, Drive, e-mail…) pour ne rien perdre, ou pour les transmettre à un
        autre appareil.
      </Text>
      <View style={styles.actions}>
        <ActionButton
          testID="export-backup"
          icon="share"
          text="Exporter mes tableaux"
          onPress={onExport}
          busy={busy === 'export'}
          disabled={busy !== null}
        />
        <ActionButton
          testID="import-backup"
          icon="download"
          text="Importer une sauvegarde"
          onPress={onImport}
          busy={busy === 'import'}
          disabled={busy !== null}
        />
      </View>

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

      <Text style={[styles.h2, { color: theme.text }]}>Code source</Text>
      <Text style={p}>
        Kozé est un logiciel libre, distribué sous licence GNU GPL v3 avec une permission
        additionnelle pour les stores d&apos;applications. Le code est consultable et modifiable
        par tous.
      </Text>
      <Pressable onPress={() => Linking.openURL(SOURCE_URL)} accessibilityRole="link">
        <Text style={[styles.link, { color: theme.accent }]}>github.com/Playzkool/koze</Text>
      </Pressable>

      <Text style={[styles.h2, { color: theme.text }]}>Confidentialité</Text>
      <Text style={p}>
        Aucun compte, aucune publicité, aucun suivi. Kozé se connecte à internet seulement pour
        chercher des pictogrammes et vérifier les mises à jour.
      </Text>
      <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link" testID="privacy-link">
        <Text style={[styles.link, { color: theme.accent }]}>Politique de confidentialité</Text>
      </Pressable>

      <Text style={[styles.h2, { color: theme.text }]}>Réinitialiser</Text>
      <Pressable
        testID="reset-boards"
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

function ActionButton({
  testID,
  icon,
  text,
  onPress,
  busy,
  disabled,
}: {
  testID: string;
  icon: IconName;
  text: string;
  onPress: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled }}
      style={[styles.action, { borderColor: theme.border, backgroundColor: theme.surface, opacity: disabled && !busy ? 0.5 : 1 }]}>
      {busy ? <ActivityIndicator /> : <Icon name={icon} size={24} color={theme.accent} />}
      <Text style={[styles.actionText, { color: theme.text }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three },
  h2First: { fontSize: 20, fontWeight: '700' },
  actions: { gap: Spacing.two },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouch,
    paddingHorizontal: Spacing.three,
    borderWidth: 2,
    borderRadius: 14,
  },
  actionText: { fontSize: 18, fontWeight: '600' },
  h1: { fontSize: 32, fontWeight: '800', marginTop: Spacing.four },
  h2: { fontSize: 20, fontWeight: '700', marginTop: Spacing.three },
  p: { fontSize: 17, lineHeight: 25 },
  link: { fontSize: 17, fontWeight: '600' },
});
