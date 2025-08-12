import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

import { HTMLParser } from './htmlparser.js';

export class ExtractSlack extends HTMLParser {
  constructor(options = {}) {
    super();
    this.options = options;
    this.messages = [];
    this.slots = {};
    this.slots.message = {};
  }

  'exit:[data-qa=message_container]'() {
    this.messages.push(this.slots.message);
    this.slots.message = {};
  }

  'exit:body'() {
    if (this.slots.message.content) {
      this.messages.push(this.slots.message);
    }
  }

  'enter:[data-qa=message_sender_name]'(el) {
    this.slots.message.author = {
      name: el.innerText,
      id: el.getAttribute('data-message-sender'),
    };
  }

  'enter:.c-timestamp'(el) {
    if (!this.slots.workspaceUrl) {
      this.slots.workspaceUrl = new URL(el.getAttribute('href')).origin;
    }

    this.slots.message.timestamp = new Date(
      1000 * parseFloat(el.getAttribute('data-ts'))
    );
  }

  'enter:.p-rich_text_section'(el) {
    this.slots.message.content = unsafeHTML(el.innerHTML);
  }

  formatDate(dt) {
    const datePart = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeZone: 'America/New_York',
    }).format(dt);
    const timePart = new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
      timeZone: 'America/New_York',
    }).format(dt);

    return `${datePart}, ${timePart} ET`;
  }

  renderMessage(m, idx) {
    const renderHeader = () => {
      if (!m.author) {
        // if m.author is empty, then this is a consecutive message by same author
        return;
      }

      return html`
        ${idx > 0 ? html`<hr />` : null}
        <strong>${renderAuthor()}</strong> – ${renderTime()}
      `;
    };

    const renderAuthor = () => {
      if (this.options.authorLinks && this.slots.workspaceUrl) {
        return html`<a href="${this.slots.workspaceUrl}/team/${m.author.id}"
          >${m.author.name}</a
        >`;
      }

      return m.author.name;
    };

    const renderTime = () => {
      if (!m.author) {
        // avoid showing consecutive timestamps for the same author
        return;
      }

      const iso = m.timestamp.toISOString();
      const formatted = this.formatDate(m.timestamp);

      return html`<time datetime=${iso}>${formatted}</time>`;
    };

    return html`
      ${renderHeader()}
      <p>${m.content}</p>
    `;
  }

  render(el) {
    const items = [];

    for (const [idx, message] of Object.entries(this.messages)) {
      items.push(this.renderMessage(message, idx));
    }

    render(items, el);
  }
}
