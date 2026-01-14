import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ChipOption = {
  label: string;
  value: number;
};

type Props = {
  label: string;
  options: ChipOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  allowClear?: boolean;
  disabled?: boolean;
  helperText?: string;
};

export default function ChipSelect({
  label,
  options,
  value,
  onChange,
  allowClear,
  disabled,
  helperText,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {allowClear && value != null ? (
          <Pressable
            style={styles.clearButton}
            onPress={() => onChange(null)}
            disabled={disabled}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <View style={[styles.chipWrap, disabled && styles.disabledWrap]}>
        {options.length === 0 ? (
          <Text style={styles.emptyText}>No options available.</Text>
        ) : (
          options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => onChange(option.value)}
                disabled={disabled}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#3e4c59',
    fontWeight: '600',
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
  helperText: {
    color: '#8c8577',
    fontSize: 12,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  disabledWrap: {
    opacity: 0.6,
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
  emptyText: {
    color: '#8c8577',
    fontSize: 12,
  },
});
