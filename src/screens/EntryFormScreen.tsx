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
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EntriesStackParamList } from '../navigation/RootNavigator';
import {
  createEntry,
  deleteEntry,
  getClients,
  getProjects,
  getTasks,
  TickClient,
  TickProject,
  TickTask,
  updateEntry,
} from '../api/tickApi';
import { useSettings } from '../context/SettingsContext';

const pad2 = (value: number) => value.toString().padStart(2, '0');
const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const todayString = () => formatLocalDate(new Date());

type Props = NativeStackScreenProps<EntriesStackParamList, 'EntryForm'>;

export default function EntryFormScreen({ navigation, route }: Props) {
  const { settings, isReady } = useSettings();
  const entry = route.params?.entry;

  const [date, setDate] = useState(entry?.date ?? todayString());
  const [hours, setHours] = useState(() => {
    const initial = Number(entry?.hours ?? 0);
    return Number.isFinite(initial) ? initial : 0;
  });
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [projectId, setProjectId] = useState<number | null>(entry?.project_id ?? null);
  const [taskId, setTaskId] = useState<number | null>(entry?.task_id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<TickProject[]>([]);
  const [tasks, setTasks] = useState<TickTask[]>([]);
  const [clients, setClients] = useState<TickClient[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const isEditing = Boolean(entry?.id);
  const title = isEditing ? 'Update Entry' : 'New Entry';

  const payload = useMemo(() => {
    return {
      date,
      hours: Number.isFinite(hours) ? hours : 0,
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
    Promise.all([getProjects(settings), getTasks(settings), getClients(settings)])
      .then(([projectList, taskList, clientList]) => {
        if (!isMounted) {
          return;
        }
        setProjects(projectList);
        setTasks(taskList);
        setClients(clientList);
        if (entry?.task_id) {
          const matched = taskList.find((task) => task.id === entry.task_id);
          if (matched?.project_id != null) {
            setProjectId((current) => current ?? matched.project_id ?? null);
          }
        }
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
  }, [isReady, settings, entry?.task_id]);

  const projectNameById = useMemo(() => {
    const map = new Map<number, string>();
    projects.forEach((project) => map.set(project.id, project.name));
    return map;
  }, [projects]);

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    clients.forEach((client) => map.set(client.id, client.name));
    return map;
  }, [clients]);

  const projectById = useMemo(() => {
    const map = new Map<number, TickProject>();
    projects.forEach((project) => map.set(project.id, project));
    return map;
  }, [projects]);

  const tasksByProject = useMemo(() => {
    const grouped = new Map<string, TickTask[]>();
    tasks.forEach((task) => {
      const project = task.project_id ? projectById.get(task.project_id) : null;
      const projectName = project?.name ?? 'Other';
      const clientName = project?.client_id ? clientNameById.get(project.client_id) : undefined;
      const key = clientName ? `${clientName} - ${projectName}` : projectName;
      const list = grouped.get(key) ?? [];
      list.push(task);
      grouped.set(key, list);
    });
    return Array.from(grouped.entries()).map(([name, list]) => ({ name, list }));
  }, [tasks, projectById, clientNameById]);

  const formattedHours = useMemo(() => {
    const totalMinutes = Math.round(hours * 60);
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = totalMinutes % 60;
    return `${hoursPart}h ${minutesPart.toString().padStart(2, '0')}m`;
  }, [hours]);

  const handleSave = async () => {
    if (!settings.apiKey) {
      Alert.alert('Missing API key', 'Add an API key in Settings before saving entries.');
      return;
    }

    if (!payload.date || payload.hours < 0) {
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
          <View style={styles.sliderHeader}>
            <Text style={styles.label}>Hours</Text>
            <Text style={styles.sliderValue}>{formattedHours}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={12}
            step={1 / 12}
            value={hours}
            onValueChange={setHours}
            minimumTrackTintColor="#1f2933"
            maximumTrackTintColor="#d7d1c6"
            thumbTintColor="#1f2933"
          />
          <View style={styles.sliderLegendRow}>
            <Text style={styles.sliderLegend}>0h</Text>
            <Text style={styles.sliderLegend}>12h</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.taskHeaderRow}>
            <Text style={styles.label}>Task</Text>
            {taskId != null ? (
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setTaskId(null);
                  setProjectId(null);
                }}
                disabled={isLoadingLookups || !settings.apiKey}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          {!settings.apiKey ? (
            <Text style={styles.helperText}>Add an API key in Settings to load tasks.</Text>
          ) : isLoadingLookups ? (
            <Text style={styles.helperText}>Loading tasks...</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.helperText}>No tasks available.</Text>
          ) : (
            tasksByProject.map((group) => (
              <View key={group.name} style={styles.taskGroup}>
                <Text style={styles.groupTitle}>{group.name}</Text>
                <View style={styles.chipWrap}>
                  {group.list.map((task) => {
                    const isSelected = task.id === taskId;
                    return (
                      <Pressable
                        key={task.id}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => {
                          setTaskId(task.id);
                          setProjectId(task.project_id ?? null);
                        }}
                        disabled={isLoadingLookups}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {task.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>

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
  helperText: {
    color: '#8c8577',
    fontSize: 12,
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
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderValue: {
    color: '#1f2933',
    fontWeight: '700',
  },
  slider: {
    height: 36,
  },
  sliderLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLegend: {
    color: '#8c8577',
    fontSize: 12,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f0ede6',
  },
  clearText: {
    color: '#1f2933',
    fontSize: 12,
    fontWeight: '600',
  },
  taskGroup: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8c8577',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e3ded4',
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#1f2933',
    borderColor: '#1f2933',
  },
  chipText: {
    color: '#1f2933',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#f9f5ee',
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
