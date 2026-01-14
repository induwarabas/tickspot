import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EntriesStackParamList } from '../navigation/RootNavigator';
import {
  deleteEntry,
  getClients,
  getEntriesByDate,
  getProjects,
  getTasks,
  TickClient,
  TickEntry,
  TickProject,
  TickTask,
} from '../api/tickApi';
import { useSettings } from '../context/SettingsContext';
import { useEntryDate } from '../context/EntryDateContext';

const pad2 = (value: number) => value.toString().padStart(2, '0');
const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const todayString = () => formatLocalDate(new Date());

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + days);
  return formatLocalDate(next);
}

type Props = NativeStackScreenProps<EntriesStackParamList, 'Entries'>;

export default function EntriesScreen({ navigation }: Props) {
  const { settings, isReady } = useSettings();
  const { setDate: setSharedDate } = useEntryDate();
  const [date, setDate] = useState(todayString());
  const [entries, setEntries] = useState<TickEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<TickProject[]>([]);
  const [tasks, setTasks] = useState<TickTask[]>([]);
  const [clients, setClients] = useState<TickClient[]>([]);

  const fetchEntries = useCallback(async () => {
    if (!isReady) {
      return;
    }
    if (!settings.apiKey) {
      setEntries([]);
      setError('Add an API key in Settings to load entries.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getEntriesByDate(settings, date);
      setEntries(response);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load entries.');
    } finally {
      setLoading(false);
    }
  }, [settings, date, isReady]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={styles.headerAction}
          onPress={() => navigation.navigate('EntryForm', { date })}
        >
          <Text style={styles.headerActionText}>New</Text>
        </Pressable>
      ),
    });
  }, [navigation, date]);

  React.useEffect(() => {
    setSharedDate(date);
  }, [date, setSharedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !settings.apiKey) {
        return;
      }
      let isMounted = true;
      Promise.allSettled([
        getProjects(settings),
        getTasks(settings),
        getClients(settings),
      ]).then((results) => {
        if (!isMounted) {
          return;
        }
        const [projectsResult, tasksResult, clientsResult] = results;
        if (projectsResult.status === 'fulfilled') {
          setProjects(projectsResult.value);
        }
        if (tasksResult.status === 'fulfilled') {
          setTasks(tasksResult.value);
        }
        if (clientsResult.status === 'fulfilled') {
          setClients(clientsResult.value);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [isReady, settings]),
  );

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0),
    [entries],
  );

  const formatHours = useCallback((value: number) => {
    const totalMinutes = Math.round(value * 60);
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = totalMinutes % 60;
    return `${hoursPart}h ${minutesPart.toString().padStart(2, '0')}m`;
  }, []);

  const taskNameById = useMemo(() => {
    const map = new Map<number, string>();
    tasks.forEach((task) => map.set(task.id, task.name));
    return map;
  }, [tasks]);

  const taskById = useMemo(() => {
    const map = new Map<number, TickTask>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const projectById = useMemo(() => {
    const map = new Map<number, TickProject>();
    projects.forEach((project) => map.set(project.id, project));
    return map;
  }, [projects]);

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    clients.forEach((client) => map.set(client.id, client.name));
    return map;
  }, [clients]);

  const handleDelete = useCallback(
    (entry: TickEntry) => {
      Alert.alert('Delete entry?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(settings, entry.id);
              fetchEntries();
            } catch (deleteError) {
              Alert.alert(
                'Delete failed',
                deleteError instanceof Error ? deleteError.message : 'Please try again.',
              );
            }
          },
        },
      ]);
    },
    [settings, fetchEntries],
  );

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateButton} onPress={() => setDate(shiftDate(date, -1))}>
          <Text style={styles.dateButtonText}>Prev</Text>
        </Pressable>
        <View>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.totalText}>{`Total ${formatHours(totalHours)}`}</Text>
        </View>
        <Pressable style={styles.dateButton} onPress={() => setDate(shiftDate(date, 1))}>
          <Text style={styles.dateButtonText}>Next</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEntries} />}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {!isReady
              ? 'Loading settings...'
              : loading
                ? 'Loading entries...'
                : 'No entries for this date.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHours}>{formatHours(Number(item.hours || 0))}</Text>
              <Text style={styles.cardMeta}>#{item.id}</Text>
            </View>
            <Text style={styles.cardNotes}>{item.notes || 'No notes provided.'}</Text>
            {item.task_id ? (
              <Text style={styles.cardMetaRowText}>
                {(item.project_id
                  ? clientNameById.get(projectById.get(item.project_id)?.client_id ?? 0)
                  : clientNameById.get(
                      projectById.get(taskById.get(item.task_id)?.project_id ?? 0)?.client_id ??
                        0,
                    )) || 'Unassigned'}{' '}
                - {taskNameById.get(item.task_id) ?? `#${item.task_id}`}
              </Text>
            ) : null}
            <View style={styles.cardActions}>
              <Pressable
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('EntryForm', { entry: item })}
              >
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.deleteButton, styles.actionButtonLast]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.actionText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f5f0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2933',
    borderRadius: 8,
  },
  dateButtonText: {
    color: '#f9f5ee',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2933',
  },
  totalText: {
    textAlign: 'center',
    color: '#8c8577',
  },
  errorBanner: {
    padding: 12,
    backgroundColor: '#fce8e6',
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#b42318',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8c8577',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHours: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2933',
  },
  cardNotes: {
    color: '#3e4c59',
    marginBottom: 8,
  },
  cardMetaRowText: {
    color: '#8c8577',
    fontSize: 12,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 12,
  },
  actionButtonLast: {
    marginRight: 0,
  },
  editButton: {
    backgroundColor: '#e6f4ff',
  },
  deleteButton: {
    backgroundColor: '#fde2e2',
  },
  actionText: {
    color: '#1f2933',
    fontWeight: '600',
  },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1f2933',
    borderRadius: 16,
  },
  headerActionText: {
    color: '#f9f5ee',
    fontWeight: '600',
  },
});
