# ClipVault

> A private, authenticated media vault for organizing, discovering, watching, and discussing gaming and IRL clips with a close friend group.

---

## 💡 The Problem & Architectural Concept

Gaming and personal video clips consume tens to hundreds of gigabytes across friends' hard drives. Traditional self-hosted video applications require object storage buckets (S3/R2), transcoding pipelines (FFmpeg), CDN delivery, and significant monthly bandwidth costs.

ClipVault solves this problem at **₹0/month** by separating concerns:

```text
┌────────────────────────────────────────────────────────────┐
│                    ClipVault Web App                       │
│  - Google Authentication & Approval-based Access Control   │
│  - Clip Metadata (Game, Category, Many-to-Many Tags)       │
│  - Granular Visibility Rules (Friends / Selected / Private)│
│  - Multi-Emoji Reactions (😂, 💀, 🔥, 🤡)                 │
│  - Discussion Threads with Author-Only Deletion            │
└─────────────────────────────┬──────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │   Supabase (Postgres) │     │    YouTube Unlisted   │
   │  - Application State  │     │  - Media Storage      │
   │  - Row Level Security │     │  - Transcoding & CDN  │
   │  - Google OAuth Sync  │     │  - High-Res Playback  │
   └───────────────────────┘     └───────────────────────┘
```

- **YouTube Unlisted** acts as the free media storage and delivery layer.
- **ClipVault** acts as the private organizational, discovery, and social layer.

---

## 🔒 Security & Access Model

- **Invite/Approval Gate**: Even with Google Sign-In, accounts must be explicitly approved (`is_approved = true`) before accessing any private content.
- **Three-Tier Visibility**:
  - `FRIENDS`: Discoverable by all approved members in the friend group.
  - `SELECTED`: Restricted strictly to specified friends and the uploader.
  - `PRIVATE`: Restricted exclusively to the uploader.
- **Row Level Security (RLS)**: Access control is enforced directly in PostgreSQL via Supabase RLS policies—unauthorized clips are never sent over the wire.
- **Transparency on YouTube Unlisted Links**: An unlisted YouTube video is accessible to anyone possessing its direct URL. ClipVault enforces access control *through the application interface*.

---

## 🚀 Features

- **Instant Metadata Ingestion**: Paste any YouTube URL (`youtube.com/watch`, `youtu.be`, shorts, embed) to automatically resolve video ID, high-res thumbnail, and title via oEmbed.
- **Duplicate Prevention**: Canonical 11-character video IDs are uniquely indexed to prevent duplicate submissions.
- **Library & Feed**: Dynamic filtering by game, category, and tags with date/alphabetical sorting.
- **Embedded Playback**: Watch full clips in 16:9 directly inside the app with an optional "Open in YouTube" button.
- **Multi-Emoji Reactions**: Toggle reactions (`😂`, `💀`, `🔥`, `🤡`) with live counters and duplicate prevention per user.
- **Discussion Threads**: Post timestamped comments with author-restricted deletion.
- **Uploader Controls**: Full edit and delete permissions for clip creators.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Vanilla CSS Design System with dark glassmorphism tokens
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Icons**: Lucide React
- **Compatibility**: Tested and compatible with Node.js v18.18+

---

## 🏁 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/C-S-Darshan/ClipVault.git
cd ClipVault
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

*(Note: If no Supabase credentials are provided, ClipVault automatically runs in **Local Preview Mode** with interactive mock data so you can test the entire workflow immediately).*

### 3. Initialize Database

Execute [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor. This configures:
- Tables: `users`, `clips`, `tags`, `clip_tags`, `clip_permissions`, `comments`, `reactions`
- Auth trigger to automatically create a user record upon Google OAuth login
- Complete Row Level Security policies

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
