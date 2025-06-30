# Query Processor

🔍 A lightweight tool to analyze and optimize URL query parameters. 
Works offline with Service Worker.

## 🛠️ Architecture Overview

This project employs a minimal, dependency-free architecture leveraging modern web technologies:

    Frontend (index.html, style.css):
    Built with vanilla JavaScript and CSS, ensuring fast load times and broad browser compatibility.

    Service Worker (sw.js):
    Implements offline capabilities and intercepts fetch requests to handle API interactions locally.

          

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api')) {
    event.respondWith(handleApiRequest(event.request));
  }
});

      

    Serverless API (netlify/functions/api.js):
    Deployed via Netlify Functions, processes query parameters and returns JSON data.

          

exports.handler = async (event) => {
  const params = event.queryStringParameters;
  return { statusCode: 200, body: JSON.stringify({ query: params }) };
};

      

    Deployment Configuration (netlify.toml):
    Manages routing, functions, and build settings for deployment.

# 📄 Usage & Features

    No build process: Open index.html directly in the browser.
    Offline support: Service Worker enables offline functionality.
    Type inference: Automatically detects data types such as numbers, booleans, arrays, and dates.
    Statistical analysis: Computes metrics like mean, median, and standard deviation.
    Responsive UI: Implements a modern, glassmorphism style, updating dynamically without page refresh.

# 📁 File Structure

    index.html
    style.css
    sw.js
    netlify/functions/api.js
    netlify.toml
    LICENSE
    README.md

# ⚙️ Development

No build tools required. Simply open index.html in your browser to run locally.

# 📝 License

This project is licensed under the MIT License.
