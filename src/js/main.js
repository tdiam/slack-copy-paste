import { html, render } from 'lit-html';
import { ExtractSlack } from './slack.js';
import './copy-button.js';

// DOM Elements
const pasteAreaEl = document.querySelector('.paste-area');
const pasteZoneEl = document.querySelector('.paste-zone');
const resultAreaEl = document.querySelector('.result-area');
const outputEl = document.querySelector('.output-container');
const backButtonEl = document.querySelector('.back-button');
const copyButtonEl = document.querySelector('copy-button');
const errorMessage = document.querySelector('.error-message');
const includeEmojiCheckbox = document.querySelector('#includeEmoji');
const includeAuthorLinksCheckbox = document.querySelector(
  '#includeAuthorLinks'
);

// Store original content
let pastedContent = '';

function init() {
  // Event Listeners
  document.addEventListener('paste', handlePaste);
  pasteZoneEl.addEventListener('dragover', handleDragOver);
  pasteZoneEl.addEventListener('dragleave', handleDragLeave);
  pasteZoneEl.addEventListener('drop', handleDrop);
  backButtonEl.addEventListener('click', goBack);
  copyButtonEl.addEventListener('copy-error', (e) => {
    showError('Failed to copy content');
    console.error('Failed to copy:', e.detail.error);
  });
  includeEmojiCheckbox.addEventListener('change', handleSettingsChange);
  includeAuthorLinksCheckbox.addEventListener('change', handleSettingsChange);

  // Make the paste area clickable to focus (helps on mobile)
  pasteZoneEl.addEventListener('click', () => {
    pasteZoneEl.focus();
  });
}

// Process pasted content
function handlePaste(e) {
  e.preventDefault();

  let htmlContent = '';

  const clipboardData = e.clipboardData || window.clipboardData;

  htmlContent = clipboardData.getData('text/html');

  // If no HTML, use plain text
  if (!htmlContent) {
    htmlContent = clipboardData.getData('text');
  }

  // Store original content
  pastedContent = htmlContent;
  processHTML(htmlContent);
  document.removeEventListener('paste', handlePaste);
}

// Handle drag and drop
function handleDragOver(e) {
  e.preventDefault();
  pasteAreaEl.classList.add('highlight');
}

function handleDragLeave(e) {
  e.preventDefault();
  pasteAreaEl.classList.remove('highlight');
}

function handleDrop(e) {
  e.preventDefault();
  pasteAreaEl.classList.remove('highlight');

  const file = e.dataTransfer.files[0];
  if (
    file &&
    (file.type === 'text/html' ||
      file.name.endsWith('.html') ||
      file.type === 'text/plain')
  ) {
    const reader = new FileReader();
    reader.onload = function (event) {
      // Store original content
      pastedContent = event.target.result;
      processHTML(event.target.result);
    };
    reader.readAsText(file);
  } else {
    showError('Please drop an HTML file.');
  }
}

// Process HTML content
function processHTML(htmlContent) {
  try {
    render(html``, outputEl);
    copyButtonEl.setContent(null);
    errorMessage.textContent = '';

    const parser = new ExtractSlack({
      authorLinks: includeAuthorLinksCheckbox.checked,
      includeEmoji: includeEmojiCheckbox.checked,
    });
    parser.parse(htmlContent);
    parser.render(outputEl);

    // Update copy button click handler
    copyButtonEl.setContent(
      new ClipboardItem({
        'text/html': new Blob([outputEl.innerHTML], {
          type: 'text/html',
        }),
      })
    );

    pasteAreaEl.classList.add('hidden');
    resultAreaEl.classList.remove('hidden');
    backButtonEl.classList.remove('hidden');
  } catch (error) {
    showError('Error processing HTML: ' + error.message);
    console.error('Error processing HTML:', error);
  }
}

function showError(message) {
  errorMessage.textContent = message;
  setTimeout(() => {
    errorMessage.textContent = '';
  }, 5000);
}

// Go back to paste area
function goBack() {
  pasteAreaEl.classList.remove('hidden');
  resultAreaEl.classList.remove('hidden');
  backButtonEl.classList.remove('hidden');
  pastedContent = ''; // Reset pasted content

  // Reset copy button state
  copyButtonEl.reset();

  document.addEventListener('paste', handlePaste);
}

function handleSettingsChange() {
  // Re-process the original content with new settings
  if (pastedContent) {
    processHTML(pastedContent);
  }
}

window.addEventListener('load', init);
