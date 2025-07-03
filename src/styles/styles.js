export const styles = /*css*/ `
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
    margin-bottom: 1rem;
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
    min-height: 6rem;
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
    margin: 0.25rem 0 1rem 0;
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
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    position: relative;
    overflow: hidden;
  }
  button:hover {
    transform: translateY(-8px) scale(1.05);
    background: linear-gradient(135deg, #9061ff, #8b5cf6);
    box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5);
  }
  button:active {
    transform: translateY(-2px) scale(0.95);
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
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
    transform: translateY(20px);
  }
  .output-group.visible {
    opacity: 1;
    transform: translateY(0);
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
  .success-flash {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    pointer-events: none;
    opacity: 0;
  }
  .progress-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 80%;
    border: 4px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .kbd-hint {
    font-size: 0.7rem;
    opacity: 0.6;
    margin-top: 0.25rem;
    font-weight: 400;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: opacity 0.3s ease;
  }
  button:hover .kbd-hint {
    opacity: 0.9;
  }
  .label.output-label {
    margin-top: 1.5rem;
  }
  .label.caption-label {
    margin-top: 1.25rem;
  }

  /* --- Craft Options Popout --- */
  #craftOptions {
    position: absolute;
    top: 0rem;
    right: 1.5rem;
    width: 540px;
    height: 220px;
    padding: 20px 2px 2px 2px; /* top right bottom left */
    border-width: 1px;
    min-width: 400px;
    max-width: 90vw;
    min-height: 180px;
    max-height: 90vh;
    display: flex;
    flex-direction: row;
    gap: 1rem;
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
    opacity: 0;
    background: #232336;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.18);
    border: 1.25px solid #3d3d47;
    padding: 1rem 1.5rem;
    margin: 0;
    z-index: 100;
  }
  #craftOptions.open {
    max-height: 740px;
    opacity: 1;
  }
  #craftOptions .craft-field {
    flex: 1 1 0;
    min-width: 0;
    width: 50%;
    max-width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    margin: 0;
    padding: 0 0.75rem;
  }
  #craftOptions .craft-field:first-child {
    padding-left: 0;
  }
  #craftOptions .craft-field:last-child {
    padding-right: 0;
  }
  #craftOptions .mini-select {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    max-height: 200px;
    height: auto;
    overflow-y: auto;
  }
  @media (max-width: 600px) {
    #craftOptions {
      position: fixed;
      top: 1.25rem;
      right: 1rem;
      left: 1rem;
      width: auto;
      min-width: 0;
      max-width: 98vw;
      height: auto;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem 1rem;
    }
    #craftOptions .craft-field {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
  }

  #craftOptions label, #craftOptions .checkbox-label {
    font-size: 1.15rem;
    padding: 0.5em 0.7em;
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }
  #craftOptions input[type="checkbox"] {
    width: 1.3em;
    height: 1.3em;
    margin-right: 0.7em;
    accent-color: #8b5cf6;
    border-radius: 6px;
  }
  #craftOptions .label {
    font-size: 1.05rem;
    margin-bottom: 0.7rem;
    color: #a78bfa;
    letter-spacing: 0.7px;
  }
  #craftOptions .checkbox-group {
    margin-bottom: 1.2rem;
    padding: 0.7rem 0.5rem 0.7rem 0.5rem;
    border-radius: 10px;
    background: rgba(139, 92, 246, 0.04);
  }
  #craftOptions .checkbox-group:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 600px) {
    #craftOptions {
      padding: 1rem 0.5rem;
      max-width: 98vw;
    }
    #craftOptions label, #craftOptions .checkbox-label {
      font-size: 1rem;
      padding: 0.4em 0.4em;
    }
  }

  .secondary-badges {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    align-items: center;
  }

  .badge-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
`; 