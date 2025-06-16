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
    .button-group {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      gap: 0;
      position: relative;
      z-index: 10; /* Ensure buttons stay above other content */
    }

    /* Primary buttons container */
    .button-group .primary-buttons {
      display: flex;
      gap: 18px;
      margin-right: 37px;
    }
    
    /* Social buttons container */
    .button-group .social-buttons {
      display: flex;
      gap: 0.75rem;
    }
    
    .button-group button {
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    
    /* Primary action buttons (Healthwatch-ify and Copy All) */
    .button-group button:not([id$="Button"]) {
      background: #8b5cf6;
      color: white;
      border: none;
      font-weight: 500;
      padding: 1.25rem 1.0rem; /* Increased vertical padding */
      min-width: 103px;
      height: 90px; /* Taller, but not quite square */
    }
    
    .button-group button:not([id$="Button"]):hover {
      background: #7c3aed;
      transform: translateY(-6px);
    }
    
    /* Social posting buttons */
    .button-group button[id$="Button"] {
      border-radius: 999px;
      padding: 0.875rem 1.25rem;
      min-width: 105px;
      height: 61px; /* Slightly taller */
      font-size: 0.9275rem;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.2);
      color: #8b5cf6;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
    }
    
    .button-group button[id$="Button"]:hover:not(:disabled) {
      background: rgba(139, 92, 246, 0.2);
      border-color: rgba(139, 92, 246, 0.3);
      transform: translateY(-6px);
    }
    
    .button-group button[id$="Button"]:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
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
    .paywall-badge {
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    .paywall-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .article-type:hover {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      transform: translateY(-1px);
    }
    .authors-list {
      color: #6d6d7d;
      font-size: 0.875rem;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      padding: 2px 4px;
      border-radius: 4px;
      min-width: 60px;
      display: inline-block;
    }
    .authors-list:hover {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      transform: translateY(-1px);
    }
    .image-container {
      position: relative;
      display: inline-block;
      width: 100%;
      z-index: 1; /* Keep images below the buttons */
    }
    .remove-image-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 20;
    }
    .remove-image-btn:hover {
      background: rgba(220, 38, 38, 0.8);
      transform: scale(1.1);
    }
    .add-image-placeholder {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 120px;
      border: 2px dashed #3d3d47;
      border-radius: 12px;
      background: #1a1a1f;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }
    .add-image-placeholder:hover {
      border-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.05);
    }
    .add-icon {
      font-size: 24px;
      color: #6d6d7d;
      margin-bottom: 4px;
      transition: color 0.2s ease;
    }
    .add-text {
      font-size: 14px;
      color: #6d6d7d;
      transition: color 0.2s ease;
    }
    .add-image-placeholder:hover .add-icon,
    .add-image-placeholder:hover .add-text {
      color: #8b5cf6;
    }
    /* Add responsive adjustments for mobile */
    @media (max-width: 768px) {
      .button-group {
        margin-bottom: 1.5rem; /* Add more space below buttons on mobile */
      }

      .button-group .primary-buttons,
      .button-group .social-buttons {
        flex-wrap: nowrap; /* Prevent button wrapping on mobile */
        overflow-x: auto; /* Allow horizontal scrolling if needed */
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.5rem; /* Add space for potential scroll bar */
      }

      .button-group .primary-buttons {
        margin-bottom: 1rem; /* Space between primary and social buttons on mobile */
      }
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
        <div class="primary-buttons">
          <button id="go" title="Press Enter to activate">
            Healthwatch-ify
            <span class="kbd-hint">↵</span>
          </button>
          <button id="copyAll" title="Press Ctrl+Q to activate">
            Copy All
            <span class="kbd-hint">⌃Q</span>
          </button>
        </div>
        <div class="social-buttons">
          <button id="threadsButton" onclick="postToThreads()" title="Post to Threads" disabled style="display: none;">
            🧵 Post to Threads
          </button>
          <button id="blueskyButton" onclick="postToBluesky()" title="Post to Bluesky" disabled>
            🦋 Post to Bluesky
          </button>
          <button id="linkedinButton" onclick="postToLinkedIn()" title="Post to LinkedIn" disabled style="display: none;">
            💼 Post to LinkedIn
          </button>
          <button id="mastodonButton" onclick="postToMastodon()" title="Post to Mastodon" disabled>
            🐘 Post to Mastodon
          </button>
        </div>
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
        <div class="image-container">
        <img id="preview" alt="Article preview" />
          <button id="removeImage" class="remove-image-btn" title="Remove image">×</button>
          <div id="addImagePlaceholder" class="add-image-placeholder" title="Click to add image from clipboard">
            <span class="add-icon">+</span>
            <span class="add-text">Add Image</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>${script}</script>
</body>
</html>
`; 