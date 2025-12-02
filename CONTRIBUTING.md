# Contributing to CSS/SCSS Modules IntelliSense

Thank you for your interest in contributing!
Here's how you can help improve this VS Code extension.

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense.git
   cd CSS-Modules-IntelliSense
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run compile
   ```

4. **Run tests**

   ```bash
   npm test
   ```

## Development Workflow

1. **Open in VS Code**

   - Open the project folder in VS Code
   - Press `F5` to launch the Extension Development Host

2. **Make your changes**

   - Source code is in the `src/` directory
   - Follow the existing code style and structure

3. **Test your changes**

   - Use the Extension Development Host to test
   - Write unit tests for new functionality
   - Run `npm run lint` to check for linting errors

4. **Build and verify**

   ```bash
   npm test
   ```

## Project Structure

```
src/
├── libs/                 # Core libraries (caching, document processing)
├── providers/            # Language feature providers
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── test/                 # Test files
```

## Submitting Changes

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit your changes**

   - Write clear, descriptive commit messages
   - Reference issue numbers when applicable

3. **Submit a Pull Request**
   - Provide a clear description of the changes
   - Link to any related issues
   - Ensure all tests pass

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Write tests for new features
- Keep functions focused and modular

## Reporting Issues

- Use GitHub Issues to report bugs
- Provide a clear description and reproduction steps
- Include VS Code version and extension version
- Share relevant code samples or screenshots

## Questions?

Feel free to open an issue for any questions or discussions!
