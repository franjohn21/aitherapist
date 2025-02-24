import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  TouchableOpacity,
} from "react-native";
import { Button, Text, Input } from "react-native-elements";
import { Audio } from "expo-av";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { Message } from "../types";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";

type ChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Chat"
>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;

interface Props {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

// Local network IP address for development
const API_URL = "http://192.168.1.142:3000/api";

export default function ChatScreen({ route }: Props) {
  const { sessionType } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Initialize audio
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });

        // Request permissions if needed
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          console.error("Audio permission not granted");
        }
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    })();

    return () => {
      // Cleanup audio when component unmounts
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(`ws://${API_URL.replace("http://", "")}`);

    ws.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transcription" && data.text) {
          setInputMessage(data.text);
        } else if (data.type === "error") {
          console.error("WebSocket error:", data.error);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const playAudioResponse = async (base64Audio: string) => {
    try {
      console.log("Starting audio playback...");

      // Stop any currently playing audio
      if (soundRef.current) {
        console.log("Unloading previous audio...");
        await soundRef.current.unloadAsync();
      }

      // Create audio file from base64
      const audioUri = `data:audio/mp3;base64,${base64Audio}`;
      console.log("Creating audio from base64...");
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;

      // Play the audio
      console.log("Playing audio...");
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status && "didJustFinish" in status && status.didJustFinish) {
          console.log("Audio playback finished");
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        console.error("Permission to record was denied");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      recordingRef.current = recording;
      setRecording(recording);
      setIsRecording(true);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("START_STREAM");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      
      const uri = recordingRef.current.getURI();
      if (!uri) return;

      // Read the audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send the audio data
        wsRef.current.send(base64Audio);
        wsRef.current.send("END_STREAM");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }

    recordingRef.current = null;
    setRecording(null);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    const newMessages = [
      ...messages,
      { role: "user", content: userMessage },
    ] as Message[];
    setMessages(newMessages);

    try {
      console.log("Sending request to:", API_URL);
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionType,
          isFirstMessage: messages.length === 0,
        }),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.response },
      ]);

      // Play the audio response
      if (data.audioContent) {
        await playAudioResponse(data.audioContent);
      }
    } catch (error) {
      console.error("Error details:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              message.role === "user" ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === "user"
                  ? styles.userMessageText
                  : styles.aiMessageText,
              ]}
            >
              {message.content}
            </Text>
            {message.role === "assistant" && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={() =>
                  message.audioContent &&
                  playAudioResponse(message.audioContent)
                }
                disabled={isPlaying}
              >
                <MaterialIcons
                  name={isPlaying ? "pause" : "play-arrow"}
                  size={24}
                  color="#6200ee"
                />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <Text style={styles.typingIndicator}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <Input
          placeholder="Type your message..."
          value={inputMessage}
          onChangeText={setInputMessage}
          containerStyle={styles.textInput}
          inputContainerStyle={{ borderBottomWidth: 0 }}
        />
        <TouchableOpacity
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={[styles.recordButton, isRecording && styles.recordingActive]}
        >
          <MaterialIcons
            name={isRecording ? "mic" : "mic-none"}
            size={24}
            color={isRecording ? "#ff4444" : "#000"}
          />
        </TouchableOpacity>
        <Button
          title="Send"
          onPress={() => sendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          buttonStyle={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 5,
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6200ee",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
    flex: 1,
  },
  userMessageText: {
    color: "#fff",
  },
  aiMessageText: {
    color: "#333",
  },
  typingIndicator: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  textInput: {
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#6200ee",
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  playButton: {
    marginLeft: 8,
    padding: 4,
  },
  recordButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  recordingActive: {
    backgroundColor: "#ffe0e0",
  },
});
