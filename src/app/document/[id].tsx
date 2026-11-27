import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import {
  addPages,
  deleteDocument,
  getDocument,
  movePage,
  pageUri,
  removePage,
  renameDocument,
  type ScannedDocument,
} from '../../lib/documents';
import { sharePdf } from '../../lib/pdf';
import { scanPages } from '../../lib/scanner';
import { useTheme, type Theme } from '../../lib/theme';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function DocumentScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<ScannedDocument | null>(() => getDocument(id));
  const [name, setName] = useState(doc?.name ?? '');
  const [busy, setBusy] = useState<'scan' | 'pdf' | null>(null);

  if (!doc) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.muted }}>Este documento ya no existe.</Text>
      </View>
    );
  }

  const commitName = () => {
    const updated = renameDocument(doc, name);
    setDoc(updated);
    setName(updated.name);
  };

  const onAddPages = async () => {
    setBusy('scan');
    try {
      const images = await scanPages();
      if (images.length > 0) setDoc(await addPages(doc, images));
    } catch (error) {
      Alert.alert('No se pudo escanear', errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    setBusy('pdf');
    try {
      await sharePdf(doc);
    } catch (error) {
      Alert.alert('No se pudo crear el PDF', errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const onDeletePage = (page: string) => {
    Alert.alert('¿Eliminar esta página?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setDoc(removePage(doc, page)) },
    ]);
  };

  const onDeleteDocument = () => {
    Alert.alert('¿Eliminar el documento?', 'Se borrarán todas sus páginas del teléfono.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteDocument(doc.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: doc.name,
          headerRight: () => (
            <Pressable onPress={onDeleteDocument} hitSlop={12} accessibilityRole="button">
              <Text style={{ color: theme.danger, fontSize: 16 }}>Eliminar</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={doc.pages}
        keyExtractor={(page) => page}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.label, { color: theme.muted }]}>Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={commitName}
              onSubmitEditing={commitName}
              returnKeyType="done"
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
              ]}
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            No quedan páginas. Pulsa «Añadir páginas» para escanear más.
          </Text>
        }
        renderItem={({ item, index }) => (
          <PageCard
            theme={theme}
            uri={pageUri(doc, item)}
            index={index}
            total={doc.pages.length}
            onUp={() => setDoc(movePage(doc, index, -1))}
            onDown={() => setDoc(movePage(doc, index, 1))}
            onDelete={() => onDeletePage(item)}
          />
        )}
      />
      <View style={[styles.footer, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Button
          title="Añadir páginas"
          variant="secondary"
          onPress={onAddPages}
          loading={busy === 'scan'}
          disabled={busy !== null}
        />
        <Button
          title="Compartir PDF"
          onPress={onShare}
          loading={busy === 'pdf'}
          disabled={busy !== null || doc.pages.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

type PageCardProps = {
  theme: Theme;
  uri: string;
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
};

function PageCard({ theme, uri, index, total, onUp, onDown, onDelete }: PageCardProps) {
  const action = (label: string, onPress: () => void, disabled = false, color = theme.primary) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [(pressed || disabled) && { opacity: 0.35 }]}>
      <Text style={[styles.action, { color }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Image source={{ uri }} style={styles.page} contentFit="contain" />
      <View style={styles.cardBar}>
        <Text style={[styles.pageNumber, { color: theme.muted }]}>
          Página {index + 1} de {total}
        </Text>
        <View style={styles.actions}>
          {action('Subir', onUp, index === 0)}
          {action('Bajar', onDown, index === total - 1)}
          {action('Quitar', onDelete, false, theme.danger)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 16 },
  header: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  input: {
    fontSize: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyText: { textAlign: 'center', marginTop: 32, fontSize: 15 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  page: { width: '100%', aspectRatio: 1 / Math.SQRT2, backgroundColor: '#00000008' },
  cardBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pageNumber: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 18 },
  action: { fontSize: 15, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
