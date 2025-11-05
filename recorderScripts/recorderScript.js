(() => {
  function isDynamic(value) {
    // Check for dynamic patterns: UUIDs, timestamps, random numbers, session IDs, minified classes
    const dynamicPatterns = [
      /\d{13,}/,  // Timestamps
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i,  // UUIDs
      /^[a-z0-9]{20,}$/i,  // Long random strings
      /(session|token|temp|tmp|random|guid|uuid)/i,  // Dynamic keywords
      /\d{10,}/,  // Long numbers
      /-\d+-/,  // Patterns like item-123-container
      /^[A-Z][a-z0-9]{5}$/,  // Minified classes like WOvzF4
      /^_[a-zA-Z0-9]{5,}$/,  // Underscore prefixed like _7dPnhA
      /^[a-z]{1,2}[A-Z][a-z0-9]{4,}$/,  // camelCase minified like aBcDef
      /^[a-zA-Z]{1,3}\d{3,}$/,  // Short letters + numbers like ab123
      /^[a-zA-Z0-9]{6}$/,  // Exactly 6 random chars
      /^[A-Z]{2,}[a-z0-9]{4,}$/,  // Multiple caps + lowercase like ABcdef
    ];
    return dynamicPatterns.some(pattern => pattern.test(value));
  }
  
  function hasMinifiedClasses(classString) {
    if (!classString) return false;
    const classes = classString.split(' ').filter(c => c);
    // If more than 50% of classes look minified, consider it dynamic
    const minifiedCount = classes.filter(c => isDynamic(c)).length;
    return minifiedCount > classes.length * 0.5;
  }

  function getStabilityScore(type, value) {
    // Higher score = more stable and preferred
    const baseScores = {
      'data-testid': 100,
      'data-test': 95,
      'ID': 90,
      'name': 85,
      'aria-label': 80,
      'placeholder': 75,
      'type': 70,
      'role': 65,
      'text': 60,
      'class': 40,
      'CSS Path': 30,
      'XPath': 20
    };
    
    let score = baseScores[type] || 10;
    
    // Penalize if contains dynamic values
    if (isDynamic(value)) {
      score -= 50;
    }
    
    // Penalize very long selectors (likely fragile)
    if (value.length > 100) {
      score -= 20;
    }
    
    // Bonus for short, simple selectors
    if (value.length < 30) {
      score += 10;
    }
    
    return score;
  }

  function getMatchCount(selector) {
    try {
      return document.querySelectorAll(selector).length;
    } catch (e) {
      return '?';
    }
  }

  function getAllSelectors(el) {
    const selectors = [];
    
    // getByRole with accessible name (Playwright best practice)
    const role = el.getAttribute('role') || (el.tagName === 'BUTTON' ? 'button' : el.tagName === 'A' ? 'link' : null);
    const ariaLabel = el.getAttribute('aria-label');
    const text = el.textContent?.trim();
    
    if (role && (ariaLabel || text)) {
      const name = ariaLabel || text.substring(0, 30);
      selectors.push({
        type: 'getByRole',
        playwright: `getByRole('${role}', { name: '${name}' })`,
        css: `[role="${role}"]`,
        xpath: `//*[@role="${role}"]`,
        score: 95,
        matches: '?'
      });
    }
    
    // data-testid (highest priority for testing)
    if (el.getAttribute('data-testid')) {
      const testid = el.getAttribute('data-testid');
      if (!isDynamic(testid)) {
        const css = `[data-testid="${testid}"]`;
        selectors.push({ 
          type: 'data-testid', 
          playwright: `getByTestId('${testid}')`,
          css, 
          xpath: `//*[@data-testid="${testid}"]`,
          score: getStabilityScore('data-testid', testid),
          matches: getMatchCount(css)
        });
      }
    }
    
    // data-test
    if (el.getAttribute('data-test')) {
      const test = el.getAttribute('data-test');
      if (!isDynamic(test)) {
        const css = `[data-test="${test}"]`;
        selectors.push({ 
          type: 'data-test', 
          css, 
          xpath: `//*[@data-test="${test}"]`,
          score: getStabilityScore('data-test', test),
          matches: getMatchCount(css)
        });
      }
    }
    
    // ID (only if not dynamic)
    if (el.id && !isDynamic(el.id)) {
      const css = `#${el.id}`;
      selectors.push({ 
        type: 'ID', 
        css, 
        xpath: `//*[@id="${el.id}"]`,
        score: getStabilityScore('ID', el.id),
        matches: getMatchCount(css)
      });
    }
    
    // name
    if (el.getAttribute('name')) {
      const name = el.getAttribute('name');
      if (!isDynamic(name)) {
        const css = `[name="${name}"]`;
        selectors.push({ 
          type: 'name', 
          css, 
          xpath: `//*[@name="${name}"]`,
          score: getStabilityScore('name', name),
          matches: getMatchCount(css)
        });
      }
    }
    
    // aria-label (getByLabel)
    if (el.getAttribute('aria-label')) {
      const label = el.getAttribute('aria-label');
      const css = `[aria-label="${label}"]`;
      selectors.push({ 
        type: 'aria-label', 
        playwright: `getByLabel('${label}')`,
        css, 
        xpath: `//*[@aria-label="${label}"]`,
        score: getStabilityScore('aria-label', label),
        matches: getMatchCount(css)
      });
    }
    
    // Label text (for form inputs)
    const labelEl = document.querySelector(`label[for="${el.id}"]`);
    if (labelEl && labelEl.textContent.trim()) {
      const labelText = labelEl.textContent.trim();
      selectors.push({
        type: 'label',
        playwright: `getByLabel('${labelText}')`,
        css: `[id="${el.id}"]`,
        xpath: `//*[@id="${el.id}"]`,
        score: 88,
        matches: 1
      });
    }
    
    // placeholder (getByPlaceholder)
    if (el.getAttribute('placeholder')) {
      const placeholder = el.getAttribute('placeholder');
      const css = `[placeholder="${placeholder}"]`;
      selectors.push({ 
        type: 'placeholder', 
        playwright: `getByPlaceholder('${placeholder}')`,
        css, 
        xpath: `//*[@placeholder="${placeholder}"]`,
        score: getStabilityScore('placeholder', placeholder),
        matches: getMatchCount(css)
      });
    }
    
    // type attribute (for inputs)
    if (el.getAttribute('type') && el.tagName === 'INPUT') {
      const type = el.getAttribute('type');
      const css = `input[type="${type}"]`;
      selectors.push({ 
        type: 'type', 
        css, 
        xpath: `//input[@type="${type}"]`,
        score: getStabilityScore('type', type),
        matches: getMatchCount(css)
      });
    }
    
    // role attribute
    if (el.getAttribute('role')) {
      const role = el.getAttribute('role');
      const css = `[role="${role}"]`;
      selectors.push({ 
        type: 'role', 
        css, 
        xpath: `//*[@role="${role}"]`,
        score: getStabilityScore('role', role),
        matches: getMatchCount(css)
      });
    }
    
    // text content (getByText/getByRole)
    if ((el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'SPAN' || el.tagName === 'DIV') && el.textContent.trim()) {
      const text = el.textContent.trim().substring(0, 30);
      const css = `${el.tagName.toLowerCase()}:has-text("${text}")`;
      const pwLocator = el.tagName === 'BUTTON' ? `getByRole('button', { name: '${text}' })` : 
                        el.tagName === 'A' ? `getByRole('link', { name: '${text}' })` :
                        `getByText('${text}')`;
      selectors.push({ 
        type: 'text', 
        playwright: pwLocator,
        css, 
        xpath: `//${el.tagName.toLowerCase()}[contains(text(), "${text}")]`,
        score: getStabilityScore('text', text),
        matches: '?'
      });
    }
    
    // Filter by text (chaining)
    if (el.className && !hasMinifiedClasses(el.className) && text && text.length < 30) {
      const stableClass = el.className.split(' ').find(c => !isDynamic(c));
      if (stableClass) {
        selectors.push({
          type: 'filter',
          playwright: `locator('.${stableClass}').filter({ hasText: '${text}' })`,
          css: `.${stableClass}`,
          xpath: `//*[contains(@class, "${stableClass}")]`,
          score: 72,
          matches: '?'
        });
      }
    }
    
    // Locator chaining with parent
    if (el.parentElement && el.parentElement.getAttribute('data-testid')) {
      const parentTestId = el.parentElement.getAttribute('data-testid');
      const tag = el.tagName.toLowerCase();
      selectors.push({
        type: 'chain',
        playwright: `getByTestId('${parentTestId}').locator('${tag}')`,
        css: `[data-testid="${parentTestId}"] ${tag}`,
        xpath: `//*[@data-testid="${parentTestId}"]//${tag}`,
        score: 78,
        matches: '?'
      });
    }
    
    // CSS Path (only if has stable classes)
    const tag = el.tagName.toLowerCase();
    const allClasses = el.className && typeof el.className === 'string' 
      ? el.className.split(' ').filter(c => c)
      : [];
    
    // Filter out dynamic and state classes
    const stableClasses = allClasses.filter(c => {
      return c && 
             !c.match(/^(active|hover|focus|selected|disabled|open|closed|visible|hidden)$/i) &&
             !isDynamic(c);
    });
    
    // Only use class-based selector if we have stable classes
    const classes = stableClasses.length > 0 ? stableClasses.slice(0, 2).join('.') : '';
    
    let nth = 1;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === el.tagName) nth++;
      sibling = sibling.previousElementSibling;
    }
    
    let cssPath = classes ? `${tag}.${classes}` : tag;
    if (nth > 1 || !classes) {
      cssPath += `:nth-of-type(${nth})`;
    }
    
    // Only add parent context if parent has stable classes
    if (el.parentElement && el.parentElement.tagName !== 'BODY') {
      const parent = el.parentElement;
      const parentTag = parent.tagName.toLowerCase();
      const parentAllClasses = parent.className && typeof parent.className === 'string'
        ? parent.className.split(' ').filter(c => c)
        : [];
      const parentStableClasses = parentAllClasses.filter(c => !isDynamic(c));
      const parentClasses = parentStableClasses.length > 0 ? parentStableClasses.slice(0, 1).join('.') : '';
      const parentSelector = parentClasses ? `${parentTag}.${parentClasses}` : parentTag;
      cssPath = `${parentSelector} > ${cssPath}`;
    }
    
    // Skip CSS Path if it contains only dynamic classes or is too generic
    const skipCssPath = !classes || hasMinifiedClasses(el.className || '');
    
    // XPath - Basic positional
    let xpathParts = [];
    let current = el;
    let depth = 0;
    while (current && current.tagName !== 'BODY' && depth < 3) {
      const tag = current.tagName.toLowerCase();
      let position = 1;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) position++;
        sibling = sibling.previousElementSibling;
      }
      xpathParts.unshift(`${tag}[${position}]`);
      current = current.parentElement;
      depth++;
    }
    const xpath = '//' + xpathParts.join('/');
    
    // Always add CSS Path but mark with warning if dynamic
    const hasDynamicClasses = hasMinifiedClasses(el.className || '');
    const cssPathScore = getStabilityScore('CSS Path', cssPath);
    
    selectors.push({ 
      type: hasDynamicClasses ? 'CSS Path ⚠️' : 'CSS Path', 
      css: cssPath, 
      xpath,
      score: hasDynamicClasses ? cssPathScore - 30 : cssPathScore,
      warning: hasDynamicClasses,
      matches: getMatchCount(cssPath)
    });
    
    // Advanced XPath strategies - only if no unique selector found
    const hasUniqueSelector = selectors.some(s => s.matches === 1);
    if (!hasUniqueSelector) {
      const advancedXPaths = [];
      
      // Strategy 1: Using preceding-sibling with stable attributes
      if (el.previousElementSibling) {
        const prevSibling = el.previousElementSibling;
        if (prevSibling.id && !isDynamic(prevSibling.id)) {
          advancedXPaths.push({
            type: 'XPath (preceding-sibling)',
            css: null,
            xpath: `//*[@id="${prevSibling.id}"]/following-sibling::${el.tagName.toLowerCase()}[1]`,
            score: 70,
            matches: '?'
          });
        } else if (prevSibling.className && !hasMinifiedClasses(prevSibling.className)) {
          const stableClass = prevSibling.className.split(' ').find(c => !isDynamic(c));
          if (stableClass) {
            advancedXPaths.push({
              type: 'XPath (preceding-sibling)',
              css: null,
              xpath: `//*[contains(@class,"${stableClass}")]/following-sibling::${el.tagName.toLowerCase()}[1]`,
              score: 65,
              matches: '?'
            });
          }
        }
      }
      
      // Strategy 2: Using parent with stable attributes
      if (el.parentElement && el.parentElement.tagName !== 'BODY') {
        const parent = el.parentElement;
        if (parent.id && !isDynamic(parent.id)) {
          const childIndex = Array.from(parent.children).indexOf(el) + 1;
          advancedXPaths.push({
            type: 'XPath (parent)',
            css: null,
            xpath: `//*[@id="${parent.id}"]/*[${childIndex}]`,
            score: 68,
            matches: '?'
          });
        } else if (parent.getAttribute('role')) {
          const childIndex = Array.from(parent.children).indexOf(el) + 1;
          advancedXPaths.push({
            type: 'XPath (parent role)',
            css: null,
            xpath: `//*[@role="${parent.getAttribute('role')}"]/*[${childIndex}]`,
            score: 66,
            matches: '?'
          });
        }
      }
      
      // Strategy 3: Using text of nearby elements
      if (el.previousElementSibling && el.previousElementSibling.textContent.trim()) {
        const siblingText = el.previousElementSibling.textContent.trim().substring(0, 20);
        advancedXPaths.push({
          type: 'XPath (sibling text)',
          css: null,
          xpath: `//*[contains(text(),"${siblingText}")]/following-sibling::${el.tagName.toLowerCase()}[1]`,
          score: 62,
          matches: '?'
        });
      }
      
      // Strategy 4: Using ancestor with stable attribute
      let ancestor = el.parentElement;
      let ancestorDepth = 0;
      while (ancestor && ancestor.tagName !== 'BODY' && ancestorDepth < 3) {
        if (ancestor.id && !isDynamic(ancestor.id)) {
          advancedXPaths.push({
            type: 'XPath (ancestor)',
            css: null,
            xpath: `//*[@id="${ancestor.id}"]//${el.tagName.toLowerCase()}[${nth}]`,
            score: 64,
            matches: '?'
          });
          break;
        }
        ancestor = ancestor.parentElement;
        ancestorDepth++;
      }
      
      // Strategy 5: Combining multiple attributes
      const attrs = [];
      if (el.className && !hasMinifiedClasses(el.className)) {
        const stableClass = el.className.split(' ').find(c => !isDynamic(c));
        if (stableClass) attrs.push(`contains(@class,"${stableClass}")`);
      }
      if (el.getAttribute('type')) attrs.push(`@type="${el.getAttribute('type')}"`);
      if (attrs.length >= 2) {
        advancedXPaths.push({
          type: 'XPath (multi-attr)',
          css: null,
          xpath: `//${el.tagName.toLowerCase()}[${attrs.join(' and ')}]`,
          score: 60,
          matches: '?'
        });
      }
      
      selectors.push(...advancedXPaths);
    }
    
    // Sort by stability score (highest first)
    selectors.sort((a, b) => b.score - a.score);
    
    // Return all selectors with warnings for unstable ones
    return selectors;
  }

  function getSelector(el) {
    const all = getAllSelectors(el);
    // Return the best selector (highest score) with playwright property
    if (all.length > 0) {
      const best = all[0];
      return { 
        css: best.css, 
        xpath: best.xpath,
        playwright: best.playwright
      };
    }
    
    // Fallback to basic selectors
    // Priority 1: ID
    if (el.id && !isDynamic(el.id)) return { css: `#${el.id}`, xpath: `//*[@id="${el.id}"]` };
    
    // Priority 2: data-testid or data-test
    if (el.getAttribute('data-testid')) {
      const testid = el.getAttribute('data-testid');
      return { css: `[data-testid="${testid}"]`, xpath: `//*[@data-testid="${testid}"]`, playwright: `getByTestId('${testid}')` };
    }
    if (el.getAttribute('data-test')) {
      const test = el.getAttribute('data-test');
      return { css: `[data-test="${test}"]`, xpath: `//*[@data-test="${test}"]` };
    }
    
    // Priority 3: name attribute (for form elements)
    if (el.getAttribute('name')) {
      const name = el.getAttribute('name');
      return { css: `[name="${name}"]`, xpath: `//*[@name="${name}"]` };
    }
    
    // Priority 4: aria-label
    if (el.getAttribute('aria-label')) {
      const label = el.getAttribute('aria-label');
      return { css: `[aria-label="${label}"]`, xpath: `//*[@aria-label="${label}"]`, playwright: `getByLabel('${label}')` };
    }
    
    // Priority 5: placeholder (for inputs)
    if (el.getAttribute('placeholder')) {
      const placeholder = el.getAttribute('placeholder');
      return { css: `[placeholder="${placeholder}"]`, xpath: `//*[@placeholder="${placeholder}"]`, playwright: `getByPlaceholder('${placeholder}')` };
    }
    
    // Priority 6: text content for links and buttons
    if ((el.tagName === 'A' || el.tagName === 'BUTTON') && el.textContent.trim()) {
      const text = el.textContent.trim().substring(0, 30);
      const pwLocator = el.tagName === 'BUTTON' ? `getByRole('button', { name: '${text}' })` : `getByRole('link', { name: '${text}' })`;
      return { 
        css: `${el.tagName.toLowerCase()}:has-text("${text}")`,
        xpath: `//${el.tagName.toLowerCase()}[contains(text(), "${text}")]`,
        playwright: pwLocator
      };
    }
    
    // Priority 7: Build path with classes and nth-child
    const tag = el.tagName.toLowerCase();
    const classes = el.className && typeof el.className === 'string' 
      ? el.className.split(' ').filter(c => c && !c.match(/^(active|hover|focus|selected)$/)).slice(0, 2).join('.')
      : '';
    
    // Get nth-child position
    let nth = 1;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === el.tagName) nth++;
      sibling = sibling.previousElementSibling;
    }
    
    // Build CSS selector with parent context
    let cssPath = classes ? `${tag}.${classes}` : tag;
    if (nth > 1 || !classes) {
      cssPath += `:nth-of-type(${nth})`;
    }
    
    // Add parent context if needed for uniqueness
    if (el.parentElement && el.parentElement.tagName !== 'BODY') {
      const parent = el.parentElement;
      const parentTag = parent.tagName.toLowerCase();
      const parentClasses = parent.className && typeof parent.className === 'string'
        ? parent.className.split(' ').filter(c => c).slice(0, 1).join('.')
        : '';
      const parentSelector = parentClasses ? `${parentTag}.${parentClasses}` : parentTag;
      cssPath = `${parentSelector} > ${cssPath}`;
    }
    
    // Build XPath
    let xpathParts = [];
    let current = el;
    let depth = 0;
    while (current && current.tagName !== 'BODY' && depth < 3) {
      const tag = current.tagName.toLowerCase();
      let position = 1;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) position++;
        sibling = sibling.previousElementSibling;
      }
      xpathParts.unshift(`${tag}[${position}]`);
      current = current.parentElement;
      depth++;
    }
    const xpath = '//' + xpathParts.join('/');
    
    return { css: cssPath, xpath };
  }

  let lastInputTime = {};
  let highlightedElement = null;

  // Create highlight overlay
  const highlightOverlay = document.createElement('div');
  highlightOverlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999999;
    background: rgba(78, 201, 176, 0.2);
    border: 2px solid #4ec9b0;
    box-shadow: 0 0 0 2px rgba(78, 201, 176, 0.3);
    transition: all 0.1s ease;
  `;
  document.body.appendChild(highlightOverlay);

  // Highlight element on hover
  document.addEventListener('mouseover', e => {
    if (e.target === highlightOverlay) return;
    highlightedElement = e.target;
    const rect = e.target.getBoundingClientRect();
    highlightOverlay.style.top = (rect.top + window.scrollY) + 'px';
    highlightOverlay.style.left = (rect.left + window.scrollX) + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
    highlightOverlay.style.display = 'block';
  }, true);

  document.addEventListener('mouseout', e => {
    if (e.target === highlightedElement) {
      highlightOverlay.style.display = 'none';
      highlightedElement = null;
    }
  }, true);

  // Click events
  document.addEventListener('click', e => {
    // Ignore clicks on context menu
    if (contextMenu.contains(e.target) || e.target === contextMenu) {
      return;
    }
    const selectors = getSelector(e.target);
    const event = { type: 'click', ...selectors, timestamp: Date.now() };
    window.postMessage({ source: 'recorder', event }, '*');
  }, true);

  // Input events (text, textarea)
  let lastInputValues = {};
  document.addEventListener('input', e => {
    const selectors = getSelector(e.target);
    const key = selectors.css;
    clearTimeout(lastInputTime[key]);
    lastInputTime[key] = setTimeout(() => {
      // Only record if value changed from last recorded value
      if (lastInputValues[key] !== e.target.value) {
        lastInputValues[key] = e.target.value;
        const event = { type: 'input', ...selectors, value: e.target.value, timestamp: Date.now() };
        window.postMessage({ source: 'recorder', event }, '*');
      }
    }, 1000);
  });

  // Change events (select, checkbox, radio)
  document.addEventListener('change', e => {
    const el = e.target;
    const selectors = getSelector(el);
    let event;
    
    if (el.type === 'checkbox') {
      event = { type: 'check', ...selectors, checked: el.checked, timestamp: Date.now() };
    } else if (el.type === 'radio') {
      event = { type: 'check', ...selectors, checked: el.checked, timestamp: Date.now() };
    } else if (el.tagName === 'SELECT') {
      event = { type: 'select', ...selectors, value: el.value, timestamp: Date.now() };
    } else {
      return;
    }
    window.postMessage({ source: 'recorder', event }, '*');
  });

  // Keyboard events
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Enter') {
        const selectors = getSelector(e.target);
        const event = { type: 'press', ...selectors, key: 'Enter', timestamp: Date.now() };
        window.postMessage({ source: 'recorder', event }, '*');
      }
    }
  });

  // Form submit
  document.addEventListener('submit', e => {
    const selectors = getSelector(e.target);
    const event = { type: 'submit', ...selectors, timestamp: Date.now() };
    window.postMessage({ source: 'recorder', event }, '*');
  }, true);

  // Double click
  document.addEventListener('dblclick', e => {
    const selectors = getSelector(e.target);
    const event = { type: 'dblclick', ...selectors, timestamp: Date.now() };
    window.postMessage({ source: 'recorder', event }, '*');
  }, true);

  // Create context menu overlay
  const contextMenu = document.createElement('div');
  contextMenu.style.cssText = `
    position: fixed;
    display: none;
    background: #2d2d30;
    border: 1px solid #4ec9b0;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    z-index: 9999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    min-width: 200px;
    max-height: 80vh;
    overflow-y: auto;
  `;
  document.body.appendChild(contextMenu);

  let contextElement = null;

  let selectedLocator = null;
  let selectedLocatorElement = null;

  function showContextMenu(x, y, element) {
    contextElement = element;
    const allSelectors = getAllSelectors(element);
    selectedLocator = allSelectors[0] ? { css: allSelectors[0].css, xpath: null } : getSelector(element);
    selectedLocatorElement = null;
    const value = element.innerText || element.value || '';
    
    const locatorOptions = allSelectors.map((sel, idx) => {
      const rankBadge = idx === 0 ? '⭐ ' : `${idx + 1}. `;
      const scoreColor = sel.score >= 80 ? '#4ec9b0' : sel.score >= 60 ? '#dcdcaa' : '#ce9178';
      const matchColor = sel.matches === 1 ? '#4ec9b0' : sel.matches > 1 && sel.matches <= 5 ? '#dcdcaa' : '#f48771';
      const matchIcon = sel.matches === 1 ? '✅' : sel.matches > 1 ? '⚠️' : '❓';
      const warningMsg = sel.warning ? `<div style="color: #f48771; font-size: 9px; margin-top: 2px;">⚠️ May break on page rebuild (contains dynamic classes)</div>` : '';
      const playwrightOption = sel.playwright ? `<div class="locator-option" data-index="${idx}" data-locator-type="playwright" style="padding: 4px 8px; color: #4ec9b0; cursor: pointer; font-size: 10px; font-family: monospace; border-radius: 2px; margin: 2px 0; ${idx === 0 ? 'background: #37373d;' : ''}">
          🎭 Playwright: ${sel.playwright}
        </div>` : '';
      return `<div style="padding: 6px 16px; border-bottom: 1px solid #3e3e42;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="color: ${scoreColor}; font-size: 10px; font-weight: 600;">${rankBadge}${sel.type}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: ${matchColor}; font-size: 9px;">${matchIcon} ${sel.matches} match${sel.matches === 1 ? '' : 'es'}</span>
            <span style="color: #858585; font-size: 9px;">Score: ${sel.score}</span>
          </div>
        </div>
        ${warningMsg}
        ${playwrightOption}
        <div class="locator-option" data-index="${idx}" data-locator-type="css" style="padding: 4px 8px; color: #ce9178; cursor: pointer; font-size: 10px; font-family: monospace; border-radius: 2px; margin: 2px 0;">
          📋 CSS: ${sel.css}
        </div>
        <div class="locator-option" data-index="${idx}" data-locator-type="xpath" style="padding: 4px 8px; color: #9cdcfe; cursor: pointer; font-size: 10px; font-family: monospace; border-radius: 2px; margin: 2px 0;">
          📋 XPath: ${sel.xpath}
        </div>
      </div>`;
    }).join('');
    
    contextMenu.innerHTML = `
      <div style="padding: 8px 16px; background: #1e1e1e; color: #4ec9b0; font-weight: 600; border-bottom: 1px solid #3e3e42; display: flex; justify-content: space-between; align-items: center;">
        <span>Actions & Assertions</span>
        <button class="context-close" style="background: none; border: none; color: #e4e4e7; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;">×</button>
      </div>
      <div style="padding: 4px 0;">
        <div class="menu-section" style="padding: 4px 12px; color: #858585; font-size: 11px; font-weight: 600;">LOCATORS</div>
        ${locatorOptions}
        <div style="border-top: 1px solid #3e3e42; margin: 4px 0;"></div>
      </div>
      <div style="padding: 4px 0;">
        <div class="menu-section" style="padding: 4px 12px; color: #858585; font-size: 11px; font-weight: 600;">ACTIONS</div>
        <div class="menu-item" data-action="click" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">🖱️ Click</div>
        <div class="menu-item" data-action="dblclick" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">🖱️ Double Click</div>
        <div class="menu-item" data-action="hover" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">👆 Hover</div>
        ${element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? 
          '<div class="menu-item" data-action="fill" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">⌨️ Fill Text</div>' : ''}
        
        <div style="border-top: 1px solid #3e3e42; margin: 4px 0;"></div>
        <div class="menu-section" style="padding: 4px 12px; color: #858585; font-size: 11px; font-weight: 600;">ASSERTIONS</div>
        <div class="menu-item" data-action="assert-visible" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">👁️ Assert Visible</div>
        ${value ? '<div class="menu-item" data-action="assert-text" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">📝 Assert Text</div>' : ''}
        ${element.value !== undefined ? '<div class="menu-item" data-action="assert-value" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">✏️ Assert Value</div>' : ''}
        <div class="menu-item" data-action="assert-enabled" style="padding: 8px 16px; color: #d4d4d4; cursor: pointer;">✅ Assert Enabled</div>
      </div>
    `;

    // Locator selection
    contextMenu.querySelectorAll('.locator-option').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = '#37373d';
      });
      item.addEventListener('mouseleave', () => {
        if (item !== selectedLocatorElement) {
          item.style.background = 'transparent';
        }
      });
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(item.dataset.index);
        const locatorType = item.dataset.locatorType;
        
        // Create a custom selector object based on user choice
        const baseSelector = allSelectors[idx];
        if (locatorType === 'playwright') {
          // User selected Playwright advanced locator
          selectedLocator = { playwright: baseSelector.playwright, css: baseSelector.css, xpath: baseSelector.xpath };
        } else if (locatorType === 'css') {
          // User selected CSS - set xpath to undefined (not null)
          selectedLocator = { css: baseSelector.css };
          delete selectedLocator.xpath;
          delete selectedLocator.playwright;
        } else {
          // User selected XPath - set css to undefined (not null)
          selectedLocator = { xpath: baseSelector.xpath };
          delete selectedLocator.css;
          delete selectedLocator.playwright;
        }
        
        // Update visual selection
        contextMenu.querySelectorAll('.locator-option').forEach(opt => {
          opt.style.background = 'transparent';
        });
        item.style.background = '#37373d';
        selectedLocatorElement = item;
      });
    });

    // Close button handler
    const closeBtn = contextMenu.querySelector('.context-close');
    if (closeBtn) {
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        closeBtn.style.color = '#ef4444';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
        closeBtn.style.color = '#e4e4e7';
      });
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        contextMenu.style.display = 'none';
      });
    }
    
    // Add hover effects
    contextMenu.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = '#37373d';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        handleContextAction(action, selectedLocator, value);
        contextMenu.style.display = 'none';
      });
    });

    // Position menu
    contextMenu.style.display = 'block';
    
    // Adjust position based on viewport
    setTimeout(() => {
      const rect = contextMenu.getBoundingClientRect();
      const menuHeight = rect.height;
      const menuWidth = rect.width;
      
      // Horizontal positioning
      let left = x;
      if (x + menuWidth > window.innerWidth) {
        left = x - menuWidth;
      }
      
      // Vertical positioning - show below if near top, above if near bottom
      let top = y;
      if (y < menuHeight / 2) {
        // Near top - show below cursor
        top = y + 10;
      } else if (y + menuHeight > window.innerHeight) {
        // Near bottom - show above cursor
        top = y - menuHeight;
      }
      
      contextMenu.style.left = left + 'px';
      contextMenu.style.top = top + 'px';
    }, 0);
  }

  function handleContextAction(action, selectors, value) {
    let event;
    switch(action) {
      case 'click':
        event = { type: 'click', ...selectors, timestamp: Date.now() };
        break;
      case 'dblclick':
        event = { type: 'dblclick', ...selectors, timestamp: Date.now() };
        break;
      case 'hover':
        event = { type: 'hover', ...selectors, timestamp: Date.now() };
        break;
      case 'fill':
        contextElement.focus();
        contextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const text = prompt('Enter text to fill:');
          if (text !== null) {
            contextElement.value = text;
            contextElement.dispatchEvent(new Event('input', { bubbles: true }));
            contextElement.dispatchEvent(new Event('change', { bubbles: true }));
            event = { type: 'input', ...selectors, value: text, timestamp: Date.now() };
            if (event) {
              window.postMessage({ source: 'recorder', event }, '*');
            }
          }
        }, 100);
        return;
      case 'assert-visible':
        event = { type: 'assertion', ...selectors, assertType: 'isVisible', value: '', timestamp: Date.now() };
        break;
      case 'assert-text':
        event = { type: 'assertion', ...selectors, assertType: 'containsText', value, timestamp: Date.now() };
        break;
      case 'assert-value':
        event = { type: 'assertion', ...selectors, assertType: 'hasValue', value, timestamp: Date.now() };
        break;
      case 'assert-enabled':
        event = { type: 'assertion', ...selectors, assertType: 'isEnabled', value: '', timestamp: Date.now() };
        break;
    }
    if (event) {
      window.postMessage({ source: 'recorder', event }, '*');
    }
  }

  // Right-click to show context menu
  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (e.target === contextMenu || contextMenu.contains(e.target)) return;
    showContextMenu(e.pageX, e.pageY, e.target);
  }, true);

  // Close menu on click outside
  document.addEventListener('click', e => {
    if (contextMenu.style.display === 'block' && !contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  }, true);

  // Also close on escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && contextMenu.style.display === 'block') {
      contextMenu.style.display = 'none';
    }
  });

  function scanPageElements() {
    const elements = [];
    const seen = new Set();
    const locatorMap = new Map(); // Track used locators
    
    // Priority selectors
    const prioritySelectors = [
      '[data-testid]', '[data-test]', '[data-automation-id]', '[automation-id]',
      'input:not([type="hidden"])', 'button', 'textarea', 'select',
      '[role="button"]', '[role="navigation"]', '[role="menu"]', '[role="menuitem"]',
      'a[href]', '[role="link"]',
      'nav a', 'nav button',
      '[id]:not([id=""])',
      'form', 'table',
      '[role="dialog"]', '[role="alert"]',
      'h1, h2, h3'
    ];
    
    prioritySelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach((el) => {
          if (seen.has(el)) return;
          if (!isElementValid(el)) return;
          
          const allSels = getAllSelectors(el);
          if (allSels.length === 0) return;
          
          const best = allSels[0];
          const elementData = createElementData(el, best, elements.length, locatorMap);
          if (elementData) {
            elements.push(elementData);
            seen.add(el);
          }
        });
      } catch (e) {}
    });
    
    return elements;
  }
  
  function isElementValid(el) {
    // Skip hidden elements
    if (!el.offsetParent && el.tagName !== 'INPUT') return false;
    
    // Skip images unless they have important attributes
    if (el.tagName === 'IMG' && !el.getAttribute('data-testid') && !el.id) return false;
    
    // Skip SVG and icons unless they have role or data attributes
    if ((el.tagName === 'SVG' || el.tagName === 'I') && !el.getAttribute('role') && !el.getAttribute('data-testid')) return false;
    
    // Skip elements with dynamic classes only
    if (el.className && typeof el.className === 'string' && hasMinifiedClasses(el.className) && !el.id && !el.getAttribute('data-testid')) return false;
    
    // Skip script, style, meta tags
    if (['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT'].includes(el.tagName)) return false;
    
    return true;
  }
  
  function buildAccurateCssSelector(el) {
    // Try to build CSS selector using parent/grandparent context
    const tag = el.tagName.toLowerCase();
    
    // Check if element has unique ID
    if (el.id && !isDynamic(el.id)) {
      return `#${el.id}`;
    }
    
    // Check for data-testid or other test attributes
    if (el.getAttribute('data-testid') && !isDynamic(el.getAttribute('data-testid'))) {
      return `[data-testid="${el.getAttribute('data-testid')}"]`;
    }
    
    // Check for unique name attribute
    if (el.getAttribute('name') && !isDynamic(el.getAttribute('name'))) {
      const name = el.getAttribute('name');
      if (document.querySelectorAll(`[name="${name}"]`).length === 1) {
        return `[name="${name}"]`;
      }
    }
    
    // Try to find parent with unique identifier
    let current = el;
    let path = [];
    let depth = 0;
    
    while (current && current !== document.body && depth < 4) {
      const currentTag = current.tagName.toLowerCase();
      let selector = currentTag;
      
      // Add ID if present and not dynamic
      if (current.id && !isDynamic(current.id)) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break; // Found unique parent, stop here
      }
      
      // Add data-testid if present
      if (current.getAttribute('data-testid') && !isDynamic(current.getAttribute('data-testid'))) {
        selector = `[data-testid="${current.getAttribute('data-testid')}"]`;
        path.unshift(selector);
        break; // Found unique parent, stop here
      }
      
      // Add stable class if available
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c && !isDynamic(c) && !c.match(/^(active|hover|focus|selected|disabled|open|closed|visible|hidden)$/i));
        if (classes.length > 0) {
          selector = `${currentTag}.${classes[0]}`;
        }
      }
      
      // Add nth-of-type if needed for specificity
      if (current !== el && current.parentElement) {
        const siblings = Array.from(current.parentElement.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
      depth++;
    }
    
    // Build final selector
    let finalSelector = path.join(' > ');
    
    // Verify uniqueness
    try {
      const matches = document.querySelectorAll(finalSelector);
      if (matches.length === 1) {
        return finalSelector;
      }
    } catch (e) {}
    
    return null;
  }
  
  function createElementData(el, best, idx, locatorMap) {
    locatorMap = locatorMap || new Map();
    const type = el.tagName.toLowerCase();
    const text = el.textContent?.trim().substring(0, 30) || el.placeholder || el.value || '';
    const name = generateElementName(el, idx);
    
    // Determine if it should be a List<WebElement>
    const isList = shouldBeList(el, best);
    
    // For Playwright: always use advanced locators (getByRole, getByTestId, etc.)
    let finalPlaywright = best.playwright || `locator("${best.css || 'xpath=' + best.xpath}")`;
    
    // For Selenium: build accurate CSS selector or use XPath
    let finalCss = best.css;
    let finalXpath = best.xpath;
    
    if (!isList) {
      const locatorKey = finalCss || finalXpath;
      
      // Check if this locator was already used OR if it matches multiple elements
      const isDuplicate = locatorMap.has(locatorKey);
      const matchCount = finalCss ? document.querySelectorAll(finalCss).length : 0;
      
      if (isDuplicate || matchCount > 1) {
        // Try to build accurate CSS selector using parent context
        const accurateCss = buildAccurateCssSelector(el);
        
        if (accurateCss && !locatorMap.has(accurateCss)) {
          finalCss = accurateCss;
          finalXpath = null;
        } else {
          // Try to find a unique selector from all available selectors
          const allSels = getAllSelectors(el);
          const uniqueSel = allSels.find(s => {
            try {
              if (s.css && !locatorMap.has(s.css)) {
                const count = document.querySelectorAll(s.css).length;
                return count === 1;
              }
            } catch (e) {}
            return false;
          });
          
          if (uniqueSel) {
            finalCss = uniqueSel.css;
            finalXpath = uniqueSel.xpath;
          } else {
            // Use XPath as fallback for uniqueness (Selenium only)
            finalCss = null;
            finalXpath = generateUniqueXPath(el);
          }
        }
      }
      
      // Mark this locator as used
      locatorMap.set(finalCss || finalXpath, true);
    }
    
    return {
      type: isList ? `List<${type}>` : type,
      name: text || type,
      varName: name,
      locator: finalCss || finalXpath,
      css: finalCss,
      xpath: finalXpath,
      playwright: finalPlaywright,
      isList
    };
  }
  
  function generateUniqueXPath(el) {
    if (el.id && !isDynamic(el.id)) {
      return `//*[@id="${el.id}"]`;
    }
    
    const text = el.textContent?.trim();
    if (text && text.length < 50) {
      const tag = el.tagName.toLowerCase();
      return `//${tag}[normalize-space(text())="${text.replace(/"/g, '&quot;')}"]`;
    }
    
    // Build positional XPath
    let path = '';
    let current = el;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;
      
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      
      const tagName = current.nodeName.toLowerCase();
      const pathIndex = index > 0 ? `[${index + 1}]` : '';
      path = `/${tagName}${pathIndex}${path}`;
      
      current = current.parentNode;
      
      if (current === document.body) break;
    }
    
    return path || '//*';
  }
  
  function shouldBeList(el, best) {
    // Check if selector matches multiple elements
    const selector = best.css || best.xpath;
    let matchCount = 0;
    
    try {
      if (best.css) {
        matchCount = document.querySelectorAll(best.css).length;
      } else if (best.xpath) {
        const result = document.evaluate(best.xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        matchCount = result.snapshotLength;
      }
    } catch (e) {
      return false;
    }
    
    // If matches multiple similar elements, make it a list
    if (matchCount > 1) {
      // Check if they're similar elements (same tag, similar purpose)
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'LI') {
        return true;
      }
      // Navigation items, menu items
      if (el.closest('nav') || el.getAttribute('role') === 'menuitem') {
        return true;
      }
      // Table rows/cells
      if (el.tagName === 'TR' || el.tagName === 'TD') {
        return true;
      }
    }
    
    return false;
  }

  function generateElementName(el, idx) {
    const tag = el.tagName.toLowerCase();
    let baseName = '';
    let prefix = '';
    
    // Determine prefix based on element type
    if (tag === 'button' || el.getAttribute('role') === 'button') {
      prefix = 'btn';
    } else if (tag === 'a' || el.getAttribute('role') === 'link') {
      prefix = 'lnk';
    } else if (tag === 'input') {
      const type = el.getAttribute('type') || 'text';
      if (type === 'text' || type === 'email' || type === 'password' || type === 'search') {
        prefix = 'txt';
      } else if (type === 'checkbox') {
        prefix = 'chk';
      } else if (type === 'radio') {
        prefix = 'rdo';
      } else if (type === 'submit') {
        prefix = 'btn';
      } else {
        prefix = 'inp';
      }
    } else if (tag === 'select') {
      prefix = 'ddl';
    } else if (tag === 'textarea') {
      prefix = 'txt';
    } else if (tag === 'form') {
      prefix = 'frm';
    } else if (tag === 'table') {
      prefix = 'tbl';
    } else if (tag === 'nav' || el.getAttribute('role') === 'navigation') {
      prefix = 'nav';
    } else if (el.getAttribute('role') === 'dialog') {
      prefix = 'dlg';
    } else if (el.getAttribute('role') === 'menu' || el.getAttribute('role') === 'menuitem') {
      prefix = 'mnu';
    } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      prefix = 'hdr';
    } else if (tag === 'img') {
      prefix = 'img';
    } else {
      prefix = 'elm';
    }
    
    // Extract meaningful name
    const testid = el.getAttribute('data-testid');
    if (testid && !isDynamic(testid)) {
      baseName = testid.replace(/-/g, '_');
    } else if (el.id && !isDynamic(el.id)) {
      baseName = el.id.replace(/-/g, '_');
    } else if (el.getAttribute('name') && !isDynamic(el.getAttribute('name'))) {
      baseName = el.getAttribute('name').replace(/-/g, '_');
    } else if (el.getAttribute('aria-label')) {
      baseName = el.getAttribute('aria-label').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    } else if (el.getAttribute('placeholder')) {
      baseName = el.getAttribute('placeholder').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    } else if (el.getAttribute('title')) {
      baseName = el.getAttribute('title').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    } else if (el.getAttribute('alt')) {
      baseName = el.getAttribute('alt').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    } else {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length < 40) {
        baseName = text.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      } else if (el.className && typeof el.className === 'string') {
        const classes = el.className.split(' ').filter(c => c && !isDynamic(c));
        if (classes.length > 0) {
          baseName = classes[0].replace(/[^a-z0-9]+/g, '_');
        }
      }
    }
    
    // Clean up base name
    baseName = baseName.replace(/^_+|_+$/g, '').substring(0, 30);
    
    // If no meaningful name found, use generic with index
    if (!baseName) {
      baseName = tag + '_' + idx;
      return prefix + baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
    
    // Combine prefix with base name (camelCase)
    const finalName = prefix + baseName.charAt(0).toUpperCase() + baseName.slice(1);
    return finalName;
  }

  // Expose scanPageElements globally
  window.scanPageElements = scanPageElements;
  
  // Section scan functionality
  let sectionScanMode = false;
  const sectionOverlay = document.createElement('div');
  sectionOverlay.style.cssText = `
    position: absolute;
    pointer-events: none;
    z-index: 999998;
    background: rgba(236, 72, 153, 0.2);
    border: 3px solid #ec4899;
    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.3);
    display: none;
  `;
  document.body.appendChild(sectionOverlay);
  
  function scanSection(element) {
    const elements = [];
    const seen = new Set();
    const locatorMap = new Map(); // Track used locators
    
    const prioritySelectors = [
      '[data-testid]', '[data-test]', '[data-automation-id]', '[automation-id]',
      'input:not([type="hidden"])', 'button', 'textarea', 'select',
      '[role="button"]', '[role="navigation"]', '[role="menu"]', '[role="menuitem"]',
      'a[href]', '[role="link"]',
      'nav a', 'nav button',
      '[id]:not([id=""])',
      'form', 'table',
      '[role="dialog"]', '[role="alert"]',
      'h1, h2, h3'
    ];
    
    prioritySelectors.forEach(selector => {
      try {
        element.querySelectorAll(selector).forEach((el) => {
          if (seen.has(el)) return;
          if (!isElementValid(el)) return;
          
          const allSels = getAllSelectors(el);
          if (allSels.length === 0) return;
          
          const best = allSels[0];
          const elementData = createElementData(el, best, elements.length, locatorMap);
          if (elementData) {
            elements.push(elementData);
            seen.add(el);
          }
        });
      } catch (e) {}
    });
    
    return elements;
  }
  
  window.startSectionScan = function() {
    sectionScanMode = true;
    document.body.style.cursor = 'crosshair';
    
    const hoverHandler = (e) => {
      if (!sectionScanMode) return;
      e.stopPropagation();
      const rect = e.target.getBoundingClientRect();
      sectionOverlay.style.top = (rect.top + window.scrollY) + 'px';
      sectionOverlay.style.left = (rect.left + window.scrollX) + 'px';
      sectionOverlay.style.width = rect.width + 'px';
      sectionOverlay.style.height = rect.height + 'px';
      sectionOverlay.style.display = 'block';
    };
    
    const clickHandler = (e) => {
      if (!sectionScanMode) return;
      e.preventDefault();
      e.stopPropagation();
      
      sectionScanMode = false;
      document.body.style.cursor = '';
      sectionOverlay.style.display = 'none';
      highlightOverlay.style.display = 'none';
      
      document.removeEventListener('mouseover', hoverHandler, true);
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('keydown', escapeHandler);
      
      const elements = scanSection(e.target);
      window.sendToRecorder({ action: 'scanResults', elements });
    };
    
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && sectionScanMode) {
        sectionScanMode = false;
        document.body.style.cursor = '';
        sectionOverlay.style.display = 'none';
        highlightOverlay.style.display = 'none';
        document.removeEventListener('mouseover', hoverHandler, true);
        document.removeEventListener('click', clickHandler, true);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    highlightOverlay.style.display = 'none';
    document.addEventListener('mouseover', hoverHandler, true);
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', escapeHandler);
  };
})();