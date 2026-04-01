import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0f0e1a]">
        <ActivityIndicator color="#4d44e3" size="large" />
      </View>
    );
  }

  return <Redirect href={user ? '/(app)' : '/(auth)/login'} />;
}
