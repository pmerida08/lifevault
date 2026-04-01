import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, FileText, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../../store/auth.store';
import { useTasksStore } from '../../store/tasks.store';
import { useTheme } from '../../hooks/useTheme';

const PRIORITY_DOT: Record<string, string> = {
  high: '#9e3f4e', medium: '#f59e0b', low: '#a9b4b9',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'Pendiente', in_progress: 'En curso', done: 'Hecho',
};

export default function DashboardScreen() {
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore((s) => s.user);
  const { tasks, fetchTasks, isLoading } = useTasksStore();

  useEffect(() => { fetchTasks(); }, []);

  const pending    = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const high       = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';

  const statusColor = (status: string) => ({
    bg:   status === 'todo' ? t.todoBg : status === 'in_progress' ? t.inProgressBg : t.doneBg,
    text: status === 'todo' ? t.todoText : status === 'in_progress' ? t.inProgressText : t.doneText,
  });

  const quickActions = [
    { label: 'Nueva tarea',  Icon: CheckCircle2, route: '/(app)/planner'   },
    { label: 'Subir doc',    Icon: FileText,     route: '/(app)/vault'      },
    { label: 'Preguntar IA', Icon: Sparkles,     route: '/(app)/assistant'  },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={() => fetchTasks()} tintColor={t.primary} />
      }
    >
      {/* Header */}
      <View style={{
        backgroundColor: t.headerBg,
        paddingHorizontal: 24,
        paddingTop: insets.top + 12,
        paddingBottom: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 15, color: t.textMuted, fontWeight: '500', marginBottom: 2 }}>
              {greeting()},
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: t.text, letterSpacing: -0.8 }}>
              {firstName}
            </Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            backgroundColor: t.primaryContainer, borderRadius: 9999,
            paddingHorizontal: 13, paddingVertical: 8,
          }}>
            <ShieldCheck size={14} color={t.primary} strokeWidth={2.2} />
            <Text style={{ fontSize: 12, color: t.textOnPrimaryContainer, fontWeight: '700', letterSpacing: 0.4 }}>
              SEGURO
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Pendientes',  value: pending,    accent: t.primary },
            { label: 'En curso',    value: inProgress, accent: '#f59e0b' },
            { label: 'Alta prior.', value: high,       accent: '#9e3f4e' },
          ].map(({ label, value, accent }) => (
            <View key={label} style={{
              flex: 1, backgroundColor: t.card, borderRadius: 20, padding: 16,
              shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
            }}>
              <View style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: accent, marginBottom: 12 }} />
              <Text style={{ fontSize: 32, fontWeight: '800', color: t.text, letterSpacing: -0.5 }}>{value}</Text>
              <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 4, fontWeight: '500' }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: t.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
          Acciones rápidas
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {quickActions.map(({ label, Icon, route }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as never)}
              style={{
                flex: 1, backgroundColor: t.card, borderRadius: 20, padding: 16,
                alignItems: 'center', gap: 10,
                shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: t.primaryContainer,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color={t.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 12, color: t.textMuted, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent tasks */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.text }}>Tareas recientes</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/planner' as never)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ fontSize: 14, color: t.primary, fontWeight: '600' }}>Ver todas</Text>
            <ArrowRight size={14} color={t.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {tasks.slice(0, 5).map((task) => {
          const s = statusColor(task.status);
          return (
            <View key={task.id} style={{
              backgroundColor: t.card, borderRadius: 16, padding: 16, marginBottom: 8,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
            }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PRIORITY_DOT[task.priority] ?? '#a9b4b9' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: t.text }} numberOfLines={1}>
                  {task.title}
                </Text>
                {task.due_date && (
                  <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
                    {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </Text>
                )}
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, backgroundColor: s.bg }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: s.text }}>
                  {STATUS_LABELS[task.status] ?? task.status}
                </Text>
              </View>
            </View>
          );
        })}

        {tasks.length === 0 && (
          <View style={{
            backgroundColor: t.card, borderRadius: 24, padding: 40, alignItems: 'center',
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
          }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: t.primaryContainer,
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <CheckCircle2 size={28} color={t.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '600', color: t.text }}>Todo al día</Text>
            <Text style={{ fontSize: 15, color: t.textMuted, marginTop: 4 }}>Sin tareas pendientes</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
