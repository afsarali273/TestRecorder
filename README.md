# 🎬 Test Recorder - Advanced Web Test Automation Tool

A powerful CLI-based test recorder that captures user interactions and generates test code for **Playwright**, **Selenium**, **UFT**, and **Page Object Model** patterns across multiple programming languages.

![Test Recorder](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## 📸 Screenshot

![Test Recorder UI](./img.png)

## ✨ Features

### 🎯 Smart Locator Strategies
- **Advanced Playwright Locators**: `getByRole()`, `getByTestId()`, `getByLabel()`, `getByPlaceholder()`, `getByText()`
- **Locator Chaining**: `getByTestId('form').locator('button')`
- **Filtering**: `locator('.button').filter({ hasText: 'Submit' })`
- **Stability Scoring**: Ranks locators by reliability (data-testid: 100, ID: 90, CSS: 30)
- **Dynamic Class Detection**: Identifies and avoids minified/generated classes
- **Context Menu**: Right-click any element to see all available locators with match counts

### 🌐 Multi-Framework Support
- **Playwright** (JavaScript, TypeScript, Python, Java)
- **Selenium** (Python, Java with By.xpath, By.cssSelector)
- **UFT** (VBScript with descriptive programming)
- **Page Object Model** (All languages with meaningful variable names)

### 🎨 Modern UI/UX
- Professional gradient design with glassmorphism effects
- Real-time event recording with color-coded actions
- Tabbed code viewer with syntax highlighting
- Right-side panel (650px) for side-by-side testing
- Vertical layout: Events (40%) + Code (60%)

### 🔍 Advanced Features
- **Element highlighting** on hover
- **Pause/Resume/Stop** controls
- **Delete individual** recorded steps
- **Copy generated code** to clipboard
- **Navigation tracking** with auto-injection
- **Form input debouncing** (1-second delay)
- **Assertion support** (visible, text, value, enabled)
- **Page scanning** - Discover all interactive elements
- **Section scanning** - Scan specific page sections
- **POM generation** - Auto-generate Page Object Model classes

## 📦 Installation

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/afsarali273/TestRecorder.git
cd TestRecorder
```

2. **Install dependencies**
```bash
npm install
```

3. **Link the CLI globally** (optional)
```bash
npm link
```

## 🚀 Usage

### Basic Command
```bash
node bin/recorder.js --url https://example.com
```

### With Browser Selection
```bash
node bin/recorder.js --url https://example.com --browser chromium
# Options: chromium, firefox, webkit
```

### If Linked Globally
```bash
test-recorder --url https://example.com
```

## 🎮 How to Use

![Recorder UI](./img.png)

### Recording Interactions
1. **Start Recording**: Run the command with your target URL
2. **Interact**: The recorder window opens on the right side - perform actions on the main browser
3. **View Events**: See recorded actions in real-time in the Events panel
4. **Right-Click**: Access context menu for assertions and locator options
5. **Select Language**: Choose from JavaScript, TypeScript, Python, or Java
6. **Switch Tabs**: View code in Playwright, Selenium, UFT, or POM format
7. **Copy Code**: Click "Copy Code" button to copy generated tests
8. **Stop**: Click Stop button or press Enter in terminal

### Page Scanning & POM Generation
1. **Scan Full Page**: Click "🔍 Scan" button to discover all interactive elements
2. **Scan Section**: Click "🎯 Section" button, then click on any page section to scan only that area
3. **Select Elements**: Check/uncheck elements you want in your Page Object Model
4. **Generate POM**: Click "Generate POM (Java)" to create Page Object classes
5. **Choose Pattern**: Toggle between Playwright POM and Selenium POM (PageFactory or normal pattern)
6. **Copy Code**: Use the copy button to get the generated POM code

## 📋 Supported Actions

| Action | Description | Playwright | Selenium |
|--------|-------------|------------|----------|
| **Click** | Single click on elements | `.click()` | `.click()` |
| **Double Click** | Double click on elements | `.dblclick()` | `ActionChains.double_click()` |
| **Input** | Text input with debouncing | `.fill()` | `.send_keys()` |
| **Select** | Dropdown selection | `.selectOption()` | `Select().select_by_value()` |
| **Check/Uncheck** | Checkbox and radio buttons | `.setChecked()` | `.click()` |
| **Hover** | Mouse hover events | `.hover()` | `ActionChains.move_to_element()` |
| **Press** | Keyboard events (Enter, etc.) | `.press()` | `.send_keys(Keys.ENTER)` |
| **Submit** | Form submission | `.evaluate()` | `.submit()` |
| **Navigate** | Page navigation tracking | `page.goto()` | `driver.get()` |

## 🎯 Assertions (Right-Click Menu)

- **Assert Visible**: Verify element is displayed
- **Assert Text**: Verify element contains text
- **Assert Value**: Verify input/textarea value
- **Assert Enabled**: Verify element is enabled

## 📝 Generated Code Examples

### Playwright (JavaScript)
```javascript
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByTestId('username').fill('john@example.com');
await expect(page.getByLabel('Email')).toBeVisible();
```

### Selenium (Python)
```python
driver.find_element(By.CSS_SELECTOR, "[data-testid='login-btn']").click()
driver.find_element(By.XPATH, "//input[@name='username']").send_keys("admin")
assert driver.find_element(By.ID, "message").is_displayed()
```

### Selenium (Java)
```java
driver.findElement(By.cssSelector("[data-testid='login-btn']")).click();
driver.findElement(By.xpath("//input[@name='username']")).sendKeys("admin");
assertTrue(driver.findElement(By.id("message")).isDisplayed());
```

### UFT (VBScript)
```vbscript
Browser("Browser").Page("Page").WebEdit("name:=username").Set "admin"
Browser("Browser").Page("Page").WebButton("innertext:=Login").Click
```

### Page Object Model (TypeScript)
```typescript
class PageObject {
  readonly username_input: Locator;
  readonly login_button: Locator;
  
  constructor(page: Page) {
    this.username_input = page.getByPlaceholder('Enter username');
    this.login_button = page.getByRole('button', { name: 'Login' });
  }
}
```

## 🎭 Page Object Model (POM) Generation

### Features
- **Auto-discovery**: Scans page for interactive elements (buttons, inputs, links, forms)
- **Smart naming**: Generates meaningful variable names (btnLogin, txtUsername, lnkForgotPassword)
- **Multiple patterns**: Supports Playwright POM and Selenium POM (PageFactory & normal)
- **Unique locators**: Ensures each element has a unique, stable locator
- **List detection**: Automatically creates `List<WebElement>` for multiple similar elements

### Playwright POM (Java)
```java
import com.microsoft.playwright.*;
import java.util.List;

public class PageObject {
    private Page page;
    private Locator btnLogin;
    private Locator txtUsername;
    private List<Locator> lnkNavigation;
    
    public PageObject(Page page) {
        this.page = page;
        this.btnLogin = page.getByRole('button', { name: 'Login' });
        this.txtUsername = page.getByPlaceholder('Enter username');
        this.lnkNavigation = page.getByRole('link').all();
    }
    
    public Locator getBtnLogin() { return btnLogin; }
    public Locator getTxtUsername() { return txtUsername; }
    public List<Locator> getLnkNavigation() { return lnkNavigation; }
}
```

### Selenium POM - PageFactory Pattern (Java)
```java
import org.openqa.selenium.*;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import java.util.List;

public class SeleniumPageObject {
    private WebDriver driver;
    
    @FindBy(css = "[data-testid='login-btn']")
    private WebElement btnLogin;
    
    @FindBy(xpath = "//input[@placeholder='Enter username']")
    private WebElement txtUsername;
    
    @FindBy(css = "nav a")
    private List<WebElement> lnkNavigation;
    
    public SeleniumPageObject(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }
    
    public WebElement getBtnLogin() { return btnLogin; }
    public WebElement getTxtUsername() { return txtUsername; }
    public List<WebElement> getLnkNavigation() { return lnkNavigation; }
}
```

### Selenium POM - Normal Pattern (Java)
```java
import org.openqa.selenium.*;
import java.util.List;

public class SeleniumPageObject {
    private WebDriver driver;
    private By btnLogin = By.cssSelector("[data-testid='login-btn']");
    private By txtUsername = By.xpath("//input[@placeholder='Enter username']");
    private By lnkNavigation = By.cssSelector("nav a");
    
    public SeleniumPageObject(WebDriver driver) {
        this.driver = driver;
    }
    
    public WebElement getBtnLogin() {
        return driver.findElement(btnLogin);
    }
    
    public WebElement getTxtUsername() {
        return driver.findElement(txtUsername);
    }
    
    public List<WebElement> getLnkNavigation() {
        return driver.findElements(lnkNavigation);
    }
}
```

### Element Naming Convention
| Prefix | Element Type | Example |
|--------|-------------|----------|
| `btn` | Button | `btnSubmit`, `btnLogin` |
| `lnk` | Link | `lnkForgotPassword`, `lnkHome` |
| `txt` | Text Input | `txtUsername`, `txtEmail` |
| `chk` | Checkbox | `chkRememberMe`, `chkTerms` |
| `rdo` | Radio Button | `rdoGender`, `rdoPayment` |
| `ddl` | Dropdown | `ddlCountry`, `ddlLanguage` |
| `inp` | Generic Input | `inpSearch`, `inpFile` |
| `frm` | Form | `frmLogin`, `frmRegistration` |
| `tbl` | Table | `tblUsers`, `tblProducts` |
| `nav` | Navigation | `navHeader`, `navSidebar` |
| `dlg` | Dialog | `dlgConfirm`, `dlgAlert` |
| `mnu` | Menu | `mnuDropdown`, `mnuContext` |
| `hdr` | Header | `hdrTitle`, `hdrSection` |
| `img` | Image | `imgLogo`, `imgProfile` |
| `elm` | Generic Element | `elmContainer`, `elmWrapper` |

## 🏗️ Project Structure

```
cli_test_recorder_updated/
├── bin/
│   └── recorder.js              # Main CLI entry point
├── lib/
│   ├── browserManager.js        # Browser launch logic (Chromium/Firefox/WebKit)
│   └── codeGenerator.js         # Code generation (Playwright/Selenium)
├── recorderScripts/
│   ├── recorderScript.js        # Client-side recording & scanning logic
│   └── recorderUI.html          # Recorder UI with modern design
├── package.json
└── README.md
```

### Architecture Overview

#### bin/recorder.js
- **CLI Entry Point**: Parses command-line arguments (--url, --browser, --replay)
- **Browser Management**: Launches main browser and detached recorder window (650px, right-aligned)
- **Script Injection**: Injects recorderScript.js into target pages and new tabs/popups
- **Navigation Tracking**: Monitors page navigation and re-injects recorder
- **Event Collection**: Receives events from browser via `sendToRecorder` exposed function
- **Scan Integration**: Exposes `requestScan()` and `requestScanSection()` to recorder UI
- **Auto-save**: Saves recorded events to `recordedSteps.json` on stop
- **Code Output**: Generates Playwright and Selenium code to console

#### lib/browserManager.js
- **Multi-browser Support**: Launches Chromium, Firefox, or WebKit
- **Headless Mode**: Configurable (default: false for recording)
- **Context Management**: Creates browser context and pages

#### lib/codeGenerator.js
- **Playwright Generator**: Uses advanced locators (getByRole, getByTestId, getByLabel, etc.)
- **Selenium Generator**: Respects user's CSS/XPath choice from context menu
- **Action Mapping**: Converts recorded events to framework-specific syntax
- **Assertion Support**: Generates expect/assert statements for validations

## 🔧 Configuration

### Recorder Window
- **Width**: 650px
- **Position**: Right side of screen (auto-calculated based on screen width)
- **Height**: Full screen (matches screen height)
- **Auto-positioning**: `window.moveTo(screenWidth - 650, 0)`

### Browser Options
- **Chromium** (default): `--browser chromium`
- **Firefox**: `--browser firefox`
- **WebKit**: `--browser webkit`
- **Headless**: Disabled for recording (requires visible browser)

### Replay Mode
- **Command**: `--replay recordedSteps.json`
- **Purpose**: Replay previously recorded steps
- **Actions**: Executes click and input events from JSON file

### Locator Priority
1. **data-testid** (Score: 100) - Highest priority for test automation
2. **getByRole** with name (Score: 95) - Playwright semantic locator
3. **ID** (Score: 90) - Unique identifier
4. **getByLabel** (Score: 88) - Form labels
5. **name** (Score: 85) - Form element names
6. **aria-label** (Score: 80) - Accessibility attributes
7. **getByTestId** chaining (Score: 78) - Parent-child relationships
8. **getByPlaceholder** (Score: 75) - Input placeholders
9. **filter** with hasText (Score: 72) - Text-based filtering
10. **CSS Path** (Score: 30) - Structural selectors
11. **XPath** (Score: 20) - Fallback option

### Selenium CSS Selector Strategy
- **Hierarchical path building**: Traverses up to 4 levels of parent/grandparent elements
- **Stable attributes**: Prioritizes IDs, data-testid, and non-dynamic classes
- **nth-of-type**: Adds positional specificity when needed
- **Uniqueness verification**: Ensures each selector matches exactly one element
- **Example**: `#parent-id > div.content > button:nth-of-type(2)`

## 🐛 Troubleshooting

### Issue: Recorder window not visible
- Check screen resolution (minimum 1280x720)
- Try maximizing the browser window

### Issue: Events not recording
- Ensure JavaScript is enabled
- Check browser console for errors
- Verify page has loaded completely

### Issue: Locators not working
- Use context menu to see alternative locators
- Check for dynamic classes (marked with ⚠️)
- Try XPath or advanced locator strategies

### Issue: Page scan not finding elements
- Ensure page is fully loaded before scanning
- Check if elements are hidden (display: none)
- Try section scan for specific areas

### Issue: Duplicate locators in POM
- Tool automatically detects duplicates and generates unique XPath
- Playwright uses semantic locators (can have duplicates by design)
- Selenium gets unique CSS/XPath selectors

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev/)
- Inspired by modern test automation best practices
- UI design follows latest UX guidelines
- Supports Selenium WebDriver patterns
- PageFactory pattern for Java Selenium users

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [afsarali273@gmail.com]

---

**Made with ❤️ for the QA community**
