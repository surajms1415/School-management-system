# 💻 EduCore — Frontend Client

The frontend client for **EduCore (School Management System)** is a modern, responsive Single Page Application (SPA) built with **React 19**, **Vite 8**, and **Tailwind CSS v4**.

---

## 🎨 UI & Features

- **Dark Glassmorphic Aesthetics**: Modern UI with animated floating particle mesh background and blur filters.
- **Micro-Interactions & Transitions**: Built with [Framer Motion](https://www.framer-motion.dev/) for smooth animations.
- **Role-Based Access Control**:
  - **Admin**: Dashboard metrics, Student CRUD, Teacher CRUD, Curriculum/Subject management, System-wide Attendance logs.
  - **Teacher**: Classroom student rosters, Subject selector, 1-click Attendance marking (`Present` / `Absent`), Examination results/marks entry.
  - **Student**: Personalized portal, calculated attendance percentage ($\ge 75\%$ status pill), detailed attendance history, academic scorecard.
- **JWT Authorization**: Axios request interceptor automatically attaches the `Bearer` token to protected endpoints.

---

## 🛠️ Tech Stack & Libraries

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4, PostCSS, Autoprefixer
- **Navigation**: React Router DOM v7
- **Animations**: Framer Motion
- **Icons**: React Icons (`react-icons/fa`) & Lucide React
- **Data Visualization**: Chart.js & `react-chartjs-2`
- **HTTP Client**: Axios
- **Token Decoding**: `jwt-decode`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend API Endpoint
Edit `src/utils/api.js` to point to your local or hosted backend:

```javascript
// Local FastAPI backend:
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Production backend:
// baseURL: 'https://school-management-system-03r3.onrender.com'
```

### 3. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```
The compiled, minified bundle will be output to the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```
