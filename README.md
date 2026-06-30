# Skill Swap - Peer-to-Peer Skill Exchange Platform

**Trade What You Know. Learn What You Don't.**

AI-powered platform where users teach skills they know in exchange for learning new skills from others.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | **Java Spring Boot 3.2** |
| Database | **MySQL** (MySQL Workbench compatible) |
| ORM | Spring Data JPA / Hibernate |
| Auth | JWT (jjwt library) |
| AI | Google Gemini API (FREE) |
| WebSocket | Spring WebSocket + STOMP |
| i18n | react-i18next (EN, TA, HI) |

## Quick Start

### Prerequisites
- **Java 17+** (JDK)
- **Maven 3.8+**
- **MySQL** (MySQL Workbench recommended)
- **Node.js 18+** (for frontend)
- Gemini API key (FREE from https://aistudio.google.com/apikey)

### 1. Database Setup (MySQL Workbench)
```sql
CREATE DATABASE skillswap;
```

### 2. Configure Backend
Edit `server/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/skillswap
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
app.gemini.api-key=YOUR_GEMINI_KEY
```

### 3. Run Backend (Spring Boot)
```bash
cd server
mvn spring-boot:run
```
Server starts on **http://localhost:5000**. Tables are auto-created by Hibernate. Seed data (skills, admin, demo users) loads automatically on first run.

### 4. Run Frontend (React)
```bash
cd client
npm install
npm run dev
```
Client starts on **http://localhost:5173**

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@skillswap.com | Admin@123 |
| User | alex@demo.com | Demo@123 |
| User | priya@demo.com | Demo@123 |
| User | karthik@demo.com | Demo@123 |
| User | deepa@demo.com | Demo@123 |
| User | rahul@demo.com | Demo@123 |

## Project Structure

```
skillswap/
├── client/                         # React Frontend (Vite)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Route pages
│   │   ├── context/                # Auth, Socket, Theme contexts
│   │   ├── services/               # API service (Axios)
│   │   ├── i18n/                   # Translations (EN, TA, HI)
│   │   └── App.jsx
│   └── ...
├── server/                         # Spring Boot Backend
│   ├── pom.xml                     # Maven dependencies
│   └── src/main/java/com/skillswap/
│       ├── SkillSwapApplication.java
│       ├── config/                 # Security, WebSocket, DataSeeder
│       ├── controller/             # REST API controllers
│       ├── entity/                 # JPA entities
│       ├── repository/             # Spring Data repositories
│       ├── security/               # JWT filter & util
│       ├── service/                # Business logic
│       └── websocket/              # Real-time chat
└── .env.example
```

## API Endpoints (all at /api/*)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/skills | Master skill list |
| POST | /api/skills/user/batch | Add skills to profile |
| POST | /api/validate/questions | Generate AI questions |
| POST | /api/validate/submit | Submit answers |
| POST | /api/matches/run | Run matching algorithm |
| GET | /api/matches | Get matches |
| GET | /api/chat/{matchId}/messages | Get messages |
| POST | /api/chat/{matchId}/messages | Send message |
| POST | /api/ratings | Rate session |
| GET | /api/notifications | Get notifications |
| POST | /api/chatbot/message | AI chatbot |
| GET | /api/admin/stats | Admin stats |

## Features

- AI Skill Validation (Gemini-powered questions)
- Bipartite Matching Algorithm
- Real-time Chat (WebSocket/STOMP)
- Certificate Upload & Verification
- Rating & Reputation System
- Multilingual (EN/TA/HI)
- Admin Dashboard with Analytics
- Dark/Light Theme
- Block & Report Users
