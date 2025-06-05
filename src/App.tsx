import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import hole1Img from './assets/Hole1.png';

const REDTAIL_INFO = {
  name: "Redtail Golf Center",
  address: "8200 SW Scholls Ferry Rd, Beaverton, OR 97008",
  phone: "(503) 646-5166",
  website: "https://www.redtailgolfcenter.com/",
  description: "Redtail Golf Center is a public 18-hole golf course in Beaverton, Oregon, known for its well-maintained fairways and practice facilities."
};

const REDTAIL_HOLES = [
  { number: 1, par: 4, yards: 380 },
  { number: 2, par: 3, yards: 175 },
  { number: 3, par: 4, yards: 395 },
  { number: 4, par: 5, yards: 520 },
  { number: 5, par: 4, yards: 410 },
  { number: 6, par: 3, yards: 185 },
  { number: 7, par: 4, yards: 400 },
  { number: 8, par: 4, yards: 390 },
  { number: 9, par: 5, yards: 510 },
  { number: 10, par: 4, yards: 405 },
  { number: 11, par: 3, yards: 180 },
  { number: 12, par: 4, yards: 395 },
  { number: 13, par: 5, yards: 515 },
  { number: 14, par: 4, yards: 415 },
  { number: 15, par: 3, yards: 190 },
  { number: 16, par: 4, yards: 405 },
  { number: 17, par: 4, yards: 385 },
  { number: 18, par: 5, yards: 525 },
];

type ShotMarker = { x: number; y: number; distance?: number; club?: string };

interface HoleDiagramProps {
  holeNumber: number;
  image: string;
  shots: ShotMarker[];
  onMapClick: (x: number, y: number) => void;
  onRemoveShot: (idx: number) => void;
  onResetShots: () => void;
  tee: ShotMarker | null;
  pin: ShotMarker | null;
  setMode: 'tee' | 'pin' | 'shot';
  onSetTee: (x: number, y: number) => void;
  onSetPin: (x: number, y: number) => void;
  onFlagClick: () => void;
  shotsDisabled: boolean;
}

const IMAGE_WIDTH = 1152;
const IMAGE_HEIGHT = 768;
const VIEWPORT_WIDTH = 1152;
const VIEWPORT_HEIGHT = 768;
const DISPLAY_WIDTH = 600;
const DISPLAY_HEIGHT = 400;
const HOLE1_YARDS = 380;
const DRAGGABLE_ZOOM = 2; // 2x zoom for draggable view

const flagSVG = (
  <svg width="32" height="32" viewBox="0 0 32 32">
    <rect x="14" y="6" width="3" height="20" fill="#b71c1c" />
    <polygon points="17,6 28,12 17,18" fill="#fff" stroke="#b71c1c" strokeWidth="1" />
  </svg>
);

// Add tee marker SVG
const teeSVG = (
  <svg width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="#2E7D32" stroke="#fff" strokeWidth="2" />
    <path d="M18 8 L18 28 M12 14 L24 14 M12 22 L24 22" stroke="#fff" strokeWidth="2" />
  </svg>
);

const HoleDiagram: React.FC<HoleDiagramProps> = ({ holeNumber, image, shots, onMapClick, onRemoveShot, onResetShots, tee, pin, setMode, onSetTee, onSetPin, onFlagClick, shotsDisabled }) => {
  // View mode: full hole or draggable
  const [fullView, setFullView] = React.useState(true);
  // Pan state for draggable mode
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [lastMouse, setLastMouse] = React.useState<{ x: number; y: number } | null>(null);

  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (fullView) return;
    setDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (fullView || !dragging || !lastMouse) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setPan(pan => {
      let newX = pan.x + dx;
      let newY = pan.y + dy;
      return clampPan({ x: newX, y: newY });
    });
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => {
    setDragging(false);
    setLastMouse(null);
  };
  const handleMouseLeave = () => {
    setDragging(false);
    setLastMouse(null);
  };
  const handleResetView = () => {
    setPan({
      x: (VIEWPORT_WIDTH - IMAGE_WIDTH * DRAGGABLE_ZOOM) / 2,
      y: (VIEWPORT_HEIGHT - IMAGE_HEIGHT * DRAGGABLE_ZOOM) / 2,
    });
  };

  // Calculate fit-to-viewport scale for full view
  // Use the actual container size for mobile responsiveness
  // We'll use 100vw and aspectRatio for the container
  const fitScale = 1; // We'll use SVG's viewBox and width/height to scale for full view

  // Update pan clamping logic for draggable view
  const clampPan = (pan: { x: number; y: number }) => {
    // The image is DRAGGABLE_ZOOM times larger than the viewport
    const maxX = 0;
    const minX = VIEWPORT_WIDTH - IMAGE_WIDTH * DRAGGABLE_ZOOM;
    const maxY = 0;
    const minY = VIEWPORT_HEIGHT - IMAGE_HEIGHT * DRAGGABLE_ZOOM;
    return {
      x: Math.min(maxX, Math.max(pan.x, minX)),
      y: Math.min(maxY, Math.max(pan.y, minY)),
    };
  };

  // In useEffect, reset pan when switching to draggable view
  useEffect(() => {
    if (!fullView) {
      setPan({
        x: (VIEWPORT_WIDTH - IMAGE_WIDTH * DRAGGABLE_ZOOM) / 2,
        y: (VIEWPORT_HEIGHT - IMAGE_HEIGHT * DRAGGABLE_ZOOM) / 2,
      });
    }
  }, [fullView]);

  // Helper function to rotate coordinates 90 degrees clockwise
  const rotateCoordinates = (x: number, y: number) => {
    return {
      x: y,
      y: IMAGE_HEIGHT - x
    };
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        aspectRatio: '3/2',
        margin: '0 auto',
        overflow: 'hidden',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        touchAction: 'none',
      }}
    >
      {fullView ? (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}`}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'auto' }}
          onClick={e => {
            if (shotsDisabled) return;
            if (setMode !== 'shot') return;
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * IMAGE_WIDTH;
            const y = ((e.clientY - rect.top) / rect.height) * IMAGE_HEIGHT;
            onMapClick(x, y);
          }}
        >
          <image
            href={image}
            x={0}
            y={0}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            preserveAspectRatio="xMidYMid meet"
          />
          {/* Tee marker */}
          {tee && (
            <g transform={`translate(${tee.x - 18},${tee.y - 18})`} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              {teeSVG}
            </g>
          )}
          {/* Pin marker (flag) */}
          {pin && (
            <g transform={`translate(${pin.x - 16},${pin.y - 32})`} style={{ cursor: shotsDisabled ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}>
              {flagSVG}
            </g>
          )}
          {/* Shot markers */}
          {shots.map((shot: ShotMarker, idx: number) => (
            <g key={idx} style={{ pointerEvents: 'auto' }}>
              <circle
                cx={shot.x}
                cy={shot.y}
                r={16}
                fill="#fff"
                stroke="#1565C0"
                strokeWidth={3}
                filter="url(#shadow)"
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.stopPropagation();
                  onRemoveShot(idx);
                }}
              />
              <text
                x={shot.x}
                y={shot.y + 6}
                textAnchor="middle"
                fontSize="14"
                fill="#1565C0"
                style={{ pointerEvents: 'none', fontWeight: 'bold' }}
              >
                {idx + 1}
              </text>
            </g>
          ))}
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0003" />
            </filter>
          </defs>
        </svg>
      ) : (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEWPORT_WIDTH} ${VIEWPORT_HEIGHT}`}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'auto', cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={e => {
            if (dragging) return;
            if (shotsDisabled) return;
            if (setMode !== 'shot') return;
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * VIEWPORT_WIDTH;
            const svgY = ((e.clientY - rect.top) / rect.height) * VIEWPORT_HEIGHT;
            const x = (svgX - pan.x) / DRAGGABLE_ZOOM;
            const y = (svgY - pan.y) / DRAGGABLE_ZOOM;
            onMapClick(x, y);
          }}
        >
          <g transform={`translate(${pan.x},${pan.y}) scale(${DRAGGABLE_ZOOM})`}>
            <image
              href={image}
              x={0}
              y={0}
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
              preserveAspectRatio="xMidYMid meet"
            />
            {/* Tee marker */}
            {tee && (
              <g transform={`translate(${tee.x - 18},${tee.y - 18})`} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                {teeSVG}
              </g>
            )}
            {/* Pin marker (flag) */}
            {pin && (
              <g transform={`translate(${pin.x - 16},${pin.y - 32})`} style={{ cursor: shotsDisabled ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}>
                {flagSVG}
              </g>
            )}
            {/* Shot markers */}
            {shots.map((shot: ShotMarker, idx: number) => (
              <g key={idx} style={{ pointerEvents: 'auto' }}>
                <circle
                  cx={shot.x}
                  cy={shot.y}
                  r={16}
                  fill="#fff"
                  stroke="#1565C0"
                  strokeWidth={3}
                  filter="url(#shadow)"
                  style={{ cursor: 'pointer' }}
                  onClick={e => {
                    e.stopPropagation();
                    onRemoveShot(idx);
                  }}
                />
                <text
                  x={shot.x}
                  y={shot.y + 6}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#1565C0"
                  style={{ pointerEvents: 'none', fontWeight: 'bold' }}
                >
                  {idx + 1}
                </text>
              </g>
            ))}
          </g>
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0003" />
            </filter>
          </defs>
        </svg>
      )}
      {(setMode === 'tee' || setMode === 'pin') && !shotsDisabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 3,
            cursor: 'crosshair',
            pointerEvents: 'auto',
          }}
          onClick={e => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            let x, y;
            if (fullView) {
              x = ((e.clientX - rect.left) / rect.width) * IMAGE_WIDTH;
              y = ((e.clientY - rect.top) / rect.height) * IMAGE_HEIGHT;
            } else {
              x = ((e.clientX - rect.left) / rect.width) * VIEWPORT_WIDTH - pan.x;
              y = ((e.clientY - rect.top) / rect.height) * VIEWPORT_HEIGHT - pan.y;
            }
            if (setMode === 'tee') onSetTee(x, y);
            else if (setMode === 'pin') onSetPin(x, y);
          }}
        />
      )}
      <div className="control-buttons">
        <button
          onClick={onResetShots}
          className="control-button"
        >
          Reset Shots
        </button>
        <button
          onClick={handleResetView}
          className="control-button"
          disabled={fullView}
        >
          Reset View
        </button>
        <button
          onClick={() => setFullView(v => !v)}
          className="control-button"
        >
          {fullView ? 'Draggable View' : 'Full View'}
        </button>
      </div>
    </div>
  );
};

const CLUBS = [
  'Driver', '3 Wood', '5 Wood', '2 Iron', '3 Iron', '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'Pitching Wedge', 'Sand Wedge', 'Lob Wedge', 'Putter'
];

const initialHoleState = {
  markers: [] as ShotMarker[],
  tee: null as ShotMarker | null,
  pin: null as ShotMarker | null,
  setMode: 'shot' as 'tee' | 'pin' | 'shot',
  shotsDisabled: false,
};

const RoundTracker = () => {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [holeStates, setHoleStates] = useState(
    Array(18).fill(null).map(() => ({ ...initialHoleState }))
  );
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [holeScores, setHoleScores] = useState<(number | null)[]>(Array(18).fill(null));
  const [clubSelections, setClubSelections] = useState<{ [key: string]: string }>({});
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Helper to update state for a specific hole
  const updateHoleState = (holeIdx: number, update: Partial<typeof initialHoleState>) => {
    setHoleStates(prev => {
      const arr = [...prev];
      arr[holeIdx] = { ...arr[holeIdx], ...update };
      return arr;
    });
  };

  // Handlers for the selected hole
  const holeIdx = (selectedHole ?? 1) - 1;
  const state = holeStates[holeIdx];
  const HOLE_YARDS = REDTAIL_HOLES[holeIdx].yards;
  let scale = 1;
  if (state.tee && state.pin) {
    const dx = state.pin.x - state.tee.x;
    const dy = state.pin.y - state.tee.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    scale = HOLE_YARDS / pixelDist;
  }

  const handleMapClick = (x: number, y: number) => {
    if (state.shotsDisabled) return;
    if (state.setMode === 'shot') {
      const prevClub = state.markers.length > 0 ? state.markers[state.markers.length - 1].club : CLUBS[0];
      updateHoleState(holeIdx, {
        markers: [...state.markers, { x, y, club: prevClub || CLUBS[0] }],
      });
    }
  };
  const handleRemoveMarker = (idx: number) => {
    updateHoleState(holeIdx, {
      markers: state.markers.filter((_, i) => i !== idx),
    });
  };
  const handleResetShots = () => {
    updateHoleState(holeIdx, {
      markers: [],
      shotsDisabled: false,
    });
  };
  const handleSetTee = (x: number, y: number) => {
    updateHoleState(holeIdx, { tee: { x, y }, setMode: 'shot' });
  };
  const handleSetPin = (x: number, y: number) => {
    updateHoleState(holeIdx, { pin: { x, y }, setMode: 'shot' });
  };
  const handleSetMode = (mode: 'tee' | 'pin' | 'shot') => {
    updateHoleState(holeIdx, { setMode: mode });
  };
  const handleFlagClick = () => {
    if (!state.pin || state.shotsDisabled) return;
    if (state.markers.length > 0) {
      const last = state.markers[state.markers.length - 1];
      if (last.x === state.pin.x && last.y === state.pin.y) return;
    }
    updateHoleState(holeIdx, {
      markers: [...state.markers, { x: state.pin.x, y: state.pin.y }],
      shotsDisabled: true,
    });
    setTimeout(() => {
      const strokes = state.markers.length + 1;
      const par = REDTAIL_HOLES[holeIdx].par;
      let msg = '';
      if (strokes === par - 2) msg = 'Incredible! Eagle!!';
      else if (strokes === par - 1) msg = 'Amazing Birdie!';
      else if (strokes === par) msg = 'Nice Job on that Par!';
      else if (strokes === par + 1) msg = 'Solid effort, just a Bogey.';
      else if (strokes > par + 1) msg = `Keep practicing! ${strokes - par} over par.`;
      else msg = 'Great round!';
      setResultMsg(msg);
      setShowResult(true);
      setHoleScores(prev => {
        const arr = [...prev];
        arr[holeIdx] = strokes;
        return arr;
      });
    }, 100);
  };
  const handleClubChange = (shotIdx: number, club: string) => {
    const updatedMarkers = state.markers.map((shot, idx) => idx === shotIdx ? { ...shot, club } : shot);
    updateHoleState(holeIdx, { markers: updatedMarkers });
  };

  return (
    <div className="round-tracker-container">
      <div className="header-container">
        <h1 className="header-title">Round Tracker</h1>
        <button
          className={`analytics-toggle ${showAnalytics ? 'active' : ''}`}
          onClick={() => setShowAnalytics(a => !a)}
        >
          {showAnalytics ? 'Hide' : 'Show'} Analytics
        </button>
      </div>

      {showAnalytics && (
        <DataAnalytics holeStates={holeStates} holes={REDTAIL_HOLES} />
      )}

      <div className="course-info" style={{
        background: '#fff',
        borderRadius: 12,
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#1a237e', fontSize: '1.8rem' }}>{REDTAIL_INFO.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#424242' }}>{REDTAIL_INFO.address}</p>
            <p style={{ margin: '0.5rem 0', color: '#424242' }}>Phone: {REDTAIL_INFO.phone}</p>
          </div>
          <div>
            <p style={{ margin: '0.5rem 0', color: '#424242' }}>
              Website: <a href={REDTAIL_INFO.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1a237e', textDecoration: 'none' }}>{REDTAIL_INFO.website}</a>
            </p>
            <p style={{ margin: '0.5rem 0', color: '#424242' }}>{REDTAIL_INFO.description}</p>
          </div>
        </div>
      </div>

      <div className="holes-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}>
        {REDTAIL_HOLES.map(hole => (
          <button
            key={hole.number}
            className={`hole-button${selectedHole === hole.number ? ' selected' : ''}`}
            onClick={() => setSelectedHole(hole.number)}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              border: '2px solid',
              borderColor: selectedHole === hole.number ? '#1a237e' : '#e0e0e0',
              background: selectedHole === hole.number ? '#1a237e' : '#fff',
              color: selectedHole === hole.number ? '#fff' : '#424242',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '1rem'
            }}
          >
            {hole.number}
          </button>
        ))}
      </div>

      {selectedHole && (
        <div className="hole-details" style={{ 
          background: '#fff',
          borderRadius: 12,
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1a237e' }}>Hole {selectedHole}</h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#424242' }}>
                Par {REDTAIL_HOLES[selectedHole - 1].par} | {REDTAIL_HOLES[selectedHole - 1].yards} yards
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleSetMode('tee')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  border: '2px solid',
                  borderColor: state.setMode === 'tee' ? '#2E7D32' : '#e0e0e0',
                  background: state.setMode === 'tee' ? '#2E7D32' : '#fff',
                  color: state.setMode === 'tee' ? '#fff' : '#424242',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Set Tee
              </button>
              <button
                onClick={() => handleSetMode('pin')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  border: '2px solid',
                  borderColor: state.setMode === 'pin' ? '#1565C0' : '#e0e0e0',
                  background: state.setMode === 'pin' ? '#1565C0' : '#fff',
                  color: state.setMode === 'pin' ? '#fff' : '#424242',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Set Pin
              </button>
            </div>
          </div>

          <div className="hole-map" style={{ marginBottom: '2rem' }}>
            <HoleDiagram
              holeNumber={selectedHole}
              image={hole1Img}
              shots={state.markers}
              onMapClick={handleMapClick}
              onRemoveShot={handleRemoveMarker}
              onResetShots={handleResetShots}
              tee={state.tee}
              pin={state.pin}
              setMode={state.setMode}
              onSetTee={handleSetTee}
              onSetPin={handleSetPin}
              onFlagClick={handleFlagClick}
              shotsDisabled={state.shotsDisabled}
            />
          </div>

          <div className="scoreboard-card" style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#1a237e', fontSize: '1.2rem' }}>Shot Details</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#424242', fontWeight: 600 }}>Shot #</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#424242', fontWeight: 600 }}>Club</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#424242', fontWeight: 600 }}>Distance (yds)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#424242', fontWeight: 600 }}>To Pin (yds)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#424242', fontWeight: 600 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {state.markers.map((shot, idx) => {
                    let shotDist = '-';
                    if (state.tee && scale !== 1) {
                      if (idx === 0) {
                        const d = Math.sqrt((shot.x - state.tee.x) ** 2 + (shot.y - state.tee.y) ** 2) * scale;
                        shotDist = d.toFixed(1);
                      } else {
                        const prev = state.markers[idx - 1];
                        const d = Math.sqrt((shot.x - prev.x) ** 2 + (shot.y - prev.y) ** 2) * scale;
                        shotDist = d.toFixed(1);
                      }
                    }
                    let toPin = '-';
                    if (state.pin && scale !== 1) {
                      const d = Math.sqrt((shot.x - state.pin.x) ** 2 + (shot.y - state.pin.y) ** 2) * scale;
                      toPin = d.toFixed(1);
                    }
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '0.75rem', color: '#424242' }}>{idx + 1}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <select
                            value={shot.club || ''}
                            onChange={e => handleClubChange(idx, e.target.value)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: 6,
                              border: '1px solid #e0e0e0',
                              background: '#fff',
                              color: '#424242',
                              width: '100%'
                            }}
                          >
                            <option value="" disabled>Select club</option>
                            {CLUBS.map(club => (
                              <option key={club} value={club}>{club}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#424242' }}>{shotDist}</td>
                        <td style={{ padding: '0.75rem', color: '#424242' }}>{toPin}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => handleRemoveMarker(idx)}
                            style={{
                              color: '#b71c1c',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: '0.5rem'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1rem', fontWeight: 600, color: '#1a237e' }}>
              Total Shots: {state.markers.length}
            </div>
          </div>
        </div>
      )}

      {/* Scorecard */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1a237e', fontSize: '1.2rem', textAlign: 'center' }}>Scorecard</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#424242', fontWeight: 600 }}></th>
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i} style={{ padding: '0.75rem', textAlign: 'center', color: '#424242', fontWeight: 600 }}>
                    {i + 1}
                  </th>
                ))}
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#424242', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.75rem', textAlign: 'center', background: '#f5f5f5', fontWeight: 600, color: '#424242' }}>Front 9</td>
                {holeScores.slice(0, 9).map((score, i) => (
                  <td key={i} style={{ padding: '0.75rem', textAlign: 'center', color: score != null ? '#2E7D32' : '#888', fontWeight: score != null ? 600 : 400 }}>
                    {score ?? '-'}
                  </td>
                ))}
                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#1a237e' }}>
                  {holeScores.slice(0, 9).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', textAlign: 'center', background: '#f5f5f5', fontWeight: 600, color: '#424242' }}>Back 9</td>
                {holeScores.slice(9, 18).map((score, i) => (
                  <td key={i} style={{ padding: '0.75rem', textAlign: 'center', color: score != null ? '#1565C0' : '#888', fontWeight: score != null ? 600 : 400 }}>
                    {score ?? '-'}
                  </td>
                ))}
                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#1a237e' }}>
                  {holeScores.slice(9, 18).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Result popup */}
      {showResult && resultMsg && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          maxWidth: 400,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', color: '#2E7D32', fontWeight: 600, marginBottom: '1.5rem' }}>
            {resultMsg}
          </div>
          <button
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 8,
              border: 'none',
              background: '#2E7D32',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setShowResult(false)}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};

const DataAnalytics: React.FC<{ holeStates: any[]; holes: any[] }> = ({ holeStates, holes }) => {
  // Aggregate all shots from all holes, with yardage calculation
  let allShots: { club: string; distanceYards: number }[] = [];
  holeStates.forEach((holeState, holeIdx) => {
    const tee = holeState.tee;
    const pin = holeState.pin;
    const markers = holeState.markers || [];
    if (!tee || !pin || markers.length === 0) return;
    const HOLE_YARDS = holes[holeIdx].yards;
    const dx = pin.x - tee.x;
    const dy = pin.y - tee.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    const scale = pixelDist !== 0 ? HOLE_YARDS / pixelDist : 1;
    // For each shot (except the first), calculate distance from previous shot
    for (let i = 0; i < markers.length; i++) {
      const shot = markers[i];
      if (!shot.club) continue;
      let dist = 0;
      if (i === 0) {
        // First shot: from tee
        dist = Math.sqrt((shot.x - tee.x) ** 2 + (shot.y - tee.y) ** 2) * scale;
      } else {
        const prev = markers[i - 1];
        dist = Math.sqrt((shot.x - prev.x) ** 2 + (shot.y - prev.y) ** 2) * scale;
      }
      // Only count if distance is positive and club is set
      if (dist > 0 && shot.club) {
        allShots.push({ club: shot.club, distanceYards: dist });
      }
    }
  });
  // Group by club
  const clubStats: { [club: string]: { count: number; totalDist: number } } = {};
  allShots.forEach(shot => {
    if (!clubStats[shot.club]) clubStats[shot.club] = { count: 0, totalDist: 0 };
    clubStats[shot.club].count++;
    clubStats[shot.club].totalDist += shot.distanceYards;
  });
  // Prepare data for display
  const clubRows = Object.entries(clubStats).map(([club, stat]) => ({
    club,
    count: stat.count,
    avgDist: stat.count > 0 ? (stat.totalDist / stat.count).toFixed(1) : '-',
  }));

  // Dispersion visualization state
  const [selectedClub, setSelectedClub] = useState<string>('');
  // Gather all clubs used
  const allClubs = Array.from(new Set(allShots.map(s => s.club)));

  // For dispersion: gather all shots for the selected club, with their (x, y) positions relative to the pin for their hole
  let dispersionShots: { x: number; y: number; relX: number; relY: number }[] = [];
  if (selectedClub) {
    holeStates.forEach((holeState, holeIdx) => {
      const pin = holeState.pin;
      const markers = holeState.markers || [];
      if (!pin) return;
      markers.forEach((shot: ShotMarker) => {
        if (shot.club === selectedClub) {
          dispersionShots.push({
            x: shot.x,
            y: shot.y,
            relX: shot.x - pin.x,
            relY: shot.y - pin.y,
          });
        }
      });
    });
  }
  // Calculate mean and stddev for relX and relY
  function mean(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
  function stddev(arr: number[], m: number) { return arr.length ? Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) : 0; }
  const relXs = dispersionShots.map(s => s.relX);
  const relYs = dispersionShots.map(s => s.relY);
  const meanX = mean(relXs);
  const meanY = mean(relYs);
  const stdX = stddev(relXs, meanX);
  const stdY = stddev(relYs, meanY);

  // Shot map visualization (all shots on a single SVG)
  const DISPLAY_WIDTH = 600;
  const DISPLAY_HEIGHT = 400;
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      padding: '2rem',
      marginBottom: '2rem'
    }}>
      <h2 style={{ margin: '0 0 1.5rem 0', color: '#1a237e', fontSize: '1.8rem' }}>Data Analytics</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1a237e', fontSize: '1.4rem' }}>Club Performance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#424242', fontWeight: 600 }}>Club</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#424242', fontWeight: 600 }}>Shots</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#424242', fontWeight: 600 }}>Avg. Distance (yds)</th>
              </tr>
            </thead>
            <tbody>
              {clubRows.map(row => (
                <tr key={row.club} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '0.75rem', color: '#424242' }}>{row.club}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#424242' }}>{row.count}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#424242' }}>{row.avgDist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1a237e', fontSize: '1.4rem' }}>Shot Dispersion</h3>
        <div style={{ marginBottom: '1rem' }}>
          <select
            value={selectedClub}
            onChange={e => setSelectedClub(e.target.value)}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              background: '#fff',
              color: '#424242',
              width: '100%',
              maxWidth: 300
            }}
          >
            <option value="">Select a club to view dispersion</option>
            {allClubs.map(club => (
              <option key={club} value={club}>{club}</option>
            ))}
          </select>
        </div>
        {selectedClub && (
          <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <svg width={DISPLAY_WIDTH} height={DISPLAY_HEIGHT} style={{ width: '100%', height: 'auto', maxWidth: DISPLAY_WIDTH }}>
              {/* Draw ellipse for 1 stddev */}
              {dispersionShots.length > 1 && (
                <ellipse
                  cx={DISPLAY_WIDTH / 2 + meanX * (DISPLAY_WIDTH / 1152)}
                  cy={DISPLAY_HEIGHT / 2 + meanY * (DISPLAY_HEIGHT / 768)}
                  rx={stdX * (DISPLAY_WIDTH / 1152)}
                  ry={stdY * (DISPLAY_HEIGHT / 768)}
                  fill="#1565C033"
                  stroke="#1565C0"
                  strokeWidth={2}
                />
              )}
              {/* Draw shots */}
              {dispersionShots.map((s, idx) => (
                <circle
                  key={idx}
                  cx={DISPLAY_WIDTH / 2 + s.relX * (DISPLAY_WIDTH / 1152)}
                  cy={DISPLAY_HEIGHT / 2 + s.relY * (DISPLAY_HEIGHT / 768)}
                  r={8}
                  fill="#1565C0"
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={0.8}
                />
              ))}
              {/* Draw pin at center */}
              <circle
                cx={DISPLAY_WIDTH / 2}
                cy={DISPLAY_HEIGHT / 2}
                r={10}
                fill="#b71c1c"
                stroke="#fff"
                strokeWidth={3}
              />
            </svg>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1a237e', fontSize: '1.4rem' }}>Shot Map</h3>
        <div style={{ background: '#f8f8f8', borderRadius: 12, padding: '1rem' }}>
          <svg width={DISPLAY_WIDTH} height={DISPLAY_HEIGHT} style={{ width: '100%', height: 'auto', maxWidth: DISPLAY_WIDTH }}>
            {holeStates.flatMap((holeState, holeIdx) =>
              (holeState.markers || []).map((shot: ShotMarker, idx: number) => (
                <circle
                  key={`${holeIdx}-${idx}`}
                  cx={shot.x * (DISPLAY_WIDTH / 1152)}
                  cy={shot.y * (DISPLAY_HEIGHT / 768)}
                  r={8}
                  fill={shot.club ? '#1565C0' : '#888'}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={0.7}
                />
              ))
            )}
          </svg>
        </div>
        <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          <b>Note:</b> This is a simple shot map for all holes and clubs. Future updates will include heatmaps, trends, and more detailed analytics.
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App" style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
        padding: '1rem'
      }}>
        <header className="App-header" style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          padding: '1rem 2rem',
          marginBottom: '2rem',
          borderRadius: 16
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1a237e', fontWeight: 700 }}>Golf Tracker</h1>
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link to="/" className="nav-link" style={{
                color: '#424242',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                borderRadius: 8,
                transition: 'all 0.2s ease',
                background: 'rgba(26, 35, 126, 0.05)'
              }}>Home</Link>
              <Link to="/round-tracker" className="nav-link" style={{
                color: '#424242',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                borderRadius: 8,
                transition: 'all 0.2s ease',
                background: 'rgba(26, 35, 126, 0.05)'
              }}>Round Tracker</Link>
            </nav>
          </div>
        </header>
        <main className="App-main" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={
              <div className="home" style={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                padding: '3rem 2rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                <h2 style={{ fontSize: '2.5rem', color: '#1a237e', marginBottom: '1rem', fontWeight: 700 }}>Welcome to Golf Tracker</h2>
                <p style={{ fontSize: '1.2rem', color: '#424242', lineHeight: 1.6 }}>
                  Track your golf rounds, analyze your performance, and improve your game!
                </p>
              </div>
            } />
            <Route path="/round-tracker" element={<RoundTracker />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
