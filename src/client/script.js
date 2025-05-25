export const clientScript = /*javascript*/ `
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
    
    // Create and animate progress ring
    const button = $("go");
    const ring = document.createElement('div');
    ring.className = 'progress-ring';
    button.appendChild(ring);
    
    // Start spinning animation
    gsap.to(ring, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    });
    
    gsap.to(ring, {
      rotation: 360,
      duration: 2,
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
      
      gsap.to(flash, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => flash.remove()
      });

      // Update output
      $("out").value = data.text;
      $("title").value = data.title;
      if (data.image) {
        $("preview").src = data.image;
        $("preview").style.display = "block";
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
    }
  };

  $("copyAll").onclick = async () => {
    const text = $("out").value;
    if (!text) return;
    
    const button = $("copyAll");
    
    try {
      await navigator.clipboard.writeText(text);
      
      // Show success flash
      const flash = document.createElement('div');
      flash.className = 'success-flash';
      button.appendChild(flash);
      
      gsap.to(flash, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => flash.remove()
      });
      
    } catch (e) {
      alert("Failed to copy: " + e.message);
    }
  };
`; 