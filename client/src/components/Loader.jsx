import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import './Loader.css'

function Loader({ message = 'Loading...' }) {
  const [loaderAnimation, setLoaderAnimation] = useState(null)

  useEffect(() => {
    fetch('/loader.json')
      .then(response => response.json())
      .then(data => setLoaderAnimation(data))
      .catch(err => console.error('Failed to load animation:', err))
  }, [])

  return (
    <div className="global-loader-overlay">
      <div className="global-loader-content">
        {loaderAnimation && (
          <Lottie 
            animationData={loaderAnimation} 
            loop={true}
            style={{ width: 200, height: 200 }}
          />
        )}
        <p className="loader-message">{message}</p>
      </div>
    </div>
  )
}

export default Loader
