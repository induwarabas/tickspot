import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function EntriesScreen() {
  const navigation = useNavigation();
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
      Promise.allSettled([getProjects(settings), getTasks(settings), getClients(settings)]).then(
        (results) => {
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
        },
      );

      return () => {
        isMounted = false;
      };
    }, [isReady, settings]),
  );

  React.useEffect(() => {
    setSharedDate(date);
  }, [date, setSharedDate]);

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
          <Swipeable
            renderRightActions={() => (
              <Pressable style={styles.swipeDelete} onPress={() => handleDelete(item)}>
                <Text style={styles.swipeDeleteText}>Delete</Text>
              </Pressable>
            )}
          >
            <Pressable
              style={styles.card}
              onPress={() =>
                (navigation.getParent()?.getParent() as RootNav | undefined)?.navigate(
                  'EntryForm',
                  { entry: item },
                )
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {taskNameById.get(item.task_id ?? 0) ?? 'No task'}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {(item.project_id
                      ? clientNameById.get(projectById.get(item.project_id)?.client_id ?? 0)
                      : clientNameById.get(
                          projectById.get(taskById.get(item.task_id)?.project_id ?? 0)?.client_id ??
                            0,
                        )) || 'Unassigned'}{' '}
                    -{' '}
                    {projectById.get(
                      item.project_id ?? taskById.get(item.task_id ?? 0)?.project_id ?? 0,
                    )?.name ?? 'No project'}
                  </Text>
                </View>
                <Text style={styles.cardHours}>{formatHours(Number(item.hours || 0))}</Text>
              </View>
              <Text style={styles.cardNotes} numberOfLines={1}>
                {item.notes || 'No notes provided.'}
              </Text>
            </Pressable>
          </Swipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
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
    marginHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#efeae1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    color: '#1f2933',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardHours: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2933',
  },
  cardSubtitle: {
    color: '#3e4c59',
    marginBottom: 2,
  },
  cardNotes: {
    color: '#8c8577',
  },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    backgroundColor: '#e11d48',
  },
  swipeDeleteText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
