# Travel Planner

Next.js App Router で作成した旅行プランナーです。  
現在は **Supabase** をバックエンドとして、`trips / places / notes` の一覧表示と追加・編集・削除ができる実装です。

## プロジェクト概要

- `/dashboard` で旅行一覧を Supabase から取得
- `/dashboard` で新しい旅行を作成
  - 入力: `title`, `start_date`, `end_date`
  - 保存時: `share_password` を 6 桁英数字で自動生成
- `/trip/[id]` で `trip / places / notes` を Supabase から取得
- 共有保護ありの旅行は 6 桁パスワード入力後に本文を表示（成功状態は `sessionStorage`）
- `places` は visit_date ごとに表示し、旅行期間内の日付だけを表示
- places は日付セクションごとの `Add place`、各行の `Edit / Delete` に対応
- places は dnd-kit で日付内並び替え・別日付移動に対応（`visit_date` と `sort_order` を保存）

## 使用技術

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- MUI (Material UI)
- Supabase (`@supabase/supabase-js`)

## ページ構成

- `/` : トップページ
- `/login` : ログインページ（UIのみ）
- `/dashboard` : 旅行一覧 + 新規旅行作成
- `/trip/[id]` : 旅行詳細（places / notes の一覧 + 追加）

## 主要ディレクトリ構成

```text
src/
  app/
    dashboard/page.tsx
    trip/[id]/page.tsx
  components/
    places/PlacesSection.tsx
    places/PlaceItem.tsx
    trip/TripDetailView.tsx
  lib/
    supabase/client.ts
    trips/service.ts
    places/service.ts
    notes/service.ts
    share/access.ts
    types/db.ts
    types/trip.ts
supabase/
  schema.sql
```

## Supabase 接続手順

1. Supabase で新規プロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. `.env.local` を作成して環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ローカル起動

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## データ仕様（今回対応分）

- `trips`
  - `title`, `start_date`, `end_date`, `share_password`, `is_share_protected`
- `places`
  - `trip_id`, `visit_date`, `name`, `address`, `memo`, `lat`, `lng`, `sort_order`
- `notes`
  - `trip_id`, `title`, `content`

## 現在の実装範囲

- 旅行（trips）の編集・削除は未実装
- places は追加・編集・削除・ドラッグ移動まで対応済み
- itinerary / flights / hotels はプレースホルダー表示

## 将来拡張の想定

- Supabase Auth 連携（ユーザー単位データ）
- RLS のユーザー単位制御
- trips / notes の編集・削除
- Vercel へのデプロイと環境変数連携
