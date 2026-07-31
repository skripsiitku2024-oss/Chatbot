const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// If your frontend and backend run on different ports locally (e.g., Live Server on port 5500 and Express on port 3000),
// you can change this to 'http://localhost:3000/api/chat' since the Express server has CORS enabled.
const API_URL = 'http://localhost:3000/api/chat';

// Store conversation history for Gemini API.
// Format matches backend requirements: { role: 'user' | 'model', text: string }
let conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Clear the input field for the next message
  input.value = '';

  // Add the user's message to the chat box
  appendMessage('user', userMessage);

  // Show a temporary "Thinking..." bot message
  const thinkingMessage = appendMessage('bot', 'Thinking...');

  // Disable form inputs during the network request to prevent duplicate submissions
  toggleFormState(true);

  // Construct the payload for this request containing the full history plus the new message.
  // We do not save to conversationHistory state until the request successfully completes.
  const payload = [
    ...conversationHistory,
    { role: 'user', text: userMessage }
  ];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: payload })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.result) {
      // Replace the "Thinking..." text with the actual AI response
      thinkingMessage.textContent = data.result;

      // Upon success, commit the user message and model response to history
      conversationHistory.push({ role: 'user', text: userMessage });
      conversationHistory.push({ role: 'model', text: data.result });
    } else {
      // Handle the case where response structure is missing the result
      thinkingMessage.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    // Replace "Thinking..." with error message
    thinkingMessage.textContent = 'Failed to get response from server.';
  } finally {
    // Re-enable form inputs and scroll chat to bottom
    toggleFormState(false);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

/**
 * Appends a message to the chat container
 * @param {'user' | 'bot'} sender - The sender role (used for styling classes)
 * @param {string} text - Message text content
 * @returns {HTMLDivElement} The inner message div element created
 */
function appendMessage(sender, text) {
  // Create a row container to clear floats properly and avoid layout alignment issues
  const row = document.createElement('div');
  row.style.width = '100%';
  row.style.display = 'flow-root';
  row.style.marginBottom = '8px';

  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;

  row.appendChild(msg);
  chatBox.appendChild(row);

  // Keep chatbox scrolled to bottom
  chatBox.scrollTop = chatBox.scrollHeight;

  return msg;
}

/**
 * Disables or enables form controls during API requests
 * @param {boolean} disable 
 */
function toggleFormState(disable) {
  input.disabled = disable;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = disable;
  }
  if (!disable) {
    input.focus();
  }
}

