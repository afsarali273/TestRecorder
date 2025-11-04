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
- **Selenium** (Python with By.XPATH, By.CSS_SELECTOR)
- **UFT** (VBScript with descriptive programming)
- **Page Object Model** (All languages with meaningful variable names)

### 🎨 Modern UI/UX
- Professional gradient design with glassmorphism effects
- Real-time event recording with color-coded actions
- Tabbed code viewer with syntax highlighting
- Right-side panel (650px) for side-by-side testing
- Vertical layout: Events (40%) + Code (60%)

### 🔍 Advanced Features
- Element highlighting on hover
- Pause/Resume/Stop controls
- Delete individual recorded steps
- Copy generated code to clipboard
- Navigation tracking with auto-injection
- Form input debouncing (1-second delay)
- Assertion support (visible, text, value, enabled)

## 📦 Installation

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd cli_test_recorder_updated
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

1. **Start Recording**: Run the command with your target URL
2. **Interact**: The recorder window opens on the right side - perform actions on the main browser
3. **View Events**: See recorded actions in real-time in the Events panel
4. **Right-Click**: Access context menu for assertions and locator options
5. **Select Language**: Choose from JavaScript, TypeScript, Python, or Java
6. **Switch Tabs**: View code in Playwright, Selenium, UFT, or POM format
7. **Copy Code**: Click "Copy Code" button to copy generated tests
8. **Stop**: Click Stop button or press Enter in terminal

## 📋 Supported Actions

| Action | Description |
|--------|-------------|
| **Click** | Single click on elements |
| **Double Click** | Double click on elements |
| **Input** | Text input with debouncing |
| **Select** | Dropdown selection |
| **Check/Uncheck** | Checkbox and radio buttons |
| **Hover** | Mouse hover events |
| **Press** | Keyboard events (Enter, etc.) |
| **Submit** | Form submission |
| **Navigate** | Page navigation tracking |

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

## 🏗️ Project Structure

```
cli_test_recorder_updated/
├── bin/
│   └── recorder.js              # Main CLI entry point
├── lib/
│   ├── browserManager.js        # Browser launch logic
│   └── codeGenerator.js         # Code generation for frameworks
├── recorderScripts/
│   ├── recorderScript.js        # Client-side recording logic
│   └── recorderUI.html          # Recorder UI with modern design
├── package.json
└── README.md
```

## 🔧 Configuration

### Recorder Window
- **Width**: 650px
- **Position**: Right side of screen
- **Height**: Full screen

### Locator Priority
1. data-testid (Score: 100)
2. ID (Score: 90)
3. name (Score: 85)
4. aria-label (Score: 80)
5. placeholder (Score: 75)
6. CSS Path (Score: 30)
7. XPath (Score: 20)

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

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Made with ❤️ for the QA community**
