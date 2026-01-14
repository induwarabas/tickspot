import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntriesScreen from '../screens/EntriesScreen';
import EntryFormScreen from '../screens/EntryFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { TickEntry } from '../api/tickApi';

export type EntriesStackParamList = {
  Entries: undefined;
  EntryForm: { entry?: TickEntry } | undefined;
};

export type RootTabParamList = {
  EntriesStack: undefined;
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

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="EntriesStack"
          component={EntriesStack}
          options={{ title: 'Entries', headerShown: false }}
        />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
