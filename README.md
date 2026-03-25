# ◈ Stock Evaluation Bot

An AI-powered stock portfolio analysis and tracking platform built with **Node.js**, **React**, and **SQLite**. It leverages OpenAI/GPT-4o and live news data to provide intelligent, weighted insights into your holdings.

---

## ⚡ Features

- **Portfolios**: Organize your holdings into separate lists.
- **Allocation Logic**: Set positions in either **USD ($)** or **Percentage (%)** to get weighted advice.
- **AI Analysis**: 
    - Full-portfolio reports that cross-reference price trends, sector exposure, and risk signals.
    - Single-stock deep dives for focused research.
- **News Context**: View the exact articles the AI considered during its analysis.
- **Automated Tasks**: Configure cron jobs to generate recurring reports on your favorite lists.
- **Rich Aesthetics**: Responsive, premium dark/light mode interface with glassmorphism and subtle animations.

---

## 🛠 Tech Stack

- **Frontend**: 
    - [React](https://reactjs.org/) (Vite)
    - Vanilla CSS (Glassmorphism, CSS Variables theme system)
    - Custom Hooks for API management
- **Backend**: 
    - [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
    - [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) (Synchronous, performant persistence)
    - [Bcryptjs](https://github.com/dcodeIO/bcrypt.js/) & [JWT](https://jwt.io/) (Secure auth)
- **APIs**:
    - [OpenAI](https://openai.com/) (GPT-4o-mini default)
    - [Alpha Vantage](https://www.alphavantage.co/) (Live market prices)
    - **Google News RSS** (Curated news context)

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- An [OpenAI API Key](https://platform.openai.com/api-keys)
- An [Alpha Vantage API Key](https://www.alphavantage.co/support/#api-key) (Free)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mdafer/stocks-portfolio-trading-evaluation-ai.git
   cd stocks-portfolio-trading-evaluation-ai
   ```

2. **Configure Environment**:
   Edit the `.env` file in the `backend/` directory:
   ```env
   JWT_SECRET=your-random-secret
   STOCK_API_KEY=your-alpha-vantage-key
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Launch with Docker**:
   ```bash
   docker compose up -d --build
   ```

4. **Access the App**:
   - **Frontend**: http://localhost:3010
   - **Backend API**: http://localhost:3011

---

## 📚 Database Schema

The SQLite database (`backend/data/stock_eval.db`) follows this structure:

- **users**: Accounts and preferences.
- **lists**: Portfolio groupings.
- **stocks**: Reference ticker data.
- **list_stocks**: The mapping table linking lists to stocks, including **allocation** amounts.
- **analyses**: AI report results and metadata.
- **analysis_news**: Cached news articles linked to specific analyses.
- **cron_jobs**: Automated analysis schedules.

---

## 📄 License

This project is for demo purposes and is not financial advice. Usage of AI for trading involves significant risk. Always consult a certified financial advisor.

---

*Vibe coded with ❤️ by [mdafer](https://github.com/mdafer)*
