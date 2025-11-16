function toPlaywright(events) {
  return events.map(e => {
    // Generate Playwright locator using advanced methods
    let locator;
    
    // Priority 1: Use playwright property if available (advanced locators)
    if (e.playwright) {
      locator = `page.${e.playwright}`;
    } else if ('xpath' in e && e.xpath) {
      locator = `page.locator('xpath=${e.xpath}')`;
    } else if ('css' in e && e.css) {
      const css = e.css;
      // Use Playwright's recommended locators
      if (css.match(/\[role="([^"]+)"\]/)) {
        const role = css.match(/\[role="([^"]+)"\]/)[1];
        locator = `page.getByRole('${role}')`;
      } else if (css.match(/\[aria-label="([^"]+)"\]/)) {
        const label = css.match(/\[aria-label="([^"]+)"\]/)[1];
        locator = `page.getByLabel('${label}')`;
      } else if (css.match(/\[placeholder="([^"]+)"\]/)) {
        const placeholder = css.match(/\[placeholder="([^"]+)"\]/)[1];
        locator = `page.getByPlaceholder('${placeholder}')`;
      } else if (css.match(/\[data-testid="([^"]+)"\]/)) {
        const testid = css.match(/\[data-testid="([^"]+)"\]/)[1];
        locator = `page.getByTestId('${testid}')`;
      } else if (css.includes(':has-text')) {
        const text = css.match(/:has-text\("([^"]+)"\)/)?.[1] || '';
        locator = `page.getByText('${text}')`;
      } else {
        locator = `page.locator('${css}')`;
      }
    } else {
      const selector = e.css || e.xpath || e.selector || '';
      locator = `page.locator('${selector.startsWith('//') ? 'xpath=' + selector : selector}')`;
    }
    
    if (e.type === 'navigation') return `await page.goto('${e.url}');`;
    if (e.type === 'click') return `await ${locator}.click();`;
    if (e.type === 'dblclick') return `await ${locator}.dblclick();`;
    if (e.type === 'input') return `await ${locator}.fill('${e.value}');`;
    if (e.type === 'check') return `await ${locator}.setChecked(${e.checked});`;
    if (e.type === 'select') return `await ${locator}.selectOption('${e.value}');`;
    if (e.type === 'press') return `await ${locator}.press('${e.key}');`;
    if (e.type === 'hover') return `await ${locator}.hover();`;
    if (e.type === 'submit') return `await ${locator}.evaluate(form => form.submit());`;
    if (e.type === 'assertion') {
      switch(e.assertType) {
        case 'containsText':
          return `await expect(${locator}).toContainText('${e.value}');`;
        case 'isVisible':
          return `await expect(${locator}).toBeVisible();`;
        case 'hasValue':
          return `await expect(${locator}).toHaveValue('${e.value}');`;
        case 'isEnabled':
          return `await expect(${locator}).toBeEnabled();`;
      }
    }
  }).filter(Boolean).join('\n');
}

function toSelenium(events, language = 'python') {
  if (language === 'java') {
    return toSeleniumJava(events);
  }
  return toSeleniumPython(events);
}

function toSeleniumPython(events) {
  return events.map(e => {
    let selector, locatorType;
    if ('css' in e && e.css) {
      selector = e.css;
      locatorType = 'css selector';
    } else if ('xpath' in e && e.xpath) {
      selector = e.xpath;
      locatorType = 'xpath';
    } else {
      selector = e.css || e.xpath || e.selector || '';
      locatorType = selector === e.xpath ? 'xpath' : 'css selector';
    }
    
    if (e.type === 'navigation') return `driver.get('${e.url}')`;
    if (e.type === 'click') return `driver.find_element('${locatorType}', '${selector}').click()`;
    if (e.type === 'dblclick') return `ActionChains(driver).double_click(driver.find_element('${locatorType}', '${selector}')).perform()`;
    if (e.type === 'input') return `driver.find_element('${locatorType}', '${selector}').send_keys('${e.value}')`;
    if (e.type === 'check') {
      const action = e.checked ? 'click()' : '# already unchecked';
      return `driver.find_element('${locatorType}', '${selector}').${action}`;
    }
    if (e.type === 'select') return `Select(driver.find_element('${locatorType}', '${selector}')).select_by_value('${e.value}')`;
    if (e.type === 'press') return `driver.find_element('${locatorType}', '${selector}').send_keys(Keys.${e.key.toUpperCase()})`;
    if (e.type === 'hover') return `ActionChains(driver).move_to_element(driver.find_element('${locatorType}', '${selector}')).perform()`;
    if (e.type === 'submit') return `driver.find_element('${locatorType}', '${selector}').submit()`;
    if (e.type === 'assertion') {
      switch(e.assertType) {
        case 'containsText':
          return `assert '${e.value}' in driver.find_element('${locatorType}', '${selector}').text`;
        case 'isVisible':
          return `assert driver.find_element('${locatorType}', '${selector}').is_displayed()`;
        case 'hasValue':
          return `assert driver.find_element('${locatorType}', '${selector}').get_attribute('value') == '${e.value}'`;
        case 'isEnabled':
          return `assert driver.find_element('${locatorType}', '${selector}').is_enabled()`;
      }
    }
  }).filter(Boolean).join('\n');
}

function toSeleniumJava(events) {
  return events.map(e => {
    let selector, byType;
    if ('css' in e && e.css) {
      selector = e.css.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      byType = 'By.cssSelector';
    } else if ('xpath' in e && e.xpath) {
      selector = e.xpath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      byType = 'By.xpath';
    } else {
      selector = (e.css || e.xpath || e.selector || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      byType = selector === e.xpath ? 'By.xpath' : 'By.cssSelector';
    }
    
    if (e.type === 'navigation') return `driver.get("${e.url}");`;
    if (e.type === 'click') return `driver.findElement(${byType}("${selector}")).click();`;
    if (e.type === 'dblclick') return `new Actions(driver).doubleClick(driver.findElement(${byType}("${selector}"))).perform();`;
    if (e.type === 'input') return `driver.findElement(${byType}("${selector}")).sendKeys("${e.value}");`;
    if (e.type === 'check') {
      return e.checked ? `driver.findElement(${byType}("${selector}")).click();` : `// already unchecked`;
    }
    if (e.type === 'select') return `new Select(driver.findElement(${byType}("${selector}"))).selectByValue("${e.value}");`;
    if (e.type === 'press') return `driver.findElement(${byType}("${selector}")).sendKeys(Keys.${e.key.toUpperCase()});`;
    if (e.type === 'hover') return `new Actions(driver).moveToElement(driver.findElement(${byType}("${selector}"))).perform();`;
    if (e.type === 'submit') return `driver.findElement(${byType}("${selector}")).submit();`;
    if (e.type === 'assertion') {
      switch(e.assertType) {
        case 'containsText':
          return `assertTrue(driver.findElement(${byType}("${selector}")).getText().contains("${e.value}"));`;
        case 'isVisible':
          return `assertTrue(driver.findElement(${byType}("${selector}")).isDisplayed());`;
        case 'hasValue':
          return `assertEquals("${e.value}", driver.findElement(${byType}("${selector}")).getAttribute("value"));`;
        case 'isEnabled':
          return `assertTrue(driver.findElement(${byType}("${selector}")).isEnabled());`;
      }
    }
  }).filter(Boolean).join('\n');
}

module.exports = { toPlaywright, toSelenium };