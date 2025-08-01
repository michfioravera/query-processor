# Query Processor

🔍 A lightweight tool to analyze and optimize URL query parameters. 
Works offline with Service Worker.

---

## 🛠️ Architecture Overview

This project employs a minimal, dependency-free architecture leveraging modern web technologies:

**Frontend (index.html, style.css)** - Built with vanilla JavaScript and CSS, ensuring fast load times and broad browser compatibility.

**Service Worker (sw.js)** - Implements offline capabilities and intercepts fetch requests to handle API interactions locally.

**Parameter Processor (paramProcessor.js)** - A modular utility for parsing, deduplicating, and analyzing query parameters. This logic is shared between the frontend and the serverless backend to ensure consistent results and eliminate redundancy.

**Serverless API (netlify/functions/api.js)** - Deployed via Netlify Functions, processes query parameters and returns JSON data.

**Deployment Configuration (netlify.toml)** - Manages routing, functions, and build settings for deployment.

[![Netlify Status](https://api.netlify.com/api/v1/badges/092716c0-84f9-4dcf-98aa-abc5968942f3/deploy-status)](https://app.netlify.com/projects/query-processor/deploys)

---

## 📄 Usage & Features

- No build process: Open `index.html` directly in the browser.
- Offline support: Service Worker enables offline functionality.
- Type inference: Automatically detects data types such as numbers, booleans, arrays, and dates.
- Statistical analysis: Computes metrics like mean, median, and standard deviation.
- Responsive UI: Implements a modern, glassmorphism style, updating dynamically without page refresh.

### 📁 Project Structure

    query-processor/
├── netlify/
│   └── functions/
│       └── api.js
├── LICENSE
├── README.md
├── index.html
├── netlify.toml
├── paramProcessor.js
├── style.css
└── sw.js

---

## 📝 License

This project is licensed under the MIT License.
