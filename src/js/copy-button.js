export class CopyButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._content = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const button = this.shadowRoot.querySelector('button');
    button.addEventListener('click', () => {
      this.copy(this._content);
    });
  }

  setContent(content) {
    this._content = content;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          padding: 0.5rem 1rem;
          background-color: var(--color-primary, oklch(55% 0.2 250));
          color: white;
          border: 1px solid var(--color-secondary, oklch(90% 0.05 250));
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        button:hover {
          background-color: var(--color-primary-hover, oklch(50% 0.2 250));
        }

        svg {
          width: 12px;
          height: 12px;
        }

        .copy-text, .copied-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .copied-text {
          display: none;
        }
      </style>
      <button aria-pressed="false">
        <span class="copy-text" aria-hidden="false">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        </span>
        <span class="copied-text" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Copied!</span>
        </span>
      </button>
    `;
  }

  async copy(content) {
    if (!content) {
      this.dispatchEvent(
        new CustomEvent('copy-error', {
          detail: { error: new Error('No content to copy') },
          bubbles: true,
          composed: true,
        })
      );
      return;
    }

    try {
      await navigator.clipboard.write([content]);
      this.showCopiedState();
    } catch (err) {
      this.dispatchEvent(
        new CustomEvent('copy-error', {
          detail: { error: err },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  reset() {
    const button = this.shadowRoot.querySelector('button');
    const copyText = button.querySelector('.copy-text');
    const copiedText = button.querySelector('.copied-text');

    copyText.style.display = 'flex';
    copiedText.style.display = 'none';
    copyText.setAttribute('aria-hidden', 'false');
    copiedText.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-pressed', 'false');

    // Clear any existing timeout
    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
      this.copyTimeoutId = null;
    }
  }

  showCopiedState() {
    const button = this.shadowRoot.querySelector('button');
    const copyText = button.querySelector('.copy-text');
    const copiedText = button.querySelector('.copied-text');

    copyText.style.display = 'none';
    copiedText.style.display = 'flex';
    copyText.setAttribute('aria-hidden', 'true');
    copiedText.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-pressed', 'true');

    // Clear any existing timeout
    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
    }

    this.copyTimeoutId = setTimeout(() => {
      this.reset();
    }, 2000);
  }
}

customElements.define('copy-button', CopyButton);
