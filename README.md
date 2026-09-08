# Mực — blog của Thông

Trang tĩnh, không backend, chạy trên GitHub Pages.

- `index.html` — trang chủ
- `post.html?p=<slug>` — trang đọc bài
- `admin.html` — đăng nhập bằng GitHub token, viết và đăng thẳng lên prod
- `content/posts.json` — mục lục
- `content/posts/*.md` — nội dung từng bài

## Viết bài

Mở `/admin.html` trên site đã deploy, dán fine-grained personal access token
có quyền **Contents: Read and write** trên đúng repo này. Bấm *Đăng lên prod*
là nội dung được commit thẳng vào `main`; GitHub Pages build lại sau khoảng 30–60 giây.

Token chỉ lưu trong trình duyệt của bạn (localStorage) và chỉ gửi tới `api.github.com`.

## Chữ

- Tiêu đề và thân bài: **Newsreader** — có đủ bộ dấu tiếng Việt
- Giao diện: **Be Vietnam Pro** — thiết kế riêng cho dấu tiếng Việt
- Nhãn và số liệu: **JetBrains Mono**
