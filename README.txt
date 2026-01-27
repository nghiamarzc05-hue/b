# Học đa ngôn ngữ (Flashcard) — Static web app

## Chạy trên máy (không cần cài gì)
- Mở `index.html` trực tiếp **hoặc** (khuyến nghị) dùng server tĩnh:
  - VS Code: cài extension “Live Server” → Right click `index.html` → Open with Live Server.

## Deploy GitHub Pages / Cloudflare Pages
- Upload toàn bộ thư mục dự án.
- Entry: `index.html` (không có backend).

## Dữ liệu mặc định
- `data/default-pack.en-US.json` (gói tiếng Anh khởi động)
- 8 chủ đề, 223 mục.

## Nhập dữ liệu
- Tab **Nhập/Xuất** → chọn tệp → **Nhập (Gộp)** hoặc **Nhập (Thay thế)**.
- JSON: theo mẫu `data/mau-tai-len.json`.
- CSV: yêu cầu tối thiểu các cột: `term, meaning_vi, example, example_vi` (cột `topic`/`topicId` khuyến nghị).

## Lưu trữ
- Dữ liệu và tiến độ lưu trong `localStorage` trên trình duyệt.
