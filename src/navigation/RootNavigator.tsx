import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import EntriesScreen from '../screens/EntriesScreen';
import EntryFormScreen from '../screens/EntryFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { TickEntry } from '../api/tickApi';
import { useEntryDate } from '../context/EntryDateContext';
import Feather from '@react-native-vector-icons/feather';

export type EntriesStackParamList = {
  Entries: undefined;
  EntryForm: { entry?: TickEntry; date?: string } | undefined;
};

export type RootTabParamList = {
  EntriesStack: undefined;
  CreateEntry: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<EntriesStackParamList>();

function EntriesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Entries" component={EntriesScreen} options={{ title: 'Entries' }} />
      <Stack.Screen name="EntryForm" component={EntryFormScreen} options={{ title: 'Entry' }} />
    </Stack.Navigator>
  );
}

function CreateEntryButton() {
  const navigation = useNavigation();
  const { date } = useEntryDate();

  return (
    <View style={styles.createButtonContainer}>
      <Pressable
        style={styles.createButton}
        onPress={() => {
          navigation.navigate('EntriesStack' as never, { screen: 'EntryForm', params: { date } } as never);
        }}
      >
        <Text style={styles.createButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

function EmptyScreen() {
  return <View style={styles.emptyScreen} />;
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="EntriesStack"
          component={EntriesStack}
          options={{
            title: 'Entries',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Feather name="list" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="CreateEntry"
          component={EmptyScreen}
          options={{
            title: '',
            headerShown: false,
            tabBarButton: () => <CreateEntryButton />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Feather name="settings" color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1f2933',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  createButtonText: {
    color: '#f9f5ee',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
  emptyScreen: {
    flex: 1,
    backgroundColor: '#f7f5f0',
  },
});
