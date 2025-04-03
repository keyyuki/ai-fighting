### 🔄 Project Awareness & Context

- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.

### 🧪 Test-Driven Development Process

- **Follow the TDD approach strictly**:
  1. **Define interfaces first** - Create interfaces before any implementation code
  2. **Write tests second** - Develop comprehensive tests for the interface contracts
  3. **Implement code last** - Only write implementation after tests are created
- **Place interfaces in `interface/` subdirectories** within their respective modules
- **Name interfaces with the prefix `I`** (e.g., `IAttackSystem`, `IBlockingSystem`)
- **Create abstract classes** between interfaces and concrete implementations when appropriate

### 🧱 Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).

### 🧪 Testing & Reliability

- **Always create jest unit tests for new features** (functions, services, provider, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live with a `{filename}.spec.ts` file**
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case
- **Use mocks for dependencies** to isolate the component being tested
- **Create mock versions** in `_test/` directories with descriptive names

### ✅ Task Completion

- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📎 Style & Conventions

- **Use Typescript** as the primary language.
- Always use **ES6+ syntax** (e.g., `const`, `let`, arrow functions, destructuring).
- **Use `async/await`** for asynchronous code.
- **Use `const` for constants** and `let` for variables that will change.
- **run eslint and prettier** on all code and fix before complete task.
- **Use `camelCase` for variables and functions**.
- **Use arrow functions** for method in service and provider, but **not** in controller, gateway.

### 📚 Documentation & Explainability

- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules

- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.
