# Bida - Course Management System

A web-based course management platform built with **Node.js** and **MongoDB**.

## ⚡ Quick Start (Automated Setup)

**The easiest way to get started!**

1.  Download this project.
2.  Right-click **`setup.bat`** and select **"Run as Administrator"**.
3.  The script will automatically:
    *   Install **Node.js** (if missing).
    *   Install **MongoDB** (if missing).
    *   Install all project dependencies.
    *   Import the sample database.
4.  Once finished, you can run the app!

---

## 🛠️ Manual Setup

If you prefer to set up everything manually or refer to the individual steps:

### 1. Prerequisites
*   [Node.js (LTS)](https://nodejs.org/)
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community)

### 2. Install Dependencies
Open a terminal, navigate to the `webapp` folder, and install libraries:
```bash
cd webapp
npm install
```

### 3. Database
Run the **`import_data.bat`** script (Windows) or use `mongoimport` manually for the JSON files in `data/`.

## ▶️ Running the Application

1.  Open your terminal and navigate to the `webapp` folder (if not already there).
2.  Start the server:

```bash
npm start
```

3.  Open your web browser and go to:
    **[http://localhost:3000](http://localhost:3000)**

## 🛠️ Project Structure

*   `webapp/` - Contains the Node.js application code.
*   `data/` - Contains the JSON data files for the database.
*   `scripts/` - Helper scripts for data generation.
*   `import_data.bat` - Script to easily import data into MongoDB.
