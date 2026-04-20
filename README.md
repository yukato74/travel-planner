# Travel Planner

Next.js App Router で作成した旅行プランナーです。  
Supabase をバックエンドとして、trip 詳細ページを中心に実用的な CRUD と共有保護を実装しています。

## プロジェクト概要

- `/dashboard` で旅行一覧の表示・新規作成
- `/trip/[id]` は以下の3タブ構成
  - `Itinerary` : places を日付ごとに表示（追加・編集・削除・DnD 並び替え / 別日移動）
  - `Flights & Hotels` : flights / hotels の一覧・追加・編集・削除
  - `Notes` : notes の一覧・追加・編集・削除
- trip ヘッダーの `Info` ボタンから基本情報を編集
  - `title`, `start_date`, `end_date`, `is_share_protected`, `share_password`
- 共有保護ありの旅行は 6 桁パスワード入力後に本文を表示（成功状態は `sessionStorage`）

## 使用技術

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- MUI (Material UI)
- Supabase (`@supabase/supabase-js`)
- dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)

## ページ構成

- `/` : トップページ
- `/login` : ログインページ（UIのみ）
- `/dashboard` : 旅行一覧 + 新規旅行作成
- `/trip/[id]` : 旅行詳細（タブUI）

## 主要ディレクトリ構成

```text
src/
  app/
    dashboard/page.tsx
    trip/[id]/page.tsx
  components/
    places/
      PlaceItem.tsx
      PlacesSection.tsx
    trip/
      TripDetailView.tsx
      TripInfoDialog.tsx
      FlightsHotelsTab.tsx
      NotesTab.tsx
  lib/
    supabase/client.ts
    trips/service.ts
    places/service.ts
    flights/service.ts
    hotels/service.ts
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
- `flights`
  - `trip_id`, `airline`, `flight_number`, `departure_airport`, `arrival_airport`, `departure_time`, `arrival_time`, `memo`
- `hotels`
  - `trip_id`, `name`, `address`, `check_in_date`, `check_out_date`, `memo`
- `notes`
  - `trip_id`, `title`, `content`

## 現在の実装範囲

- trip 詳細ページのタブ化（Itinerary / Flights & Hotels / Notes）
- Itinerary(places) の CRUD + DnD
- Flights / Hotels / Notes の CRUD
- trip Info 編集ダイアログ
- itinerary（旧 separate セクション）は places に統合

## 将来拡張の想定

- Supabase Auth 連携（ユーザー単位データ）
- RLS のユーザー単位制御
- 入力バリデーションの強化
- Vercel へのデプロイと環境変数連携
