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
      align-items: center;
    }
    .publication-badge, .authors-badge, .paywall-badge {
      display: none;
      align-items: center;
      gap: 0.5rem;
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
    .publication-badge.visible, .authors-badge.visible, .paywall-badge.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .paywall-badge {
      order: 3;
    }
    .paywall-badge.paywall-free {
      background: #1a472a;
      border-color: #2d6a4f;
      color: #4ade80;
    }
    .paywall-badge.paywall-locked {
      background: #471a1a;
      border-color: #6a2d2d;
      color: #de4a4a;
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
        <button id="go" title="Press Enter to activate">
          Healthwatch-ify
          <span class="kbd-hint">↵</span>
        </button>
        <button id="copyAll" title="Press Ctrl+Q to activate">
          Copy All
          <span class="kbd-hint">⌃Q</span>
        </button>
      </div>
      <div class="output-group">
        <div class="badge-container">
          <div id="publication" class="publication-badge">
            <span class="publication-name"></span>
            <span class="article-type"></span>
          </div>
          <div id="authors" class="authors-badge">
            <span class="authors-list"></span>
          </div>
          <div id="paywall" class="paywall-badge">
            <span class="paywall-status"></span>
          </div>
        </div>
        <div class="label">Title</div>
        <input type="text" id="title" />
        <div class="label output-label">Output</div>
        <textarea id="out"></textarea>
        <div class="label caption-label">Image Caption</div>
        <input type="text" id="caption" placeholder="Image caption will appear here..." />
        <img id="preview" alt="Article preview" />
      </div>
    </div>
  </div>
  <script>${script}</script>
</body>
</html>
`; 