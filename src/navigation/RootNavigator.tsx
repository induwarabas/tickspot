import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import EntriesScreen from '../screens/EntriesScreen';
import EntryFormScreen from '../screens/EntryFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import { TickEntry } from '../api/tickApi';
import { useEntryDate } from '../context/EntryDateContext';
import { useSettings } from '../context/SettingsContext';
import Feather from '@react-native-vector-icons/feather';

export type EntriesStackParamList = {
  Entries: undefined;
};

export type RootTabParamList = {
  EntriesStack: undefined;
  CreateEntry: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  EntryForm:
    | {
        entry?: TickEntry;
        date?: string;
        prefillHours?: number;
        prefillNotes?: string;
      }
    | undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<EntriesStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function EntriesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Entries" component={EntriesScreen} options={{ title: 'Entries' }} />
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
          const rootNavigation = navigation.getParent() as
            | NativeStackNavigationProp<RootStackParamList>
            | undefined;
          rootNavigation?.navigate('EntryForm', { date });
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

function Tabs() {
  return (
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
  );
}

export default function RootNavigator() {
  const { settings, isReady } = useSettings();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f2933" />
      </View>
    );
  }

  const hasApiKey = settings.apiKey.trim().length > 0;

  return (
    <NavigationContainer>
      <RootStack.Navigator>
        {!hasApiKey ? (
          <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        )}
        <RootStack.Screen
          name="EntryForm"
          component={EntryFormScreen}
          options={{ title: 'Entry', presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f5f0',
  },
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
