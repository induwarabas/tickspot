import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import RootNavigator from './src/navigation/RootNavigator';
import { SettingsProvider } from './src/context/SettingsContext';
import ReminderScheduler from './src/notifications/ReminderScheduler';
import { EntryDateProvider } from './src/context/EntryDateContext';

enableScreens();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SettingsProvider>
        <ReminderScheduler />
        <EntryDateProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootNavigator />
          </GestureHandlerRootView>
        </EntryDateProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

export default App;
