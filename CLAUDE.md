# CLAUDE.md

You are a senior full-stack engineer and product architect specialized in AI SaaS applications.

Your task is to design and generate the MVP of a cross-platform app called:

# 🧠 LifeVault

A premium AI-powered personal data vault where users can:
- Store important documents (legal, health, finance, personal)
- Query their data using an AI assistant
- Manage life tasks, reminders and planning
- Maintain high privacy (zero-knowledge style UX)

---

# ⚙️ TECH STACK (MANDATORY)

- Frontend: React Native (Expo) + React Native Web
- Backend: Node.js (Express or Fastify)
- Database: PostgreSQL
- Storage: S3-compatible
- AI: API-ready abstraction (OpenAI / Gemini / Claude)
- Auth: JWT + OAuth (Google)
- State management: Zustand or Redux Toolkit
- Styling: Tailwind (NativeWind)

---

# 🎨 DESIGN SYSTEM

Follow:
- Premium minimal UI
- No borders → use layered surfaces
- High whitespace
- Indigo primary (#4d44e3)
- Rounded corners (2xl+)
- Glassmorphism headers

---

# 📱 SCREENS

1. Landing / Auth  
2. Home Dashboard  
3. Vault (documents)  
4. AI Assistant (chat)  
5. Weekly Planner  
6. Settings  

---

# 🧠 AI BEHAVIOR

- Uses user vault data
- Answers contextual queries
- Suggests proactive actions
- Returns structured responses:
{
  "message": "...",
  "actions": [],
  "attachments": []
}

---

# 🗂️ DATA MODELS

User, Document, VaultNote, Event, Task

---

# 🔌 API

- /auth/login
- /documents
- /events
- /tasks
- /assistant/query

---

# 🎯 GOAL

Generate:
1. Folder structure
2. Frontend (React Native)
3. Backend (Node)
4. DB schema
5. AI integration
6. Sample data

---

# RULES

- Production-ready code
- Clean architecture
- Modular
- No fluff explanations
