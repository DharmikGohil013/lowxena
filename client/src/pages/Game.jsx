import './Game.css'

function Game() {
  return (
    <div className="game-container">
      <div className="stars"></div>
      <div className="content">
        <div className="logo-section">
          <img 
            src="/logo.png" 
            alt="LowXena Logo" 
            className="game-logo"
          />
          <h1 className="game-title">LowXena</h1>
        </div>
        
        <div className="game-info">
          <p>Game is loading...</p>
        </div>
      </div>
      
      <footer className="creator-credit">
        <p>Created by Dharmik Gohil</p>
      </footer>
    </div>
  )
}

export default Game
