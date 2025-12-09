# ExamPrep

A collaborative exam preparation platform built for students. Study smarter together by sharing questions, voting on answers, and practicing with spaced repetition.

## ✨ Features

- **📚 Question Bank** - Browse and search past exam questions organized by topic
- **👍 Voting System** - Vote on the best answers for MCQs and solutions for short answer questions
- **🎯 Practice Mode** - Test your knowledge with customizable practice sessions
- **🧠 Spaced Repetition** - Smart mastery tracking helps you focus on what you need to review
- **🏆 Leaderboard** - Compete with classmates and track your contributions
- **🎁 Daily Bonus** - Earn tokens for consistent practice
- **📱 PWA Support** - Install as a standalone app on your device

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PWA**: next-pwa

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exam-prep-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example env file and fill in your Supabase credentials:
   ```bash
   cp "env copy.example" .env.local
   ```
   
   Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
exam-prep-v2/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── components/        # Reusable UI components
│   ├── context/           # React context providers
│   ├── lib/               # Utilities and services
│   ├── practice/          # Practice mode pages
│   ├── profile/           # User profile page
│   └── questions/         # Question bank pages
├── admin/                  # Admin tools
├── config/                 # App configuration
├── data/                   # Local data files
├── db/                     # Database schema and migrations
├── public/                 # Static assets
└── scripts/                # Utility scripts
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run generate-icons` | Generate PWA icons |

## 📄 License

This project is for educational purposes.
