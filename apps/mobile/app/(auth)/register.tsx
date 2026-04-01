import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../hooks/useTheme';

const FIELDS = [
  { key: 'name',     label: 'Nombre completo',   placeholder: 'Tu nombre',    type: 'default' as const,       secure: false, Icon: User },
  { key: 'email',    label: 'Correo electrónico', placeholder: 'tu@email.com', type: 'email-address' as const, secure: false, Icon: Mail },
  { key: 'password', label: 'Contraseña',         placeholder: '••••••••',     type: 'default' as const,       secure: true,  Icon: Lock },
];

export default function RegisterScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const register = useAuthStore((s) => s.register);

  const values:  Record<string, string>              = { name, email, password };
  const setters: Record<string, (v: string) => void> = { name: setName, email: setEmail, password: setPassword };

  async function handleRegister() {
    if (!name || !email || !password) { setError('Completa todos los campos'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true); setError('');
    try {
      await register(email.trim().toLowerCase(), password, name.trim());
      router.replace('/(app)');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Error al registrarse');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 28, backgroundColor: t.primary,
              alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              shadowColor: t.primary, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
            }}>
              <ShieldCheck size={38} color="#ffffff" strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 32, fontWeight: '800', color: t.text, letterSpacing: -0.8 }}>Crear cuenta</Text>
            <Text style={{ fontSize: 16, color: t.textMuted, marginTop: 6 }}>Empieza a organizar tu vida</Text>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: t.card, borderRadius: 28, padding: 26, gap: 18,
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06, shadowRadius: 24, elevation: 4,
          }}>
            {FIELDS.map(({ key, label, placeholder, type, secure, Icon }) => (
              <View key={key}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: t.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                  {label}
                </Text>
                <View style={{ backgroundColor: t.inputBg, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon size={18} color={t.textSubtle} strokeWidth={1.8} />
                  <TextInput
                    style={{ flex: 1, paddingVertical: 16, fontSize: 16, color: t.text }}
                    placeholder={placeholder}
                    placeholderTextColor={t.textSubtle}
                    value={values[key]}
                    onChangeText={setters[key]}
                    autoCapitalize="none"
                    keyboardType={type}
                    secureTextEntry={secure}
                  />
                </View>
              </View>
            ))}

            {error ? (
              <View style={{ backgroundColor: t.dangerBg, borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 14, color: t.danger, textAlign: 'center', fontWeight: '500' }}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleRegister} disabled={loading}
              style={{
                backgroundColor: t.primary, borderRadius: 18, paddingVertical: 18,
                alignItems: 'center', marginTop: 4,
                shadowColor: t.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
              }}
            >
              {loading
                ? <ActivityIndicator color="#ffffff" />
                : <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 17 }}>Crear cuenta</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 26, gap: 6 }}>
            <Text style={{ color: t.textMuted, fontSize: 15 }}>¿Ya tienes cuenta?</Text>
            <Link href="/(auth)/login">
              <Text style={{ color: t.primary, fontWeight: '700', fontSize: 15 }}>Inicia sesión</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
