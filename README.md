# SiteGen, AI Powered Website Builder

SiteGen is a full-stack web application that lets you build and preview real Next.js websites just by typing what you want in plain English. You describe your idea, and the AI agent writes the code, sets up the files, and shows you a live preview, all inside your browser.

---

## What This Project Does

You type a prompt like, build me a portfolio website with a dark theme, and the AI agent gets to work. It creates the actual Next.js files inside a cloud sandbox, runs the app, and shows you a live preview in a split-panel workspace on the right side of the screen. You can keep chatting to make changes, and the preview updates accordingly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, Shadcn UI |
| Database | PostgreSQL with Prisma ORM |
| Auth | Clerk, Google OAuth, GitHub OAuth |
| AI Model | Google Gemini 2.5 Flash |
| Agent Pipeline | Inngest, Inngest Agent Kit |
| Cloud Sandbox | E2B Sandbox |
| State Management | Zustand, TanStack React Query |
| Rate Limiting | rate-limiter-flexible |
| Deployment | Vercel, Docker |

---

## Key Features

- Type a prompt in plain English and get a working Next.js app generated for you.
- Live iframe preview of the generated app running inside an E2B cloud sandbox.
- Multi-step AI agent that can read files, create files, and run terminal commands inside the sandbox, up to 10 iterations per request.
- Syntax-highlighted file explorer so you can see all the AI-generated code files.
- Secure login with Google or GitHub via Clerk.
- API rate limiting for free-tier users so the system does not get abused.
- Project management dashboard to save and revisit all your past generated projects.
- Fully responsive split-panel UI that works on desktop.

---

## Project Structure

```
AI_Powered_Website_Builder/
├── src/
│   ├── app/
│   │   ├── (root)/          # Landing page, pricing, auth pages
│   │   ├── api/inngest/     # Inngest background job API route
│   │   └── projects/        # Project workspace pages
│   ├── components/          # Shared UI components
│   └── modules/             # Feature modules
├── prisma/
│   ├── schema.prisma        # DB schema, User, Project, Message, Fragment, Usage
│   └── migrations/          # All Prisma migration files
├── sandbox-templates/
│   └── next-js/             # E2B Dockerfile and build scripts for the sandbox
├── docker-compose.yml       # Local PostgreSQL setup
└── package.json
```

---

## Database Schema

The app has five main models in PostgreSQL.

- **User**, stores clerk user ID, email, name, and image.
- **Project**, belongs to a user, holds the project name and all its messages.
- **Message**, stores each chat message with role, USER or ASSISTANT, and type, RESULT or ERROR.
- **Fragment**, linked to a message, stores the sandbox URL, app title, and all the AI-generated files as JSON.
- **Usage**, tracks rate limit points per user key for free-tier enforcement.

---

## How the AI Agent Works

When you send a prompt, the following happens.

1. The prompt is sent to an Inngest background job so it runs reliably without timeout issues.
2. The Inngest Agent Kit spins up a Google Gemini 2.5 Flash agent with three tools, terminal execution, file creation, and file reading.
3. The agent runs inside an E2B cloud sandbox that already has Node.js and Next.js set up.
4. The agent iterates up to 10 times, writing code and fixing errors on its own.
5. Once done, the sandbox URL and all generated files are saved to the database as a Fragment.
6. The live preview iframe loads the sandbox URL and shows you the running app.

---

## Getting Started

### Prerequisites

- Node.js 18 or above.
- Docker, for running PostgreSQL locally.
- Accounts on Clerk, E2B, Inngest, and Google AI Studio for API keys.

### Steps

1. Clone the repository.

```bash
git clone https://github.com/harshmaru25/AI_Powered_Website_Builder.git
cd AI_Powered_Website_Builder
```

2. Install dependencies.

```bash
npm install
```

3. Create a `.env.local` file in the root and add the following environment variables.

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sitegen

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

GEMINI_API_KEY=your_google_gemini_api_key

E2B_API_KEY=your_e2b_api_key

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

4. Start PostgreSQL using Docker.

```bash
docker compose up -d
```

5. Run Prisma migrations to set up the database tables.

```bash
npx prisma migrate dev
```

6. Start the development server.

```bash
npm run dev
```

7. Open `http://localhost:3000` in your browser.

---



## About the Developer

Made by Harsh Maru, a Computer Engineering graduate from A.C. Patil College of Engineering, Navi Mumbai.

- Email, harshmaru2525@gmail.com.
- LinkedIn, https://www.linkedin.com/in/harsh-maru-561b94234.
- GitHub, https://github.com/harshmaru25.
