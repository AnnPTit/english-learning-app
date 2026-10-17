# Kế hoạch: Web App Học Tiếng Anh (PWA, self-host)

Bối cảnh: dùng cho cá nhân/gia đình, truy cập được từ cả iPhone (cài lên màn hình chính như app) và PC qua trình duyệt thường. Server tự host trên Ubuntu tại nhà, expose ra internet qua Cloudflare Tunnel.

Tech stack: Next.js (App Router, TypeScript) + Tailwind CSS + Prisma + SQLite + NextAuth (Credentials) + Serwist (`@serwist/turbopack`, không dùng next-pwa vì không tương thích Turbopack). Đóng gói bằng Docker, deploy bằng docker-compose (chỉ service app — cloudflared chạy sẵn dạng systemd trên host, xem Phase 0).

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
- [x] Phase 9: Đóng gói Docker và deploy lên Ubuntu — đã deploy thật, test trên iPhone xác nhận cài PWA và chạy toàn màn hình thành công
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
Chỉ có docker-compose cho **app** (không có service cloudflared), vì ở Phase 0 đã xác định tunnel Cloudflare chạy dạng systemd service trực tiếp trên host, không phải Docker — app chỉ cần publish đúng port `3001:3000` ra host để khớp route đã cấu hình.

- [Dockerfile](Dockerfile): multi-stage build trên base image `node:22-bookworm-slim` (Debian, không dùng Alpine) vì `better-sqlite3` là native module, Debian/glibc có khả năng cao hơn tải được prebuilt binary thay vì phải tự biên dịch trên con chip ARM yếu của TV box; nếu không có prebuilt binary thì vẫn có `python3 make g++` trong stage build để tự compile. Stage cuối copy toàn bộ `node_modules` (kể cả devDependencies) thay vì dùng Next.js `output: standalone`, vì cơ chế tracing file của standalone mode không đáng tin cậy với native module — đổi lấy image to hơn một chút để tránh thiếu dependency lúc chạy thật.
- [docker-compose.yml](docker-compose.yml): map `./data:/app/data` để file SQLite không mất khi container restart/update, `DATABASE_URL` trỏ vào `/app/data/prod.db`. Container chạy as root (không tạo non-root user) để tránh vấn đề quyền ghi vào bind mount từ host — chấp nhận đánh đổi này vì đây là app cá nhân/gia đình sau Cloudflare Tunnel, không phải dịch vụ public đa người dùng.
- Container tự chạy `prisma migrate deploy` trước khi start mỗi lần container khởi động (an toàn, idempotent). Lệnh `prisma db seed` KHÔNG tự chạy — phải chạy tay một lần sau khi deploy để tránh seed lại dữ liệu ngoài ý muốn.
- [.env.production.example](.env.production.example): template cho file `.env.production` thật sẽ tạo trên server (không commit), gồm `DATABASE_URL`, `NEXTAUTH_SECRET` (phải tạo secret mới, không dùng lại bản dev), `NEXTAUTH_URL=https://app.web-rtc.cloud`, `SEED_USERS`.

**Giới hạn đã biết:** không test build Docker được ngay trên máy đang code (Docker Desktop không khởi động được, WSL2 backend bị dừng — khả năng do môi trường sandbox phiên này không hỗ trợ nested virtualization). Đã bù lại bằng cách: review kỹ logic Dockerfile, và chạy `docker compose config` (không cần daemon) để xác nhận cú pháp docker-compose.yml hợp lệ, resolve đúng toàn bộ biến môi trường và volume. YAML của GitHub Actions workflow cũng đã validate bằng `python -c "import yaml..."`.

#### Cập nhật kiến trúc deploy: build qua GitHub Actions thay vì build trên server

Theo cùng mẫu [.github/workflows/main.yml của repo webrtc-angular](https://github.com/AnnPTit/webrtc-angular/blob/main/.github/workflows/main.yml) đang dùng cho các app khác, đã đổi sang: GitHub Actions build + push image lên Docker Hub (namespace `anptit2003`, dùng QEMU + Buildx để build `linux/arm64` ngay trên runner `ubuntu-latest`), server chỉ việc `docker compose pull` thay vì tự build. Lý do đổi: nhất quán với quy trình CI/CD sẵn có, và né được việc build native module (`better-sqlite3`) trên con chip ARM yếu của TV box mỗi lần deploy.

- [.github/workflows/main.yml](.github/workflows/main.yml): trigger khi push vào `main`, build + push 2 tag (`latest` và tag theo `github.sha`), sau đó gọi một webhook để server tự deploy (bước "Trigger deploy on server", giống repo webrtc-angular).
- [docker-compose.yml](docker-compose.yml) đã đổi `build: .` thành `image: anptit2003/english-learning-app:latest`.
- **Cần bạn tự thiết lập (tôi không có thông tin/quyền truy cập):**
  - Secrets trong GitHub repo này: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (giống repo webrtc-angular), và `DEPLOY_WEBHOOK_URL` + `DEPLOY_WEBHOOK_TOKEN` cho endpoint deploy riêng của app này (webrtc-angular dùng `deploy.web-rtc.cloud/hooks/deploy-frontend`, app này cần một endpoint khác, ví dụ `deploy.web-rtc.cloud/hooks/deploy-english-app`, trỏ tới script chạy `docker compose pull && docker compose up -d` cho đúng thư mục project trên server).
  - File `Dockerfile` vẫn giữ nguyên (CI dùng chính Dockerfile này để build), không cần sửa gì thêm trừ khi muốn tối ưu thêm sau này.

#### Hướng dẫn deploy (chạy trên server Ubuntu, một lần đầu tiên)

**Quan trọng: KHÔNG git clone cả repo lên server.** Vì image đã được build sẵn và push lên Docker Hub qua CI, server chỉ cần đúng 2 file nhỏ (`docker-compose.yml` và `.env.production`), không cần source code — tiết kiệm dung lượng ROM vốn rất hạn chế của con TV box này. Đây cũng chính là cách các app khác (webrtc-angular, v.v.) đang được deploy: chỉ có một `docker-compose.yml` chung tại `/root/hass/portainer/compose/1`, server không giữ source code của app nào cả.

```bash
mkdir -p /root/english-learning-app
cd /root/english-learning-app

# Tạo docker-compose.yml y hệt file trong repo (copy nội dung từ docker-compose.yml)
nano docker-compose.yml

# Tạo .env.production, điền giá trị thật (NEXTAUTH_SECRET tạo bằng: openssl rand -base64 32)
nano .env.production

# Pull image đã build sẵn từ Docker Hub và chạy
docker compose pull
docker compose up -d

# Theo dõi log, đảm bảo migration chạy xong và server start thành công
docker compose logs -f app

# Seed tài khoản gia đình (chỉ chạy một lần)
docker compose exec app npx prisma db seed

# Kiểm tra health check ngay trên server
curl http://localhost:3001/api/health
```

Sau đó mở `https://app.web-rtc.cloud` từ trình duyệt để kiểm tra từ bên ngoài, thử đăng nhập, và trên iPhone thử bấm Share → "Thêm vào MH chính" để test PWA thật.

Từ lần sau, mỗi khi push code mới vào `main`, GitHub Actions tự build + push image + gọi webhook `deploy-english-app` (xem bên dưới) để server tự `pull` và `up -d` lại tại `/root/english-learning-app` — không cần thao tác tay trên server nữa.

#### Webhook tự động deploy

Server đã có sẵn `webhook` (adnanh/webhook) chạy như systemd service, cấu hình tại `/opt/webhook/hooks.json`, nghe ở port `9001` (Cloudflare Tunnel route `deploy.web-rtc.cloud/hooks/*` đã trỏ sẵn, dùng chung cho các app khác). Đã thêm hook mới `deploy-english-app`:

- Script: `/opt/webhook/deploy-english-app.sh` — chạy `cd /root/english-learning-app && docker compose pull && docker compose up -d && docker image prune -f`
- Trigger qua header `Authorization: Bearer <token>`, token lưu trong GitHub Secret `DEPLOY_WEBHOOK_TOKEN`
- URL gọi từ GitHub Actions: `https://deploy.web-rtc.cloud/hooks/deploy-english-app` (GitHub Secret `DEPLOY_WEBHOOK_URL`)

**Lưu ý bảo mật:** trong lúc setup, token Docker Hub và các token Bearer của `hooks.json` từng bị dán vào chat (ảnh chụp màn hình, nội dung file). Nên thu hồi/tạo mới các token này sau khi mọi thứ đã chạy ổn định, để tránh rủi ro vì các token đó đã nằm trong lịch sử chat.

**Bài học khi setup thật:** `docker compose restart` KHÔNG nạp lại biến môi trường mới trong `.env.production` (chỉ khởi động lại đúng container cũ với env cũ) — phải dùng `docker compose up -d` để container được tạo lại với env mới. Gặp đúng lỗi này khi đổi `SEED_USERS` mà đăng nhập vẫn báo sai.

## Thiết kế lại giao diện (sau khi deploy thành công)

Sau khi xác nhận app chạy ổn trên production, đã thiết kế lại toàn bộ UI cho đẹp và chuyên nghiệp hơn bản MVP ban đầu (vốn chỉ có border đen trắng đơn giản). Design system áp dụng, các phase sau (5, 6, 7) nên theo đúng quy ước này để nhất quán:

- **Màu sắc:** brand color `#4f46e5` (indigo-600, khớp với màu trong manifest/icon PWA đã tạo ở Phase 8), định nghĩa qua CSS variable `--brand`/`--brand-dark` và Tailwind `@theme inline` trong [globals.css](src/app/globals.css) — dùng `bg-brand`, `text-brand-dark` thay vì hardcode `indigo-600`. Nền trang màu `#f8fafc` (slate-50) thay vì trắng tinh, tạo chiều sâu nhẹ.
- **Đã bỏ dark mode tự động** (media query `prefers-color-scheme`) vì các component chưa có biến thể dark, tránh tình trạng nửa sáng nửa tối khó đọc. Chỉ có một theme sáng duy nhất cho toàn bộ app.
- **Icon:** dùng thư viện `lucide-react` (nhẹ, tree-shakeable, nét line rõ ràng hợp với phong cách tối giản).
- **Card pattern:** `rounded-2xl border border-indigo-950/5 bg-white p-4 shadow-sm shadow-indigo-950/5` — dùng lại pattern này cho mọi khối nội dung (deck card, form, danh sách thẻ) để đồng bộ.
- **Button pattern:** nút chính `rounded-xl bg-brand ... shadow-sm shadow-indigo-300 hover:bg-brand-dark`, nút phụ dạng ghost/icon-only với hover nhẹ `hover:bg-indigo-50`.
- **Input pattern:** `rounded-xl border border-indigo-950/10 ... focus:border-brand focus:ring-2 focus:ring-brand/20`.
- **Màn hình học flashcard** ([study-session.tsx](src/app/decks/[deckId]/study/study-session.tsx)): thêm hiệu ứng lật thẻ 3D thật (CSS `transform-style: preserve-3d` + `rotateY`, định nghĩa trong `globals.css` bằng class `.flip-card-inner`/`.flip-card-face`), thanh progress bar hiển thị tiến độ phiên học, 4 nút đánh giá đổi từ nút màu đặc sang nền nhạt + icon (X/Frown/Smile/Sparkle) cho tinh tế hơn.
- Đã test lại toàn bộ qua curl với dữ liệu thật sau khi redesign (trang chủ, chi tiết deck, màn hình học đều render đúng nội dung), và chạy lại `npm run verify:srs` xác nhận logic SRS không bị ảnh hưởng.

**Giới hạn đã biết:** không có công cụ xem trước trình duyệt nào kết nối trong phiên này (thử dùng Claude Preview nhưng bị chặn bởi bộ lọc an toàn khi tạo file cấu hình `.claude/launch.json`), nên chưa tự mắt thấy được hiệu ứng lật thẻ 3D và các animation hover chạy mượt thế nào — chỉ xác nhận được cấu trúc HTML/class đúng qua curl. Cần tự mở app thật để đánh giá cảm quan cuối cùng.

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
