# Query Processor

🔍 A lightweight tool to analyze and optimize URL query parameters. 
Works offline with Service Worker.

---

## 🛠️ Architecture Overview

This project features a minimal, dependency-free architecture utilizing modern web technologies:

- **Frontend (index.html, style.css):**  
  Built with vanilla JavaScript and CSS for fast load times and broad browser compatibility.

- **Service Worker (sw.js):**  
  Enables offline capabilities and intercepts fetch requests for local handling.

- **Serverless API (netlify/functions/api.js):**  
  Processes query parameters and returns JSON data.

- **Deployment Configuration (netlify.toml):**  
  Manages routing, functions, and build settings.

---

## 📄 Usage & Features

- Open `index.html` directly in your browser—no build tools required.  
- Service Worker provides offline support.  
- Designed for rapid response times.  
- Supports extensive URL parameters with real-time parsing.  
- Automatically infers data types and provides statistical insights.  
- Features a modern, responsive UI with dynamic updates.

---

## 📁 File Structure

- `index.html`  
- `style.css`  
- `sw.js`  
- `netlify/functions/api.js`  
- `netlify.toml`  
- `LICENSE`  
- `README.md`

---

## 📝 License

This project is licensed under the MIT License.
