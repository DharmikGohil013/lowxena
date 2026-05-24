import './Loader.css'

function Loader({ message = 'Loading...' }) {
  return (
    <div className="global-loader-overlay" role="status" aria-live="polite" aria-busy="true" aria-label={message}>
      <div className="global-loader-content">
        <div className="css-loader" aria-hidden="true">
          <span className="css-loader-dot"></span>
          <span className="css-loader-dot"></span>
          <span className="css-loader-dot"></span>
        </div>
        <p className="loader-message">{message}</p>
      </div>
    </div>
  )
}

export default Loader
