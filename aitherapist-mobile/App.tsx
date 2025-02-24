import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import ChatScreen from "./src/screens/ChatScreen";
import DisclaimerScreen from "./src/screens/DisclaimerScreen";
import { SessionType } from "./src/types";

export type RootStackParamList = {
  Home: undefined;
  Chat: { sessionType: SessionType };
  Disclaimer: { sessionType: SessionType };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#f5f5f5",
            },
            headerTintColor: "#333",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "AI Therapist" }}
          />
          <Stack.Screen
            name="Disclaimer"
            component={DisclaimerScreen}
            options={{ title: "Disclaimer" }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: "Chat" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
