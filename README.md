# Travel Planner

Next.js App Router + Supabase で作成した旅行プランナーです。  
Supabase Auth (Email Magic Link) を SSR 構成 (`@supabase/ssr`) で実装しています。

## 主な機能

- `/login` で Email Magic Link ログイン
- `/dashboard` はログイン必須（未ログイン時は `/login` へリダイレクト）
- `/trip/[id]` は未ログイン閲覧可、編集操作はログイン時のみ有効
- ヘッダーにログイン状態表示 + Logout
- trips / places / flights / hotels / notes の CRUD

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- MUI
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- dnd-kit (places の並び替え)

## Auth 構成

- Browser client: `src/lib/supabase/browser-client.ts`
- Server client: `src/lib/supabase/server-client.ts`
- Middleware client: `src/lib/supabase/middleware-client.ts`
- Middleware: `middleware.ts`
- Auth callback: `src/app/auth/callback/route.ts`

## Supabase セットアップ

1. Supabase プロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. Authentication > URL Configuration で Site URL / Redirect URL を設定
   - 開発例: `http://localhost:3000`
   - Callback: `http://localhost:3000/auth/callback`
4. `.env.local` を作成

```bash
cp .env.example .env.local
```

`.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## データ要件の反映

`trips` テーブルには `owner_user_id` を追加済みです。

- 新規旅行作成時に `owner_user_id = current user.id` で保存
- dashboard は `owner_user_id` が自分の trips のみ表示

## ローカル起動

```bash
npm install
npm run dev
```

## ページ構成

- `/` : トップ
- `/login` : Magic Link ログイン
- `/dashboard` : 自分の旅行一覧（ログイン必須）
- `/trip/[id]` : 旅行詳細（閲覧可 / 編集はログイン必須）
