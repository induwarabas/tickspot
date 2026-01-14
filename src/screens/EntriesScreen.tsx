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
import { deleteEntry, getEntriesByDate, TickEntry } from '../api/tickApi';
import { useSettings } from '../context/SettingsContext';

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
  const [date, setDate] = useState(todayString());
  const [entries, setEntries] = useState<TickEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Pressable style={styles.headerAction} onPress={() => navigation.navigate('EntryForm')}>
          <Text style={styles.headerActionText}>New</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0),
    [entries],
  );

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
          <Text style={styles.totalText}>{`Total ${totalHours.toFixed(2)}h`}</Text>
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
              <Text style={styles.cardHours}>{Number(item.hours || 0).toFixed(2)}h</Text>
              <Text style={styles.cardMeta}>#{item.id}</Text>
            </View>
            <Text style={styles.cardNotes}>{item.notes || 'No notes provided.'}</Text>
            <View style={styles.cardMetaRow}>
              {item.task_id ? (
                <Text style={[styles.cardMeta, styles.cardMetaItem]}>Task {item.task_id}</Text>
              ) : null}
              {item.project_id ? (
                <Text style={styles.cardMeta}>Project {item.project_id}</Text>
              ) : null}
            </View>
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
  cardMetaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardMetaItem: {
    marginRight: 12,
  },
  cardMeta: {
    color: '#8c8577',
    fontSize: 12,
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
