import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Hello World worker', () => {
	it('responds with Hello World! (unit style)', async () => {
		const request = new Request('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('http://example.com');
		expect(await response.text()).toMatchInlineSnapshot(`
			"
			<!doctype html>
			<html lang="en">
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>Healthwatch-ifier</title>
			<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&family=Rubik:wght@500&display=swap" rel="stylesheet">
			<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
			<style>
			  body {
			    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
			    display: flex;
			    justify-content: center;
			    align-items: center;
			    min-height: 100vh;
			    margin: 0;
			    background: linear-gradient(135deg, #1a1b1f, #2d2b3a);
			    color: #e9ecef;
			  }
			  .wrap {
			    display: flex;
			    flex-direction: column;
			    gap: 1.75rem;
			    max-width: 900px;
			    width: 100%;
			    margin: 1rem;
			    background: #2a2b2f;
			    border-radius: 24px;
			    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
			    padding: 2rem;
			    min-height: 600px;
			  }
			  .content-area {
			    display: flex;
			    flex-direction: column;
			    gap: 1.75rem;
			    flex: 1;
			  }
			  .input-section {
			    margin-bottom: 2rem;
			  }
			  textarea, input {
			    width: 100%;
			    padding: 0.75rem;
			    border: 2px solid #3d3d47;
			    border-radius: 16px;
			    background: #1a1b1f;
			    color: #e9ecef;
			    font-family: inherit;
			    font-size: 1rem;
			    transition: all 0.2s ease;
			    resize: vertical;
			  }
			  textarea:focus, input:focus {
			    outline: none;
			    border-color: #8b5cf6;
			    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
			  }
			  textarea {
			    min-height: 8rem;
			  }
			  .label {
			    font-weight: 600;
			    margin-bottom: 0.5rem;
			    color: #8b5cf6;
			    text-transform: uppercase;
			    letter-spacing: 0.5px;
			    font-size: 0.9rem;
			  }
			  .button-group {
			    display: flex;
			    justify-content: center;
			    gap: 1.5rem;
			    margin-top: 1.5rem;
			    position: sticky;
			    bottom: 2rem;
			  }
			  button {
			    width: 160px;
			    height: 160px;
			    border: none;
			    border-radius: 50%;
			    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
			    color: white;
			    font-family: 'Rubik', sans-serif;
			    font-weight: 500;
			    font-size: 1.25rem;
			    cursor: pointer;
			    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			    display: flex;
			    align-items: center;
			    justify-content: center;
			    text-align: center;
			    padding: 1rem;
			    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
			  }
			  button:hover {
			    transform: translateY(-4px) scale(1.02);
			    background: linear-gradient(135deg, #9061ff, #8b5cf6);
			    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
			  }
			  button:active {
			    transform: translateY(0) scale(0.98);
			  }
			  #copyAll {
			    background: linear-gradient(135deg, #7c3aed, #6d28d9);
			  }
			  #copyAll:hover {
			    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
			  }
			  img {
			    max-width: 100%;
			    display: none;
			    margin-top: 1rem;
			    border-radius: 16px;
			    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
			  }
			  .output-group {
			    opacity: 0;
			    pointer-events: none;
			    transition: opacity 0.3s ease;
			  }
			  .output-group.visible {
			    opacity: 1;
			    pointer-events: auto;
			  }
			  ::placeholder {
			    color: #4a4a57;
			  }
			  @media (max-width: 600px) {
			    .wrap {
			      margin: 0;
			      border-radius: 0;
			      min-height: 100vh;
			    }
			    .button-group {
			      flex-direction: column;
			      align-items: center;
			      position: fixed;
			      bottom: 2rem;
			      left: 0;
			      right: 0;
			      background: linear-gradient(0deg, rgba(42, 43, 47, 1) 0%, rgba(42, 43, 47, 0.9) 90%, rgba(42, 43, 47, 0));
			      padding: 2rem;
			      margin: 0;
			    }
			    button {
			      width: 140px;
			      height: 140px;
			      font-size: 1.2rem;
			    }
			  }
			</style>
			<body>
			  <div class="wrap">
			    <div class="content-area">
			      <div class="input-section">
			        <div class="label">Paste news link here</div>
			        <input id="link" placeholder="https://..." />
			      </div>

			      <div class="output-group">
			        <div class="label">Output</div>
			        <textarea id="out" placeholder="Formatted content will appear here..."></textarea>
			        <img id="preview" alt="">
			        <div class="label">Title</div>
			        <input id="title" placeholder="Article title will appear here..." />
			      </div>
			    </div>

			    <div class="button-group">
			      <button id="go">Healthwatch-ify</button>
			      <button id="copyAll">Copy All</button>
			    </div>
			  </div>

			  <script>
			    const $ = id => document.getElementById(id);
			    const outputGroup = document.querySelector('.output-group');

			    // Show output group initially with 0 opacity
			    outputGroup.style.display = 'block';

			    $("go").onclick = async () => {
			      const url = $("link").value.trim();
			      if (!url) return alert("Please paste a URL first!");
			      
			      // Reset output and show loading state
			      $("out").value = "⏳ Fetching…";
			      $("preview").style.display = "none";
			      $("out").style.opacity = 0.5;
			      outputGroup.classList.remove('visible');
			      
			      // Animate button shine effect
			      const shine = document.createElement('div');
			      shine.className = 'button-shine';
			      $("go").appendChild(shine);
			      gsap.to(shine, {
			        left: "200%",
			        duration: 1,
			        ease: "power2.inOut",
			        onComplete: () => shine.remove()
			      });

			      try {
			        const res = await fetch("/api/healthwatchify?url=" + encodeURIComponent(url));
			        const data = await res.json();
			        if (data.error) throw new Error(data.error);

			        // Create success ripple effect
			        const ripple = document.createElement('div');
			        ripple.className = 'success-ripple';
			        document.body.appendChild(ripple);

			        // Animate success sequence
			        const tl = gsap.timeline();
			        
			        // Ripple effect
			        tl.to(ripple, {
			          width: "300vmax",
			          height: "300vmax",
			          x: "-50%",
			          y: "-50%",
			          duration: 0.8,
			          ease: "power2.out"
			        })
			        .to(ripple, {
			          opacity: 0,
			          duration: 0.3,
			          onComplete: () => ripple.remove()
			        }, "-=0.2");

			        // Fade in and slide up content
			        outputGroup.classList.add('visible');
			        
			        tl.to(outputGroup, {
			          opacity: 1,
			          y: 0,
			          duration: 0.5,
			          ease: "back.out(1.4)"
			        }, "-=0.4");

			        // Set content
			        $("out").value = data.post;
			        $("out").style.opacity = 1;
			        if (data.url) $("link").value = data.url;
			        if (data.headline) $("title").value = data.headline;

			        // Animate image if present
			        if (data.image) {
			          $("preview").src = data.image;
			          $("preview").style.display = "block";
			          $("preview").style.opacity = 0;
			          $("preview").style.transform = "scale(0.95)";
			          
			          tl.to($("preview"), {
			            opacity: 1,
			            scale: 1,
			            duration: 0.4,
			            ease: "power2.out"
			          }, "-=0.2");
			        } else {
			          $("preview").style.display = "none";
			        }

			      } catch (e) {
			        $("out").value = "Error: " + e.message;
			        gsap.to($("out"), {
			          keyframes: [
			            { x: -10 },
			            { x: 10 },
			            { x: -10 },
			            { x: 10 },
			            { x: 0 }
			          ],
			          duration: 0.4,
			          ease: "power1.inOut"
			        });
			        outputGroup.classList.add('visible');
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
			        
			        // Show feedback with animation
			        button.textContent = item.label + " Copied!";
			        gsap.to(button, {
			          scale: 1.05,
			          duration: 0.2,
			          ease: "back.out(2)",
			          yoyo: true,
			          repeat: 1
			        });
			        
			        // Add a subtle glow effect
			        const glow = document.createElement('div');
			        glow.style.cssText = 
			          'position: absolute;' +
			          'inset: -3px;' +
			          'background: radial-gradient(circle at center, rgba(139, 92, 246, 0.2), transparent);' +
			          'border-radius: inherit;' +
			          'pointer-events: none;' +
			          'opacity: 0;';
			        button.appendChild(glow);
			        
			        gsap.to(glow, {
			          opacity: 1,
			          duration: 0.2,
			          yoyo: true,
			          repeat: 1,
			          onComplete: () => glow.remove()
			        });
			        
			        // If not the last item, wait before proceeding
			        if (index < items.length - 1) {
			          await new Promise(resolve => setTimeout(resolve, 510));
			        }
			      }

			      // Try to copy image if available
			      const img = $("preview");
			      if (img.src && img.style.display !== "none") {
			        await new Promise(resolve => setTimeout(resolve, 510));
			        button.textContent = "Copying Image...";
			        
			        try {
			          const proxyUrl = "/api/proxy-image?url=" + encodeURIComponent(img.src);
			          console.log("Fetching image from:", proxyUrl);
			          
			          const response = await fetch(proxyUrl);
			          console.log("Response status:", response.status);
			          console.log("Response headers:", Object.fromEntries(response.headers.entries()));
			          
			          if (!response.ok) {
			            throw new Error("Failed to fetch image: " + response.status);
			          }

			          const blob = await response.blob();
			          console.log("Blob type:", blob.type);
			          console.log("Blob size:", blob.size);
			          
			          const item = {};
			          item[blob.type] = blob;
			          
			          console.log("Attempting to write to clipboard:", item);
			          await navigator.clipboard.write([new ClipboardItem(item)]);
			          
			          button.textContent = "Image Copied!";
			          gsap.to(button, {
			            scale: 1.05,
			            duration: 0.2,
			            ease: "back.out(2)",
			            yoyo: true,
			            repeat: 1
			          });
			        } catch (e) {
			          console.error("Failed to copy image:", e);
			          console.error("Error details:", {
			            name: e.name,
			            message: e.message,
			            stack: e.stack
			          });
			          button.textContent = "Image Failed!";
			          gsap.to(button, {
			            keyframes: [
			              { rotate: -2 },
			              { rotate: 2 },
			              { rotate: -2 },
			              { rotate: 2 },
			              { rotate: 0 }
			            ],
			            duration: 0.3,
			            ease: "power1.inOut"
			          });
			        }
			      }

			      // Reset button text after all operations
			      setTimeout(() => {
			        button.textContent = "Copy All";
			        gsap.to(button, {
			          scale: 1,
			          duration: 0.2,
			          ease: "power1.out"
			        });
			      }, 1500);
			    };
			  </script>
			</body>
			</html>
			"
		`);
	});
});
