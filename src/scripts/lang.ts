/**
 * Changing language without leaving the page. Both languages are the same markup with different
 * words, so the other language's page is fetched and whatever differs from this one's is laid over
 * the live document. Nothing is replaced: every element, and whatever scripts did to it, stays.
 */

const pages = new Map<string, Promise<Document>>();
let queue: Promise<void> = Promise.resolve();

/** Fetches a page once. Worth calling early, when a switch looks likely. */
export function loadPage(href: string) {
  let page = pages.get(href);
  if (!page) {
    page = fetch(href).then(async (response) => {
      if (!response.ok) throw new Error(`${response.status} ${href}`);
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    });
    page.catch(() => pages.delete(href));
    pages.set(href, page);
  }
  return page;
}

/** Copies onto `live` what changes between `from` and `to`, walking the three trees side by side. */
function translate(from: Node, to: Node, live: Node) {
  if (from.nodeType === Node.TEXT_NODE) {
    if (from.nodeValue !== to.nodeValue) live.nodeValue = to.nodeValue;
    return;
  }
  if (from instanceof Element && to instanceof Element && live instanceof Element) {
    for (const { name, value } of Array.from(to.attributes)) {
      if (from.getAttribute(name) !== value) live.setAttribute(name, value);
    }
    for (const { name } of Array.from(from.attributes)) {
      if (!to.hasAttribute(name)) live.removeAttribute(name);
    }
  }
  from.childNodes.forEach((child, i) => {
    const other = to.childNodes[i];
    const target = live.childNodes[i];
    // Where a script has reshaped the live page (or it is a <noscript>), that part is left alone
    if (other && target && child.nodeName === other.nodeName && child.nodeName === target.nodeName) {
      translate(child, other, target);
    }
  });
}

/** Turns the page into the one at `href`, its other-language twin. Rejects if that page cannot be fetched. */
export function switchLanguage(href: string) {
  // One at a time, so quick presses land in the order they were made
  const done = queue.then(async () => {
    const [from, to] = await Promise.all([loadPage(location.href), loadPage(href)]);
    if (from === to) return;
    translate(from.body, to.body, document.body);
    document.documentElement.lang = to.documentElement.lang;
    document.title = to.title;
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
      const content = to.querySelector(selector)?.getAttribute('content');
      if (content != null) document.querySelector(selector)?.setAttribute('content', content);
    }
    history.replaceState(history.state, '', href);
  });
  queue = done.catch(() => {});
  return done;
}
