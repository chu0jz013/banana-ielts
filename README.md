# IELTS Vocabulary Study App

Ứng dụng học từ vựng IELTS kiểu Quizlet, xây bằng React, TypeScript và Vite.
Project hiện tập trung vào một màn hình học chính: chọn bộ từ, học bằng
flashcard, luyện câu hỏi nhanh, làm bài test và nghe phát âm bằng Web Speech
API của trình duyệt.

## Mục lục

- [Chức năng chính](#chức-năng-chính)
- [Cách chạy project](#cách-chạy-project)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Project hoạt động như thế nào](#project-hoạt-động-như-thế-nào)
- [Luồng dữ liệu từ vựng](#luồng-dữ-liệu-từ-vựng)
- [Các chế độ học](#các-chế-độ-học)
- [Phát âm](#phát-âm)
- [Cách thêm bộ từ mới](#cách-thêm-bộ-từ-mới)
- [JSON schema](#json-schema)
- [Prompt tạo file từ vựng IELTS](#prompt-tạo-file-từ-vựng-ielts)
- [Kiểm tra và build](#kiểm-tra-và-build)
- [Ghi chú kỹ thuật](#ghi-chú-kỹ-thuật)

## Chức năng chính

- Tự động load tất cả file `*.json` trong `src/assets/ielts-words/`.
- Tự tạo deck tổng hợp `All Words` từ toàn bộ deck hợp lệ.
- Hiển thị thống kê số deck, số từ và trạng thái phát âm.
- Học bằng flashcard: xem từ, IPA, loại từ, band, nghĩa, ví dụ và synonyms.
- Luyện nhanh bằng câu hỏi random: chọn nghĩa hoặc nhập lại từ.
- Làm test tối đa 15 câu, gồm chọn nghĩa, chọn từ và nhập từ.
- Chấm điểm test, đánh dấu câu đúng/sai và hiển thị đáp án đúng.
- Phát âm từ vựng bằng giọng Google UK English Female hoặc Male nếu trình duyệt
  hỗ trợ.

## Cách chạy project

Yêu cầu:

- Node.js phiên bản phù hợp với Vite hiện tại.
- npm.

Cài dependencies:

```bash
npm install
```

Chạy môi trường phát triển:

```bash
npm run dev
```

Sau khi chạy, Vite sẽ in ra URL local, thường là:

```text
http://localhost:5173/
```

Build production:

```bash
npm run build
```

Preview bản production build:

```bash
npm run preview
```

Chạy lint:

```bash
npm run lint
```

## Cấu trúc thư mục

```text
.
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── ielts-words/
│   │   │   ├── education.json
│   │   │   ├── environment.json
│   │   │   ├── health.json
│   │   │   ├── society.json
│   │   │   ├── technology.json
│   │   │   └── work.json
│   │   └── mini-test-reading/
│   │       └── test-01.txt
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

Vai trò các file chính:

- `src/main.tsx`: entry point của React, render component `App` vào `#root`.
- `src/App.tsx`: chứa gần như toàn bộ logic ứng dụng, gồm load deck, state học,
  tạo câu hỏi, chấm điểm và phát âm.
- `src/App.css`: layout và style riêng cho giao diện học.
- `src/index.css`: biến màu, reset cơ bản và style global.
- `src/assets/ielts-words/*.json`: nguồn dữ liệu từ vựng.
- `public/`: static assets được Vite phục vụ trực tiếp.
- `dist/`: output sau khi chạy `npm run build`; không phải nơi sửa source.

`src/assets/mini-test-reading/test-01.txt` hiện đang rỗng và chưa được app đọc.

## Project hoạt động như thế nào

Toàn bộ ứng dụng hiện nằm trong `src/App.tsx`.

Khi app khởi động:

1. Vite bundle source React từ `src/main.tsx`.
2. `main.tsx` render `<App />`.
3. `App.tsx` dùng `import.meta.glob` để import eager toàn bộ JSON trong
   `src/assets/ielts-words/`.
4. Hàm `buildDecks()` chuyển từng file JSON thành `StudyDeck`.
5. Entry nào không đúng schema `WordEntry` sẽ bị loại bằng type guard
   `isWordEntry()`.
6. Deck rỗng bị bỏ qua.
7. App tạo thêm deck `All Words` bằng cách gom toàn bộ entries từ các deck hợp lệ.
8. State ban đầu chọn deck đầu tiên, mặc định là `All Words`.

Các deck được sort theo title, còn deck `All Words` luôn được đặt lên đầu danh
sách. Nếu không có deck hợp lệ, app dùng `EMPTY_DECK` để tránh crash và hiển thị
trạng thái rỗng.

## Luồng dữ liệu từ vựng

Dữ liệu gốc nằm trong:

```text
src/assets/ielts-words/
```

Đoạn load dữ liệu chính:

```ts
const wordModules = import.meta.glob<WordDeckJson>(
  "./assets/ielts-words/*.json",
  {
    eager: true,
    import: "default",
  },
);
```

Ý nghĩa:

- `*.json`: mọi file JSON trong folder này đều được xem là một deck.
- `eager: true`: dữ liệu được import ngay khi bundle được load.
- `import: "default"`: lấy default export của JSON module.

Sau khi load, app kiểm tra từng entry có đủ các field bắt buộc:

- `word`
- `type`
- `ipa`
- `def_en`
- `def_vi`
- `example`
- `synonyms`
- `band`

Nếu một object thiếu field, sai kiểu dữ liệu, hoặc `synonyms` không phải mảng
string, object đó không được đưa vào deck.

`total_entries` chỉ dùng để hiển thị `Declared total` trong phần summary. Số từ
thực tế luôn tính bằng `entries.length` sau khi đã lọc entry hợp lệ.

## Các chế độ học

### 1. Flashcards

Flashcards dùng các state:

- `cardOrder`: mảng index của các từ trong deck hiện tại.
- `cardIndex`: vị trí hiện tại trong `cardOrder`.
- `isFlipped`: đang xem mặt từ hay mặt nghĩa.

Mặt trước hiển thị:

- từ vựng
- loại từ
- IPA
- band
- nút nghe phát âm

Mặt sau hiển thị:

- định nghĩa tiếng Anh
- nghĩa tiếng Việt
- câu ví dụ
- synonyms

Các thao tác:

- `Previous`: lùi một card, quay vòng về cuối nếu đang ở card đầu.
- `Next`: tới card tiếp theo, quay vòng về đầu nếu đang ở card cuối.
- `Show Meaning` / `Show Word`: lật card.
- `Shuffle`: tạo thứ tự card mới bằng Fisher-Yates shuffle.

### 2. Learn

Learn mode tạo từng câu hỏi ngẫu nhiên bằng `createLearnQuestion()`.

Có 2 dạng câu hỏi:

- `choose-definition`: cho một từ và yêu cầu chọn nghĩa đúng.
- `type-word`: cho định nghĩa và yêu cầu nhập lại từ.

Logic chọn câu hỏi:

- Nếu deck rỗng, không tạo câu hỏi.
- Nếu deck có nhiều hơn 1 từ, app có xu hướng tạo câu chọn nghĩa.
- Nếu không, app tạo câu nhập từ.

Khi người dùng trả lời:

- App normalize câu trả lời bằng `normalizeAnswer()`.
- So sánh với đáp án đúng.
- Cập nhật `learnStats.correct` hoặc `learnStats.incorrect`.
- Hiển thị feedback kèm đáp án và ví dụ.
- Nút `Next Question` tạo câu mới từ deck hiện tại.

Normalize hiện xử lý:

- trim khoảng trắng đầu/cuối
- lowercase
- chuẩn hóa dấu nháy cong và nháy thẳng
- gom nhiều khoảng trắng thành một khoảng trắng

### 3. Test

Test mode tạo danh sách câu hỏi bằng `createTestQuestions()`.

Đặc điểm:

- Tối đa 15 câu, theo hằng số `TEST_QUESTION_COUNT`.
- Nếu deck có ít hơn 15 từ, số câu bằng số từ trong deck.
- Từ được shuffle trước khi lấy câu hỏi.
- Ba dạng câu hỏi được xoay vòng:
  - `choose-definition`
  - `type-word`
  - `choose-word`

Khi làm bài:

- Câu trắc nghiệm lưu đáp án được chọn.
- Câu nhập từ lưu text người dùng nhập.
- `Answered x/y` tính số câu đã có đáp án không rỗng.
- `Submit Test` chuyển sang trạng thái đã nộp.

Sau khi nộp:

- App tính điểm bằng cách so sánh từng đáp án với `question.answer`.
- Câu đúng có class `correct`.
- Câu sai có class `incorrect`.
- Đáp án đúng được hiển thị.
- Với trắc nghiệm, lựa chọn đúng được highlight.
- Nút `Review Flashcards` chuyển về mode flashcard.
- Nút `New Test` tạo lại bộ câu hỏi mới từ deck hiện tại.

## Phát âm

Phần phát âm dùng Web Speech API:

```ts
window.speechSynthesis
SpeechSynthesisUtterance
```

App hỗ trợ 2 lựa chọn giọng:

- `Google UK English Female (en-GB)`
- `Google UK English Male (en-GB)`

Luồng hoạt động:

1. Khi app mount, app đọc danh sách voice bằng `speechSynthesis.getVoices()`.
2. App lắng nghe event `voiceschanged` để cập nhật lại danh sách voice.
3. Khi bấm `Hear` hoặc `Test Voice`, app tìm đúng voice theo name và lang.
4. Nếu tìm thấy, app phát âm từ với rate `0.86` và pitch `1`.
5. Nếu không tìm thấy, app báo voice chưa có trong trình duyệt.

Lưu ý:

- Web Speech API phụ thuộc trình duyệt và hệ điều hành.
- Google voices thường có trên Chrome hoặc Edge, nhưng không được đảm bảo ở mọi
  máy.
- Nếu trình duyệt không hỗ trợ `speechSynthesis`, nút phát âm sẽ bị disable.

## Cách thêm bộ từ mới

Thêm một file JSON mới vào:

```text
src/assets/ielts-words/
```

Ví dụ:

```text
src/assets/ielts-words/media.json
src/assets/ielts-words/government.json
```

Sau đó reload dev server hoặc để Vite tự hot reload. Vì app dùng
`import.meta.glob('./assets/ielts-words/*.json')`, file mới sẽ tự xuất hiện
trong danh sách deck nếu:

- file là JSON hợp lệ
- có `entries`
- ít nhất một entry đúng schema

Không cần sửa `App.tsx` khi thêm deck mới.

## JSON schema

Mỗi deck nên có cấu trúc:

```json
{
  "category": "education",
  "band_range": "7.0-9.0",
  "description": "Vocabulary for IELTS Academic on education topics",
  "total_entries": 2,
  "entries": [
    {
      "word": "academic rigor",
      "type": "collocation",
      "ipa": "/ˌækəˈdemɪk ˈrɪɡər/",
      "def_en": "high standards of intellectual challenge in education",
      "def_vi": "tính nghiêm ngặt học thuật",
      "example": "The university is known for its academic rigor.",
      "synonyms": ["intellectual rigor"],
      "band": 7.5
    },
    {
      "word": "aptitude",
      "type": "noun",
      "ipa": "/ˈæptɪtjuːd/",
      "def_en": "natural ability to do something",
      "def_vi": "năng khiếu",
      "example": "She has a remarkable aptitude for languages.",
      "synonyms": ["talent", "flair"],
      "band": 7.5
    }
  ]
}
```

Các field top-level:

- `category`: tên chủ đề, dùng làm title deck.
- `band_range`: khoảng band, hiển thị trong summary.
- `description`: mô tả deck.
- `total_entries`: tổng số entry khai báo, dùng để tham khảo.
- `entries`: mảng từ vựng.

Các field bắt buộc trong từng entry:

- `word`: từ hoặc cụm từ IELTS.
- `type`: loại từ hoặc nhãn, ví dụ `noun`, `verb`, `adj`, `collocation`.
- `ipa`: phiên âm IPA.
- `def_en`: định nghĩa tiếng Anh ngắn gọn.
- `def_vi`: nghĩa tiếng Việt.
- `example`: câu ví dụ tự nhiên.
- `synonyms`: mảng các từ/cụm từ liên quan.
- `band`: số band IELTS, ví dụ `7.0`, `7.5`, `8.0`.

## Prompt tạo file từ vựng IELTS

Có thể dùng prompt sau để tạo deck mới bằng AI assistant:

```text
Create a valid JSON file for IELTS Academic vocabulary.

Topic/category: education
Band range: 7.0-9.0
Number of entries: 300

Return only JSON with this exact top-level structure:
{
  "category": string,
  "band_range": string,
  "description": string,
  "total_entries": number,
  "entries": array
}

Each entry must contain:
- "word": advanced IELTS word or collocation
- "type": part of speech or "collocation"
- "ipa": IPA pronunciation
- "def_en": concise English definition
- "def_vi": Vietnamese translation
- "example": natural IELTS-style sentence
- "synonyms": array of 1-4 synonyms or related phrases
- "band": numeric IELTS band from 7.0 to 9.0

Rules:
- Output valid JSON only.
- Do not include markdown.
- Do not include duplicate words.
- Use double quotes for all JSON strings.
- Make "total_entries" match the number of objects in "entries".
- Keep definitions concise and suitable for IELTS learners.
```

## Kiểm tra và build

Các script trong `package.json`:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

Ý nghĩa:

- `npm run dev`: chạy Vite dev server.
- `npm run build`: type-check bằng TypeScript project references, sau đó build
  production bằng Vite.
- `npm run lint`: kiểm tra code bằng ESLint.
- `npm run preview`: phục vụ thư mục `dist` sau khi build.

Checklist trước khi commit deck mới:

- JSON parse được, không có comment hoặc trailing comma.
- `entries` là một mảng.
- Mỗi entry có đủ field bắt buộc.
- `synonyms` là mảng string.
- `band` là number, không phải string.
- `total_entries` khớp với số object trong `entries`.
- Không trùng `word` trong cùng một file.
- Chạy `npm run build` để chắc chắn JSON được import đúng.

## Ghi chú kỹ thuật

- App là client-side React app, chưa có backend và chưa có database.
- Dữ liệu từ vựng được bundle cùng frontend tại build time.
- Thêm hoặc sửa JSON cần rebuild nếu đang dùng bản production.
- State học hiện chỉ nằm trong memory, reload trang sẽ mất tiến độ.
- Test và Learn dùng `Math.random()`, nên câu hỏi thay đổi mỗi lần tạo lại.
- App chưa đọc dữ liệu reading test trong `src/assets/mini-test-reading/`.
- Thư mục `dist/` là artifact build, không nên sửa trực tiếp.
