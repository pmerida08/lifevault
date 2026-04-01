import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, CheckCircle2, Circle, Trash2, CalendarDays } from 'lucide-react-native';
import { useTasksStore } from '../../store/tasks.store';
import { useTheme } from '../../hooks/useTheme';
import type { Task } from '@lifevault/shared';

const STATUSES = ['todo', 'in_progress', 'done'] as const;
const STATUS_LABELS: Record<string, string> = {
  all: 'Todas', todo: 'Pendiente', in_progress: 'En curso', done: 'Hecho',
};
const PRIORITY_COLORS: Record<string, string> = {
  high: '#9e3f4e', medium: '#f59e0b', low: '#a9b4b9',
};
const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta', medium: 'Media', low: 'Baja',
};

function TaskItem({ task, onStatusChange, onDelete, t }: {
  task: Task;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTheme>;
}) {
  const nextStatus: Record<Task['status'], Task['status']> = {
    todo: 'in_progress', in_progress: 'done', done: 'todo',
  };
  const isDone = task.status === 'done';

  return (
    <View style={{
      backgroundColor: t.card, borderRadius: 18, padding: 16, marginBottom: 8,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    }}>
      <TouchableOpacity onPress={() => onStatusChange(task.id, nextStatus[task.status])}>
        {isDone
          ? <CheckCircle2 size={26} color={t.primary} strokeWidth={1.8} />
          : <Circle size={26} color={t.textSubtle} strokeWidth={1.8} />
        }
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16, fontWeight: '500',
          color: isDone ? t.textSubtle : t.text,
          textDecorationLine: isDone ? 'line-through' : 'none',
        }}>
          {task.title}
        </Text>
        {task.description ? (
          <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: PRIORITY_COLORS[task.priority] }} />
          <Text style={{ fontSize: 12, color: t.textMuted, fontWeight: '600' }}>
            {PRIORITY_LABELS[task.priority]}
          </Text>
          {task.due_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <CalendarDays size={11} color={t.textSubtle} strokeWidth={1.8} />
              <Text style={{ fontSize: 12, color: t.textSubtle }}>
                {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={() => onDelete(task.id)} style={{ padding: 6 }}>
        <Trash2 size={18} color={t.textSubtle} strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  );
}

export default function PlannerScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, isLoading } = useTasksStore();
  const [activeStatus, setActiveStatus] = useState<string>('todo');
  const [showModal,    setShowModal]    = useState(false);
  const [newTitle,     setNewTitle]     = useState('');
  const [newPriority,  setNewPriority]  = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks.filter((tk) => activeStatus === 'all' || tk.status === activeStatus);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    await createTask({ title: newTitle.trim(), priority: newPriority, status: 'todo' });
    setNewTitle('');
    setShowModal(false);
  }

  function handleDelete(id: string) {
    Alert.alert('Eliminar', '¿Eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={{ backgroundColor: t.headerBg, paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 13, color: t.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 }}>
              Organización
            </Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: t.text, letterSpacing: -0.6 }}>Planner</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              backgroundColor: t.primary, borderRadius: 16,
              paddingHorizontal: 16, paddingVertical: 11,
              flexDirection: 'row', alignItems: 'center', gap: 7,
            }}
          >
            <Plus size={18} color="#ffffff" strokeWidth={2.5} />
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>Tarea</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          {(['all', ...STATUSES] as const).map((s) => {
            const active = activeStatus === s;
            const count  = s === 'all' ? tasks.length : tasks.filter((tk) => tk.status === s).length;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setActiveStatus(s)}
                style={{
                  marginHorizontal: 4, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9999,
                  backgroundColor: active ? t.primary : t.surface,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? '#ffffff' : t.textMuted }}>
                  {STATUS_LABELS[s]}
                </Text>
                <View style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.25)' : t.overlay,
                  borderRadius: 9999, paddingHorizontal: 7, paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#ffffff' : t.textMuted }}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tasks */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchTasks()} tintColor={t.primary} />}
      >
        {filtered.map((task) => (
          <TaskItem
            key={task.id} task={task} t={t}
            onStatusChange={(id, status) => updateTask(id, { status })}
            onDelete={handleDelete}
          />
        ))}

        {filtered.length === 0 && !isLoading && (
          <View style={{
            backgroundColor: t.card, borderRadius: 24, padding: 48, alignItems: 'center', marginTop: 16,
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
          }}>
            <View style={{
              width: 68, height: 68, borderRadius: 22, backgroundColor: t.primaryContainer,
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <CheckCircle2 size={30} color={t.primary} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: t.text, marginBottom: 6 }}>Sin tareas aquí</Text>
            <Text style={{ fontSize: 15, color: t.textMuted }}>Crea una nueva tarea</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: t.modalOverlay }}>
          <View style={{ backgroundColor: t.modalBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 18 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.overlay, alignSelf: 'center', marginBottom: 2 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: t.text }}>Nueva tarea</Text>

            <View style={{ backgroundColor: t.inputBg, borderRadius: 16, paddingHorizontal: 18 }}>
              <TextInput
                style={{ paddingVertical: 16, fontSize: 16, color: t.text }}
                placeholder="Título de la tarea..."
                placeholderTextColor={t.textSubtle}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, color: t.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>
                Prioridad
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setNewPriority(p)}
                    style={{
                      flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
                      backgroundColor: newPriority === p ? t.primary : t.surface,
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, marginBottom: 5, backgroundColor: newPriority === p ? '#ffffff' : PRIORITY_COLORS[p] }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: newPriority === p ? '#ffffff' : t.textMuted }}>
                      {PRIORITY_LABELS[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setShowModal(false); setNewTitle(''); }}
                style={{ flex: 1, backgroundColor: t.surface, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: t.textMuted, fontWeight: '600', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={{ flex: 1, backgroundColor: t.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
