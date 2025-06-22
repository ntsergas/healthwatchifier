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
            const url = URL.createObjectURL(blob);
            
            const preview = $("preview");
            preview.src = url;
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


  // Post to LinkedIn function
  async function postToLinkedIn() {
    await postToSocialMedia('linkedin-post', 'LinkedIn');
  }

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

    // ... existing code ...
  }

  // 🧵 THREADS FUNCTIONALITY

  // Make postToThreads globally available
  window.postToThreads = async function() {
    const title = $("title").value;
    const imagePreview = $("preview");
    const caption = $("caption").value;
    
    if (!title.trim()) {
      alert('Please extract an article first');
      return;
    }

    const button = $("threadsButton");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '🧵 Posting...';

    try {
      const postData = {
        headline: title,
        imageUrl: imagePreview.src && imagePreview.style.display !== 'none' ? imagePreview.src : null,
        caption: caption || ''
      };

      const response = await fetch('/api/threads-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (result.success) {
        // Success animation
        gsap.to(button, {
          scale: 1.2,
          duration: 0.3,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        button.textContent = '✅ Posted!';
        
        // Reset button after 3 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to post');
      }

    } catch (error) {
      console.error('❌ Failed to post to Threads:', error);
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

  // Enable Threads button when content is loaded
  function enableThreadsButton() {
    const button = $("threadsButton");
    if (button && $("title").value.trim()) {
      button.disabled = false;
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
    // Enable Threads button when content is loaded
    const threadsButton = $("threadsButton");
    if (threadsButton && $("title").value.trim()) {
      threadsButton.disabled = false;
    }
    
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
    
    // LinkedIn button temporarily hidden while waiting for API permissions
    /* const linkedinButton = $("linkedinButton");
    if (linkedinButton && $("out").value.trim()) {
      linkedinButton.disabled = false;
    } */
  };

  // 🌐 CRAFT CMS FUNCTIONALITY

  // Make pushToCraft globally available
  window.pushToCraft = async function() {
    const title = $("title").value;
    const link = $("link").value;
    const imagePreview = $("preview");
    
    if (!title.trim() || !link.trim()) {
      alert('Please extract an article first');
      return;
    }

    // Show Craft options if not already visible
    const craftOptions = $("craftOptions");
      if (craftOptions.style.display === 'none') {
    craftOptions.style.display = 'flex';
      
      // Animate the appearance
      gsap.fromTo(craftOptions, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
      
      // Change button text to indicate next step
      const button = $("craftButton");
      button.innerHTML = '🌐 Publish<br>Now';
      return;
    }

    // Get selected topics and regions
    const selectedTopics = Array.from(document.querySelectorAll('#topicsSelect input:checked')).map(cb => cb.value);
    const selectedRegions = Array.from(document.querySelectorAll('#regionsSelect input:checked')).map(cb => cb.value);
    
    if (selectedTopics.length === 0 || selectedRegions.length === 0) {
      alert('Please select at least one Topic and one Region before publishing.');
      return;
    }

    const button = $("craftButton");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '🌐 Publishing...';

    try {
      // Gather all the data
      const postData = {
        headline: title,
        url: sanitizeUrl(link),
        publication: publicationName.textContent,
        articleType: articleType.textContent.toLowerCase(),
        authors: authorsList.textContent ? [authorsList.textContent] : [],
        isPaywalled: paywallBadge.classList.contains('paywall-locked'),
        image: imagePreview.src && imagePreview.style.display !== 'none' ? imagePreview.src : null,
        topics: selectedTopics,
        regions: selectedRegions
      };

      const response = await fetch('/api/craft-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();

      if (result.success) {
        // Success animation
        gsap.to(button, {
          scale: 1.2,
          duration: 0.3,
          ease: "back.out(3)",
          yoyo: true,
          repeat: 1
        });
        button.textContent = '✅ Published!';
        
        // Hide craft options after successful publish
        gsap.to(craftOptions, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            craftOptions.style.display = 'none';
          }
        });
        
        // Show success message with link
        if (result.url) {
          setTimeout(() => {
            alert(\`Article published successfully!\\n\\nView at: \${result.url}\`);
          }, 500);
        }
        
        // Reset button after 5 seconds
        setTimeout(() => {
          button.innerHTML = '🌐 Push<br>to Web';
          button.disabled = false;
        }, 5000);
      } else {
        throw new Error(result.error || 'Failed to publish');
      }

    } catch (error) {
      console.error('❌ Failed to publish to Craft:', error);
      button.textContent = "❌ Failed";
      
      // Error animation
      gsap.to(button, {
        x: [-5, 5, -5, 5, 0],
        duration: 0.5,
        ease: "power1.inOut"
      });
      
      alert(\`Failed to publish: \${error.message}\`);
      
      // Reset button after 3 seconds
      setTimeout(() => {
        button.innerHTML = '🌐 Push<br>to Web';
        button.disabled = false;
      }, 3000);
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
    
    // LinkedIn button temporarily hidden while waiting for API permissions
    /* const linkedinButton = $("linkedinButton");
    if (linkedinButton && $("out").value.trim()) {
      linkedinButton.disabled = false;
    } */

    // Mastodon button temporarily hidden while waiting for API permissions
    /* const mastodonButton = $("mastodonButton");
    if (mastodonButton && $("out").value.trim()) {
      mastodonButton.disabled = false;
    } */
  };

  // Toggle all regions when "National" is clicked
  window.toggleAllRegions = function(nationalCheckbox) {
    const regionCheckboxes = document.querySelectorAll('.region-checkbox');
    const isChecked = nationalCheckbox.checked;
    
    regionCheckboxes.forEach(checkbox => {
      checkbox.checked = isChecked;
    });
  };
`; 