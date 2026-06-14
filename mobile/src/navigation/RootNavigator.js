import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import QueueScreen from '../screens/QueueScreen';
import LibraryScreen from '../screens/LibraryScreen';
import TabBar from './TabBar';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        // Smooth cross-fade between tabs.
        animation: 'shift',
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Queue" component={QueueScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}
