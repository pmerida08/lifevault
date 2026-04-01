import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User, Mail, CreditCard, KeyRound, Fingerprint, Download,
  UserX, BrainCircuit, MessageSquareX, Info, FileText,
  LogOut, ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../hooks/useTheme';

function SettingsRow({ label, value, onPress, danger, icon, t }: {
  label: string; value?: string; onPress?: () => void;
  danger?: boolean; icon: React.ReactNode;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} disabled={!onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 18, gap: 14 }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: danger ? t.dangerBg : t.surface,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </View>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: danger ? t.danger : t.text }}>{label}</Text>
      {value
        ? <Text style={{ fontSize: 14, color: t.textMuted }}>{value}</Text>
        : onPress
          ? <ChevronRight size={18} color={t.textSubtle} strokeWidth={1.8} />
          : null
      }
    </TouchableOpacity>
  );
}

function Divider({ t }: { t: ReturnType<typeof useTheme> }) {
  return <View style={{ height: 1, backgroundColor: t.divider, marginLeft: 68 }} />;
}

function SettingsSection({ title, children, t }: { title: string; children: React.ReactNode; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: t.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 4, marginBottom: 10 }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: t.card, borderRadius: 20, overflow: 'hidden',
        shadowColor: t.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
      }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join('') ?? 'U';

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Header */}
      <View style={{ backgroundColor: t.headerBg, paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 20 }}>
        <Text style={{ fontSize: 13, color: t.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 }}>
          Mi cuenta
        </Text>
        <Text style={{ fontSize: 30, fontWeight: '800', color: t.text, letterSpacing: -0.6 }}>Perfil</Text>
      </View>

      <View style={{ padding: 20 }}>
        {/* Profile card */}
        <View style={{
          backgroundColor: t.primary, borderRadius: 24, padding: 22,
          flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24,
          shadowColor: t.primary, shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
        }}>
          <View style={{
            width: 60, height: 60, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#ffffff' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>{user?.name}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user?.email}</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '700' }}>Premium</Text>
          </View>
        </View>

        <SettingsSection title="Cuenta" t={t}>
          <SettingsRow label="Nombre"             value={user?.name}  icon={<User size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
          <Divider t={t} />
          <SettingsRow label="Email"              value={user?.email} icon={<Mail size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
          <Divider t={t} />
          <SettingsRow label="Plan"               value="Premium"     onPress={() => {}} icon={<CreditCard size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
          <Divider t={t} />
          <SettingsRow label="Cambiar contraseña" onPress={() => Alert.alert('Próximamente')} icon={<KeyRound size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
        </SettingsSection>

        <SettingsSection title="Privacidad y seguridad" t={t}>
          <SettingsRow label="Autenticación biométrica" onPress={() => Alert.alert('Próximamente')} icon={<Fingerprint size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
          <Divider t={t} />
          <SettingsRow label="Exportar datos"           onPress={() => Alert.alert('Próximamente')} icon={<Download size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
          <Divider t={t} />
          <SettingsRow label="Eliminar cuenta"          onPress={() => Alert.alert('Próximamente')} icon={<UserX size={18} color={t.danger} strokeWidth={1.8} />} danger t={t} />
        </SettingsSection>

        <SettingsSection title="Inteligencia Artificial" t={t}>
          <SettingsRow label="Proveedor IA"              value="OpenAI" onPress={() => Alert.alert('Próximamente')} icon={<BrainCircuit size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
          <Divider t={t} />
          <SettingsRow label="Limpiar historial de chat" onPress={() => Alert.alert('Próximamente')} icon={<MessageSquareX size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
        </SettingsSection>

        <SettingsSection title="App" t={t}>
          <SettingsRow label="Versión"               value="1.0.0" icon={<Info size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
          <Divider t={t} />
          <SettingsRow label="Términos y privacidad" onPress={() => Alert.alert('Próximamente')} icon={<FileText size={18} color={t.textMuted} strokeWidth={1.8} />} t={t} />
        </SettingsSection>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: t.dangerBg, borderRadius: 18, paddingVertical: 17,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 4,
          }}
        >
          <LogOut size={18} color={t.danger} strokeWidth={2} />
          <Text style={{ color: t.danger, fontWeight: '700', fontSize: 16 }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
