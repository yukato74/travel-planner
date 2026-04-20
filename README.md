# Travel Planner (Minimal Starter)

Next.js App Router で構築した、旅行プランナーWebアプリの最小構成です。  
現段階はダミーデータで動作し、将来的に Supabase と Vercel へ接続しやすい構成にしています。

## プロジェクト概要

- 旅行一覧と旅行詳細を閲覧できる
- 旅行詳細は `itinerary / flights / hotels / places / notes` をカードで整理表示
- 共有URLベースでアクセス可能
- 共有保護ありの旅行は 6 桁パスワード入力で閲覧可能（仮実装）
- ログインUIは仮実装（認証基盤は未接続）

## 使用技術

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- MUI (Material UI)

## ページ構成

- `/` : トップページ
- `/login` : ログインページ（UIのみ）
- `/dashboard` : 自分の旅行一覧
- `/trip/[id]` : 旅行詳細ページ

## 主要ディレクトリ構成

```text
src/
  app/
    page.tsx
    login/page.tsx
    dashboard/page.tsx
    trip/[id]/page.tsx
  components/
    layout/AppHeader.tsx
    providers/AppProviders.tsx
    providers/ThemeRegistry.tsx
    trip/TripDetailView.tsx
    trip/TripSectionCard.tsx
  data/
    trips.ts
  lib/
    share/access.ts
    trips/service.ts
    types/trip.ts
```

## ローカル起動方法

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 共有URLと6桁パスワード保護の仮実装

- 共有URLは `lib/trips/service.ts` の `buildTripShareUrl` で生成
- 保護要否とパスワードは `src/data/trips.ts` のダミーデータで管理
- パスワード検証ロジックは `lib/share/access.ts` に分離
- `/trip/[id]` で保護対象の場合、本文表示前に入力UIを表示
- 入力成功状態は `sessionStorage` で管理（キー: `trip-access:<tripId>`）

## 今後の拡張想定

- Supabase:
  - `src/data/trips.ts` を Supabase テーブル取得に置き換え
  - `lib/trips/service.ts` を API / Server Action 化
  - `lib/share/access.ts` を RLS + 共有トークン戦略へ置換
- Vercel:
  - そのまま `npm run build` が通る構成
  - `NEXT_PUBLIC_APP_URL` を環境変数で設定すると共有URL生成を本番ドメインに合わせられる
- Places の並び替え:
  - 現在はハンドル付きリストUIのみ
  - 後続で `dnd-kit` 導入時に `TripDetailView` の places セクションへ組み込みやすい構造
