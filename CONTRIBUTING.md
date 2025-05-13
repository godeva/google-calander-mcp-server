# Contributing to AI Agenda MCP

Thank you for your interest in contributing to AI Agenda MCP! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read and follow it to ensure a positive and respectful environment for everyone.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** by following the instructions in the README
4. **Create a new branch** for your feature or bug fix
5. **Make your changes** following the coding guidelines
6. **Write or update tests** as necessary
7. **Submit a pull request** with your changes

## Development Environment Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ai-agenda-mcp.git
cd ai-agenda-mcp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## Project Structure

The project follows the modular structure outlined in the [File Structure](docs/file-structure.md) documentation. Please familiarize yourself with this structure before contributing.

## Coding Guidelines

### General Guidelines

- Follow the existing code style and conventions
- Write clean, maintainable, and testable code
- Document your code with appropriate comments and JSDoc annotations
- Keep functions small and focused on a single responsibility
- Use meaningful variable and function names

### TypeScript Guidelines

- Use strict typing with TypeScript
- Define interfaces for all data structures
- Use enums for values with a fixed set of options
- Avoid using `any` type when possible
- Use async/await for asynchronous code

### Testing Guidelines

- Write unit tests for all new functionality
- Ensure all tests pass before submitting a pull request
- Aim for high test coverage, particularly for critical components
- Use mocks and stubs appropriately for external dependencies

### Commit Guidelines

- Use clear and descriptive commit messages
- Follow the conventional commits format:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation changes
  - `style`: Code style changes (formatting, missing semi-colons, etc)
  - `refactor`: Code changes that neither fix a bug nor add a feature
  - `test`: Adding or updating tests
  - `chore`: Changes to the build process or auxiliary tools

Example: `feat(calendar): add recurring event support`

## Pull Request Process

1. **Update documentation** if necessary
2. **Add tests** for any new functionality
3. **Ensure all tests pass** by running `npm test`
4. **Update the README.md** with details of changes if appropriate
5. **Submit the pull request** with a clear description of the changes

Your pull request will be reviewed by the maintainers, who may request changes or improvements before merging.

## Feature Requests and Bug Reports

If you'd like to request a feature or report a bug:

1. Check existing issues to see if it has already been reported
2. If not, create a new issue with a clear description
3. For bug reports, include steps to reproduce, expected behavior, and actual behavior
4. For feature requests, describe the feature and why it would be valuable

## Architecture Contributions

For changes to the system architecture:

1. Discuss proposed architectural changes in an issue first
2. Reference the architecture documentation in your proposal
3. Explain how your changes align with the existing design principles
4. Consider the impact on existing components and interfaces

## License

By contributing to AI Agenda MCP, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

If you have any questions about contributing, please open an issue or contact the maintainers.

Thank you for contributing to AI Agenda MCP!