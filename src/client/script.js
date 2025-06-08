export const clientScript = /*javascript*/ `
  const $ = id => document.getElementById(id);
  const outputGroup = document.querySelector('.output-group');
  const publicationBadge = $("publication");
  const publicationName = publicationBadge.querySelector('.publication-name');
  const articleType = publicationBadge.querySelector('.article-type');
  const authorsBadge = $("authors");
  const authorsList = authorsBadge.querySelector('.authors-list');
  const paywallBadge = $("paywall");
  const paywallStatus = paywallBadge.querySelector('.paywall-status');

  // URL sanitization function
  function sanitizeUrl(input) {
    try {
      const u = new URL(input);
      for (const key of Array.from(u.searchParams.keys())) {
        const lower = key.toLowerCase();
        if (
          lower.startsWith("utm_") ||
          lower === "cmp" ||
          lower === "fbclid" ||
          lower === "gclid" ||
          lower.startsWith("mc_")
        ) {
          u.searchParams.delete(key);
        }
      }
      return u.href;
    } catch {
      return input;
    }
  }

  // Show output group initially with 0 opacity
  outputGroup.style.display = 'block';

  // Handle URL paste event
  $("link").addEventListener('paste', (e) => {
    // Wait for the paste to complete
    setTimeout(() => {
      const url = e.target.value.trim();
      if (url) {
        e.target.value = sanitizeUrl(url);
      }
    }, 0);
  });

  $("go").onclick = async () => {
    let url = $("link").value.trim();
    if (!url) return alert("Please paste a URL first!");
    
    // Sanitize URL and update input field
    url = sanitizeUrl(url);
    $("link").value = url;
    
    // Reset output and show loading state
    $("out").value = "⏳ Fetching…";
    $("caption").value = "";
    $("preview").style.display = "none";
    $("out").style.opacity = 0.5;
    resetUI();
    
    // Create and animate progress ring
    const button = $("go");
    const ring = document.createElement('div');
    ring.className = 'progress-ring';
    button.appendChild(ring);
    
    // Start spinning animation
    gsap.to(ring, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    });
    
    gsap.to(ring, {
      rotation: 360,
      duration: 1.5,
      ease: "none",
      repeat: -1
    });

    try {
      const res = await fetch("/api/healthwatchify?url=" + encodeURIComponent(url));
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Stop ring animation
      gsap.to(ring, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => ring.remove()
      });

      // Show success flash
      const flash = document.createElement('div');
      flash.className = 'success-flash';
      button.appendChild(flash);
      
      // Enhanced success animation
      gsap.to(flash, {
        opacity: 0.8,
        scale: 1.5,
        duration: 0.5,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => flash.remove()
      });

      // Update output with a nice fade
      gsap.to(outputGroup, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.4)"
      });

      // Set content
      $("out").value = data.text;
      $("title").value = data.title;
      $("caption").value = data.caption || "";
      
      // Handle publication badge
      if (data.publication) {
        publicationName.textContent = data.publication;
        articleType.textContent = data.articleType || 'news';
        publicationBadge.style.display = 'inline-flex';
        setTimeout(() => publicationBadge.classList.add('visible'), 100);
      } else {
        publicationBadge.style.display = 'none';
      }

      // Handle authors badge
      if (data.authors && data.authors.length) {
        authorsList.textContent = data.authors.join(', ');
        authorsBadge.style.display = 'inline-flex';
        setTimeout(() => authorsBadge.classList.add('visible'), 200);
      } else {
        authorsBadge.style.display = 'none';
      }
      
      // Handle paywall badge
      if (data.isPaywalled !== undefined) {
        const icon = data.isPaywalled ? '🔒' : '✓';
        const status = data.isPaywalled ? 'Paywalled' : 'Free';
        paywallBadge.style.display = 'inline-flex';
        paywallStatus.textContent = icon + ' ' + status;
        paywallBadge.classList.add(data.isPaywalled ? 'paywall-locked' : 'paywall-free');
        setTimeout(() => paywallBadge.classList.add('visible'), 100);
      } else {
        paywallBadge.style.display = 'none';
      }
      
      if (data.image) {
        $("preview").src = data.image;
        $("preview").style.display = "block";
        $("preview").style.opacity = 0;
        $("preview").style.transform = "scale(0.95) translateY(10px)";
        
        gsap.to($("preview"), {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.4)"
        });
      }
      $("out").style.opacity = 1;
      outputGroup.classList.add('visible');

    } catch (e) {
      // Stop ring animation
      gsap.to(ring, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => ring.remove()
      });

      $("out").value = "❌ Error: " + e.message;
      $("out").style.opacity = 1;
      outputGroup.classList.add('visible');
      
      // Error shake animation
      gsap.to(button, {
        x: [-10, 10, -10, 10, 0],
        duration: 0.5,
        ease: "power1.inOut"
      });
    }
  };

  $("copyAll").onclick = async () => {
    const output = $("out").value;
    const title = $("title").value;
    const caption = $("caption").value;
    const url = $("link").value;
    const img = $("preview");
    const publication = publicationName.textContent;
    const authors = authorsList.textContent;
    
    if (!output) return;
    
    const button = $("copyAll");
    const COPY_DELAY = 540; // Time between copy operations in ms
    
    try {
      // 1. Copy Caption if exists
      if (caption) {
        await navigator.clipboard.writeText(caption);
        button.textContent = "Caption Copied!";
        gsap.to(button, {
          scale: 1.15,
          duration: 0.2,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        await new Promise(resolve => setTimeout(resolve, COPY_DELAY));
      }

      // 2. Copy Output
      await navigator.clipboard.writeText(output);
      button.textContent = "Output Copied!";
      gsap.to(button, {
        scale: 1.15,
        duration: 0.2,
        ease: "back.out(3)",
        yoyo: true,
        repeat: 1
      });
      await new Promise(resolve => setTimeout(resolve, COPY_DELAY));

      // 3. Copy Publication if exists
      if (publication && publicationBadge.style.display !== 'none') {
        await navigator.clipboard.writeText(publication);
        button.textContent = "Outlet Copied!";
        gsap.to(button, {
          scale: 1.15,
          duration: 0.2,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        await new Promise(resolve => setTimeout(resolve, COPY_DELAY));
      }

      // 4. Copy Authors if exist
      if (authors && authorsBadge.style.display !== 'none') {
        await navigator.clipboard.writeText(authors);
        button.textContent = "Authors Copied!";
        gsap.to(button, {
          scale: 1.15,
          duration: 0.2,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        await new Promise(resolve => setTimeout(resolve, COPY_DELAY));
      }

      // 5. Copy Title if exists
      if (title) {
        await navigator.clipboard.writeText(title);
        button.textContent = "Title Copied!";
        gsap.to(button, {
          scale: 1.15,
          duration: 0.2,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        await new Promise(resolve => setTimeout(resolve, COPY_DELAY));
      }

      // 6. Copy URL if exists
      if (url) {
        await navigator.clipboard.writeText(url);
        button.textContent = "URL Copied!";
        gsap.to(button, {
          scale: 1.15,
          duration: 0.2,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        await new Promise(resolve => setTimeout(resolve, COPY_DELAY));
      }

      // 7. Copy Image if exists and visible
      if (img.src && img.style.display !== "none") {
        button.textContent = "Copying Image...";
        try {
          // Create a new image using our proxy
          const proxyUrl = "/api/proxy-image?url=" + encodeURIComponent(img.src);
          const loadedImage = await new Promise((resolve, reject) => {
            const tempImg = new Image();
            tempImg.crossOrigin = "anonymous";
            tempImg.onload = () => resolve(tempImg);
            tempImg.onerror = reject;
            tempImg.src = proxyUrl;
          });

          // Create a canvas element
          const canvas = document.createElement('canvas');
          canvas.width = loadedImage.naturalWidth;
          canvas.height = loadedImage.naturalHeight;
          
          // Draw the image onto the canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(loadedImage, 0, 0);
          
          // Convert to PNG blob
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
          });
          
          // Copy to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ]);
          
          button.textContent = "Image Copied!";
          gsap.to(button, {
            scale: 1.15,
            duration: 0.2,
            ease: "back.out(3)",
            yoyo: true,
            repeat: 1
          });
        } catch (e) {
          console.error("Failed to copy image:", e);
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
      }, 3000);
      
    } catch (e) {
      alert("Failed to copy: " + e.message);
      button.textContent = "Copy All";
    }
  };

  // 🎹 KEYBOARD SHORTCUTS
  document.addEventListener('keydown', (e) => {
    // Enter key: Trigger Healthwatchify (but not when typing in input)
    if (e.key === 'Enter' && e.target.id !== 'link') {
      e.preventDefault();
      $("go").click();
    }
    
    // Ctrl+Q: Trigger Copy All
    if (e.ctrlKey && e.key === 'q') {
      e.preventDefault();
      const copyButton = $("copyAll");
      if (copyButton && copyButton.style.display !== 'none') {
        copyButton.click();
      }
    }
  });
  
  // Allow Enter in URL input to trigger healthwatchify
  $("link").addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $("go").click();
    }
  });

  // Reset UI state
  function resetUI() {
    outputGroup.classList.remove('visible');
    publicationBadge.style.display = 'none';
    publicationBadge.classList.remove('visible');
    authorsBadge.style.display = 'none';
    authorsBadge.classList.remove('visible');
    paywallBadge.style.display = 'none';
    paywallBadge.classList.remove('visible');
    paywallBadge.classList.remove('paywall-free');
    paywallBadge.classList.remove('paywall-locked');
  }

  // Update UI with response data
  function updateUI(data) {
    // ... existing code ...

    // Update paywall badge
    if (data.isPaywalled !== undefined) {
      const icon = data.isPaywalled ? '🔒' : '✓';
      const status = data.isPaywalled ? 'Paywalled' : 'Free';
      paywallBadge.style.display = 'inline-flex';
      paywallStatus.textContent = icon + ' ' + status;
      paywallBadge.classList.add(data.isPaywalled ? 'paywall-locked' : 'paywall-free');
      setTimeout(() => paywallBadge.classList.add('visible'), 100);
    }

    // ... existing code ...
  }
`; 