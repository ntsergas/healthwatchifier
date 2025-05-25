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
    margin: 1rem 0 2rem 0;
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
    position: relative;
    overflow: hidden;
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
  .progress-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 4px solid transparent;
    border-left-color: rgba(139, 92, 246, 0.8);
    opacity: 0;
    pointer-events: none;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .success-flash {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(124, 58, 237, 0.4));
    opacity: 0;
    pointer-events: none;
  }
`; 