export const htmlTemplate = ({ styles, script }) => /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthwatch-ifier</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Rubik:wght@500&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <style>
    ${styles}
    .publication-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: #2a2b2f;
      border: 1px solid #3d3d47;
      border-radius: 12px;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      color: #8b5cf6;
      margin-bottom: 1rem;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    }
    .publication-badge.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .publication-badge svg {
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
        <div id="publication" class="publication-badge" style="display: none;">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L1 21h22L12 2zm0 3.45l6.52 11.33H5.48L12 5.45z"/>
          </svg>
          <span class="publication-name"></span>
          <div class="badge-divider"></div>
          <span class="article-type"></span>
        </div>
        <div class="label">Title</div>
        <input type="text" id="title" readonly />
        <div class="label">Output</div>
        <textarea id="out" readonly></textarea>
        <img id="preview" alt="Article preview" />
      </div>
    </div>
  </div>
  <script>${script}</script>
</body>
</html>
`; 