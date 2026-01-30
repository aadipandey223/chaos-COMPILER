# 🌀 The Chaos Compiler
### Controlled Non-Deterministic Code Obfuscation & Polymorphic Compilation

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Chaos Compiler** is a unique research project and compilation framework designed to explore **Polymorphic Code Generation**. It takes standard C-like source code and produces functional Assembly output that is mathematically verified to be identical in behavior but radically different in binary signature every time it is compiled.

---

## ✨ Key Features

- 🧬 **Polymorphic Engine:** Generates unique binary signatures for the same functional behavior using non-deterministic IR transformations.
- 🎨 **visual Pipeline:** A real-time, step-by-step visualization of the compilation process:
  - **Lexer & Parser:** Highlighting tokenization and AST construction.
  - **Chaos Layer:** Visualizing instruction shuffling, dead-code insertion, and register swapping.
  - **Verification:** Automated equivalence checking between "clean" and "chaotic" builds.
- 🌳 **Interactive Parse Tree:** A dynamic, hierarchical view of the Abstract Syntax Tree (AST), exported as high-quality PNGs.
- 🧪 **Intensity Control:** Adjustable "Chaos Intensity" levels (None, Low, Medium, High) to control the degree of mutation.
- 📜 **Signature History:** Track and compare the hexadecimal signatures of multiple runs to verify polymorphism.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Animations:** Framer Motion
- **Editor:** React Simple Code Editor + PrismJS (C/C++ Highlighting)
- **Visualization:** Lucide Icons, html2canvas
- **Compiler Core:** 
  - **JavaScript Implementation:** For real-time browser execution.
  - **Native C Implementation:** Found in `src/compiler/` for reference and CLI-based benchmarks.

---

## 🏗️ Project Structure

```text
chaos-COMPILER/
├── src/
│   ├── compiler/          # THE CORE ENGINE
│   │   ├── lexer.js/c/h    # Tokenizer
│   │   ├── parser.js/c/h   # AST Generator
│   │   ├── ir.js/h         # Intermediate Representation
│   │   ├── chaos.c/h       # Polymorphic Mutation Engine
│   │   └── codegen.js/c/h  # Assembly Generator
│   ├── components/        # React UI Components
│   │   └── ParseTree.jsx   # Recursive AST Visualizer
│   └── App.jsx            # Main Application Logic
├── tailwind.config.js     # Styling Configuration
└── package.json           # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```powershell
   git clone https://github.com/aadipandey223/chaos-COMPILER.git
   cd chaos-COMPILER
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

---

## 🔬 How it Works

1. **Analysis:** The Lexer and Parser turn your C code into a "Clean IR" (Intermediate Representation).
2. **Mutation:** The Chaos Engine applies random but "behavior-preserving" transformations:
   - **Instruction Shuffling:** Reordering operations that don't depend on each other.
   - **Opaque Predicates:** Adding complex-looking logic that always evaluates to a known value.
   - **No-Op Injection:** Inserting "junk" instructions that don't change state.
3. **Verification:** The "clean" result and "chaotic" result are compared in a virtual execution environment to ensure 1:1 functional parity.
4. **Export:** The system generates valid assembly code and a unique binary fingerprint.

---

## 🤝 Contributing
Contributions are welcome! If you have ideas for new chaos transformations or UI improvements, please open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Created with 🌪️ by **Antigravity AI**
