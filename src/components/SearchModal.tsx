import React, { useState, useEffect, useRef } from 'react';
import { CityModelOutput } from '../types.ts';
import { Search, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: CityModelOutput[];
  onSelectCity: (city: CityModelOutput) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  cities,
  onSelectCity,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = cities.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.city.name.toLowerCase().includes(q) ||
      c.city.state.toLowerCase().includes(q) ||
      c.city.id.toString() === q ||
      c.city.zone.toLowerCase().includes(q) ||
      c.city.region.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all 130 hubs by name, state, ID (#1 - #130)..."
            className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full font-mono"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-sans">
              No matching meteorological stations found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.city.id}
                onClick={() => {
                  onSelectCity(c);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-800">
                    <span className="font-bold text-[11px]">#{c.city.id}</span>
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-cyan-300 text-sm">
                      {c.city.name}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {c.city.state} • {c.city.zone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div className="text-[11px]">
                    <span className="font-bold text-white">{Math.round(c.weather.tempC)}°C</span>
                    <span className="block text-[10px] text-rose-400 font-semibold">{c.disaster.riskLevel}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
