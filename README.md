# 🟢 CoopWise: Reimagining African Cooperatives with AI & Stablecoin Innovation

**CoopWise** is a next-gen cooperative savings platform that digitizes traditional African savings models (e.g., *Ajo*, *Esusu*, *Chamas*). We blend **AI-driven insights**, **stablecoin-based settlements**, and **transparent group governance** to empower communities with modern financial infrastructure.

---

## 🧠 Key Features

- 🔐 **Authentication & Identity Verification**
- 🤖 **AI-Powered Cooperative Insights & Financial Nudges**
- 🌍 **Group Creation, Joining, and Discovery**
- 💰 **Stablecoin Wallets & Seamless Contributions**
- 📈 **Smart Dashboards with Contribution Tracking**
- 📬 **Real-time Notifications & Invitations**
- 🛠️ **Admin and Support Channels for Dispute Resolution**
- 💬 **AI Interview Chat (Beta)**

---

## 📁 Project Structure

```txt
olaniyigeorge-coopwise/
│
├── api_backend/         → FastAPI backend (versioned routes, services, models, utils)
│   ├── app/             → Core app logic: APIs, schemas, services, etc.
│   ├── db/              → SQLAlchemy models and DB logic
│   ├── main.py          → Entrypoint for backend
│
├── frontend/            → Next.js frontend (app directory structure, components, styling)
│   ├── app/             → Pages, routes, layout
│   ├── components/      → UI and dashboard components
│   ├── lib/             → API & state management logic
│   ├── hooks/, types/   → Shared utilities and types
│
├── docker-compose.yml   → Multi-service orchestration
├── todo.md              → Pending or planned features
├── README.md            → You're here
