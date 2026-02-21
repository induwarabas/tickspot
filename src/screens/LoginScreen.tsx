import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useAppTheme } from '../theme/useAppTheme';

export default function LoginScreen() {
  const { settings, save } = useSettings();
  const { colors } = useAppTheme();
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setBaseUrl(settings.baseUrl);
  }, [settings.apiKey, settings.baseUrl]);

  const handleLogin = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Missing API key', 'Enter your TickSpot API key to continue.');
      return;
    }

    if (!baseUrl.trim()) {
      Alert.alert('Missing login URL', 'Enter your TickSpot login URL to continue.');
      return;
    }

    setIsSaving(true);
    try {
      await save({
        ...settings,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
      });
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>TickSpot Login</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add your API key and login URL to continue.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>API Key</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            placeholder="Your API key"
            secureTextEntry
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Login URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={baseUrl}
            onChangeText={setBaseUrl}
            autoCapitalize="none"
            placeholder="https://your-account.tickspot.com/.../api/v2"
          />
        </View>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.primary }, isSaving && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isSaving}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>Continue</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
  content: {
    padding: 20,
    paddingTop: 32,
  },
  headerBlock: {
    marginBottom: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 8,
  },
  subtitle: {
    color: '#52606d',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#3e4c59',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e3ded4',
  },
  primaryButton: {
    backgroundColor: '#1f2933',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#f9f5ee',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
