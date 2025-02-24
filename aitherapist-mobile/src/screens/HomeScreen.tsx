import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { Button, Text } from "react-native-elements";
import { SessionType } from "../types";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const sessionTypes: {
  type: SessionType;
  title: string;
  description: string;
}[] = [
  {
    type: "therapy",
    title: "Therapy Session",
    description: "Talk about your feelings, emotions, and mental well-being.",
  },
  {
    type: "relationship",
    title: "Relationship Counseling",
    description: "Discuss relationship challenges and get guidance.",
  },
  {
    type: "career",
    title: "Career Guidance",
    description: "Get help with career decisions and professional growth.",
  },
  {
    type: "life",
    title: "Life Coaching",
    description: "Work on personal goals and life direction.",
  },
];

export default function HomeScreen({ navigation }: Props) {
  const handleSessionSelect = (sessionType: SessionType) => {
    navigation.navigate("Disclaimer", { sessionType });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h3 style={styles.title}>
          Welcome to AI Therapist
        </Text>
        <Text style={styles.subtitle}>
          Choose a session type to begin your journey to wellness
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {sessionTypes.map((session) => (
          <View key={session.type} style={styles.buttonWrapper}>
            <Button
              title={session.title}
              onPress={() => handleSessionSelect(session.type)}
              buttonStyle={styles.button}
              titleStyle={styles.buttonText}
            />
            <Text style={styles.description}>{session.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    padding: 20,
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#6200ee",
    borderRadius: 8,
    padding: 15,
  },
  buttonText: {
    fontSize: 16,
  },
  description: {
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
});
