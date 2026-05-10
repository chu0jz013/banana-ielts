# IELTS Passive Vocab Web App — Plan

> **TL;DR.** Rebuild the current Quizlet-style MVP into a mobile-first,
> TikTok-style **vertical vocab feed** designed for passive learning during dead
> time (đi vệ sinh, chờ thang máy, lướt trước khi ngủ). Frontend-only first
> (React + TS + Vite + IndexedDB + PWA), backend later only when sync across
> devices is needed. Core differentiator vs Quizlet: **no decks, no sessions,
> no mode-switching** — just an infinite, audio-first scroll where every
> interaction silently feeds an FSRS scheduler that promotes/demotes words
> between `new → learning → familiar → known → mastered`.

---

## 1. Problem statement

Pain points của MVP hiện tại (rút từ README):

| #   | Pain point                     | Diagnosis                                                                                                                                              |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Không ưu tiên phone mode       | Layout là desktop-first card; không tận dụng vertical viewport, không có gesture, navigation cần 2 tay.                                                |
| 2   | Quá giống Quizlet              | Mental model là **deck → session → mode** (flashcard / learn / test). User phải _quyết định_ trước khi học → friction cao → không phù hợp passive use. |
| 3   | Chưa tối ưu passive learning   | Mỗi câu hỏi cần explicit input (click chọn / type). Không có audio-first flow, không có background play, không có "lướt rồi quên".                     |
| 4   | Không sort known vs unknown    | Tất cả từ được random uniform. Không có model về việc _từ này tôi đã thuộc chưa_ → user thấy lại từ "academic" 100 lần dù đã thuộc từ lâu.             |
| 5   | (implicit) State chỉ in-memory | Reload là mất tiến độ → không thể track learning curve dài hạn → không enable được SRS.                                                                |

**Hệ quả:** App hoạt động như một quizlet clone — đòi hỏi user phải _ngồi xuống học_. Trong khi mục tiêu là **fill thời gian rảnh**, tức là **học khi không có ý định học**.

---

## 2. Research: passive learning thực sự là gì?

Trước khi code phải clear concept, không thì sẽ build sai.

### 2.1 Passive vs active learning — không phải đối lập, mà là continuum

Trong nghiên cứu giáo dục, "passive learning" thường nghĩa là **input mà không yêu cầu output rõ ràng** (đọc, nghe, lướt). "Active learning" yêu cầu **retrieval** (gọi lại từ trí nhớ — nhập từ, chọn nghĩa, nói ra).

**Sự thật khó chịu nhưng phải chấp nhận:** active recall > passive review về mặt retention. Nhiều tổng quan tài liệu (Dunlosky 2013, meta-analysis 2024) cho thấy **practice testing và spaced practice** là hai kỹ thuật học hiệu quả nhất, hơn hẳn highlighting / re-reading.

**Vậy tại sao vẫn build passive app?**

1. **Active học 30 phút/ngày < Passive học 90 phút/ngày**, nếu user chỉ _thực sự_ mở app khi nó passive. Total exposure thắng quality-per-minute khi consistency là bottleneck.
2. **Habit formation**: passive scroll = zero activation energy → user mở app hàng ngày. Sau khi habit có, có thể inject active retrieval nhẹ vào feed.
3. **Implicit learning of pronunciation & collocation**: nghe IPA + ví dụ lặp lại nhiều lần → ngấm dần, đặc biệt cho IELTS speaking & listening.

→ **Design principle:** App phải feel passive (low friction) nhưng _có inject active retrieval moments_ được tuned để không phá vỡ flow.

### 2.2 Những gì research đã xác nhận

Tổng hợp từ literature mobile-assisted vocabulary learning (MAVL):

- **Spaced repetition là gold standard** cho vocab retention. Meta-analysis trên 21,000+ learners: standardized mean difference = 0.78 (large effect) so với conventional study.
- **Multimedia text + audio + image** được learners prefer hơn text-only (Zhang et al. 2021).
- **Số lần exposure tối ưu** theo perceived difficulty:
  - Unknown words: 6–7 sessions trong 10–14 ngày
  - Familiar-but-unsure: 3–4 sessions
  - Known: 2–3 maintenance sessions
- **Khoảng cách giữa các session nên tăng dần** (the spacing effect — đường cong quên Ebbinghaus).
- Learners prefer **2–3 retrieval format khác nhau** (đa dạng) hơn là 1 format lặp lại.

### 2.3 Những gì TikTok UX đã chứng minh

Từ research về TikTok UI/UX và việc adoption của vertical-feed pattern bởi edtech:

- **Full-screen vertical content** loại bỏ competing UI elements → immersion.
- **Vertical swipe** = navigation pattern dễ nhất bằng 1 tay (1 thumb).
- **Auto-play on viewport entry** → 0 friction để bắt đầu consumption.
- **Single feed, no menu** → loại bỏ choice paralysis.
- **Right-side action column** = vùng dễ nhất với thumb (Fitt's Law).
- **Bite-sized content** (< 60s) → fit mobile attention span.

### 2.4 SRS algorithm: chọn FSRS, không phải SM-2

- **SM-2** (Anki, 1990): 1 ease-factor per card. Đơn giản, đã chứng minh, nhưng không cá nhân hóa.
- **FSRS** (2022, native trong Anki từ 11/2023): 3-component memory model (Difficulty, Stability, Retrievability) + 21 trainable parameters. Cần ~20–30% ít review hơn SM-2 để đạt cùng retention rate.
- **Verdict cho project này:** Bắt đầu với **FSRS-4.5** simplified — đã có open-source TS port (`ts-fsrs` trên npm). FSRS không cần training data ban đầu, default parameters đủ tốt; có thể optimize sau khi thu được ≥1000 reviews.

---

## 3. Product principles

5 nguyên tắc, mỗi feature decision đều phải pass test với chúng:

1. **Phone-first, not phone-also.** Desktop là after-thought. Layout, gesture, font-size, tap target đều design cho 1 tay cầm điện thoại dọc.
2. **Zero activation energy.** Mở app → đã có nội dung phát audio. Không cần chọn deck, mode, không có loading screen có ý nghĩa.
3. **Audio is primary, text is secondary.** Pronunciation phải auto-play. Visuals support audio, không thay thế.
4. **The algorithm decides what's next, not the user.** User scrolls; system schedules. Không có "deck Education / Environment" để chọn. (Có _filter_ nâng cao, nhưng default = unified personalized feed.)
5. **Every interaction is a signal.** Lướt nhanh qua = "dễ"; dừng lại lâu = "đang xử lý"; tap để xem nghĩa = "chưa nắm"; vuốt left/right = explicit grade. Không có "I don't know" button đáng sợ — chỉ có signals ngầm và rating quick.

---

## 4. Core UX: The Feed

### 4.1 Anatomy of one card (mobile portrait, full-screen)

```
┌─────────────────────────┐
│ 7.5  •  noun       👤 ⚙ │  ← top: band, type, settings (subtle)
│                         │
│                         │
│                         │
│      academia           │  ← word (huge, center)
│   /ˌækəˈdiːmiə/         │  ← IPA below
│         🔊              │  ← auto-play indicator
│                         │
│                         │
│                  ❓     │  ← right action: reveal meaning
│                  🔁     │  ← right action: replay audio
│                  ⭐     │  ← right action: bookmark
│                  ✓      │  ← right action: "I know this"
│                  ✗      │  ← right action: "Don't know"
│                         │
│  tap anywhere → reveal  │
│  swipe up → next        │
└─────────────────────────┘
```

### 4.2 Interaction model

| Gesture                 | Behavior                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Open app**            | Auto-play audio of first card (UK Female default).                                                               |
| **Swipe up**            | Next card. Audio of new card auto-plays. Implicit signal: "fast swipe" = neutral, "slow lingering" = engagement. |
| **Swipe down**          | Previous card (review).                                                                                          |
| **Tap card center**     | Reveal definition + Vietnamese + example + synonyms. Tap again to hide.                                          |
| **Double-tap**          | Replay pronunciation.                                                                                            |
| **Long press**          | Bookmark + open detail sheet (full info, edit notes).                                                            |
| **Right swipe**         | Mark as "Easy" (FSRS grade = Easy / known faster).                                                               |
| **Left swipe**          | Mark as "Again" (FSRS grade = Again / surface again soon).                                                       |
| **Side action buttons** | Explicit fallbacks for users who don't discover gestures.                                                        |

### 4.3 Auto-play & background mode

- Audio auto-plays on viewport entry (after first user gesture; required by browser autoplay policies).
- **Background play mode** (đeo tai nghe trong lúc khác): toggle ở header → app reads current card aloud, waits N seconds, advances to next. Useful for `học trong lúc đi bộ / nấu ăn`. Use Wake Lock API to prevent screen sleep.
- Pronunciation order: word → IPA pause → word again → ví dụ. Pace ~0.86 (đã có trong MVP).

### 4.4 Active retrieval injection (subtle, not Quizlet-style)

Sau mỗi N cards (default N=10), feed inject 1 "**check card**" — nhưng vẫn trong cùng vertical feed, không thoát:

- Format 1: "Nghĩa của _aptitude_ là gì?" + 4 options
- Format 2: "Điền từ: _She has a remarkable \_\_\_ for languages_" + free input
- Format 3: "Nghe — đoán từ" (chỉ phát audio, ẩn text)

Card này được pick từ words user vừa thấy 3–10 cards trước → kiểm tra short-term retention. Kết quả feed thẳng vào FSRS rating.

### 4.5 Feed scheduling logic (high-level)

```
get_next_card(user) =
  weighted_pick:
    50% → due cards from FSRS scheduler (priority: overdue learning > learning > familiar)
    30% → new cards (band 7.0+, picked by category rotation)
    15% → review check cards (active retrieval injection)
     5% → "discovery" — random known/mastered for variety
```

Tỷ lệ này tunable; sau khi có data sẽ A/B.

---

## 5. Data model

### 5.1 Word state machine

```
        ┌───────┐  first seen     ┌──────────┐
        │  new  │ ──────────────> │ learning │
        └───────┘                 └────┬─────┘
                                       │
             ┌─────────────────────────┼─────────────────┐
             │ 3+ correct in a row     │ 2 fails         │
             ▼                         ▼                 │
        ┌──────────┐  consistent    ┌───────┐  fail      │
        │ familiar │ ────────────>  │ known │ ────────── ┘
        └──────────┘                └───┬───┘  (demote)
                                        │
                                        │ stability ≥ 90 days
                                        ▼
                                   ┌──────────┐
                                   │ mastered │
                                   └──────────┘
```

State được **derived from FSRS metrics** (stability, retrievability), không phải hardcode counter — clean và auto-adjusting:

- `new`: chưa có FSRS record
- `learning`: stability < 7 days
- `familiar`: 7 ≤ stability < 30 days
- `known`: 30 ≤ stability < 90 days
- `mastered`: stability ≥ 90 days

Tỷ lệ xuất hiện trong feed nghịch với state — `mastered` chỉ pop up rất thưa.

### 5.2 IndexedDB schema (Dexie.js)

```ts
// db/schema.ts
interface WordRecord {
  id: string; // hash(word + category)
  word: string;
  category: string; // "education", "environment", ...
  // ... rest of WordEntry fields from existing JSON
}

interface ReviewRecord {
  wordId: string; // FK → WordRecord.id
  // FSRS state
  difficulty: number; // 1.0–10.0
  stability: number; // days
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3; // FSRS internal state
  lastReview: number; // epoch ms
  nextReview: number; // epoch ms — query by this for "due" cards
}

interface InteractionLog {
  id: number; // auto-increment, for debugging/analytics
  wordId: string;
  ts: number;
  action: "view" | "reveal" | "audio_replay" | "grade";
  grade?: 1 | 2 | 3 | 4; // FSRS: Again/Hard/Good/Easy
  dwellMs?: number; // implicit signal
}

interface UserSettings {
  voicePreference: "uk_female" | "uk_male";
  bandFilter: { min: number; max: number }; // default { min: 7.0, max: 9.0 }
  bgPlayInterval: number;
  injectionRate: number; // active retrieval frequency
}
```

Indices: `nextReview`, `state`, `category` cho query nhanh.

---

## 6. Technical architecture

### 6.1 Stack decision

| Layer       | Choice                                     | Rationale                                                                    |
| ----------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Framework   | **React 18 + TypeScript + Vite**           | Giữ stack hiện tại, không thay vì thay = chậm.                               |
| State       | **Zustand**                                | Nhẹ, không Redux overhead, perfect cho feed state.                           |
| Storage     | **Dexie.js (IndexedDB wrapper)**           | Local-first, xử lý 10k+ words không sweat, sync sau dễ.                      |
| SRS         | **`ts-fsrs`** (npm)                        | Production-ready FSRS port, MIT, 0 dep.                                      |
| Gestures    | **`@use-gesture/react` + Framer Motion**   | Industry standard cho swipe + animation.                                     |
| Audio       | **Web Speech API** (current) + cache layer | Đã có; chỉ thêm pre-fetching để giảm latency.                                |
| PWA         | **`vite-plugin-pwa`**                      | Workbox-based, install banner, offline shell.                                |
| Styling     | **Tailwind CSS**                           | Mobile-first utility classes; dynamic viewport units (`dvh`) cho iOS Safari. |
| Lint/format | ESLint (current) + Prettier                | Không thay.                                                                  |
| Testing     | Vitest + Playwright (mobile viewport)      | Vitest cho FSRS logic, Playwright cho gesture flow.                          |

### 6.2 Kiến trúc thư mục đề xuất (refactor từ MVP)

```
src/
├── app/                    # App shell, router
│   └── App.tsx
├── features/
│   ├── feed/               # The vertical feed
│   │   ├── Feed.tsx
│   │   ├── Card.tsx
│   │   ├── ActionRail.tsx
│   │   └── useFeedScheduler.ts
│   ├── srs/                # FSRS wrapper
│   │   ├── scheduler.ts
│   │   ├── stateDerive.ts
│   │   └── srs.test.ts
│   ├── audio/              # Speech synthesis + caching
│   │   ├── speak.ts
│   │   └── voicePicker.ts
│   ├── retrieval/          # Active retrieval cards (inject)
│   │   ├── ChooseDefCard.tsx
│   │   └── FillBlankCard.tsx
│   └── settings/
│       └── Settings.tsx
├── data/
│   ├── db.ts               # Dexie instance
│   ├── seed.ts             # First-run: load JSON → IndexedDB
│   └── words/              # Same JSON pool, just relocated
│       └── *.json
├── lib/
│   ├── gesture.ts
│   └── wake-lock.ts
└── main.tsx
```

### 6.3 Backend — defer until needed

**Không build backend ở phase 1.** Lý do:

- Tất cả data nguồn (JSON pool) là bundled static.
- FSRS state per-user → IndexedDB đủ.
- Audio = Web Speech API (browser-side).
- → Backend zero-value cho MVP. Yêu cầu **automate everything** mindset của bạn ủng hộ defer: không build cái không cần.

**Khi cần backend (Phase 4+):**

- Cross-device sync (điện thoại + máy tính)
- Account / progress recovery sau khi wipe browser
- Server-side FSRS optimization (chạy parameter tuning offline)
- Analytics aggregation

Stack đề xuất khi đó:

- **Node.js + Fastify** (lighter than Express, native TS)
- **PostgreSQL** (Supabase hoặc self-hosted) — JSONB cho FSRS records, relational cho user/auth
- **Auth**: Clerk hoặc Supabase Auth (skip building auth)
- **Sync protocol**: simple last-write-wins per `(userId, wordId)` với `updated_at`. CRDT overkill cho use case này.
- **Deploy**: Fly.io hoặc Railway, IaC bằng Terraform vì phù hợp DevOps mindset của bạn.

---

## 7. Phased roadmap

Mỗi phase ship được một thứ usable. Không phase nào > 2 tuần work.

### Phase 0 — Discovery & spike (2–3 ngày)

- [ ] Đọc hết plan này, gut-check
- [ ] Spike: tạo 1 prototype feed scroll với Framer Motion + 1 hardcoded card → verify feel có giống TikTok không trên thiết bị thật
- [ ] Quyết định: Tailwind hay giữ App.css? (đề xuất Tailwind cho velocity)

### Phase 1 — Mobile feed MVP (1 tuần)

**Goal:** Có thể lướt feed dọc trên điện thoại, audio auto-play, tap reveal nghĩa. Chưa có SRS — chỉ random từ pool.

- [ ] Refactor MVP sang structure ở §6.2
- [ ] Build `<Feed />` với virtual scrolling (chỉ render 3 cards: prev/current/next)
- [ ] Build `<Card />` với layout ở §4.1
- [ ] Gesture: vertical swipe + tap reveal
- [ ] Auto-play audio on viewport entry
- [ ] Action rail (right side) — buttons nhưng chưa wire vào SRS
- [ ] Mobile-first viewport: `100dvh`, safe-area-inset, prevent overscroll
- [ ] Deploy lên Vercel/Netlify để test trên điện thoại thật

**Acceptance criteria:** Bạn có thể mở app trên điện thoại, lướt 50 cards bằng 1 tay, audio auto-play đúng, không có jank.

### Phase 2 — Persistence & FSRS (1 tuần)

**Goal:** Sort known vs unknown — pain point #4 — được giải quyết.

- [ ] Setup Dexie với schema §5.2
- [ ] First-run seed: load JSON → IndexedDB
- [ ] Integrate `ts-fsrs`
- [ ] Wire grade actions (swipe left/right + buttons) → FSRS update
- [ ] Build `useFeedScheduler` với weighted pick logic §4.5
- [ ] Derive word state từ stability §5.1, hiện badge nhỏ trên card
- [ ] Settings page: band filter, voice picker

**Acceptance criteria:** Reload app, từ đã grade "Easy" không xuất hiện lại trong 7+ ngày. Words "Again" surface trong 1–10 phút.

### Phase 3 — PWA + offline + polish (4–5 ngày)

- [ ] `vite-plugin-pwa` + manifest + icons
- [ ] Offline shell — JSON đã bundled, IndexedDB offline-first
- [ ] Install prompt
- [ ] Background play mode (Wake Lock API)
- [ ] Active retrieval injection cards (§4.4)
- [ ] Haptic feedback (vibration API) on swipe grade
- [ ] Stats screen: streak, total reviewed, state distribution donut
- [ ] Export progress as JSON (escape hatch)

### Phase 4 — Backend & sync (optional, 1 tuần)

Chỉ làm nếu thực sự cần multi-device. Tham khảo §6.3.

### Phase 5 — Other IELTS skills (later)

Khi vocab đã solid, mở rộng:

- **Listening passive feed**: micro-clips + transcript reveal
- **Reading**: short paragraphs với target words highlighted (đã có folder `mini-test-reading/` chờ sẵn)
- **Speaking**: shadow-repeat với speech recognition (Web Speech API recognition side)

---

## 8. Migration plan from current MVP

Không nên rewrite from scratch, không nên patch tại chỗ. Đề xuất **strangler pattern**:

1. **Branch mới** `v2-feed`. `main` vẫn giữ MVP đang chạy.
2. **Move JSON pool**: `src/assets/ielts-words/` → `src/data/words/`. Cập nhật `import.meta.glob`.
3. **Giữ types** từ MVP (`WordEntry`, `WordDeckJson`) — đã đúng, không cần đổi.
4. **Discard logic** của `flashcard / learn / test mode` — thay bằng feed. Code cũ làm reference, không reuse trực tiếp (mental model khác).
5. **Reuse**: voice picker logic, `normalizeAnswer`, JSON validation guards — copy nguyên sang module mới.
6. Khi Phase 1 ổn → merge `v2-feed` → `main`, xóa code cũ.

---

## 9. Open questions — cần bạn decide

| #   | Question                         | Options                                                                | Default đề xuất                                        |
| --- | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Auth ở Phase 1?                  | (a) None (b) Anonymous device ID                                       | (a) None — IndexedDB là đủ                             |
| 2   | Tailwind hay giữ App.css?        | (a) Tailwind (b) CSS modules (c) keep                                  | (a) Tailwind — velocity cho mobile-first               |
| 3   | Animation lib                    | (a) Framer Motion (b) react-spring                                     | (a) Framer Motion — gesture API tốt hơn                |
| 4   | Có cho user pick deck/category?  | (a) Hidden (algo only) (b) Filter trong settings (c) Visible deck list | (b) Filter trong settings — không phải primary nav     |
| 5   | Dark mode                        | (a) Default dark (b) System preference (c) Light only                  | (a) Default dark — feed UX tối hợp passive evening use |
| 6   | First-run flow                   | (a) Drop thẳng vào feed (b) Onboarding 3 màn                           | (a) Drop thẳng — zero activation energy nguyên tắc #2  |
| 7   | Có hiện band/category trên card? | (a) Yes, top corner (b) Hide hoàn toàn (c) Only on reveal              | (a) Subtle top — informative, không distract           |

---

## 10. Tự động hóa & DX (vì DevOps mindset của bạn)

Setup từ ngày 1 để khỏi tech-debt sau:

- **CI**: GitHub Actions — `npm run lint`, `npm run build`, `vitest run`, Playwright trên 1 mobile viewport. Trigger trên PR.
- **Preview deployments**: Vercel/Netlify auto-deploy mỗi PR → test trên điện thoại thật ngay.
- **Pre-commit**: Husky + lint-staged — Prettier + ESLint trên staged files.
- **Conventional commits + changelog**: dùng `release-please` hoặc `changesets`.
- **JSON validation**: Zod schema cho `WordEntry`. CI fails nếu JSON pool có entry sai schema → catch lỗi trước khi merge.
- **Bundle size budget**: `size-limit` plugin — fail CI nếu JS bundle > 200KB gzipped (mobile cần lean).
- **Lighthouse mobile CI**: target Performance ≥ 90, PWA pass.

---

## 11. Risks & mitigations

| Risk                                                             | Impact                                     | Mitigation                                                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web Speech API không có giọng UK trên iOS Safari                 | Audio-first principle phá sản trên iOS     | Fallback chain: UK Female → UK Male → bất kỳ en-GB → en-US. Ở settings cảnh báo nếu không có en-GB. Dài hạn: pre-record TTS server-side (eg. Azure Speech) và serve audio files cached. |
| FSRS default params không tối ưu cho IELTS user                  | Schedule sai → user bored hoặc overwhelmed | Default params đủ tốt theo benchmark. Sau 1k reviews per user, chạy optimization (client-side, 1 lần/tháng).                                                                            |
| Passive learning thực sự không retain — user "lướt" mà không nhớ | Mục tiêu chính fail                        | Active retrieval injection (§4.4) là safety net. Track retention rate trong stats; nếu < 60% sau 1 tháng → tăng injection rate.                                                         |
| iOS PWA limitations (audio in background, IndexedDB quota)       | Background play mode broken trên iOS       | Document limitations, fallback graceful. Background play là Phase 3 — có thời gian iterate.                                                                                             |
| Bạn quá bận với DevOps day-job, không ship được                  | Project chết yểu                           | Phase nhỏ, mỗi phase ship 1 thứ usable. Nếu chỉ làm xong Phase 1, đã better than current MVP rồi.                                                                                       |

---

## 12. Success metrics

Cách tự đánh giá sau mỗi phase:

- **Phase 1:** Bạn dùng app ≥ 5 phút trên điện thoại mà không thấy khó chịu.
- **Phase 2:** Sau 1 tuần dùng, từ "academia" không còn xuất hiện trong feed nữa (hoặc rất hiếm) — sort known vs unknown đã work.
- **Phase 3:** Bạn install PWA và dùng nó offline trên xe bus.
- **Long-term (3 tháng):** Vocab band 7.0+ retention test — chọn 50 từ random từ pool, self-test → target ≥ 80% recall.

---

## Appendix A — Tham khảo & đọc thêm

- FSRS algorithm: <https://github.com/open-spaced-repetition/fsrs4anki/wiki>
- `ts-fsrs` npm: <https://github.com/open-spaced-repetition/ts-fsrs>
- Wake Lock API: <https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API>
- Dexie.js: <https://dexie.org/>
- Framer Motion gestures: <https://www.framer.com/motion/gestures/>
- Vite PWA: <https://vite-pwa-org.netlify.app/>
- Mobile-assisted vocabulary learning meta-review (Frontiers in Education, 2024): <https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1496578/full>

## Appendix B — Glossary

- **MAVL** — Mobile-Assisted Vocabulary Learning
- **SRS** — Spaced Repetition System
- **FSRS** — Free Spaced Repetition Scheduler (modern SRS algo)
- **SM-2** — SuperMemo 2 (legacy SRS algo, used by Anki since 1990)
- **PWA** — Progressive Web App (installable, offline-capable web app)
- **IPA** — International Phonetic Alphabet (phiên âm)
- **dwell time** — thời gian user dừng trên 1 card (implicit engagement signal)
- **strangler pattern** — refactor pattern: dựng cái mới song song, dần dần thay cái cũ
