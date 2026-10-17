# Kế hoạch: Web App Học Tiếng Anh (PWA, self-host)

Bối cảnh: dùng cho cá nhân/gia đình, truy cập được từ cả iPhone (cài lên màn hình chính như app) và PC qua trình duyệt thường. Server tự host trên Ubuntu tại nhà, expose ra internet qua Cloudflare Tunnel.

Tech stack: Next.js (App Router, TypeScript) + Tailwind CSS + Prisma + SQLite + NextAuth (Credentials) + Serwist (`@serwist/turbopack`, không dùng next-pwa vì không tương thích Turbopack). Đóng gói bằng Docker, deploy bằng docker-compose (app + cloudflared).

## Trạng thái các phase

- [x] Phase 0: Hạ tầng mạng (Cloudflare Tunnel, Docker trên Ubuntu)
- [x] Phase 1: Khởi tạo project (Next.js, TypeScript, Tailwind, Prisma, SQLite)
- [x] Phase 2: Auth và phân quyền (NextAuth Credentials, role ADMIN/MEMBER)
- [x] Phase 3: Data model và thuật toán SRS (Deck, Card, ReviewLog, SM-2)
- [x] Phase 4: Giao diện học Flashcard (mobile first)
- [ ] Phase 5: Giao diện responsive cho PC (sidebar, phím tắt, table view) — *tạm bỏ qua theo yêu cầu, quay lại sau*
- [ ] Phase 6: Module Quiz ngữ pháp — *tạm bỏ qua theo yêu cầu, quay lại sau*
- [ ] Phase 7: Trang quản trị (Admin dashboard) — *tạm bỏ qua theo yêu cầu, quay lại sau*
- [x] Phase 8: PWA hóa cho iPhone (manifest, icon, service worker)
- [ ] Phase 9: Đóng gói Docker và deploy lên Ubuntu
- [ ] Phase 10: Mở rộng sau MVP (TTS, push notification, thống kê, backup tự động)

## Chi tiết từng phase

### Phase 0: Hạ tầng mạng (hoàn thành)
Server: TV box ARM64 (hostname `tvbox`), chạy Ubuntu 26.04, RAM 1.9GB, đã có Docker sẵn với vài container khác (webrtc app, Portainer, Samba). Domain `web-rtc.cloud` quản lý qua Cloudflare.

Đã tận dụng tunnel Cloudflare có sẵn tên **web-rtc** (chạy dạng systemd service trực tiếp trên host, không phải trong Docker, cấu hình route quản lý qua dashboard Cloudflare chứ không qua file config trên server), thay vì tạo tunnel mới. Đã thêm route mới:

- Hostname: `app.web-rtc.cloud`
- Service: HTTP
- URL: `localhost:3001`

Đã test bằng container nginx tạm publish port `3001:80`, xác nhận `https://app.web-rtc.cloud` chạy thông suốt từ internet. Container test đã được dọn dẹp.

**Lưu ý quan trọng cho Phase 9:** vì tunnel chạy ở host (không phải Docker network), app Next.js khi deploy phải publish port ra host đúng `3001` (ví dụ `-p 3001:3000` trong docker-compose) để khớp với route đã cấu hình. Port `3000`, `80`, `8080`, `9000`, `445` trên host đã bị các container khác chiếm, tránh dùng.

### Phase 1: Khởi tạo project
Next.js App Router + TypeScript + Tailwind. Prisma với datasource SQLite, migration đầu tiên với model User tối thiểu để xác nhận pipeline chạy đúng.

### Phase 2: Auth và phân quyền (hoàn thành)
NextAuth.js v4 (bản ổn định `4.24.15`, không dùng v5 vì v5 vẫn đang beta) với Credentials provider, mật khẩu hash bằng `bcryptjs` (dùng bản JS thuần thay vì `bcrypt` native để tránh thêm một native module nữa phải build khi đóng Docker, vì đã có `better-sqlite3` rồi). Đã thêm field `passwordHash` và `role` (ADMIN/MEMBER, default MEMBER) vào User, migration `add_user_auth_fields`.

Middleware (`src/middleware.ts`) chặn toàn bộ route trừ `/login`, `/api/auth/*`, `/api/health`, chuyển hướng về `/login` nếu chưa đăng nhập. Lưu ý: dùng `getToken` từ `next-auth/jwt` viết middleware thủ công thay vì re-export `next-auth/middleware` mặc định, vì Next.js 16 không nhận diện đúng cách re-export đó (báo lỗi "must export a function").

Script seed (`prisma/seed.ts`, chạy bằng `npx prisma db seed`) đọc danh sách tài khoản từ biến môi trường `SEED_USERS` (JSON) trong `.env`, không hardcode mật khẩu trong code. **Việc cần làm: sửa lại email/mật khẩu thật trong `.env` trước khi dùng thật** (hiện đang là giá trị mẫu `admin@family.local` / `doi-mat-khau-nay`).

Đã test thực tế toàn bộ luồng bằng curl: truy cập khi chưa đăng nhập bị redirect, đăng nhập đúng mật khẩu nhận session cookie và truy cập được, đăng nhập sai mật khẩu bị từ chối (401).

**Lưu ý cho Phase 9:** biến `NEXTAUTH_URL` trong `.env` hiện đang là `http://localhost:3000`, khi deploy thật phải đổi thành `https://app.web-rtc.cloud`.

### Phase 3: Data model và thuật toán SRS (hoàn thành)
Model Deck (bộ từ, `isPublic` để phân biệt deck chung cả nhà do admin tạo hay deck riêng của từng user), Card (term, meaning, example), ReviewLog. Vì deck có thể dùng chung, `ReviewLog` lưu trạng thái SM-2 theo từng cặp (user, card) chứ không phải theo card — mỗi người trong nhà học chung một deck nhưng tiến độ ôn tập độc lập nhau.

Thuật toán SM-2 thuần hàm ở [src/lib/srs.ts](src/lib/srs.ts) (`reviewCard`), lớp truy vấn ở [src/lib/decks.ts](src/lib/decks.ts) (`getDueCards`, `submitReview`). 4 nút đánh giá trên UI (Quên/Khó/Dễ/Rất dễ) ánh xạ sang quality score 0/3/4/5 của SM-2 qua `RATING_TO_QUALITY`.

Đã viết [scripts/verify-srs.ts](scripts/verify-srs.ts) (chạy bằng `npm run verify:srs`) test trực tiếp trên database thật: tạo deck/card thật, ôn thử với nhiều mức đánh giá, kiểm tra interval/easeFactor/repetition khớp đúng công thức SM-2 chuẩn, kiểm tra thẻ quá hạn mới hiện lại trong danh sách cần ôn, dọn dữ liệu test sau khi xong. Nên giữ lại script này để chạy kiểm tra hồi quy khi sửa thuật toán ở các phase sau.

### Phase 4: Giao diện học Flashcard (mobile first) (hoàn thành)
- `/` : trang chủ liệt kê deck thấy được (của mình + deck chung public), hiện số thẻ và số thẻ cần ôn hôm nay.
- `/decks/new` : tạo deck mới.
- `/decks/[deckId]` : xem danh sách thẻ, thêm từ mới, xóa từ (chỉ chủ deck hoặc ADMIN mới sửa được, kiểm tra qua `assertCanEditDeck` trong [src/app/decks/actions.ts](src/app/decks/actions.ts)).
- `/decks/[deckId]/study` : màn hình học — Server Component lấy thẻ đến hạn (`getDueCards`), truyền vào Client Component [study-session.tsx](src/app/decks/[deckId]/study/study-session.tsx) xử lý lật thẻ và 4 nút đánh giá, gọi thẳng Server Action `submitReviewAction` (không qua form, gọi trực tiếp trong `startTransition`).
- Thêm `Header` (hiện tên user + nút đăng xuất) vào layout gốc, chỉ hiện khi đã đăng nhập.

Đã test thực tế qua curl: route lồng nhau (`/decks/new`, `/decks/[id]`) đều bị middleware chặn đúng khi chưa đăng nhập; sau khi login, tạo deck/card trực tiếp trong DB rồi curl lại `/`, `/decks/[id]`, `/decks/[id]/study` xác nhận hiển thị đúng dữ liệu (tên deck, số thẻ, số thẻ cần ôn, nội dung từng thẻ, màn hình học hiện đúng thẻ đầu tiên).

**Giới hạn đã biết:** chưa test được tương tác thật trong trình duyệt (bấm lật thẻ, bấm nút đánh giá) vì không có công cụ điều khiển trình duyệt nào đang kết nối trong phiên này — phần này chỉ được xác nhận qua đọc code và test SSR tĩnh. Nên tự mở app thử trên điện thoại/máy tính và báo lại nếu có lỗi khi bấm nút thật.

### Phase 5: Giao diện responsive cho PC
Layout rộng hơn cho desktop (sidebar điều hướng, nhiều cột), phím tắt bàn phím khi học (1-4 cho các mức đánh giá), table view để thêm/sửa từ vựng hàng loạt tiện hơn trên PC.

### Phase 6: Module Quiz ngữ pháp
Sinh câu hỏi trắc nghiệm/điền từ (có thể lấy từ Deck để tạo distractor), chấm điểm tự động, lưu lịch sử làm bài.

### Phase 7: Trang quản trị (Admin dashboard)
Route `/admin`, chỉ ADMIN truy cập (kiểm tra role qua middleware). Quản lý user, quản lý Deck/Card chung cho cả nhà, import CSV, ngân hàng câu hỏi Quiz, dashboard thống kê tiến độ từng thành viên, nút backup DB thủ công.

### Phase 8: PWA hóa cho iPhone (hoàn thành)
- [src/app/manifest.ts](src/app/manifest.ts): dùng convention có sẵn của Next.js (không cần viết route thủ công), tự động phục vụ ở `/manifest.webmanifest` và tự chèn `<link rel="manifest">`.
- Icon: [scripts/generate-icons.ts](scripts/generate-icons.ts) tự vẽ icon 192x192, 512x512, và apple-touch-icon 180x180 bằng cách thao tác pixel thô + `zlib` có sẵn của Node (không cần cài thư viện xử lý ảnh nào). Đã xác nhận cả 3 file là PNG hợp lệ, đúng kích thước bằng `System.Drawing` của Windows. Chạy lại `npx tsx scripts/generate-icons.ts` nếu muốn đổi màu/thiết kế icon.
- Meta tag trong [src/app/layout.tsx](src/app/layout.tsx): `appleWebApp` (Next.js Metadata API) tự sinh `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style`, và `mobile-web-app-capable` (tag chuẩn mới). Đã thêm thủ công qua `metadata.other` tag cũ `apple-mobile-web-app-capable` vì Next.js 16 không tự sinh tag này nữa, trong khi nó vẫn cần thiết để splash screen hoạt động trên các bản iOS trước 26.
- Service worker: dùng **Serwist** (`@serwist/turbopack`), KHÔNG dùng `next-pwa` như dự tính ban đầu vì `next-pwa` không hỗ trợ Turbopack (bundler mặc định của project này). `@serwist/turbopack` biên dịch service worker qua esbuild, không cần hook vào bundler. File nguồn ở [src/app/sw.ts](src/app/sw.ts) (cần `/// <reference lib="webworker" />` ở đầu file vì tsconfig chính dùng lib "dom", xung đột với kiểu `ServiceWorkerGlobalScope`), route handler compile ở [src/app/serwist/[path]/route.ts](src/app/serwist/[path]/route.ts), đăng ký qua `SerwistProvider` trong [src/components/providers.tsx](src/components/providers.tsx).
- Đã cập nhật `src/middleware.ts` để các đường dẫn `serwist`, `manifest.webmanifest`, `icons`, `apple-touch-icon.png` không bị chặn bởi màn hình đăng nhập.
- Đã test thực tế bằng curl: `/manifest.webmanifest`, `/icons/icon-192.png`, `/apple-touch-icon.png`, `/serwist/sw.js` đều trả về 200 kể cả khi chưa đăng nhập; đã xác nhận cả 2 meta tag `apple-mobile-web-app-capable` và `mobile-web-app-capable` đều xuất hiện trong HTML.

**Giới hạn đã biết:** chưa test được thật trên iPhone (bấm "Thêm vào màn hình chính", mở app từ icon, kiểm tra chạy standalone không hiện thanh địa chỉ) vì phiên này không có thiết bị/trình duyệt thật để thao tác. Cần tự test sau khi deploy xong Phase 9 (phải có HTTPS thật qua domain mới test được trên iPhone, Add to Home Screen không hoạt động đáng tin cậy qua `http://localhost`).

### Phase 9: Đóng gói Docker và deploy
Dockerfile cho app, docker-compose gồm app và cloudflared, deploy lên Ubuntu server nhà, kiểm tra truy cập qua domain Cloudflare từ cả iPhone và PC.

### Phase 10: Mở rộng sau MVP
Text to Speech phát âm, push notification nhắc ôn bài (iOS 16.4+ hỗ trợ Web Push cho PWA đã cài), biểu đồ thống kê chi tiết, backup tự động định kỳ.

---
Ghi chú: đánh dấu `[x]` vào phần Trạng thái mỗi khi hoàn thành một phase.

## Nhật ký kỹ thuật (ghi lại các quyết định quan trọng để phase sau không bị lặp lại vấn đề)

### Phase 1 (hoàn thành)
- Scaffold bằng `create-next-app` (App Router, TypeScript, Tailwind v4, Turbopack).
- Bản `prisma` mới nhất trên npm là `8.0.0-rc.23` (release candidate, CLI khác hẳn, hướng tới Prisma Postgres). Đã ghim về bản ổn định `7.10.1` cho cả `prisma` và `@prisma/client`.
- Prisma 7 bắt buộc dùng driver adapter khi khởi tạo `PrismaClient` (không tự đọc `DATABASE_URL` ngầm như bản cũ). Đã dùng `@prisma/adapter-better-sqlite3` (gói `PrismaBetterSqlite3`, lưu ý chữ thường "ql3" chứ không phải "QL3").
- `better-sqlite3` là native module (cần build khi cài). Khi viết Dockerfile ở Phase 9 cần image có sẵn toolchain build (hoặc dùng multi-stage build cài đặt rồi copy `node_modules` sang image runtime nhẹ hơn).
- Generator `prisma-client` xuất client ra `src/generated/prisma/client.ts` (không có `index.ts`), nên import phải là `@/generated/prisma/client`, không phải `@/generated/prisma`.
- Config Prisma nằm ở `prisma7.config.ts` (tên có số 7, do CLI tự đặt tên theo major version), không phải `prisma.config.ts`.
- File DB SQLite nằm ở gốc project: `./dev.db` (không nằm trong thư mục `prisma/`).
- Đã thêm API route `/api/health` (query `prisma.user.count()`) để vừa xác nhận pipeline DB hoạt động, vừa dùng làm healthcheck cho Docker ở Phase 9.
- Đã bỏ các thư mục `.claude/skills`, `.windsurf/skills`, `.agents/skills`, `skills-lock.json`, `AGENTS.md` mà `prisma init` tự sinh ra (tính năng đồng bộ skill cho AI agent, không cần cho dự án này).
- Repo git đã được khởi tạo tự động bởi `create-next-app` nhưng chưa có commit nào (chỉ commit khi được yêu cầu).

### Phase 2 (hoàn thành)
- NextAuth v4 ổn định (`4.24.15`), không dùng v5 (đang beta). Dùng `bcryptjs` thay vì `bcrypt` để tránh thêm native module.
- **Quan trọng — đã tắt `cacheComponents` trong `next.config.ts`:** bản scaffold mặc định của Next.js 16 bật sẵn `cacheComponents: true`, khiến Route Handler/Server Component không có dynamic API (cookies/headers) bị prerender tĩnh lúc build và đóng băng kết quả mãi mãi (phát hiện qua việc `/api/health` báo sai số user sau khi đã seed). Vì app này sau middleware gần như 100% là dữ liệu động theo từng user, đã tắt hẳn tính năng này thay vì phải nhớ gọi `connection()` ở từng route. Các phase sau (Flashcard, Quiz, Admin) không cần lo vụ cache tĩnh này nữa.
- Next.js 16 đã deprecate quy ước file `middleware.ts` (khuyến nghị đổi tên thành `proxy.ts`), hiện vẫn chạy được (chỉ có warning) nên chưa đổi, nhưng nếu sau này nâng cấp Next.js có thể cần chạy `npx @next/codemod@canary middleware-to-proxy .`
- `export { default } from "next-auth/middleware"` (cách dùng `withAuth` chuẩn của NextAuth v4) không được Next.js 16 nhận diện là function export hợp lệ. Đã viết middleware thủ công bằng `getToken` từ `next-auth/jwt` thay thế.
