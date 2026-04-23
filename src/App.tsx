import './App.css'

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: '#4f9cff',
        }}
      />
    </div>
  )
}

export default App
