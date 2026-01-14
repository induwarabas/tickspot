import React, { useEffect, useMemo, useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EntriesStackParamList } from '../navigation/RootNavigator';
import {
  createEntry,
  deleteEntry,
  getProjects,
  getTasks,
  TickProject,
  TickTask,
  updateEntry,
} from '../api/tickApi';
import { useSettings } from '../context/SettingsContext';
import SelectField, { SelectOption } from '../components/SelectField';

const pad2 = (value: number) => value.toString().padStart(2, '0');
const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const todayString = () => formatLocalDate(new Date());

type Props = NativeStackScreenProps<EntriesStackParamList, 'EntryForm'>;

export default function EntryFormScreen({ navigation, route }: Props) {
  const { settings, isReady } = useSettings();
  const entry = route.params?.entry;

  const [date, setDate] = useState(entry?.date ?? todayString());
  const [hours, setHours] = useState(entry?.hours?.toString() ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [projectId, setProjectId] = useState<number | null>(entry?.project_id ?? null);
  const [taskId, setTaskId] = useState<number | null>(entry?.task_id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<TickProject[]>([]);
  const [tasks, setTasks] = useState<TickTask[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const isEditing = Boolean(entry?.id);
  const title = isEditing ? 'Update Entry' : 'New Entry';

  const payload = useMemo(() => {
    const parsedHours = Number(hours);
    return {
      date,
      hours: Number.isFinite(parsedHours) ? parsedHours : 0,
      notes: notes.trim() || undefined,
      task_id: taskId ?? undefined,
      project_id: projectId ?? undefined,
    };
  }, [date, hours, notes, taskId, projectId]);

  useEffect(() => {
    if (!isReady || !settings.apiKey) {
      return;
    }

    let isMounted = true;
    setIsLoadingLookups(true);
    Promise.all([getProjects(settings), getTasks(settings)])
      .then(([projectList, taskList]) => {
        if (!isMounted) {
          return;
        }
        setProjects(projectList);
        setTasks(taskList);
      })
      .catch((error) => {
        if (isMounted) {
          Alert.alert('Lookup failed', error instanceof Error ? error.message : 'Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLookups(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isReady, settings]);

  const projectOptions: SelectOption[] = useMemo(
    () =>
      projects.map((project) => ({
        label: project.name,
        value: project.id,
      })),
    [projects],
  );

  const taskOptions: SelectOption[] = useMemo(() => {
    const visibleTasks = projectId
      ? tasks.filter((task) => task.project_id === projectId)
      : tasks;
    return visibleTasks.map((task) => ({
      label: task.name,
      value: task.id,
    }));
  }, [tasks, projectId]);

  const handleSave = async () => {
    if (!settings.apiKey) {
      Alert.alert('Missing API key', 'Add an API key in Settings before saving entries.');
      return;
    }

    if (!payload.date || !payload.hours) {
      Alert.alert('Missing fields', 'Please enter a date and hours.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && entry) {
        await updateEntry(settings, entry.id, payload);
      } else {
        await createEntry(settings, payload);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) {
      return;
    }

    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(settings, entry.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert(
              'Delete failed',
              error instanceof Error ? error.message : 'Please try again.',
            );
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
            placeholder="2024-01-30"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hours</Text>
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={setHours}
            placeholder="1.5"
            keyboardType="decimal-pad"
          />
        </View>

        <SelectField
          label="Project"
          placeholder="Select project"
          value={projectId}
          options={projectOptions}
          onChange={(value) => {
            setProjectId(value);
            setTaskId(null);
          }}
          allowClear
          disabled={isLoadingLookups || !settings.apiKey}
          helperText={
            !settings.apiKey
              ? 'Add an API key in Settings to load projects.'
              : isLoadingLookups
                ? 'Loading projects...'
                : undefined
          }
        />

        <SelectField
          label="Task"
          placeholder={projectId ? 'Select task' : 'Select task (optional)'}
          value={taskId}
          options={taskOptions}
          onChange={setTaskId}
          allowClear
          disabled={isLoadingLookups || !settings.apiKey || tasks.length === 0}
          helperText={
            !settings.apiKey
              ? 'Add an API key in Settings to load tasks.'
              : isLoadingLookups
                ? 'Loading tasks...'
                : tasks.length === 0
                  ? 'No tasks available.'
                  : projectId
                    ? 'Filtered by project.'
                    : undefined
          }
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="What did you work on?"
            multiline
          />
        </View>

        <Pressable
          style={[styles.primaryButton, isSaving && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>{isEditing ? 'Update Entry' : 'Create Entry'}</Text>
        </Pressable>

        {isEditing ? (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Entry</Text>
          </Pressable>
        ) : null}
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
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
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
  deleteButton: {
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f3b4b4',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#b42318',
    fontWeight: '600',
  },
});
