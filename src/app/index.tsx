import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import {
  createDocument,
  listDocuments,
  pageUri,
  type ScannedDocument,
} from '../lib/documents';
import { scanPages } from '../lib/scanner';
import { useTheme } from '../lib/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DocumentsScreen() {
  const theme = useTheme();
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [scanning, setScanning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setDocuments(listDocuments());
    }, []),
  );

  const onScan = async () => {
    setScanning(true);
    try {
      const images = await scanPages();
      if (images.length === 0) return;
      const doc = await createDocument(images);
      router.push({ pathname: '/document/[id]', params: { id: doc.id } });
    } catch (error) {
      Alert.alert('No se pudo escanear', error instanceof Error ? error.message : String(error));
    } finally {
      setScanning(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <FlatList
        data={documents}
        keyExtractor={(doc) => doc.id}
        contentContainerStyle={documents.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aún no hay documentos</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              Pulsa «Escanear documento» y enfoca el papel con la cámara. La app detecta los bordes
              y lo recorta sola.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/document/[id]', params: { id: item.id } })}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && { opacity: 0.7 },
            ]}>
            {item.pages[0] ? (
              <Image
                source={{ uri: pageUri(item, item.pages[0]) }}
                style={[styles.thumb, { borderColor: theme.border }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, { borderColor: theme.border }]} />
            )}
            <View style={styles.rowText}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>
                {item.pages.length} {item.pages.length === 1 ? 'página' : 'páginas'} ·{' '}
                {formatDate(item.updatedAt)}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <View style={[styles.footer, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Button title="Escanear documento" onPress={onScan} loading={scanning} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  empty: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 56, height: 74, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13 },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
