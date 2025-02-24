# Vibec-oded AI Therapist App

An AI therapy application built playing with Windsurf vibecoding, featuring real-time voice interactions and natural language processing. The app provides supportive conversations across multiple domains: therapy, relationships, career counseling, and life coaching.

## Features

- 🎙️ Real-time voice interaction using OpenAI's advanced speech-to-text and text-to-speech
- 💬 Natural conversational AI powered by GPT-4
- 🔊 High-quality voice responses using OpenAI's TTS with customizable voices
- 📱 Cross-platform mobile support with React Native
- 🔒 Important disclaimers and ethical considerations built-in
- 🎯 Multiple specialized conversation types:
  - Therapy
  - Relationship Counseling
  - Career Guidance
  - Life Coaching

## Tech Stack

### Mobile App (aitherapist-mobile)
- React Native with Expo
- TypeScript
- React Navigation
- React Native Elements UI
- Expo AV for audio handling
- WebSocket for real-time communication

### Backend (aitherapist-backend)
- Node.js with Express
- TypeScript
- WebSocket Server (ws)
- OpenAI API integration
  - GPT-4 for conversation
  - Whisper for speech-to-text
  - TTS for text-to-speech
- PostgreSQL for data persistence

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   # Backend (.env)
   PORT=3000
   OPENAI_API_KEY=your_api_key
   DATABASE_URL=your_database_url
   ```

4. Start the backend server:
   ```bash
   cd aitherapist-backend
   pnpm dev
   ```

5. Start the mobile app:
   ```bash
   cd aitherapist-mobile
   pnpm start
   ```

## About Vibecoding

This project was created during a Vibecoding session - an innovative approach to collaborative coding that emphasizes real-time problem-solving and iterative development. Vibecoding sessions focus on building functional features while maintaining high code quality and user experience.

## Important Note

This application is designed for general support and stress relief only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers for medical or mental health concerns.

## License

MIT License - See LICENSE file for details
