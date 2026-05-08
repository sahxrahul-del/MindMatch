# MindMatch 🚀

MindMatch is a real-time multiplayer browser game where two players try to select the same number from 1 to 20. It's a game of intuition, synchronization, and fun!

## ✨ Features

- **Real-time Multiplayer**: Powered by Socket.IO for instant synchronization.
- **Dynamic Game Flow**: Waiting -> Ready -> Selection -> Reveal -> Result.
- **Secret Submissions**: Opponents cannot see your choice until both have submitted.
- **Live Chat**: Real-time room chat with typing indicators and emojis.
- **Modern UI**: Dark-themed, glassmorphism design with neon accents.
- **Responsive**: Works perfectly on Desktop, Tablet, and Mobile.
- **Animations**: Smooth transitions using Framer Motion.

## 🛠️ Tech Stack

### Frontend
- **React** (Vite)
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations)
- **Socket.io-client** (Communication)
- **Canvas-Confetti** (Celebration)

### Backend
- **Node.js** & **Express**
- **Socket.IO** (WebSockets)
- **In-memory Room Management**

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### Running the Application

You need to run both the server and the client simultaneously.

**Start the Server:**
```bash
cd server
npm start
```

**Start the Client:**
```bash
cd client
npm run dev
```

The client will typically run at `http://localhost:5173`.

## 📡 Socket Architecture

- `create-room`: Host a new game room.
- `join-room`: Join an existing room via a 5-digit code.
- `player-ready`: Signal readiness to start.
- `submit-number`: Submit your secret selection.
- `send-message`: Send a message to the room chat.
- `typing` / `stop-typing`: Real-time typing status.
- `replay-request`: Request a new round after a match.

## 📁 Project Structure

- `client/src/context`: React Context for global state and socket management.
- `client/src/components`: Reusable UI components.
- `client/src/pages`: Main application views.
- `server/rooms`: Logic for managing room state and players.
- `server/socket`: Event handlers for real-time communication.
- `server/gameLogic`: Pure functions for calculating match results.

## 📝 License
This project is open-source and available under the MIT License.
