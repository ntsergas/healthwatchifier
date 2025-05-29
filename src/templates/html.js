export const htmlTemplate = ({ styles, script }) => /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthwatch-ifier</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNiZTFhYzEiIHN0cm9rZS13aWR0aD0iMi4yNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1zcGFya2xlcy1pY29uIGx1Y2lkZS1zcGFya2xlcyI+PHBhdGggZD0iTTkuOTM3IDE1LjVBMiAyIDAgMCAwIDguNSAxNC4wNjNsLTYuMTM1LTEuNTgyYS41LjUgMCAwIDEgMC0uOTYyTDguNSA5LjkzNkEyIDIgMCAwIDAgOS45MzcgOC41bDEuNTgyLTYuMTM1YS41LjUgMCAwIDEgLjk2MyAwTDE0LjA2MyA4LjVBMiAyIDAgMCAwIDE1LjUgOS45MzdsNi4xMzUgMS41ODFhLjUuNSAwIDAgMSAwIC45NjRMMTUuNSAxNC4wNjNhMiAyIDAgMCAwLTEuNDM3IDEuNDM3bC0xLjU4MiA2LjEzNWEuNS41IDAgMCAxLS45NjMgMHoiLz48cGF0aCBkPSJNMjAgM3Y0Ii8+PHBhdGggZD0iTTIyIDVoLTQiLz48cGF0aCBkPSJNNCAxN3YyIi8+PHBhdGggZD0iTTUgMThIMyIvPjwvc3ZnPg==">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Rubik:wght@500&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    ${styles}
    .badge-container {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .publication-badge, .authors-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: #2a2b2f;
      border: 1px solid #3d3d47;
      border-radius: 12px;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      color: #8b5cf6;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    }
    .publication-badge.visible, .authors-badge.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .publication-badge svg, .authors-badge svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .badge-divider {
      width: 1px;
      height: 16px;
      background: #3d3d47;
      margin: 0 0.25rem;
    }
    .article-type {
      color: #6d6d7d;
      text-transform: capitalize;
      font-size: 0.875rem;
    }
    .authors-list {
      color: #6d6d7d;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="content-area">
      <div class="input-section">
        <div class="label">Article URL</div>
        <input type="url" id="link" placeholder="Paste a news article URL here..." />
      </div>
      <div class="button-group">
        <button id="go">Healthwatch-ify</button>
        <button id="copyAll">Copy All</button>
      </div>
      <div class="output-group">
        <div class="badge-container">
          <div id="publication" class="publication-badge" style="display: none;">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 3.45l6.52 11.33H5.48L12 5.45z"/>
            </svg>
            <span class="publication-name"></span>
            <div class="badge-divider"></div>
            <span class="article-type"></span>
          </div>
          <div id="authors" class="authors-badge" style="display: none;">
            <svg viewBox="0 0 24 24">
              <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm6 10a7 7 0 0 0-14 0"/>
            </svg>
            <span class="authors-list"></span>
          </div>
        </div>
        <div class="label">Title</div>
        <input type="text" id="title" />
        <div class="label">Output</div>
        <textarea id="out"></textarea>
        <img id="preview" alt="Article preview" />
      </div>
    </div>
  </div>
  <script>${script}</script>
</body>
</html>
`; 