'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react';

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface AddressAutocompleteProps {
  label: string;
  placeholder?: string;
  type?: 'pickup' | 'destination';
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (loc: { address: string; lat: number; lng: number }) => void;
}

export function AddressAutocomplete({
  label,
  placeholder = 'Buscar dirección, calle o sector en Venezuela...',
  type = 'pickup',
  value,
  onChange,
  onSelectLocation,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    onChange(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const query = encodeURIComponent(`${text.trim()}, Venezuela`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=ve&format=json&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'RumboFino-Backoffice-Autocomplete/1.0',
            },
          },
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setIsOpen(data.length > 0);
        }
      } catch (err) {
        console.warn('Error al autocompletar dirección en Venezuela:', err);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (item: LocationResult) => {
    const parts = item.display_name.split(', ');
    const formattedName = parts.slice(0, 3).join(', ');
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    onChange(formattedName);
    onSelectLocation({ address: formattedName, lat, lng });
    setIsOpen(false);
  };

  const isPickup = type === 'pickup';

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      <label className={`font-bold block mb-1.5 flex items-center gap-1.5 ${isPickup ? 'text-emerald-400' : 'text-luxury-gold'}`}>
        {isPickup ? <MapPin className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-executive-dark border border-executive-border rounded-xl py-2.5 pl-9 pr-8 text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold text-xs transition-colors"
        />

        <div className="absolute left-3 text-gray-400">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-luxury-gold" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </div>

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-gray-500 hover:text-gray-300 p-1"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-executive-card border border-executive-border rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-executive-border/60">
          {suggestions.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left p-3 hover:bg-executive-dark transition-colors flex items-start gap-2.5 text-gray-200 hover:text-white"
            >
              <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isPickup ? 'text-emerald-400' : 'text-luxury-gold'}`} />
              <div className="truncate">
                <p className="font-semibold truncate text-[11px]">{item.display_name.split(', ')[0]}</p>
                <p className="text-[10px] text-gray-400 truncate">{item.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
