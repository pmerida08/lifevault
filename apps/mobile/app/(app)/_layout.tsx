import { Tabs, Redirect } from 'expo-router';
import { View } from 'react-native';
import { Archive, Bot, CalendarDays } from 'lucide-react-native';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../hooks/useTheme';

const TABS = [
  { name: 'index',     Icon: Archive,      label: 'Documentos' },
  { name: 'assistant', Icon: Bot,          label: 'Chatbot'    },
  { name: 'planner',   Icon: CalendarDays, label: 'Planner'    },
];

function TabIcon({
  focused,
  Icon,
  t,
}: {
  focused: boolean;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={{
      width: 56, height: 34, borderRadius: 17,
      backgroundColor: focused ? t.primaryContainer : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={22} color={focused ? t.primary : t.textSubtle} strokeWidth={focused ? 2.2 : 1.8} />
    </View>
  );
}

export default function AppLayout() {
  const user      = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const t         = useTheme();

  if (!isLoading && !user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: t.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      {TABS.map(({ name, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Icon} t={t} />,
          }}
        />
      ))}
      {/* Settings fuera del tab bar visible */}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
