# DanaFlow: Agentic Insurtech Platform

DanaFlow is a next-generation, AI-driven mobile insurance platform built for the Malaysian market. Developed to align with the *Malaysia Digital Economy Corporation's (MDEC)* 2030 AI Nation initiative, this app reduces claim processing friction by leveraging Agentic AI.

## 🚀 Key Features

* **Agentic AI Advocate:** Uses a Large Language Model (LLM) via direct REST integration to autonomously interview users, assess claim validity, and trigger backend database updates via function calling.
* **Offline-First Architecture:** Utilizes Firestore Offline Persistence and Optimistic UI updates. Users can file claims in zero-connectivity environments (like underground parking garages) with background sync upon reconnection.
* **Biometric Security:** Integrated `react-native-biometrics` for frictionless, enterprise-grade Face ID / Touch ID authentication.
* **Optimized Cloud Storage:** Implemented edge-level image compression (`quality: 0.5`) before cloud upload, reducing bandwidth and Firebase storage costs by 50%.

## 🛠️ Tech Stack

* **Frontend:** React Native (Bare Workflow), TypeScript
* **Architecture:** MVVM (Model-View-ViewModel)
* **Backend / Database:** Firebase Authentication, Cloud Firestore (NoSQL), Firebase Storage
* **AI Integration:** Anthropic Claude 3.5 Sonnet / Google Gemini 1.5 (Raw REST Fetch bypassing heavy SDKs for Hermes engine compatibility)
* **Navigation:** React Navigation (Native Stack)

## 💡 The Problem It Solves
Traditional First Notice of Loss (FNOL) processes are manual and frustrating. DanaFlow allows users to upload damage evidence and simply chat with an AI. The AI handles the data collection and autonomously updates the claim status to "AI Reviewing" for human adjusters, dramatically reducing operational bottlenecks.

## 📱 Running Locally
\`\`\`bash
# Install dependencies
npm install

# Clear Metro Cache and Start
npm start -- --reset-cache

# Run on Android Emulator
npm run android
\`\`\`

📫 **Let's connect:** https://www.linkedin.com/in/muhammad-k-b95018139/