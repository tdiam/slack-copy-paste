import { render } from 'lit-html';

export class HTMLParser {
  constructor() {
    this.document = null;
    this.enterHandlers = {};
    this.exitHandlers = {};
    this.replacements = new Map();
    this._collectHandlers();
  }

  _collectHandlers() {
    // Collect all methods that match the patterns enter:selector and exit:selector
    const prototype = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(prototype);

    for (const method of methods) {
      if (method.startsWith('enter:')) {
        const selector = method.slice('enter:'.length);
        this.enterHandlers[selector] = this[method].bind(this);
      } else if (method.startsWith('exit:')) {
        const selector = method.slice('exit:'.length);
        this.exitHandlers[selector] = this[method].bind(this);
      }
    }
  }

  parse(htmlString) {
    const parser = new DOMParser();
    this.document = parser.parseFromString(htmlString, 'text/html');

    // Process the document using TreeWalker
    this._processDocument();

    // Apply all replacements after traversal
    this._applyReplacements();

    return this.getResults();
  }

  _processDocument() {
    const walker = document.createTreeWalker(
      this.document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    // Stack to keep track of visited nodes
    const stack = [];

    // Helper function to process a node and its children
    const processNode = (node) => {
      if (!node) return;

      this._processHandlers(node, this.enterHandlers);

      // Push current node to stack
      stack.push(node);

      // Process the first child if it exists
      let child = walker.firstChild();
      if (child) {
        processNode(child);
      }

      // When we've processed all children, pop the node and call exit callback
      stack.pop();
      this._processHandlers(node, this.exitHandlers);

      // Process next sibling
      let sibling = walker.nextSibling();
      if (sibling) {
        processNode(sibling);
      } else if (stack.length > 0) {
        // If no siblings and stack isn't empty, go back to parent's context
        walker.parentNode();
      }
    };

    processNode(this.document.body);
  }

  _processHandlers(element, handlers) {
    for (const selector in handlers) {
      if (element.matches(selector)) {
        const result = handlers[selector](element);
        if (result !== undefined) {
          this.replacements.set(element, result);
        }
      }
    }
  }

  _applyReplacements() {
    // Apply replacements in reverse order to avoid issues with nested replacements
    const elements = Array.from(this.replacements.keys()).reverse();
    for (const element of elements) {
      const replacement = this.replacements.get(element);

      if (replacement === null) {
        // Remove the element if the handler returned null
        element.remove();
      } else {
        // Create a temporary container for lit-html rendering
        const temp = document.createElement('div');

        if (typeof replacement === 'string') {
          element.outerHTML = replacement;
        } else {
          // Assume it's a lit-html template result
          render(replacement, temp);
          element.outerHTML = temp.innerHTML;
        }
      }
    }
    this.replacements.clear();
  }

  // This should be overridden by subclasses
  getResults() {
    return null;
  }
}
