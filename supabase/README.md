# Owner console — setup

The site reads its content from Supabase and falls back to the snapshot built into the bundle
(`src/data/*.ts`). Until the keys below exist, the site behaves exactly as before and `/admin`
shows a setup screen (with a local, browser-only demo mode).

## 1. Create the Supabase project and link it to Vercel

Either route works; the Vercel one injects the keys for you.

**Through Vercel (recommended)** — Vercel dashboard → your project → *Integrations* → *Browse
Marketplace* → **Supabase** → *Add Integration* → create a new Supabase project (free tier is fine,
region near India, e.g. Mumbai `ap-south-1`) → link it to this Vercel project. Vercel then adds
`SUPABASE_URL`, `SUPABASE_ANON_KEY` (and others) to the project's environment variables.

**Directly** — https://supabase.com/dashboard → *New project*. Then in Vercel → *Settings* →
*Environment Variables*, add for Production, Preview and Development:

| Name | Value (Supabase dashboard → *Project Settings* → *API*) |
|------|----------------------------------------------------------|
| `VITE_SUPABASE_URL` | Project URL, e.g. `https://abcd1234.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the **anon / public** key (never the service_role key) |

The build accepts either naming (`VITE_SUPABASE_*`, `SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*`).

## 2. Local development

Create `.env.local` in the repo root (it is git-ignored) with the same two values:

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Restart `npm run dev` afterwards. A template is in `.env.example`.

## 3. Run the migration

Supabase dashboard → *SQL Editor* → *New query* → paste the whole of
`supabase/migrations/0001_content.sql` → *Run*. It creates the tables, the owner check, the
policies, the publish/restore functions, Realtime and the `media` storage bucket. It is safe to
run again.

The owner email is set near the top of that file (`insert into public.owners …`). Change it there
before running if needed; to add another editor later, insert another row in the SQL editor.

## 4. Create the owner account and turn sign-ups off

- *Authentication* → *Users* → *Add user* → *Create new user* → the owner email + a strong
  password. Tick *Auto Confirm User*.
- *Authentication* → *Providers* → *Email* → turn **off** *Allow new users to sign up*.
- Optional but recommended: *Authentication* → *Multi-Factor* → make sure TOTP is enabled
  (it is by default). You then enrol an authenticator from the console's *Account & security*.

## 5. First sign-in

Redeploy (push, or Vercel → *Redeploy*) so the keys reach the bundle, open `/admin`, sign in.
The console shows **The database is empty — Seed from site**: click it once. That copies the
content currently built into the site into the database. From then on, edit → Publish.

Every "Download PDF" button serves whatever file is uploaded in *Profile & contact* → *Résumé PDF*.

## How it behaves

- Visitors paint the bundled snapshot first, then the published content from Supabase replaces
  it (cached in their browser for repeat visits). Publishing pushes to open tabs through Realtime.
- Edits are drafts (autosaved) until *Publish*. Every publish is kept in *History* and can be
  restored into the draft.
- Only emails listed in `public.owners` can read drafts, write, publish or upload. Anyone can
  read what is published. The anon key in the bundle can do nothing else. Drafts live in their
  own table (`content_drafts`) that visitors cannot read or subscribe to; Realtime only carries
  the published table.
- `/api/keepalive` runs weekly (see `vercel.json` → `crons`) so a free-tier project never pauses.
  Even if it did, the site keeps serving the snapshot.
