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
  <style>${styles}</style>
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