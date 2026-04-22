// Main app — Design C, optimized for iPhone swipe interaction.
// On mobile (viewport width < 640), renders full-bleed.
// On desktop, wraps the content in an iPhone frame.

(function mountApp() {
  const { LPSwipe, IOSDevice } = window;
  if (!LPSwipe || !IOSDevice) return setTimeout(mountApp, 30);

  function App() {
    const [isMobile, setIsMobile] = React.useState(
      typeof window !== 'undefined' && window.innerWidth < 640,
    );
    React.useEffect(() => {
      const onR = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener('resize', onR);
      return () => window.removeEventListener('resize', onR);
    }, []);

    if (isMobile) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
          <LPSwipe />
        </div>
      );
    }

    // Desktop: show inside iPhone bezel, centered on a dark stage
    return (
      <div style={{
        minHeight: '100vh', width: '100%', background: '#09090b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', position: 'relative',
      }}>
        {/* ambient tape stripes in the bg */}
        <div style={{
          position: 'absolute', inset: 0, opacity: .04, pointerEvents: 'none',
          background: 'repeating-linear-gradient(45deg, #ff2d55 0 24px, #09090b 24px 48px)',
        }}/>
        <div style={{
          position: 'absolute', top: 28, left: 32, color: '#ff2d55',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 3, zIndex: 1,
        }}>
          CONFIDENTIAL · LEAKING TONIGHT · 2026.04.XX
        </div>
        <div style={{
          position: 'absolute', bottom: 28, right: 32, color: 'rgba(255,255,255,.4)',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2, zIndex: 1,
          textAlign: 'right',
        }}>
          ← → or SWIPE to navigate<br/>
          TAP censored content to reveal
        </div>

        <IOSDevice width={402} height={874} dark>
          <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
            <LPSwipe />
          </div>
        </IOSDevice>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
