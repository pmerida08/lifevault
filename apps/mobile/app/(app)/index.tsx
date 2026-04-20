import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Upload, Trash2, FileText, FileImage, FileArchive, File, Settings, X } from 'lucide-react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, STORAGE_BUCKET } from '../../lib/supabase';
import { useVaultStore } from '../../store/vault.store';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../hooks/useTheme';

const UPLOAD_WEBHOOK = 'https://n8n-pmv-playground.up.railway.app/webhook/lifevault-upload';

const CATEGORIES = ['all', 'legal', 'health', 'finance', 'personal', 'other'] as const;
const CAT_LABELS: Record<string, string> = {
  all: 'Todo', legal: 'Legal', health: 'Salud', finance: 'Finanzas', personal: 'Personal', other: 'Otro',
};
const CAT_ACCENT: Record<string, string> = {
  legal: '#4d44e3', health: '#2a9d8f', finance: '#f59e0b', personal: '#e76f51', other: '#566166',
};

interface DocItem {
  id: number;
  user_id: string;
  title: string;
  file_name: string;
  file_size: number;
  file_url?: string;
  category: string;
  tags: string[] | null;
  notes?: string;
  created_at: string;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return FileImage;
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return FileArchive;
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) return FileText;
  return File;
}

function DocCard({ doc, onDelete, t }: { doc: DocItem; onDelete: () => void; t: ReturnType<typeof useTheme> }) {
  const kb     = doc.file_size ? (doc.file_size / 1024).toFixed(0) : '0';
  const accent = CAT_ACCENT[doc.category] ?? '#566166';
  const IconComponent = getFileIcon(doc.file_name ?? '');
  const tags = doc.tags ?? [];

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
          {kb} KB · {CAT_LABELS[doc.category] ?? doc.category}
        </Text>
        {tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {tags.slice(0, 3).map((tag) => (
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

type PickedFile = DocumentPicker.DocumentPickerAsset;

function UploadModal({
  visible, file, onClose, onDone, t,
}: {
  visible: boolean; file: PickedFile | null;
  onClose: () => void; onDone: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  const user = useAuthStore((s) => s.user);
  const [selectedCat, setSelectedCat] = useState<string>('other');
  const [uploading, setUploading]     = useState(false);

  const cats = CATEGORIES.filter((c) => c !== 'all');

  async function submit() {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = file.mimeType ?? 'application/octet-stream';
      const safeName = file.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${Date.now()}_${safeName}`;

      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, byteArray, { contentType: mimeType, upsert: false });

      if (storageError) throw new Error(storageError.message);

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
      const fileUrl = urlData.publicUrl;

      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(UPLOAD_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          file_url: fileUrl, file_name: file.name, file_size: file.size ?? 0,
          mime_type: mimeType, category: selectedCat,
          title: file.name.replace(/\.[^.]+$/, ''), user_id: user.id,
        }),
      });

      if (!res.ok) throw new Error(`Webhook HTTP ${res.status}`);
      onDone();
    } catch (err: unknown) {
      Alert.alert('Error al subir', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View style={{ backgroundColor: t.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: t.text }}>Subir documento</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={22} color={t.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {file && (
            <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: t.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color={t.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }} numberOfLines={1}>{file.name}</Text>
                <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
                  {file.size ? `${(file.size / 1024).toFixed(0)} KB` : 'Tamaño desconocido'}
                </Text>
              </View>
            </View>
          )}

          <Text style={{ fontSize: 14, fontWeight: '700', color: t.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Categoría</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {cats.map((cat) => {
              const active = selectedCat === cat;
              return (
                <TouchableOpacity key={cat} onPress={() => setSelectedCat(cat)}
                  style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 9999, backgroundColor: active ? t.primary : t.surface }}>
                  <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? '#fff' : t.textMuted }}>{CAT_LABELS[cat]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={submit} disabled={uploading}
            style={{ backgroundColor: uploading ? t.primaryContainer : t.primary, borderRadius: 18, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {uploading ? <ActivityIndicator color={t.primary} size="small" /> : <Upload size={18} color="#fff" strokeWidth={2.2} />}
            <Text style={{ fontSize: 17, fontWeight: '700', color: uploading ? t.primary : '#fff' }}>{uploading ? 'Subiendo...' : 'Subir archivo'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function VaultScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const { documents, isLoading, fetchDocuments, deleteDocument } = useVaultStore();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [pickedFile,   setPickedFile]   = useState<PickedFile | null>(null);

  useEffect(() => {
    fetchDocuments(category === 'all' ? undefined : category, search || undefined);
  }, [category, search]);

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    setPickedFile(result.assets[0]);
    setModalVisible(true);
  }

  function handleUploadDone() {
    setModalVisible(false);
    setPickedFile(null);
    Alert.alert('¡Listo!', 'Documento subido correctamente.');
    fetchDocuments(category === 'all' ? undefined : category, search || undefined);
  }

  function handleDelete(id: number, title: string) {
    Alert.alert('Eliminar documento', `¿Seguro que quieres eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteDocument(id) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <UploadModal visible={modalVisible} file={pickedFile}
        onClose={() => { setModalVisible(false); setPickedFile(null); }}
        onDone={handleUploadDone} t={t} />

      <View style={{ backgroundColor: t.headerBg, paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 13, color: t.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 }}>Tu bóveda</Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: t.text, letterSpacing: -0.6 }}>Documentos</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={handleUpload}
              style={{ backgroundColor: t.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Upload size={16} color="#ffffff" strokeWidth={2.2} />
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>Subir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(app)/settings' as never)}
              style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} color={t.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: t.inputBg, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12 }}>
          <Search size={18} color={t.textSubtle} strokeWidth={1.8} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: t.text }}
            placeholder="Buscar documentos..."
            placeholderTextColor={t.textSubtle}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                style={{ marginHorizontal: 4, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 9999, backgroundColor: active ? t.primary : t.surface }}>
                <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? '#ffffff' : t.textMuted }}>{CAT_LABELS[cat]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchDocuments()} tintColor={t.primary} />}>
        {(documents as DocItem[]).map((doc) => (
          <DocCard key={String(doc.id)} doc={doc} t={t} onDelete={() => handleDelete(doc.id, doc.title)} />
        ))}

        {!isLoading && documents.length === 0 && (
          <View style={{ backgroundColor: t.card, borderRadius: 24, padding: 48, alignItems: 'center', marginTop: 24,
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: t.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
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
