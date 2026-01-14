import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSettings } from '../context/SettingsContext';
import { configureWeekdayReminders, validateReminderTimes } from '../notifications/reminders';

const pad2 = (value: number) => value.toString().padStart(2, '0');

function formatTime(value: Date) {
  return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}

function parseTimeString(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
}

export default function SettingsScreen() {
  const { settings, save } = useSettings();
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderTimes, setReminderTimes] = useState<string[]>(settings.reminderTimes);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<
    { mode: 'add' } | { mode: 'edit'; index: number } | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setBaseUrl(settings.baseUrl);
    setReminderEnabled(settings.reminderEnabled);
    setReminderTimes(settings.reminderTimes);
  }, [
    settings.apiKey,
    settings.baseUrl,
    settings.reminderEnabled,
    settings.reminderTimes,
  ]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Missing API key', 'Enter your TickSpot API key to continue.');
      return;
    }

    const normalizedTimes = validateReminderTimes(reminderTimes);
    if (reminderEnabled && normalizedTimes.length === 0) {
      Alert.alert('Invalid reminder times', 'Add at least one time in HH:MM format.');
      return;
    }

    setIsSaving(true);
    try {
      const nextSettings = {
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || settings.baseUrl,
        reminderEnabled,
        reminderTimes: normalizedTimes,
      };
      await save(nextSettings);
      await configureWeekdayReminders(nextSettings);
      Alert.alert('Saved', 'Your settings have been updated.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Settings</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            placeholder="Your API key"
          />
          <Text style={styles.helperText}>
            This key is stored locally on the device.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Base URL</Text>
          <TextInput
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
            autoCapitalize="none"
            placeholder="https://www.tickspot.com/api/v2"
          />
          <Text style={styles.helperText}>
            Update if your TickSpot account uses a custom host.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>Reminders</Text>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Weekday reminders</Text>
          <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
        </View>
        <Text style={styles.helperText}>
          Scheduled Monday to Friday. Defaults to 10:00, 17:00, 21:00.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Times (24h)</Text>
          {reminderTimes.map((time, index) => (
            <View key={`${time}-${index}`} style={styles.timeRow}>
              <Pressable
                style={[styles.input, styles.timeInput, styles.timeButton]}
                onPress={() => {
                  setPickerTarget({ mode: 'edit', index });
                  setPickerDate(parseTimeString(time));
                  setPickerVisible(true);
                }}
              >
                <Text style={styles.timeText}>{time}</Text>
              </Pressable>
              <Pressable
                style={styles.removeButton}
                onPress={() =>
                  setReminderTimes((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.timeRow}>
            <Pressable
              style={[styles.input, styles.timeInput, styles.timeButton]}
              onPress={() => {
                setPickerTarget({ mode: 'add' });
                setPickerDate(new Date());
                setPickerVisible(true);
              }}
            >
              <Text style={styles.timePlaceholder}>Add time</Text>
            </Pressable>
            <Pressable
              style={styles.addButton}
              onPress={() => {
                setPickerTarget({ mode: 'add' });
                setPickerDate(new Date());
                setPickerVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>Pick</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, isSaving && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>Save Settings</Text>
        </Pressable>
      </ScrollView>

      {pickerVisible && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="default"
          is24Hour
          onChange={(event, date) => {
            setPickerVisible(false);
            if (event.type !== 'set' || !date || !pickerTarget) {
              return;
            }
            const nextValue = formatTime(date);
            setReminderTimes((current) => {
              if (pickerTarget.mode === 'add') {
                return [...current, nextValue];
              }
              return current.map((item, itemIndex) =>
                itemIndex === pickerTarget.index ? nextValue : item,
              );
            });
          }}
        />
      ) : null}

      {pickerVisible && Platform.OS === 'ios' ? (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="spinner"
              is24Hour
              onChange={(_, date) => {
                if (date) {
                  setPickerDate(date);
                }
              }}
            />
            <View style={styles.pickerActions}>
              <Pressable style={styles.pickerCancel} onPress={() => setPickerVisible(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.pickerDone}
                onPress={() => {
                  if (!pickerTarget) {
                    setPickerVisible(false);
                    return;
                  }
                  const nextValue = formatTime(pickerDate);
                  setReminderTimes((current) => {
                    if (pickerTarget.mode === 'add') {
                      return [...current, nextValue];
                    }
                    return current.map((item, itemIndex) =>
                      itemIndex === pickerTarget.index ? nextValue : item,
                    );
                  });
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 16,
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
  helperText: {
    color: '#8c8577',
    fontSize: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e3ded4',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#1f2933',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
    marginRight: 12,
  },
  timeButton: {
    justifyContent: 'center',
  },
  timeText: {
    color: '#1f2933',
    fontWeight: '600',
  },
  timePlaceholder: {
    color: '#8c8577',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fde2e2',
  },
  removeButtonText: {
    color: '#b42318',
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e6f4ff',
  },
  addButtonText: {
    color: '#1f2933',
    fontWeight: '600',
  },
  pickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
  },
  pickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pickerCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f0ede6',
  },
  pickerCancelText: {
    color: '#1f2933',
    fontWeight: '600',
  },
  pickerDone: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1f2933',
  },
  pickerDoneText: {
    color: '#f9f5ee',
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#f9f5ee',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
