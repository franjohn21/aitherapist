import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { Pool } from "pg";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { ChatCompletionMessageParam } from "openai/resources";
import fs from "fs/promises";
import FormData from "form-data";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "*", // Be more restrictive in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Database configuration
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System messages for different conversation types
const systemMessages = {
  therapy:
    "You are a supportive AI therapist specializing in mental health and emotional well-being. Your tone is gentle, empathetic, and non-judgmental. Focus on helping users explore their feelings and thoughts while maintaining appropriate boundaries. Keep your responses concise and natural, as they will be spoken out loud.",
  relationship:
    "You are an AI relationship counselor helping users navigate relationship challenges. Provide balanced perspectives and communication strategies. Your responses should be supportive and practical, focusing on healthy relationship dynamics. Keep responses natural and conversational, as they will be spoken out loud.",
  career:
    "You are an AI career coach helping users with professional development and career decisions. Provide practical guidance, help explore options, and offer strategies for professional growth. Keep your responses focused and actionable, as they will be spoken out loud.",
  life: "You are an AI life coach helping users work towards personal goals and life direction. Focus on motivation, goal-setting, and practical steps while maintaining realistic expectations. Keep your responses encouraging and actionable, as they will be spoken out loud.",
};

// Disclaimer message
const DISCLAIMER = `IMPORTANT: This AI chat service is not a substitute for professional medical advice, diagnosis, or treatment. 
If you're experiencing a mental health emergency or having thoughts of self-harm, please contact emergency services or a mental health crisis hotline immediately. 
This service is designed for general support and stress relief only. Always consult qualified healthcare providers for medical or mental health concerns.`;

interface ChatRequest {
  message: string;
  sessionType: keyof typeof systemMessages;
  isFirstMessage: boolean;
}

// Routes
app.post(
  "/api/chat",
  // @ts-ignore
  async (req: Request<{}, {}, ChatRequest>, res: Response) => {
    try {
      const { message, sessionType, isFirstMessage } = req.body;

      // Validate session type
      if (!systemMessages[sessionType]) {
        return res.status(400).json({ error: "Invalid session type" });
      }

      const messages = [
        {
          role: "system",
          content: systemMessages[sessionType],
        },
      ] as ChatCompletionMessageParam[];

      // Add disclaimer for first message
      if (isFirstMessage) {
        messages.push({ role: "assistant", content: DISCLAIMER });
      }

      messages.push({ role: "user", content: message });

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const textResponse = completion.choices[0].message.content;

      // Generate speech from the response
      const speechResponse = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "shimmer", // Using Shimmer voice - one of the most natural-sounding voices
        input: textResponse || "",
        speed: 1.0, // Normal speed
        response_format: "mp3",
      });

      // Convert the speech response to base64
      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      const audioBase64 = audioBuffer.toString("base64");

      res.json({
        response: textResponse,
        audioContent: audioBase64,
      });
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ error: "An error occurred while processing your request" });
    }
  }
);

// Speech-to-text endpoint
// @ts-ignore
app.post("/api/transcribe", async (req: Request, res: Response) => {
  try {
    const { audioData } = req.body; // Base64 encoded audio data

    if (!audioData) {
      return res.status(400).json({ error: "No audio data provided" });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, "base64");

    // Create a temporary file with the audio data
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.mp3", { type: "audio/mp3" }),
      model: "whisper-1",
      language: "en",
    });

    res.json({ text: transcription.text });
  } catch (error) {
    console.error("Error in speech-to-text:", error);
    res.status(500).json({ error: "Error processing audio" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");
  let audioChunks: Buffer[] = [];

  ws.on("message", async (data: Buffer) => {
    try {
      const messageStr = data.toString();
      
      if (messageStr === "START_STREAM") {
        audioChunks = [];
        ws.send(JSON.stringify({ type: "status", status: "started" }));
      } else if (messageStr === "END_STREAM") {
        // Process the last received audio chunk
        if (audioChunks.length === 0) {
          throw new Error("No audio data received");
        }

        const lastChunk = audioChunks[audioChunks.length - 1];
        
        try {
          // Create a temporary file
          const tempFilePath = `/tmp/audio-${Date.now()}.m4a`;
          await fs.promises.writeFile(tempFilePath, lastChunk);

          console.log("Created temp file:", tempFilePath);
          
          // Create form data with the file
          const form = new FormData();
          form.append('file', fs.createReadStream(tempFilePath), {
            filename: 'audio.m4a',
            contentType: 'audio/m4a',
          });
          
          console.log("Sending to OpenAI for transcription...");
          
          const transcription = await openai.audio.transcriptions.create({
            file: form.get('file') as any,
            model: "whisper-1",
            language: "en",
          });

          console.log("Transcription received:", transcription.text);

          // Clean up temp file
          await fs.promises.unlink(tempFilePath);

          ws.send(
            JSON.stringify({
              type: "transcription",
              text: transcription.text,
            })
          );
        } catch (error) {
          console.error("Transcription error details:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              error: "Failed to transcribe audio",
              details: error.message,
            })
          );
        }

        audioChunks = [];
      } else {
        // Store the base64 audio data
        try {
          const audioBuffer = Buffer.from(messageStr, "base64");
          audioChunks.push(audioBuffer);
        } catch (error) {
          console.error("Error processing audio chunk:", error);
        }
      }
    } catch (error) {
      console.error("WebSocket error details:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Failed to process audio stream",
          details: error.message,
        })
      );
    }
  });
});

// Start the server
// @ts-ignore
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
