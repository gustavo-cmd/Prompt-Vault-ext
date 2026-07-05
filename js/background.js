// PromptVault Background Service Worker - Floating Popup Logic

let popupWindowId = null;
const POPUP_URL = 'html/popup.html';
const MIN_WIDTH = 350;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 700;

// Load saved window size from storage
async function loadWindowSize() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['popupWidth', 'popupHeight'], (result) => {
      resolve({
        width: result.popupWidth || 450,
        height: result.popupHeight || 550
      });
    });
  });
}

// Save window size to storage
async function saveWindowSize(width, height) {
  chrome.storage.local.set({
    popupWidth: Math.max(MIN_WIDTH, Math.min(width, MAX_WIDTH)),
    popupHeight: Math.max(MIN_HEIGHT, Math.min(height, MAX_HEIGHT))
  });
}

// Create or focus floating popup window
async function togglePopup() {
  if (popupWindowId !== null) {
    // Check if window still exists
    try {
      const window = await chrome.windows.get(popupWindowId);
      if (window) {
        // Window exists, focus it
        await chrome.windows.update(popupWindowId, { focused: true });
        return;
      }
    } catch (e) {
      // Window doesn't exist, reset ID
      popupWindowId = null;
    }
  }

  // Get saved size
  const { width, height } = await loadWindowSize();

  // Get current active window to position popup near it
  const currentWindow = await chrome.windows.getCurrent();
  
  // Calculate position (centered relative to browser window or screen)
  const left = Math.round(currentWindow.left + (currentWindow.width - width) / 2);
  const top = Math.round(currentWindow.top + (currentWindow.height - height) / 2);

  // Create new popup window
  const popupWindow = await chrome.windows.create({
    url: POPUP_URL,
    type: 'popup',
    width: width,
    height: height,
    left: Math.max(0, left),
    top: Math.max(0, top),
    focused: true
  });

  popupWindowId = popupWindow.id;
}

// Listen for extension icon click
chrome.action.onClicked.addListener(() => {
  togglePopup();
});

// Listen for window close events to cleanup
chrome.windows.onRemoved.addListener((closedWindowId) => {
  if (closedWindowId === popupWindowId) {
    popupWindowId = null;
  }
});

// Listen for messages from popup (e.g., close button clicked)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'closePopup' && popupWindowId !== null) {
    chrome.windows.remove(popupWindowId).catch(() => {
      // Window may have already been closed
    });
    popupWindowId = null;
  }
  return true;
});

// Listen for window resize events to save size
chrome.windows.onBoundsChanged.addListener(async (changedWindow) => {
  if (changedWindow.id === popupWindowId && changedWindow.type === 'popup') {
    await saveWindowSize(changedWindow.width, changedWindow.height);
  }
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(() => {
  popupWindowId = null;
});
