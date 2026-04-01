import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Upload, Trash2, FileText, FileImage, FileArchive, File } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useVaultStore } from '../../store/vault.store';
import { useTheme } from '../../hooks/useTheme';
import type { Document } from '@lifevault/shared';

const CATEGORIES = ['all', 'legal', 'health', 'finance', 'personal', 'other'] as const;
const CAT_LABELS: Record<string, string> = {
  all: 'Todo', legal: 'Legal', health: 'Salud', finance: 'Finanzas', personal: 'Personal', other: 'Otro',
};
const CAT_ACCENT: Record<string, string> = {
  legal: '#4d44e3', health: '#2a9d8f', finance: '#f59e0b', personal: '#e76f51', other: '#566166',
};

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return FileImage;
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return FileArchive;
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) return FileText;
  return File;
}

function DocCard({ doc, onDelete, t }: { doc: Document; onDelete: () => void; t: ReturnType<typeof useTheme> }) {
  const kb     = (doc.file_size / 1024).toFixed(0);
  const accent = CAT_ACCENT[doc.category] ?? '#566166';
  const IconComponent = getFileIcon(doc.file_name);

  return (
    <View style={{
      backgroundColor: t.card, borderRadius: 20, padding: 18, marginBottom: 10,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    }}>
      <View style={{
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconComponent size={24} color={accent} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: t.text }} numberOfLines={1}>{doc.title}</Text>
        <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
          {kb} KB · {CAT_LABELS[doc.category]}
        </Text>
        {doc.tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {doc.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={{ backgroundColor: t.chipBg, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12, color: t.chipText, fontWeight: '600' }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} style={{ padding: 8 }}>
        <Trash2 size={18} color={t.textSubtle} strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  );
}

export default function VaultScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const { documents, isLoading, fetchDocuments, deleteDocument } = useVaultStore();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    fetchDocuments(category === 'all' ? undefined : category, search || undefined);
  }, [category, search]);

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    Alert.alert('Próximamente', 'La subida de archivos estará disponible pronto.');
  }

  function handleDelete(id: string, title: string) {
    Alert.alert('Eliminar documento', `¿Seguro que quieres eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteDocument(id) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={{ backgroundColor: t.headerBg, paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 13, color: t.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 }}>
              Tu bóveda
            </Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: t.text, letterSpacing: -0.6 }}>Documentos</Text>
          </View>
          <TouchableOpacity
            onPress={handleUpload}
            style={{
              backgroundColor: t.primary, borderRadius: 16,
              paddingHorizontal: 16, paddingVertical: 11,
              flexDirection: 'row', alignItems: 'center', gap: 7,
            }}
          >
            <Upload size={16} color="#ffffff" strokeWidth={2.2} />
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>Subir</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{
          backgroundColor: t.inputBg, borderRadius: 16,
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12,
        }}>
          <Search size={18} color={t.textSubtle} strokeWidth={1.8} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: t.text }}
            placeholder="Buscar documentos..."
            placeholderTextColor={t.textSubtle}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={{
                  marginHorizontal: 4, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9999,
                  backgroundColor: active ? t.primary : t.surface,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? '#ffffff' : t.textMuted }}>
                  {CAT_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchDocuments()} tintColor={t.primary} />}
      >
        {documents.map((doc) => (
          <DocCard key={doc.id} doc={doc} t={t} onDelete={() => handleDelete(doc.id, doc.title)} />
        ))}

        {!isLoading && documents.length === 0 && (
          <View style={{
            backgroundColor: t.card, borderRadius: 24, padding: 48, alignItems: 'center', marginTop: 24,
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
          }}>
            <View style={{
              width: 76, height: 76, borderRadius: 24, backgroundColor: t.primaryContainer,
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <FileText size={34} color={t.primary} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 8 }}>Sin documentos</Text>
            <Text style={{ fontSize: 15, color: t.textMuted, textAlign: 'center', lineHeight: 22 }}>
              Sube tus documentos importantes para acceder a ellos en cualquier momento
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
