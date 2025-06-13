# CSS Modules Intellisense — Quickstart Guide

Welcome to the development environment for your **CSS Modules Intellisense** VS Code extension!

This guide walks you through setup, build, run, and packaging instructions to help you get productive fast.

---

## 🛠 Requirements

- [Node.js](https://nodejs.org) (v16 or later recommended)
- [VS Code](https://code.visualstudio.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [VSCE CLI](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

---

## 📦 Install Dependencies

From the root of your extension project, run:

```bash
npm install
```

---

## 🧪 Run the Extension

To launch the extension in a VS Code development window:

```bash
code .
```

Then press `F5` in VS Code to open a new **Extension Development Host** window with your extension loaded.

---

## 🔁 Code Changes

Your main extension code lives in:

```text
src/extension.ts
```

Run the compile script:

```bash
npm run compile
```

or, Run the pretest script:

```bash
npm run pretest
```

and, You can also run the watch script:

```bash
npm run watch
```

---

## 🧪 Testing (Optional)

We recommend using **Mocha** for writing extension tests.

Test entry point (if added):

```text
src/test/
```

Run the test script:

```bash
npm run test
```

More info: [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

---

## 📦 Package Your Extension

After building with `npm run pretest`, run:

```bash
vsce package
```

This generates a file like:

```bash
css-modules-intellisense-${version}.vsix
```

---

## 🚀 Install Locally

To test your `.vsix` locally:

```bash
code --install-extension css-modules-intellisense-${version}.vsix
```

---

## 🧾 Publish to Marketplace

1. Create a [publisher account](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher)
2. Login:

   ```bash
   vsce login <your-publisher-name>
   ```

3. Publish:

   ```bash
   vsce publish
   ```

---

## 📂 Project Structure

```text
.
├── src/                      # TypeScript source code
├── dist/                     # Compiled JS output
├── package.json              # Extension manifest
├── README.md                 # Marketplace documentation
├── CHANGELOG.md              # Changelog / release notes
├── vsc-extension-quickstart.md  # This file
├── .vscode/                  # Debug config
└── tsconfig.json             # TypeScript configuration
```

---

## 🧠 Notes

- Supports `.module.css`, `.module.scss`, and `.module.less`
- Recognizes `import styles from './file.module.css'` usage
- Lints missing class names
- Supports Rename across both module and usage files
- Supports Go-to-Definition across javascript and typescript files
- Supports Autocomplete across script files through modules
- Planned: Hover, Find References

---

Happy building with **CSS Modules Intellisense**! 🎉
