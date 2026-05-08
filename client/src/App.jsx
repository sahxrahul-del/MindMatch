import React from 'react';
import { useGame } from './context/GameContext';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';

function App() {
  const { room } = useGame();

  return (
    <div className="min-h-screen bg-background">
      {!room ? <Home /> : <GameRoom />}
    </div>
  );
}

export default App;
