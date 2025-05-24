import { scrapeInfo } from "./utils/scrapeInfo.js";

const TAGLINE = "𝗠𝗼𝗿𝗲 𝗵𝗲𝗮𝗹𝘁𝗵 𝗻𝗲𝘄𝘀 ⇢ CanadaHealthwatch.ca 🍁";

const htmlPage = /*html*/ `
<!doctype html>
<html lang="en">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Healthwatch-ifier</title>
<style>
  body {
    font-family: Calibri, system-ui, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    background: linear-gradient(135deg, #f8f9fa, #e0f7fa);
  }
  .wrap {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 900px;
    width: 100%;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }
  textarea, input, button {
    font: inherit;
  }
  textarea {
    width: 100%;
    height: 8rem;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    resize: vertical;
  }
  .label {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  input {
    width: 100%;
    padding: 0.65rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  button {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 999px;
    background: #6a5acd;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .copy-button {
    width: 100px;
    height: 100px;
    padding: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85em;
    line-height: 1.2;
    text-align: center;
  }
  .small-copy-button {
    width: 55px;
    height: 55px;
    font-size: 0.75em;
  }
  .copy-buttons-container {
    margin-top: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  .right-buttons {
    display: flex;
    gap: 0.5rem;
  }
  button:hover {
    background: #5a4abf;
  }
  button:active {
    transform: scale(0.97);
  }
  img {
    max-width: 100%;
    display: none;
    margin-top: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
</style>
<body>
  <div class="wrap">
    <div>
      <div class="label">Paste news link here</div>
      <input id="link" />
      <div style="margin-top:1rem; display: flex; gap: 0.5rem">
        <button id="go">Healthwatch-ify</button>
        <button id="copyAll" class="copy-button">Copy All</button>
      </div>
    </div>

    <div>
      <div class="label">Output</div>
      <textarea id="out"></textarea>
      <img id="preview">
      <div style="margin-top:1rem">
        <div class="label">Title</div>
        <input id="title" />
      </div>
    </div>
  </div>

  <script>
    const $ = id => document.getElementById(id);

    $("go").onclick = async () => {
      const url = $("link").value.trim();
      if (!url) return alert("Please paste a URL first!");
      $("out").value = "⏳ Fetching…";
      $("preview").style.display = "none";

      try {
        const res = await fetch("/api/healthwatchify?url=" + encodeURIComponent(url));
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        $("out").value = data.post;
        if (data.url) $("link").value = data.url;
        if (data.headline) $("title").value = data.headline;

        if (data.image) {
          $("preview").src = data.image;
          $("preview").style.display = "block";
        } else {
          $("preview").style.display = "none";
        }
      } catch (e) {
        $("out").value = "Error: " + e.message;
      }
    };

    $("copyAll").onclick = async () => {
      const button = $("copyAll");
      const items = [
        { text: $("out").value, label: "Post" },
        { text: $("title").value.trim(), label: "Title" },
        { text: $("link").value.trim(), label: "Link" }
      ];

      for (const [index, item] of items.entries()) {
        if (!item.text) continue;
        
        // Copy the current item
        await navigator.clipboard.writeText(item.text);
        
        // Show feedback
        button.textContent = \`\${item.label} Copied!\`;
        
        // If not the last item, wait before proceeding
        if (index < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 850));
        }
      }

      // Try to copy image if available
      const img = $("preview");
      if (img.src && img.style.display !== "none") {
        await new Promise(resolve => setTimeout(resolve, 850));
        button.textContent = "Copying Image...";
        
        try {
          // Create a new image to handle cross-origin
          const tempImg = new Image();
          tempImg.crossOrigin = "anonymous";
          
          // Create a proxied URL to bypass CORS
          const proxyUrl = "/api/proxy-image?url=" + encodeURIComponent(img.src);
          
          // Wait for the image to load
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            tempImg.src = proxyUrl;
          });

          // Create a canvas and draw the image
          const canvas = document.createElement("canvas");
          canvas.width = tempImg.naturalWidth;
          canvas.height = tempImg.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(tempImg, 0, 0);
          
          // Get the image as a blob
          const blob = await new Promise(resolve => canvas.toBlob(resolve));
          
          // Copy to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          
          button.textContent = "Image Copied!";
        } catch (e) {
          console.error("Failed to copy image:", e);
          button.textContent = "Image Failed!";
        }
      }

      // Reset button text after all operations
      setTimeout(() => button.textContent = "Copy All", 1500);
    };
  </script>
</body>
</html>
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response(htmlPage, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/healthwatchify") {
      const target = url.searchParams.get("url");
      if (!target) {
        return new Response(JSON.stringify({ error: "Missing URL" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      try {
        const { headline, image, url: cleanUrl } = await scrapeInfo(target);
        const post = `${headline}\n${cleanUrl}\n\n${TAGLINE}`;
        return new Response(
          JSON.stringify({ post, image, url: cleanUrl, headline }),
          { headers: { "content-type": "application/json" } },
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || String(err) }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/proxy-image") {
      const imageUrl = url.searchParams.get("url");
      if (!imageUrl) {
        return new Response("Missing URL", { status: 400 });
      }
      
      try {
        const response = await fetch(imageUrl);
        const contentType = response.headers.get("content-type");
        
        return new Response(response.body, {
          headers: {
            "content-type": contentType,
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response("Failed to proxy image", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};