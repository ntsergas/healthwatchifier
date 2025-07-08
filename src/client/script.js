import { decode } from '../utils/htmlEntities.js';

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
  const removeImageBtn = $("removeImage");
  const addImagePlaceholder = $("addImagePlaceholder");

  // Global helper to play sound with optional pitch
  function playHealthwatchSfx(pitch = 1.0) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createBufferSource();

    fetch(window.healthwatchifySfxBase64) // Don't add prefix - it's already included
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        source.buffer = audioBuffer;
        source.playbackRate.value = pitch; // 1.0 is normal speed
        source.connect(audioCtx.destination);
        source.start(0);
      })
      .catch(err => console.error("Audio playback failed:", err));
  }

    function playHealthwatchifyEchoSfx(pitch = 0.83, offsetSeconds = 0.0) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const gain = ctx.createGain();
  gain.gain.value = 0.28;

  const delay = ctx.createDelay();
  delay.delayTime.value = 0.23;

  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;

  delay.connect(feedback);
  feedback.connect(delay);

  gain.connect(delay);
  delay.connect(ctx.destination);
  gain.connect(ctx.destination);
  feedback.connect(ctx.destination);

  fetch(window.healthwatchifySfxBase64)
    .then(res => res.arrayBuffer())
    .then(buf => ctx.decodeAudioData(buf))
    .then(buffer => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = pitch;
      source.connect(gain);
      source.start(0, offsetSeconds);
    })
    .catch(err => console.error("Echo SFX error:", err));
}

  // Push to Web sound effect
function playPushToWebSfx(pitch = 1.0, offsetSeconds = 0.0) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.28; // Match healthwatchify volume

  fetch("data:audio/wav;base64," + window.pushToWebSfx)
    .then(res => res.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      source.buffer = audioBuffer;
      source.playbackRate.value = pitch;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start(0, offsetSeconds); // 👈 Starts at chosen offset
    })
    .catch(err => console.error("Push-to-Web sound error:", err));
}

  // HTML entity decoder
  function decode(str = "") {
    return str
      // Standard HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      
      // Quotes and apostrophes (both named and numeric)
      .replace(/&#x27;|&apos;/g, "'")
      .replace(/&rsquo;?|&lsquo;?/g, "'")
      .replace(/&rdquo;?|&ldquo;?/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;|&#8221;/g, '"')
      .replace(/&bdquo;|&ldquo;/g, '"')
      
      // Unicode smart quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      
      // Hyphens and dashes
      .replace(/&#x2d;/g, "-")
      .replace(/&mdash;|&#8212;/g, "—")
      .replace(/&ndash;|&#8211;/g, "–")
      
      // Special spaces
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/&ensp;/g, " ")
      .replace(/&emsp;/g, " ")
      
      // Common accents
      .replace(/&eacute;/g, "é")
      .replace(/&egrave;/g, "è")
      .replace(/&uuml;/g, "ü")
      .replace(/&ntilde;/g, "ñ")
      
      // French characters
      .replace(/&ccedil;/g, "ç")
      .replace(/&Ccedil;/g, "Ç")
      .replace(/&acirc;/g, "â")
      .replace(/&ecirc;/g, "ê")
      .replace(/&icirc;/g, "î")
      .replace(/&ocirc;/g, "ô")
      .replace(/&ucirc;/g, "û")
      .replace(/&euml;/g, "ë")
      
      // Any other numeric entities (decimal or hex)
      .replace(/&#(\\d+)(?:\\s*;)?/g, (_, n) => String.fromCodePoint(+n))
      .replace(/&#x([0-9a-f]+)(?:\\s*;)?/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  }

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
    // Decode the URL to preserve special characters like é, ñ, etc.
    return decodeURI(u.href);
    } catch {
      return input;
    }
  }

  // Show output group initially with 0 opacity
  outputGroup.style.display = 'block';

  // Show Mastodon button since credentials are configured
  const mastodonButton = $("mastodonButton");
  if (mastodonButton) {
    mastodonButton.style.display = 'block';
  }

  // Function to update social buttons state
  function updateSocialButtonsState() {
    const hasContent = $("out").value.trim().length > 0;
    const blueskyButton = $("blueskyButton");
    const mastodonButton = $("mastodonButton");
    
    if (blueskyButton) {
      blueskyButton.disabled = !hasContent;
    }
    if (mastodonButton) {
      mastodonButton.disabled = !hasContent;
    }
  }

  // Add listener to output field to update button states
  $("out").addEventListener('input', updateSocialButtonsState);

  // Paywall badge toggle functionality
  paywallBadge.addEventListener('click', () => {
    if (paywallBadge.style.display === 'none') return; // Don't toggle if hidden
    
    const isCurrentlyPaywalled = paywallBadge.classList.contains('paywall-locked');
    
    // Toggle the state
    if (isCurrentlyPaywalled) {
      // Change to Free
      paywallStatus.textContent = '✓ Free';
      paywallBadge.classList.remove('paywall-locked');
      paywallBadge.classList.add('paywall-free');
    } else {
      // Change to Paywalled
      paywallStatus.textContent = '🔒 Paywalled';
      paywallBadge.classList.remove('paywall-free');
      paywallBadge.classList.add('paywall-locked');
    }
    
    // Add a little bounce animation to show it was clicked
    gsap.to(paywallBadge, {
      scale: 1.1,
      duration: 0.15,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  });

  // Article type toggle functionality (News vs Opinion)
  articleType.addEventListener('click', () => {
    if (publicationBadge.style.display === 'none') return; // Don't toggle if hidden
    
    const currentType = articleType.textContent.toLowerCase();
    
    // Toggle between news and opinion
    if (currentType === 'news') {
      articleType.textContent = 'opinion';
    } else {
      articleType.textContent = 'news';
    }
    
    // Add a little bounce animation to show it was clicked
    gsap.to(articleType, {
      scale: 1.1,
      duration: 0.15,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  });

  // Authors text inline editing functionality
  authorsList.addEventListener('click', () => {
    if (authorsBadge.style.display === 'none') return; // Don't edit if hidden
    
    const currentText = authorsList.textContent;
    
    // Create an input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.style.background = 'transparent';
    input.style.border = 'none';
    input.style.color = 'inherit';
    input.style.font = 'inherit';
    input.style.width = '100%';
    input.style.outline = 'none';
    input.style.padding = '0';
    
    // Replace the text with the input
    authorsList.textContent = '';
    authorsList.appendChild(input);
    
    // Focus and select all text
    input.focus();
    input.select();
    
    // Handle saving the edit
    const saveEdit = () => {
      const newText = input.value.trim() || currentText; // Fallback to original if empty
      authorsList.textContent = newText;
      
      // Add a little bounce animation to show it was saved
      gsap.to(authorsList, {
        scale: 1.05,
        duration: 0.15,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });
    };
    
    // Save on Enter or blur
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        authorsList.textContent = currentText; // Revert to original
      }
    });
    
    input.addEventListener('blur', saveEdit);
  });

  // Publication name inline editing functionality
  publicationName.addEventListener('click', () => {
    if (publicationBadge.style.display === 'none') return; // Don't edit if hidden
    
    const currentText = publicationName.textContent;
    
    // Create an input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.style.background = 'transparent';
    input.style.border = 'none';
    input.style.color = 'inherit';
    input.style.font = 'inherit';
    input.style.width = '100%';
    input.style.outline = 'none';
    input.style.padding = '0';
    
    // Replace the text with the input
    publicationName.textContent = '';
    publicationName.appendChild(input);
    
    // Focus and select all text
    input.focus();
    input.select();
    
    // Handle saving the edit
    const saveEdit = () => {
      const newText = input.value.trim() || currentText; // Fallback to original if empty
      publicationName.textContent = newText;
      
      // Add a little bounce animation to show it was saved
      gsap.to(publicationName, {
        scale: 1.05,
        duration: 0.15,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });
    };
    
    // Save on Enter or blur
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        publicationName.textContent = currentText; // Revert to original
      }
    });
    
    input.addEventListener('blur', saveEdit);
  });

  // Image management functionality
  removeImageBtn.addEventListener('click', () => {
    const preview = $("preview");
    preview.style.display = "none";
    preview.src = "";
    removeImageBtn.style.display = "none";
    addImagePlaceholder.style.display = "flex";
    
    // Clear caption too
    $("caption").value = "";
    
    // Add a little animation
    gsap.to(addImagePlaceholder, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: "back.out(1.4)"
    });
  });

  addImagePlaceholder.addEventListener('click', async () => {
    try {
      // Try to read image from clipboard
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            
            // Convert blob to base64 data URL so it can be sent to server
            const reader = new FileReader();
            const dataUrlPromise = new Promise((resolve) => {
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            
            const dataUrl = await dataUrlPromise;
            
            const preview = $("preview");
            preview.src = dataUrl; // Use data URL instead of blob URL
            preview.style.display = "block";
            preview.style.opacity = 0;
            preview.style.transform = "scale(0.95) translateY(10px)";
            
            // Hide placeholder, show remove button
            addImagePlaceholder.style.display = "none";
            removeImageBtn.style.display = "flex";
            
            // Animate image in
            gsap.to(preview, {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.6,
              ease: "back.out(1.4)"
            });
            
            return; // Exit after first image found
          }
        }
      }
      
      // No image found in clipboard
      alert('No image found in clipboard. Copy an image first, then try again.');
      
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      alert('Failed to read clipboard. Make sure you have copied an image and granted clipboard permissions.');
    }
  });

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

  async function postToMastodon() {
    const button = $("mastodonButton");
    const rawText = $("out").value;
    const imageElement = $("preview");
    const hasImage = imageElement && imageElement.style.display !== "none" && imageElement.src;
    
    // Transform CanadaHealthwatch.ca into a clickable link only for Mastodon
    const transformedText = rawText.replace(
      /CanadaHealthwatch\.ca/g,
      'https://canadahealthwatch.ca'
    );
    
    // Log the transformation for debugging
    console.log('Original text:', JSON.stringify(rawText));
    console.log('Transformed text:', JSON.stringify(transformedText));
    
    // Disable button and show loading state
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Posting...";
    
    try {
      const response = await fetch("/api/mastodon-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transformedText,
          imageUrl: hasImage ? imageElement.src : null,
          altText: hasImage ? $("caption").value : null
        })
      });
      
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      
      // Show success state
      button.textContent = "✓ Posted!";
      button.style.background = "#22c55e";
      
      // Play Push to Web success sound with offset
      playPushToWebSfx(0.79, 0.21);
      
      // Reset after 2 seconds
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
        button.style.background = "";
      }, 2000);
      
    } catch (error) {
      console.error("Failed to post to Mastodon:", error);
      alert("Failed to post to Mastodon. Please try again.");
      
      // Reset button
      button.disabled = false;
      button.textContent = originalText;
    }
  }

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
        duration: 0.9,
        ease: "back.out(1.4)"
      });

      // Set content
      $("out").value = data.text;
      $("title").value = decode(data.title || "");
      $("caption").value = decode(data.caption || "");
      
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
        
        // Show remove button, hide add placeholder
        removeImageBtn.style.display = "flex";
        addImagePlaceholder.style.display = "none";
        
        gsap.to($("preview"), {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.4)"
        });
      } else {
        // No image found, show add placeholder
        $("preview").style.display = "none";
        removeImageBtn.style.display = "none";
        addImagePlaceholder.style.display = "flex";
      }
      $("out").style.opacity = 1;
      outputGroup.classList.add('visible');
      playHealthwatchifyEchoSfx(0.83, 0.0);

      // Update social buttons state after content is loaded
      updateSocialButtonsState();

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
        playHealthwatchSfx(0.65); // Caption - lowest pitch
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
      playHealthwatchSfx(0.75); // Output
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
        playHealthwatchSfx(0.85); // Outlet
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
        playHealthwatchSfx(0.95); // Authors
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
        playHealthwatchSfx(1.05); // Title
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
        playHealthwatchSfx(1.15); // URL - normal pitch
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
          
          playHealthwatchSfx(1.25); // Image - highest pitch
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

  // Post to Bluesky function
  window.postToBluesky = async function() {
    const output = $("out").value;
    const caption = $("caption").value;
    const img = $("preview");
    
    if (!output) {
      alert('Please generate content first by entering a URL and clicking "Healthwatch-ify"');
      return;
    }
    
    const blueskyButton = $("blueskyButton");
    const originalText = blueskyButton.textContent;
    
    try {
      blueskyButton.textContent = "Posting to Bluesky...";
      blueskyButton.disabled = true;
      
      // Prepare post data (credentials now handled server-side)
      const postData = {
        text: output,
        altText: caption || 'Health news article image'
      };
      
      // Include image if available
      if (img.src && img.style.display !== "none") {
        postData.imageUrl = img.src;
      }
      
      const response = await fetch('/api/bluesky-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        blueskyButton.textContent = "✅ Posted!";
        
        // Play Push to Web success sound with offset
        playPushToWebSfx(1.18, 0.29);
        
        // Reset button after 3 seconds
        setTimeout(() => {
          blueskyButton.textContent = originalText;
          blueskyButton.disabled = false;
        }, 3000);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Bluesky posting error:', error);
      blueskyButton.textContent = "❌ Failed";
      alert('Failed to post to Bluesky: ' + error.message);
      
      // Reset button after 3 seconds
      setTimeout(() => {
        blueskyButton.textContent = originalText;
        blueskyButton.disabled = false;
      }, 3000);
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
    
    // Reset image controls
    removeImageBtn.style.display = 'none';
    addImagePlaceholder.style.display = 'none';
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
  }

  // Enable Bluesky button when content is loaded
  function enableBlueskyButton() {
    const button = $("blueskyButton");
    if (button && $("out").value.trim()) {
      button.disabled = false;
    }
  }

  // Enable buttons after successful extraction
  const originalOnclick = $("go").onclick;
  $("go").onclick = async function() {
    await originalOnclick.call(this);
    
    // Enable all buttons when content is loaded
    const threadsButton = $("threadsButton");
    if (threadsButton && $("title").value.trim()) {
      threadsButton.disabled = false;
    }
    
    const blueskyButton = $("blueskyButton");
    if (blueskyButton && $("out").value.trim()) {
      blueskyButton.disabled = false;
    }
    
    const craftButton = $("craftButton");
    if (craftButton && $("title").value.trim()) {
      craftButton.disabled = false;
    }

    const linkedinRssButton = $("linkedinRssButton");
    if (linkedinRssButton && $("title").value.trim() && $("link").value.trim()) {
      linkedinRssButton.disabled = false;
    }
  };

  // 🌐 CRAFT CMS FUNCTIONALITY

  // Function to handle Craft CMS publishing
  window.pushToCraft = async function() {
    const craftButtonEl = $("craftButton");
    const originalText = craftButtonEl?.textContent || '🌐 Push to Web'; // Store original text before any changes
    
    // Check if dropdowns are visible - if not, show them first
    const craftOptionsEl = $("craftOptions");
    if (craftOptionsEl && !craftOptionsEl.classList.contains('open')) {
      console.log("Showing dropdowns!"); // Debug log as requested
      craftOptionsEl.style.display = 'flex';
      craftOptionsEl.classList.add('open');
      craftButtonEl.textContent = 'Send it 🚀';
      return; // Exit early to wait for user selection
    }
    
    try {
      // Get and validate DOM elements first
      const titleEl = $("title");
      const urlEl = $("link");
      const previewEl = $("preview");
      const publicationNameEl = document.querySelector('.publication-name');
      const articleTypeEl = document.querySelector('.article-type');
      const authorsListEl = document.querySelector('.authors-list');
      const paywallBadgeEl = document.querySelector('.paywall-badge');
      
      if (!titleEl || !urlEl || !publicationNameEl || !articleTypeEl) {
        throw new Error('Some required elements are missing. Please refresh the page and try again.');
      }

      // Get article data with null checks
      const articleData = {
        headline: titleEl.value?.trim() || '',
        url: sanitizeUrl(urlEl.value?.trim() || ''),
        publication: publicationNameEl.textContent?.trim() || '',
        articleType: (articleTypeEl.textContent?.trim() || '').toLowerCase(),
        authors: authorsListEl?.textContent?.trim() ? [authorsListEl.textContent.trim()] : [],
        isPaywalled: paywallBadgeEl?.classList?.contains('paywall-locked') || false,
        image: previewEl?.src || null
      };

      // Topic and Region ID mappings (must match craftApi.js constants)
      const TOPIC_IDS = {
        'Canada': 26320,
        'US': 26836,
        'International': 26321,
        'Technology': 26322,
        'Policy': 26323,
        'Opinion': 26835,
        'Research': 37224,
        'Pharma': 41889,
        'COVID': 69275,
        'Business': 69276,
        'H5N1': 102010
      };

      const REGION_IDS = {
        'ATLANTIC': 42385,
        'NORTH': 46537,
        'ONTARIO': 47388,
        'PRAIRIES': 42383,
        'QUEBEC': 46536,
        'WEST': 42382
      };

      // Get topics with defensive checks and convert to IDs
      const topicInputs = document.querySelectorAll('input[name="articleTopic"]:checked') || [];
      const selectedTopicLabels = Array.from(topicInputs)
        .map(cb => cb.value?.trim())
        .filter(Boolean); // Remove any falsy values
      
      const selectedTopicIds = selectedTopicLabels
        .map(label => TOPIC_IDS[label])
        .filter(Boolean); // Remove any undefined IDs

      // Get regions with defensive checks (excluding National) and convert to IDs
      const regionInputs = document.querySelectorAll('input[name="articleRegion"]:checked') || [];
      const selectedRegionLabels = Array.from(regionInputs)
        .map(cb => cb.value?.trim())
        .filter(region => region && region !== 'National'); // Remove National and any falsy values
      
      const selectedRegionIds = selectedRegionLabels
        .map(label => REGION_IDS[label])
        .filter(Boolean); // Remove any undefined IDs

      // Validate required fields
      if (!articleData.headline) {
        throw new Error('Please enter a headline');
      }
      if (!articleData.url) {
        throw new Error('Please enter a URL');
      }
      if (!articleData.publication) {
        throw new Error('Publication name is missing');
      }
      if (!articleData.articleType) {
        throw new Error('Article type is missing');
      }

      // Add optional fields only if they have values
      const craftOptions = {
        authorId: 25385, // Default to Nick Tsergas
        topics: selectedTopicIds, // Send IDs instead of labels
        regions: selectedRegionIds // Send IDs instead of labels
      };

      // Debug log the conversion and payload before submission
      console.log("Topic conversion:", { 
        labels: selectedTopicLabels, 
        ids: selectedTopicIds 
      });
      console.log("Region conversion:", { 
        labels: selectedRegionLabels, 
        ids: selectedRegionIds 
      });
      
      const payload = { ...articleData, ...craftOptions };
      console.log("Submitting to Craft with: ", payload);

      // Show loading state
      craftButtonEl.disabled = true;
      craftButtonEl.textContent = '📝 Publishing...';

      // Make the API call
      const response = await fetch('/api/craft-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...articleData,
          ...craftOptions
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish to Craft');
      }

      // Success animation
      gsap.to(craftButtonEl, {
        scale: 1.2,
        duration: 0.3,
        ease: "back.out(3)",
        yoyo: true,
        repeat: 1
      });
      craftButtonEl.textContent = '✅ Published!';
      
      // Play the Push to Web success sound with offset
      playPushToWebSfx(1.06, 0.25);
      
      // Reset all topic and region checkboxes
      document.querySelectorAll('input[name="articleTopic"], input[name="articleRegion"]').forEach(cb => {
        cb.checked = false;
      });
      // Hide the checkbox container with slide/collapse
      const craftOptionsEl = document.getElementById('craftOptions');
      if (craftOptionsEl) {
        craftOptionsEl.classList.remove('open');
      }
      
      // Reset button after 3 seconds
      setTimeout(() => {
        craftButtonEl.textContent = '🌐 Push to Web'; // Revert to original state
        craftButtonEl.disabled = false;
      }, 3000);

    } catch (error) {
      console.error('Craft publishing error:', error);
      
      if (craftButtonEl) {
        craftButtonEl.textContent = "❌ Failed";
        
        // Error animation
        gsap.to(craftButtonEl, {
          x: [-5, 5, -5, 5, 0],
          duration: 0.5,
          ease: "power1.inOut"
        });
        
        // Show error message
        alert('Failed to publish to Craft: ' + error.message);
        
        // Reset button after 3 seconds
        setTimeout(() => {
          craftButtonEl.textContent = '🌐 Push to Web'; // Revert to original state
          craftButtonEl.disabled = false;
        }, 3000);
      }
    }
  };

  // Enable buttons when content is loaded
  window.onload = () => {
    // Enable Bluesky button when content is loaded
    const blueskyButton = $("blueskyButton");
    if (blueskyButton && $("out").value.trim()) {
      blueskyButton.disabled = false;
    }
    
    // Enable Craft button when content is loaded
    const craftButton = $("craftButton");
    if (craftButton && $("title").value.trim()) {
      craftButton.disabled = false;
    }

    // Enable LinkedIn RSS button when content is loaded
    const linkedinRssButton = $("linkedinRssButton");
    if (linkedinRssButton && $("title").value.trim() && $("link").value.trim()) {
      linkedinRssButton.disabled = false;
    }
  };

  // Toggle all regions when "National" is clicked
  window.toggleAllRegions = function(nationalCheckbox) {
    const regionCheckboxes = document.querySelectorAll('.region-checkbox');
    const isChecked = nationalCheckbox.checked;
    
    regionCheckboxes.forEach(checkbox => {
      checkbox.checked = isChecked;
      checkbox.dispatchEvent(new Event('change')); // Trigger any change handlers
    });
  };

  // When showing the popout, use .open for animation
  const craftButtonEl = $("craftButton");
  const craftOptionsEl = $("craftOptions");
  if (craftButtonEl && craftOptionsEl) {
    craftButtonEl.addEventListener('click', () => {
      craftOptionsEl.classList.add('open');
    });
  }

  // Add close button logic for craftOptions popout
  window.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeCraftOptions');
    const craftOptionsEl = document.getElementById('craftOptions');
    const craftButtonEl = document.getElementById('craftButton');
    if (closeBtn && craftOptionsEl) {
      closeBtn.addEventListener('click', () => {
        // Reset all topic and region checkboxes
        document.querySelectorAll('input[name="articleTopic"], input[name="articleRegion"]').forEach(cb => {
          cb.checked = false;
        });
        // Reset button text to original state
        if (craftButtonEl) {
          craftButtonEl.textContent = '🌐 Push to Web';
        }
        // Hide the popout with animation
        craftOptionsEl.classList.remove('open');
      });
    }

    // Add click-outside-to-close functionality
    document.addEventListener('click', (event) => {
      if (!craftOptionsEl) return;
      
      // Check if the popup is open
      if (!craftOptionsEl.classList.contains('open')) return;
      
      // Check if click was outside the popup and not on the trigger button
      const craftButton = document.getElementById('craftButton');
      const clickedInsidePopup = craftOptionsEl.contains(event.target);
      const clickedOnButton = craftButton && craftButton.contains(event.target);
      
      if (!clickedInsidePopup && !clickedOnButton) {
        // Close popup but keep checkboxes checked (no reset)
        craftOptionsEl.classList.remove('open');
      }
    });
  });

  // LinkedIn Feed functionality
  window.postToLinkedInRSS = async function() {
    const title = $("title").value;
    const link = $("link").value;
    const imagePreview = $("preview");
    
    if (!title.trim() || !link.trim()) {
      alert('Please extract an article first');
      return;
    }

    const button = $("linkedinRssButton");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '🔄 Posting...';

    try {
      // Only include image if it's visible and has a valid URL
      let imageUrl = null;
      if (imagePreview && imagePreview.style.display !== 'none' && imagePreview.src) {
        // Skip data URLs
        if (!imagePreview.src.startsWith('data:')) {
          imageUrl = imagePreview.src;
        }
      }

      const postData = {
        title: title.trim(),
        link: link.trim(),
        tagline: "More news → CanadaHealthwatch.ca 🍁",
        image: imageUrl
      };

      console.log('Sending to LinkedIn feed:', postData);

      const response = await fetch('https://feed.strikethroughediting.ca/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to post to LinkedIn feed');
      }

        // Success animation
        gsap.to(button, {
          scale: 1.2,
          duration: 0.3,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        button.textContent = '✅ Posted!';
        button.style.background = "#22c55e";

        // Play Push to Web success sound with offset
        playPushToWebSfx(0.96, 0.25);

        // Nudge LinkedIn to re-fetch RSS preview
        fetch("https://www.linkedin.com/checkpoint/rp/rss-link-preview?feedUrl=https://feed.strikethroughediting.ca")
          .then(() => console.log("✅ LinkedIn scraper nudge sent"))
          .catch(err => console.error("⚠️ LinkedIn scraper nudge failed:", err));
        
        // Reset button after 3 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          button.style.background = "";
        }, 3000);

    } catch (error) {
      console.error('❌ Failed to post to LinkedIn feed:', error);
      button.textContent = "❌ Failed";
      
      // Error animation
      gsap.to(button, {
        x: [-5, 5, -5, 5, 0],
        duration: 0.5,
        ease: "power1.inOut"
      });
      
      // Reset button after 3 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
    }
  };

  // Empty LinkedIn Feed functionality
  window.emptyLinkedInFeed = async function() {
    const button = $("emptyFeedButton");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '🔄 Emptying...';

    try {
      const response = await fetch('https://feed.strikethroughediting.ca/empty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to empty feed');
      }

      // Success animation
      gsap.to(button, {
        scale: 1.2,
        duration: 0.3,
        ease: "back.out(3)",
        yoyo: true,
        repeat: 1
      });
      button.textContent = '✅';
      button.classList.add('success');
      
      // Play sound effect at lower pitch for empty/trash action
      playHealthwatchSfx(0.38);
      
      // Reset button after 3 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('success');
      }, 3000);

    } catch (error) {
      console.error('❌ Failed to empty LinkedIn feed:', error);
      button.textContent = "❌ Failed";
      button.classList.add('error');
      
      // Error animation
      gsap.to(button, {
        x: [-5, 5, -5, 5, 0],
        duration: 0.5,
        ease: "power1.inOut"
      });
      
      // Reset button after 3 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('error');
      }, 3000);
    }
  };
`; 