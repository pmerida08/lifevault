import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface State { hasError: boolean; error: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      error: error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0f0e17', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#f87171', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Algo salió mal</Text>
          <ScrollView style={{ maxHeight: 300, width: '100%', backgroundColor: '#1a1928', borderRadius: 12, padding: 14 }}>
            <Text style={{ color: '#9895c8', fontSize: 12, fontFamily: 'monospace' }}>{this.state.error}</Text>
          </ScrollView>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: '' })}
            style={{ marginTop: 20, backgroundColor: '#4d44e3', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
