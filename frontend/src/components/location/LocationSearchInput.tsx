import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  MapPin, 
  Navigation, 
  Loader2, 
  Building2, 
  Plane, 
  Train, 
  Hotel, 
  ShoppingBag, 
  Bus,
  Crosshair
} from 'lucide-react';
import { LocationDetails, searchLocations, reverseGeocode } from '../../services/geocoding';

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  type?: 'pickup' | 'dropoff';
  showCurrentLocation?: boolean;
  onLocationSelect: (location: LocationDetails) => void;
  onClear?: () => void;
  onMapPickToggle?: () => void;
  isMapPicking?: boolean;
  disabled?: boolean;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  value,
  type = 'pickup',
  showCurrentLocation = false,
  onLocationSelect,
  onClear,
  onMapPickToggle,
  isMapPicking = false,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationDetails[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync external value updates
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(text);
        setSuggestions(results);
        setHasSearched(true);
      } catch (err) {
        console.error('Location search error:', err);
        setSuggestions([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 320);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Select suggestion item
  const handleSelectSuggestion = (loc: LocationDetails) => {
    setInputValue(loc.placeName || loc.formattedAddress);
    setIsOpen(false);
    setSuggestions([]);
    onLocationSelect(loc);
  };

  // Clear button handler
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setHasSearched(false);
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  // Current Location Geolocation handler
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const loc = await reverseGeocode(latitude, longitude);
          setInputValue(loc.placeName);
          onLocationSelect(loc);
        } catch (err) {
          console.error('Reverse geocode error:', err);
          alert('Could not determine your address. Please enter manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        alert('Could not retrieve your current location. Please check browser permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Render icon based on type
  const renderItemIcon = (iconType?: string) => {
    const iconClass = "w-4 h-4 text-slate-500 shrink-0";
    switch (iconType) {
      case 'airport':
        return <Plane className="w-4 h-4 text-electric-600 shrink-0" />;
      case 'station':
        return <Train className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'hotel':
        return <Hotel className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'commercial':
        return <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'building':
        return <Building2 className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'transit':
        return <Bus className="w-4 h-4 text-cyan-600 shrink-0" />;
      default:
        return <MapPin className={iconClass} />;
    }
  };

  const isPickup = type === 'pickup';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label with optional Map Pin toggle */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          {label}
        </label>
        {onMapPickToggle && (
          <button
            type="button"
            onClick={onMapPickToggle}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center space-x-1 ${
              isMapPicking
                ? 'bg-electric-500 text-white border-electric-500 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-pearl-100 hover:text-navy-900'
            }`}
          >
            <Navigation className="w-2.5 h-2.5" />
            <span>{isMapPicking ? 'Picking...' : 'Pick on Map'}</span>
          </button>
        )}
      </div>

      {/* Input container */}
      <div className="relative flex items-center">
        {/* Left Indicator Pin */}
        <div className="absolute left-3 flex items-center pointer-events-none z-10">
          {isPickup ? (
            <div className="w-2.5 h-2.5 rounded-full bg-electric-500 ring-4 ring-electric-100 shadow-sm" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shadow-sm" />
          )}
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-pearl-100/70 hover:bg-white focus:bg-white border border-slate-200 focus:border-electric-500 rounded-2xl pl-8 pr-20 py-2.5 text-xs font-medium text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500/20 shadow-sm transition"
        />

        {/* Action icons right */}
        <div className="absolute right-2 flex items-center space-x-1 z-10">
          {/* Loading indicator */}
          {isLoading && (
            <div className="p-1 text-electric-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          )}

          {/* Clear button */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear location"
              className="p-1 rounded-full text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Current Location GPS Button (for pickup) */}
          {showCurrentLocation && (
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={isLocating}
              title="Use current GPS location"
              className={`p-1.5 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                isLocating
                  ? 'bg-electric-50 text-electric-600 border-electric-300 animate-pulse'
                  : 'bg-white text-slate-500 hover:text-electric-600 hover:border-electric-300 border-slate-200'
              }`}
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-electric-600" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Auto-suggest Dropdown Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[200] bg-white rounded-2xl border border-slate-200/90 shadow-luxury-lg overflow-hidden max-h-72 overflow-y-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-3 flex items-center space-x-2 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-electric-600" />
              <span>Searching real locations...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((loc, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${loc.placeName}-${loc.latitude}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(loc)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-3.5 py-2.5 text-left flex items-start space-x-3 transition cursor-pointer ${
                      isSelected ? 'bg-electric-50/80 border-l-4 border-electric-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="mt-0.5">
                      {renderItemIcon(loc.iconType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-navy-900 truncate">
                        {loc.placeName}
                      </div>
                      {loc.subAddress && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {loc.subAddress}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : hasSearched ? (
            <div className="px-4 py-5 text-center text-xs text-slate-400">
              <MapPin className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <div className="font-semibold text-navy-900">No locations found</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Try searching for a landmark, airport, street, or city name.
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
