import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CategoryPicker } from '@/components/category-picker';
import { Icon, type IconName } from '@/components/icon';
import { PictoSearch } from '@/components/picto-search';
import { TEXT_TILE_COLORS, TileImage } from '@/components/tile-image';
import { MinTouch, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addCategory,
  addTile,
  countTilesInCategory,
  getTile,
  LABEL_MAX,
  LABEL_SOFT_LIMIT,
  moveTile,
  removeTile,
  SPEECH_MAX,
  type TileImage as TileImageData,
  updateTile,
} from '@/store/boards';
import { persistPhoto, pickPhoto } from '@/utils/photo';
import { say } from '@/utils/speech';

type Source = 'arasaac' | 'photo' | 'text';

type Props = {
  boardId: string;
  /** Editing an existing tile when set; creating otherwise. */
  tileId?: string;
  /** Creating a category rather than a word tile. */
  category?: boolean;
};

/** Mode aidant: create or edit a word tile or a category. */
export function TileEditor({ boardId, tileId, category = false }: Props) {
  const theme = useTheme();
  const existing = tileId ? getTile(boardId, tileId) : undefined;
  const isCategory = existing ? !!existing.boardId : category;

  const [label, setLabel] = useState(existing?.label ?? '');
  const [speech, setSpeech] = useState(existing?.speech ?? '');
  const [image, setImage] = useState<TileImageData | null>(existing?.image ?? null);
  const [source, setSource] = useState<Source>(existing?.image.kind ?? 'arasaac');
  /** Freshly picked photo, persisted only on save so cancelling leaves no orphan file. */
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  /** Board the word tile will live in. Defaults to the board the editor was opened from. */
  const [targetBoardId, setTargetBoardId] = useState(boardId);

  const trimmedLabel = label.trim();
  const canSave = trimmedLabel.length > 0 && (!!image || !!tempPhoto) && !processing;
  const title = existing
    ? isCategory
      ? 'Modifier la catégorie'
      : 'Modifier le pictogramme'
    : isCategory
      ? 'Nouvelle catégorie'
      : 'Nouveau pictogramme';

  function chooseSource(next: Source) {
    setSource(next);
    if (next === 'text' && image?.kind !== 'text') {
      setTempPhoto(null);
      setImage({ kind: 'text', color: TEXT_TILE_COLORS[0] });
    }
  }

  async function takePhoto(from: 'camera' | 'library') {
    setProcessing(true);
    try {
      const uri = await pickPhoto(from);
      if (uri) setTempPhoto(uri);
    } catch (e) {
      if (e instanceof Error && e.message === 'permission-denied') {
        Alert.alert(
          "Accès à l'appareil photo refusé",
          'Vous pouvez l’autoriser dans les réglages du téléphone.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
          ],
        );
      } else {
        Alert.alert('La photo n’a pas pu être importée.');
      }
    } finally {
      setProcessing(false);
    }
  }

  function save() {
    if (!canSave) return;
    const finalImage: TileImageData = tempPhoto ? { kind: 'photo', file: persistPhoto(tempPhoto) } : image!;
    const finalSpeech = isCategory ? undefined : speech.trim() || undefined;

    if (existing && tileId) {
      updateTile(boardId, tileId, { label: trimmedLabel, speech: finalSpeech, image: finalImage });
      if (!isCategory) moveTile(boardId, tileId, targetBoardId);
    } else if (isCategory) {
      addCategory(boardId, { label: trimmedLabel, image: finalImage });
    } else {
      addTile(targetBoardId, { label: trimmedLabel, speech: finalSpeech, image: finalImage });
    }
    router.back();
  }

  function confirmDelete() {
    if (!existing || !tileId) return;
    const count = existing.boardId ? countTilesInCategory(existing.boardId) : 0;
    const message = existing.boardId
      ? count > 0
        ? `La catégorie « ${existing.label} » et ses ${count} pictogramme${count > 1 ? 's' : ''} seront supprimés.`
        : `La catégorie « ${existing.label} » sera supprimée.`
      : `« ${existing.label} » sera supprimé.`;
    Alert.alert('Supprimer ?', message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          removeTile(boardId, tileId);
          router.back();
        },
      },
    ]);
  }

  const previewImage: TileImageData | null = tempPhoto ? { kind: 'photo', file: '' } : image;
  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }];
  const overSoftLimit = label.length > LABEL_SOFT_LIMIT;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Pressable onPress={save} disabled={!canSave} accessibilityRole="button" hitSlop={12}>
              <Text style={[styles.headerSave, { color: theme.accent, opacity: canSave ? 1 : 0.35 }]}>
                Enregistrer
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={styles.previewRow}>
          <View
            style={[
              styles.preview,
              { backgroundColor: isCategory ? theme.folder : theme.surface, borderColor: theme.border },
            ]}>
            {previewImage ? (
              <TileImage image={previewImage} label={trimmedLabel} previewUri={tempPhoto ?? undefined} textSize={20} />
            ) : (
              <View style={[styles.previewEmpty, { borderColor: theme.border }]}>
                <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Choisissez une image</Text>
              </View>
            )}
            {previewImage?.kind !== 'text' && (
              <Text numberOfLines={2} style={[styles.previewLabel, { color: theme.text }]}>
                {trimmedLabel || ' '}
              </Text>
            )}
          </View>
          {!isCategory && (
            <Pressable
              onPress={() => say(speech.trim() || trimmedLabel)}
              disabled={!trimmedLabel}
              accessibilityRole="button"
              accessibilityLabel="Écouter"
              style={[styles.listen, { borderColor: theme.border, opacity: trimmedLabel ? 1 : 0.4 }]}>
              <Icon name="speak" size={24} color={theme.text} />
              <Text style={[styles.listenText, { color: theme.text }]}>Écouter</Text>
            </Pressable>
          )}
        </View>

        {/* Label */}
        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              {isCategory ? 'Nom de la catégorie' : 'Texte affiché'}
            </Text>
            <Text style={{ color: overSoftLimit ? theme.danger : theme.textSecondary }}>
              {label.length}/{LABEL_SOFT_LIMIT}
            </Text>
          </View>
          <TextInput
            value={label}
            onChangeText={setLabel}
            maxLength={LABEL_MAX}
            placeholder={isCategory ? 'ex : Repas' : 'ex : Mal à la tête'}
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={isCategory ? 'Nom de la catégorie' : 'Texte affiché'}
            style={inputStyle}
          />
          {overSoftLimit && (
            <Text style={[styles.hint, { color: theme.danger }]}>Risque d’être coupé sur les petits écrans.</Text>
          )}
        </View>

        {/* Speech */}
        {!isCategory && (
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Phrase prononcée (facultatif)</Text>
              <Text style={{ color: theme.textSecondary }}>
                {speech.length}/{SPEECH_MAX}
              </Text>
            </View>
            <TextInput
              value={speech}
              onChangeText={setSpeech}
              maxLength={SPEECH_MAX}
              multiline
              placeholder="ex : J'ai mal à la tête, j'ai besoin d'un médicament."
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Phrase prononcée"
              style={[inputStyle, styles.multiline]}
            />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Si vide, le texte affiché est prononcé.
            </Text>
          </View>
        )}

        {/* Category (word tiles only) */}
        {!isCategory && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Catégorie</Text>
            <CategoryPicker value={targetBoardId} onChange={setTargetBoardId} />
          </View>
        )}

        {/* Image source */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Image</Text>
          <View style={[styles.segmented, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            {(
              [
                ['arasaac', 'Pictogramme'],
                ['photo', 'Photo'],
                ['text', 'Texte seul'],
              ] as const
            ).map(([value, text]) => {
              const active = source === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => chooseSource(value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.segment, active && { backgroundColor: theme.accent }]}>
                  <Text style={[styles.segmentText, { color: active ? theme.accentText : theme.text }]}>{text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {source === 'arasaac' && (
          <PictoSearch
            initialQuery={existing ? '' : trimmedLabel}
            selectedId={!tempPhoto && image?.kind === 'arasaac' ? image.id : undefined}
            onSelect={(p) => {
              setTempPhoto(null);
              setImage({ kind: 'arasaac', id: p.id });
              if (!trimmedLabel) setLabel(p.label);
            }}
          />
        )}

        {source === 'photo' && (
          <View style={styles.photoButtons}>
            <PhotoButton icon="camera" text="Prendre une photo" onPress={() => takePhoto('camera')} disabled={processing} />
            <PhotoButton icon="photos" text="Choisir dans la galerie" onPress={() => takePhoto('library')} disabled={processing} />
            {processing && <ActivityIndicator />}
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              La photo est recadrée en carré et compressée. Elle reste uniquement sur ce téléphone.
            </Text>
          </View>
        )}

        {source === 'text' && image?.kind === 'text' && (
          <View style={styles.colors}>
            {TEXT_TILE_COLORS.map((color) => {
              const active = image.color === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => setImage({ kind: 'text', color })}
                  accessibilityRole="button"
                  accessibilityLabel={`Couleur ${TEXT_TILE_COLORS.indexOf(color) + 1}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.swatch,
                    { backgroundColor: color, borderColor: active ? theme.accent : theme.border, borderWidth: active ? 4 : 2 },
                  ]}>
                  {active && <Icon name="check" size={22} color="#111418" />}
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={save}
          disabled={!canSave}
          accessibilityRole="button"
          style={[styles.save, { backgroundColor: theme.accent, opacity: canSave ? 1 : 0.4 }]}>
          <Text style={[styles.saveText, { color: theme.accentText }]}>Enregistrer</Text>
        </Pressable>

        {existing && (
          <Pressable onPress={confirmDelete} accessibilityRole="button" style={styles.delete}>
            <Text style={[styles.deleteText, { color: theme.danger }]}>
              {isCategory ? 'Supprimer la catégorie' : 'Supprimer ce pictogramme'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PhotoButton({
  icon,
  text,
  onPress,
  disabled,
}: {
  icon: IconName;
  text: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.photoButton, { borderColor: theme.border, backgroundColor: theme.surface, opacity: disabled ? 0.5 : 1 }]}>
      <Icon name={icon} size={24} color={theme.accent} />
      <Text style={[styles.photoButtonText, { color: theme.text }]}>{text}</Text>
    </Pressable>
  );
}

const PREVIEW = 140;

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.four, paddingBottom: Spacing.five * 2 },
  headerSave: { fontSize: 17, fontWeight: '700' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  preview: {
    width: PREVIEW,
    height: PREVIEW + 28,
    borderRadius: Radius.tile,
    borderWidth: 2,
    padding: Spacing.two,
    alignItems: 'center',
  },
  previewEmpty: {
    flex: 1,
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  previewLabel: { marginTop: Spacing.one, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  listen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 52,
    paddingHorizontal: Spacing.three,
    borderWidth: 2,
    borderRadius: 26,
  },
  listenText: { fontSize: 17, fontWeight: '600' },
  field: { gap: Spacing.two },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fieldLabel: { fontSize: 17, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
  },
  multiline: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  hint: { fontSize: 14 },
  segmented: { flexDirection: 'row', borderWidth: 2, borderRadius: 14, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 16, fontWeight: '600' },
  photoButtons: { gap: Spacing.two },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouch,
    paddingHorizontal: Spacing.three,
    borderWidth: 2,
    borderRadius: 14,
  },
  photoButtonText: { fontSize: 18, fontWeight: '600' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  swatch: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  save: { height: MinTouch - 8, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 18, fontWeight: '700' },
  delete: { alignItems: 'center', padding: Spacing.three },
  deleteText: { fontSize: 17, fontWeight: '600' },
});
