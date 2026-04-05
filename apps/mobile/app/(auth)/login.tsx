import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../hooks/useTheme';

export default function LoginScreen() {
  const t      = useTheme();
  const insets = useSafeAreaInsets();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handleLogin() {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(app)');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Error al iniciar sesión');
    } finally { setLoading(false); }
  }

  const fields = [
    { key: 'email',    label: 'Correo',     placeholder: 'tu@email.com', value: email,    set: setEmail,    type: 'email-address' as const, secure: false, Icon: Mail },
    { key: 'password', label: 'Contraseña', placeholder: '••••••••',     value: password, set: setPassword, type: 'default' as const,       secure: true,  Icon: Lock },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Image
              source={require('../../assets/Lifevault.png')}
              style={{
                width: 96, height: 96, marginBottom: 20,
              }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 32, fontWeight: '800', color: t.text, letterSpacing: -0.8 }}>LifeVault</Text>
            <Text style={{ fontSize: 16, color: t.textMuted, marginTop: 6 }}>Tu bóveda personal inteligente</Text>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: t.card, borderRadius: 28, padding: 26, gap: 18,
            shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06, shadowRadius: 24, elevation: 4,
          }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: t.text, marginBottom: 2 }}>Iniciar sesión</Text>

            {fields.map(({ key, label, placeholder, value, set, type, secure, Icon }) => (
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
                    value={value}
                    onChangeText={set}
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
              onPress={handleLogin} disabled={loading}
              style={{
                backgroundColor: t.primary, borderRadius: 18, paddingVertical: 18,
                alignItems: 'center', marginTop: 4,
                shadowColor: t.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
              }}
            >
              {loading
                ? <ActivityIndicator color="#ffffff" />
                : <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 17 }}>Entrar</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 26, gap: 6 }}>
            <Text style={{ color: t.textMuted, fontSize: 15 }}>¿No tienes cuenta?</Text>
            <Link href="/(auth)/register">
              <Text style={{ color: t.primary, fontWeight: '700', fontSize: 15 }}>Regístrate</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
