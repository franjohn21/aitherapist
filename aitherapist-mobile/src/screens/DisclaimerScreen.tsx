import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type DisclaimerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Disclaimer'
>;

type DisclaimerScreenRouteProp = RouteProp<RootStackParamList, 'Disclaimer'>;

interface Props {
  navigation: DisclaimerScreenNavigationProp;
  route: DisclaimerScreenRouteProp;
}

export default function DisclaimerScreen({ navigation, route }: Props) {
  const { sessionType } = route.params;

  const handleAccept = () => {
    navigation.navigate('Chat', { sessionType });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text h4 style={styles.title}>Important Disclaimer</Text>
        
        <Text style={styles.paragraph}>
          This AI chat service is not a substitute for professional medical advice, diagnosis, or treatment.
        </Text>

        <Text style={styles.paragraph}>
          If you're experiencing a mental health emergency or having thoughts of self-harm, please contact emergency services or a mental health crisis hotline immediately.
        </Text>

        <Text style={styles.paragraph}>
          This service is designed for general support and stress relief only. Always consult qualified healthcare providers for medical or mental health concerns.
        </Text>

        <Text style={styles.paragraph}>
          By continuing, you acknowledge that you understand and agree to these terms.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="I Understand and Accept"
            onPress={handleAccept}
            buttonStyle={styles.button}
          />
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            buttonStyle={styles.backButton}
            type="outline"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 15,
  },
  backButton: {
    borderRadius: 8,
    padding: 15,
    borderColor: '#6200ee',
  },
});
