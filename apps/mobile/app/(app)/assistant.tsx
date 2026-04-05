import { useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Trash2, SendHorizonal, Bot, Settings, RefreshCw, Download, FileText } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssistantStore } from '../../store/assistant.store';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../lib/api';
import type { AIAction } from '@lifevault/shared';

const SUGGESTIONS = [
  '¿Qué tareas tengo pendientes esta semana?',
  '¿Tengo documentos de salud?',
  'Resumen de mis eventos próximos',
  'Crea una tarea: renovar seguro',
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string, color: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <Text key={i} style={{ fontWeight: '700', color }}>{part.slice(2, -2)}</Text>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <Text key={i} style={{ fontStyle: 'italic', color }}>{part.slice(1, -1)}</Text>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <Text key={i} style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color }}>{part.slice(1, -1)}</Text>;
    return <Text key={i} style={{ color }}>{part}</Text>;
  });
}

function MarkdownContent({ text, color }: { text: string; color: string }) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, idx) => {
        if (line.startsWith('### '))
          return <Text key={idx} style={{ fontWeight: '700', fontSize: 15, color, marginTop: 8, marginBottom: 2 }}>{line.slice(4)}</Text>;
        if (line.startsWith('## '))
          return <Text key={idx} style={{ fontWeight: '800', fontSize: 17, color, marginTop: 10, marginBottom: 2 }}>{line.slice(3)}</Text>;
        if (line.startsWith('# '))
          return <Text key={idx} style={{ fontWeight: '800', fontSize: 19, color, marginTop: 10, marginBottom: 2 }}>{line.slice(2)}</Text>;
        if (line.match(/^[-•]\s/))
          return (
            <View key={idx} style={{ flexDirection: 'row', marginTop: 4 }}>
              <Text style={{ color, marginRight: 8, lineHeight: 24 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 24, color }}>{renderInline(line.slice(2), color)}</Text>
            </View>
          );
        if (line.trim() === '')
          return <View key={idx} style={{ height: 6 }} />;
        return (
          <Text key={idx} style={{ fontSize: 15, lineHeight: 24, color }}>
            {renderInline(line, color)}
          </Text>
        );
      })}
    </View>
  );
}

// ─── Attachment download card ─────────────────────────────────────────────────

function AttachmentCard({
  id, title, t,
}: { id: string; title: string; t: ReturnType<typeof useTheme> }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await api.get<{ url: string }>(`/documents/${id}/download`);
      await Linking.openURL(res.url);
    } catch {
      Alert.alert('Error', 'No se pudo obtener el enlace de descarga.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handleDownload}
      disabled={loading}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: t.primaryContainer, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 10, marginTop: 8,
      }}
    >
      <FileText size={16} color={t.primary} strokeWidth={1.8} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: t.primary }} numberOfLines={1}>
        {title}
      </Text>
      {loading
        ? <ActivityIndicator size="small" color={t.primary} />
        : <Download size={15} color={t.primary} strokeWidth={1.8} />}
    </TouchableOpacity>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ role, content, actions, attachments, t }: {
  role: 'user' | 'assistant';
  content: string;
  actions?: AIAction[];
  attachments?: Array<{ type: string; id: string; title: string }>;
  t: ReturnType<typeof useTheme>;
}) {
  const isUser = role === 'user';
  const textColor = isUser ? '#ffffff' : t.text;

  return (
    <View style={{ marginBottom: 14, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <View style={{
          width: 30, height: 30, borderRadius: 10,
          backgroundColor: t.primaryContainer,
          alignItems: 'center', justifyContent: 'center', marginBottom: 6,
        }}>
          <Sparkles size={15} color={t.primary} strokeWidth={1.8} />
        </View>
      )}
      <View style={{
        maxWidth: '82%',
        borderRadius: 20,
        borderBottomRightRadius: isUser ? 4 : 20,
        borderBottomLeftRadius: isUser ? 20 : 4,
        paddingHorizontal: 18, paddingVertical: 14,
        backgroundColor: isUser ? t.primary : t.card,
        shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isUser ? 0 : 0.04, shadowRadius: 8, elevation: isUser ? 0 : 1,
      }}>
        {isUser
          ? <Text style={{ fontSize: 15, lineHeight: 24, color: textColor }}>{content}</Text>
          : <MarkdownContent text={content} color={textColor} />
        }
      </View>

      {/* Attachments (document download cards) */}
      {!isUser && attachments && attachments.length > 0 && (
        <View style={{ maxWidth: '82%', width: '82%', marginTop: 4 }}>
          {attachments
            .filter((a) => a.type === 'document')
            .map((a) => <AttachmentCard key={a.id} id={a.id} title={a.title} t={t} />)
          }
        </View>
      )}

      {/* Action chips */}
      {actions && actions.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, paddingLeft: 4 }}>
          {actions.map((a, i) => (
            <TouchableOpacity key={i} style={{
              backgroundColor: t.chipBg, borderRadius: 9999,
              paddingHorizontal: 14, paddingVertical: 7, marginRight: 6, marginTop: 6,
            }}>
              <Text style={{ fontSize: 13, color: t.chipText, fontWeight: '600' }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AssistantScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);
  const { messages, isLoading, sendMessage, clearHistory, reloadSession } = useAssistantStore();

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text);
    flatRef.current?.scrollToEnd({ animated: true });
  }

  function handleClear() {
    Alert.alert('Limpiar historial', '¿Borrar toda la conversación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: clearHistory },
    ]);
  }

  function handleReloadSession() {
    Alert.alert(
      'Nueva sesión',
      'Se iniciará una conversación nueva. El asistente no recordará el contexto anterior.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Nueva sesión', onPress: reloadSession },
      ]
    );
  }

  const renderItem = useCallback(({ item }: { item: typeof messages[0] }) => (
    <ChatBubble
      role={item.role}
      content={item.content}
      actions={item.response?.actions}
      attachments={item.response?.attachments}
      t={t}
    />
  ), [t]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{
        backgroundColor: t.headerBg, paddingHorizontal: 24,
        paddingTop: insets.top + 12, paddingBottom: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <View>
          <Text style={{ fontSize: 13, color: t.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 }}>
            Asistente
          </Text>
          <Text style={{ fontSize: 30, fontWeight: '800', color: t.text, letterSpacing: -0.6 }}>IA Personal</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {messages.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={{
                backgroundColor: t.surface, borderRadius: 12,
                paddingHorizontal: 12, paddingVertical: 8,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
            >
              <Trash2 size={14} color={t.textMuted} strokeWidth={1.8} />
              <Text style={{ fontSize: 14, color: t.textMuted, fontWeight: '600' }}>Limpiar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleReloadSession}
            style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={18} color={t.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings' as never)}
            style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Settings size={20} color={t.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 16 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 32 }}>
            <View style={{
              width: 84, height: 84, borderRadius: 28, backgroundColor: t.primaryContainer,
              alignItems: 'center', justifyContent: 'center', marginBottom: 18,
            }}>
              <Bot size={40} color={t.primary} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 19, fontWeight: '700', color: t.text, textAlign: 'center', marginBottom: 8 }}>
              Pregúntame lo que necesites
            </Text>
            <Text style={{ fontSize: 15, color: t.textMuted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 }}>
              Tengo acceso a tus tareas, eventos y documentos
            </Text>
            <View style={{ marginTop: 24, gap: 8, width: '100%' }}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setInput(s)}
                  style={{
                    backgroundColor: t.card, borderRadius: 16, padding: 16,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
                  }}
                >
                  <Sparkles size={16} color={t.primary} strokeWidth={1.8} />
                  <Text style={{ fontSize: 15, color: t.text, flex: 1 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={renderItem}
        onContentSizeChange={() => messages.length > 0 && flatRef.current?.scrollToEnd({ animated: false })}
      />

      {isLoading && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <View style={{
            backgroundColor: t.card, borderRadius: 20, borderBottomLeftRadius: 4,
            paddingHorizontal: 18, paddingVertical: 14, alignSelf: 'flex-start',
          }}>
            <ActivityIndicator size="small" color={t.primary} />
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 16, paddingBottom: insets.bottom + 8, paddingTop: 10,
        gap: 10, backgroundColor: t.tabBar,
        shadowColor: t.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 12,
      }}>
        <View style={{ flex: 1, backgroundColor: t.inputBg, borderRadius: 20, paddingHorizontal: 18, maxHeight: 120 }}>
          <TextInput
            style={{ fontSize: 16, color: t.text, paddingVertical: 14 }}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={t.textSubtle}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            width: 48, height: 48, borderRadius: 15,
            backgroundColor: input.trim() && !isLoading ? t.primary : t.overlay,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <SendHorizonal size={20} color={input.trim() && !isLoading ? '#ffffff' : t.textSubtle} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
