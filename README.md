# 🔄 Skill Swap - Peer-to-Peer Skill Exchange Platform

**Trade What You Know. Learn What You Don't.**

An AI-powered platform where users teach skills they know in exchange for learning new skills from others — no money needed.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-orange) ![AI](https://img.shields.io/badge/AI-Claude_API-purple)

---

## Features

### Core Features
- **User Registration** with full profile (name, email, DOB, gender, mobile, language, location)
- **Skill Profile** - Skills I have, Skills I want, Experience level per skill
- **AI Skill Validation** - 10 AI-generated questions, auto-grading, Verified Teacher badge
- **Bipartite Matching Algorithm** - Find optimal skill-swap partners
- **Real-time Chat** via Socket.io with resource sharing & session scheduling
- **AI Chatbot** - Learning path suggestions, course recommendations
- **Multilingual UI** - English, Tamil, Hindi (i18n)
- **Rating System** - Rate teacher & learner after sessions (1-5 stars)
- **Admin Dashboard** - Manage users, verify certificates, handle reports, analytics

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB with Mongoose |
| AI | Google Gemini API (gemini-1.5-flash) - FREE |
| Auth | JWT (JSON Web Tokens) |
| i18n | react-i18next (EN, TA, HI) |
| Charts | Recharts |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key (FREE - get from https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd abiproject

# Install root dependencies
npm install

# Install all dependencies
npm run install:all

# Or install separately:
cd server && npm install
cd ../client && npm install
cd ..
```

### Environment Setup

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=skillswap_super_secret_jwt_key_2024
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Running the App

```bash
# Run both server and client
npm run dev

# Or separately:
npm run dev:server   # Server on port 5000
npm run dev:client   # Client on port 5173
```

---

## Demo Accounts

The app auto-seeds demo data on first run:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@skillswap.com | Admin@123 |
| User 1 | alex@demo.com | Demo@123 |
| User 2 | priya@demo.com | Demo@123 |
| User 3 | karthik@demo.com | Demo@123 |
| User 4 | deepa@demo.com | Demo@123 |
| User 5 | rahul@demo.com | Demo@123 |

---

## Project Structure

```
skillswap/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── context/           # React contexts (Auth, Socket, Theme)
│   │   ├── services/          # API service (Axios)
│   │   ├── i18n/              # Translations (EN, TA, HI)
│   │   ├── utils/             # Helper functions
│   │   └── App.jsx            # Main app with routing
│   └── ...
├── server/                    # Node.js Backend
│   ├── src/
│   │   ├── config/            # Database config
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express routes
│   │   ├── middleware/        # Auth, admin, error handling
│   │   ├── services/          # Claude AI, matching, spam
│   │   ├── seed/              # Database seeding
│   │   └── index.js           # Server entry point
│   └── uploads/               # File uploads
├── .env                       # Environment variables
└── package.json               # Root package.json
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Skills
- `GET /api/skills` - Master skill list
- `POST /api/skills/user` - Add skill to user
- `POST /api/skills/user/batch` - Add multiple skills

### Validation
- `POST /api/validate/questions` - Generate AI questions
- `POST /api/validate/submit` - Submit answers for evaluation
- `POST /api/validate/certificate` - Verify certificate

### Matching
- `POST /api/matches/run` - Run bipartite matching
- `GET /api/matches` - Get user's matches

### Chat
- `GET /api/chat/:matchId/messages` - Get messages
- `POST /api/chat/:matchId/messages` - Send message
- `POST /api/chat/:matchId/session` - Schedule session

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - Manage users
- `PUT /api/admin/users/:id/ban` - Ban/unban user
- `GET /api/admin/certificates` - Certificate queue
- `GET /api/admin/reports` - User reports

---

## Key Algorithms

### Bipartite Matching (Hopcroft-Karp)
The platform uses the Hopcroft-Karp algorithm to find optimal skill-swap pairs:
1. Build adjacency graph: User A → User B if mutual skill exchange is possible
2. Calculate match percentage based on mutual skill overlap
3. Find maximum bipartite matching for optimal pairing

### AI Skill Validation
1. Claude generates 10 MCQ questions based on skill + experience level
2. User answers are evaluated by AI
3. Score ≥ 70% = Verified Teacher badge granted

---

## Design

- **Color Palette**: Electric Indigo (#6C63FF), Coral (#FF6584), Emerald (#10B981)
- **Dark Theme** default with light mode toggle
- **Glass morphism** effects on cards
- **Framer Motion** animations throughout
- **Fully responsive** mobile-first design

---

## License

MIT
