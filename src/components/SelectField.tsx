import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type SelectOption = {
  label: string;
  value: number;
};

type Props = {
  label: string;
  placeholder?: string;
  value: number | null;
  options: SelectOption[];
  onChange: (value: number | null) => void;
  allowClear?: boolean;
  disabled?: boolean;
  helperText?: string;
};

export default function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  allowClear,
  disabled,
  helperText,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = useMemo(() => {
    if (value == null) {
      return '';
    }
    const match = options.find((option) => option.value === value);
    return match?.label ?? `#${value}`;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options;
    }
    const lower = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(lower));
  }, [options, query]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.input, disabled && styles.disabledInput]}
        onPress={() => setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !selectedLabel && styles.placeholderText]}>
          {selectedLabel || placeholder || 'Select'}
        </Text>
      </Pressable>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value.toString()}
              ListEmptyComponent={<Text style={styles.emptyText}>No matches found.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />

            {allowClear ? (
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
              >
                <Text style={styles.clearButtonText}>Clear selection</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    justifyContent: 'center',
  },
  inputText: {
    color: '#1f2933',
  },
  placeholderText: {
    color: '#8c8577',
  },
  helperText: {
    color: '#8c8577',
    fontSize: 12,
    marginTop: 6,
  },
  disabledInput: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2933',
  },
  modalClose: {
    color: '#1f2933',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#f7f5f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e3ded4',
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ede6',
  },
  optionText: {
    color: '#1f2933',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#8c8577',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e3ded4',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#1f2933',
    fontWeight: '600',
  },
});
