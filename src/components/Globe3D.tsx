import React, { useEffect, useRef, useState } from 'react';
import { CityModelOutput } from '../types.ts';
import { ZoomIn, ZoomOut, Play, Pause, Navigation } from 'lucide-react';

interface Globe3DProps {
  cities: CityModelOutput[];
  selectedCity: CityModelOutput | null;
  onSelectCity: (city: CityModelOutput) => void;
}

export const Globe3D: React.FC<Globe3DProps> = ({
  cities,
  selectedCity,
  onSelectCity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef<{ x: number; y: number }>({
    x: 0.38, // Centered roughly at India's latitude ~22°
    y: -1.38, // Centered roughly at India's longitude ~78°
  });
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hoveredCity, setHoveredCity] = useState<CityModelOutput | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.1);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const projectedPointsRef = useRef<Array<{ x: number; y: number; city: CityModelOutput; visible: boolean }>>([]);
  const hoveredCityRef = useRef<CityModelOutput | null>(null);
  hoveredCityRef.current = hoveredCity;
  const selectedCityRef = useRef<CityModelOutput | null>(selectedCity);
  selectedCityRef.current = selectedCity;
  const isRotatingRef = useRef<boolean>(isRotating);
  isRotatingRef.current = isRotating;
  const zoomScaleRef = useRef<number>(zoomScale);
  zoomScaleRef.current = zoomScale;

  // Animation Loop for Canvas 3D Globe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Auto-rotation if enabled
      if (isRotatingRef.current && !isDraggingRef.current) {
        rotationRef.current.y += 0.0025;
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const currentZoom = zoomScaleRef.current;
      const radius = (Math.min(width, height) * 0.38) * currentZoom;
      const rot = rotationRef.current;

      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Atmosphere Glow
      const glowGradient = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.35);
      glowGradient.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
      glowGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.06)');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Globe Sphere Base
      const sphereGradient = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      sphereGradient.addColorStop(0, '#131b2e');
      sphereGradient.addColorStop(0.7, '#0b1120');
      sphereGradient.addColorStop(1, '#050811');
      ctx.fillStyle = sphereGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Globe outline rim
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Draw Graticules (Latitude & Longitude parallels)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 0.8;

      // Latitude circles (-60° to +60°)
      for (let lat = -60; lat <= 60; lat += 20) {
        const phi = (lat * Math.PI) / 180;
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 10) {
          const theta = (lng * Math.PI) / 180;
          // Rotate around X and Y
          const pt = project3D(phi, theta, rot.x, rot.y, radius, cx, cy);
          if (pt.z > 0) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // Longitude meridians
      for (let lng = -180; lng < 180; lng += 30) {
        const theta = (lng * Math.PI) / 180;
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 5) {
          const phi = (lat * Math.PI) / 180;
          const pt = project3D(phi, theta, rot.x, rot.y, radius, cx, cy);
          if (pt.z > 0) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // 4. Project and Draw All 130 Cities
      const currentProjects: Array<{ x: number; y: number; city: CityModelOutput; visible: boolean }> = [];
      const currentSelected = selectedCityRef.current;
      const currentHovered = hoveredCityRef.current;

      cities.forEach((cityData) => {
        const latRad = (cityData.city.lat * Math.PI) / 180;
        const lngRad = (cityData.city.lng * Math.PI) / 180;
        const pt = project3D(latRad, lngRad, rot.x, rot.y, radius, cx, cy);
        const isVisible = pt.z > 0;

        currentProjects.push({ x: pt.x, y: pt.y, city: cityData, visible: isVisible });

        if (isVisible) {
          const isSelected = currentSelected?.city.id === cityData.city.id;
          const isHovered = currentHovered?.city.id === cityData.city.id;

          // Dot color based on disaster risk
          let dotColor = '#10b981'; // Green
          if (cityData.disaster.riskLevel === 'SEVERE') dotColor = '#f43f5e';
          else if (cityData.disaster.riskLevel === 'WARNING') dotColor = '#fbbf24';
          else if (cityData.disaster.riskLevel === 'ADVISORY') dotColor = '#facc15';

          // Pulse ring for warning / severe
          if (cityData.disaster.riskLevel === 'SEVERE' || cityData.disaster.riskLevel === 'WARNING') {
            ctx.strokeStyle = dotColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, (isSelected ? 9 : 6) + Math.sin(Date.now() / 250) * 2, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Pin marker dot
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isSelected ? 5.5 : isHovered ? 4.5 : 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // City Label if selected or zoomed
          if (isSelected || isHovered || currentZoom > 1.25) {
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
            ctx.fillText(
              `#${cityData.city.id} ${cityData.city.name}`,
              pt.x + 7,
              pt.y + 3
            );
          }
        }
      });

      projectedPointsRef.current = currentProjects;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cities]);

  // Project spherical coordinates to 2D screen coordinates
  function project3D(
    lat: number,
    lng: number,
    rotX: number,
    rotY: number,
    radius: number,
    cx: number,
    cy: number
  ) {
    // 3D Cartesian coordinates on unit sphere
    const cosLat = Math.cos(lat);
    const x0 = cosLat * Math.sin(lng);
    const y0 = -Math.sin(lat);
    const z0 = cosLat * Math.cos(lng);

    // Rotate around Y axis (longitude)
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = x0 * cosY - z0 * sinY;
    const z1 = x0 * sinY + z0 * cosY;

    // Rotate around X axis (latitude tilt)
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y2 = y0 * cosX - z1 * sinX;
    const z2 = y0 * sinX + z1 * cosX;

    return {
      x: cx + x1 * radius,
      y: cy + y2 * radius,
      z: z2,
    };
  }

  // Mouse / Drag Interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      rotationRef.current = {
        x: Math.max(-1.2, Math.min(1.2, rotationRef.current.x + dy * 0.005)),
        y: rotationRef.current.y - dx * 0.005,
      };
    } else {
      // Detect hovered city on the 3D globe
      const hit = projectedPointsRef.current.find((p) => {
        if (!p.visible) return false;
        const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
        return dist < 10;
      });
      setHoveredCity(hit ? hit.city : null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find closest visible city within click threshold
    const hit = projectedPointsRef.current.find((p) => {
      if (!p.visible) return false;
      const dist = Math.hypot(p.x - clickX, p.y - clickY);
      return dist < 12;
    });

    if (hit) {
      onSelectCity(hit.city);
    }
  };

  // Center on India specifically
  const centerOnIndia = () => {
    rotationRef.current = {
      x: 0.38,
      y: -1.38,
    };
    setZoomScale(1.15);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#07090e] overflow-hidden select-none">
      {/* 3D Canvas Element */}
      <canvas
        ref={canvasRef}
        width={960}
        height={640}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        className="cursor-grab active:cursor-grabbing max-w-full max-h-full"
      />

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="glass-panel p-3 rounded-xl border border-slate-800 text-xs font-mono max-w-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Interactive 3D Globe
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Web Dashboard
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Click any city marker dot on the 3D globe to inspect active 1h Weather, 3h Hazard Early Warning, and Agro predictions.
          </p>
        </div>
      </div>

      {/* Right Floating Globe Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={centerOnIndia}
          className="glass-panel p-2 rounded-xl text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-xs font-mono"
          title="Center on Indian Subcontinent"
        >
          <Navigation className="w-4 h-4 text-cyan-400" />
          <span>Lock India</span>
        </button>
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`glass-panel p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-mono ${
            isRotating ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
          title={isRotating ? 'Pause Auto-Spin' : 'Resume Auto-Spin'}
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isRotating ? 'Pause Spin' : 'Auto Spin'}</span>
        </button>
        <div className="glass-panel p-1 rounded-xl flex flex-col gap-1">
          <button
            onClick={() => setZoomScale((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hovered city tooltip display */}
      {hoveredCity && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="glass-panel-heavy p-2.5 px-4 rounded-xl border border-cyan-500/50 shadow-2xl flex items-center gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">TARGET HOVERED</span>
              <span className="font-bold text-cyan-300 text-sm">
                #{hoveredCity.city.id} {hoveredCity.city.name}, {hoveredCity.city.state}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="text-[11px] text-slate-300">
              <span>{hoveredCity.weather.tempC}°C • {hoveredCity.weather.condition}</span>
              <span className="block text-[10px] text-emerald-400 font-bold">Click to inspect 3 models</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
