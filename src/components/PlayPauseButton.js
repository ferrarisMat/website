function PlayPauseButton({ isConfigured, isPlaying, currentTrack, onToggle }) {
  if (!isConfigured) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      {currentTrack && (
        <div style={{
          textAlign: 'right',
          color: '#fff',
          maxWidth: '200px',
          opacity: isPlaying ? 1 : 0.5,
          transition: 'opacity 0.3s'
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentTrack.name}
          </div>
          <div style={{
            fontSize: '0.65rem',
            color: 'rgba(0,255,136,0.7)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentTrack.artist}
          </div>
        </div>
      )}
      <button
        onClick={onToggle}
        style={{
          background: 'rgba(255,255,255,0.1)',
          color: '#00FF88',
          border: '1px solid rgba(0,255,136,0.3)',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          backdropFilter: 'blur(8px)',
          flexShrink: 0
        }}
      >
        {isPlaying ? '\u275A\u275A' : '\u25B6'}
      </button>
    </div>
  );
}

export default PlayPauseButton;
