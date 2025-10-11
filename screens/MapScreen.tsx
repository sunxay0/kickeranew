import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Field, FieldStatus, Player } from '../types';
import { generateMockFieldDetails } from '../mockData';
import { FieldDetailPanel } from '../components/FieldDetailPanel';
import { FilterPanel } from '../components/FilterPanel';
import { AddNewField } from '../components/AddNewField';
import { LoadingSpinner, LocationIcon, AddIcon, RefreshIcon, FilterIcon, XMarkIcon, SearchIcon } from '../components/icons';
import { MapController } from '../components/MapController';
import { GeolocationPrompt } from '../components/GeolocationPrompt';
import { FieldCluster } from '../components/FieldCluster';
import { AddressSearch } from '../components/AddressSearch';
import { useSettings } from '../contexts/SettingsContext';
import { db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const fieldStatusColors: Record<FieldStatus, string> = {
  [FieldStatus.Available]: '#22c55e', // green-500
  [FieldStatus.Busy]: '#f59e0b', // amber-500
  [FieldStatus.Closed]: '#ef4444', // red-500
};

const iconCache: Record<string, L.DivIcon> = {};

const createMarkerIcon = (status: FieldStatus, playerCount: number) => {
  const cacheKey = `${status}-${playerCount}`;
  if (iconCache[cacheKey]) {
    return iconCache[cacheKey];
  }

  const icon = L.divIcon({
    html: `
      <div 
        class="w-10 h-10 flex flex-col items-center justify-center rounded-full text-white font-bold shadow-md" 
        style="background-color: ${fieldStatusColors[status]}; border: 2px solid white;"
      >
        <span class="text-lg">${playerCount}</span>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
  
  iconCache[cacheKey] = icon;
  return icon;
};

type View = 'map' | 'addField';
type GeolocationState = 'initial' | 'prompting' | 'loading' | 'granted' | 'denied';

interface MapScreenProps {
    user: Player;
    fields: Field[];
    setFields: React.Dispatch<React.SetStateAction<Field[]>>;
    selectedField: Field | null;
    setSelectedField: React.Dispatch<React.SetStateAction<Field | null>>;
    onUpdateField: (field: Field) => void;
    onUpdateUser: (user: Player) => void;
    onOpenChat: (field: Field) => void;
    onCheckIn: (field: Field) => void;
    onCheckOut: (field: Field) => void;
    onViewProfile: (player: Player) => void;
    isFetching: boolean;
    setIsFetching: React.Dispatch<React.SetStateAction<boolean>>;
    fetchError: string | null;
    map: L.Map | null;
    setMap: React.Dispatch<React.SetStateAction<L.Map | null>>;
    filters: { status: string; surface: string; rating: number; radius: number; showFavorites: boolean; minPlayers: number; };
    setFilters: React.Dispatch<React.SetStateAction<{ status: string; surface: string; rating: number; radius: number; showFavorites: boolean; minPlayers: number; }>>;
    handleFetchFields: (centerOverride?: L.LatLng) => Promise<void>;
    searchCenter: L.LatLng | null;
}

export const MapScreen: React.FC<MapScreenProps> = ({ 
    user, fields, setFields, selectedField, setSelectedField, onUpdateField, onUpdateUser, onOpenChat,
    onCheckIn, onCheckOut, onViewProfile,
    isFetching, setIsFetching, fetchError, map, setMap, filters, setFilters, handleFetchFields,
    searchCenter
}) => {
  const [view, setView] = useState<View>('map');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [geolocationState, setGeolocationState] = useState<GeolocationState>('initial');
  // Fix: Add state to hold user location obtained from prompt before map is ready.
  const [initialUserLocation, setInitialUserLocation] = useState<L.LatLng | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const { theme, t } = useSettings();
  
  const tileLayerUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    if (fetchError) {
        setShowErrorToast(true);
        const timer = setTimeout(() => {
            setShowErrorToast(false);
        }, 5000); // Hide error after 5 seconds
        return () => clearTimeout(timer);
    }
  }, [fetchError]);


  const locateUser = useCallback(() => {
    if (!map) return;
    setIsFetching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = new L.LatLng(position.coords.latitude, position.coords.longitude);
        map.setView(userLocation, 13);
        handleFetchFields(userLocation); // Fetch fields for the new location
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get your location.");
        setIsFetching(false);
      }
    );
  }, [map, handleFetchFields, setIsFetching]);
  
  // Fix: Refactored geolocation logic to correctly handle all permission states and flows.
  const handleSkipPermission = useCallback(() => {
    setGeolocationState('granted'); // Allow app to load, onMapReady will handle fetching
  }, []);

  const handlePermissionRequest = useCallback(() => {
    setGeolocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = new L.LatLng(position.coords.latitude, position.coords.longitude);
        setInitialUserLocation(userLocation); // Store location
        setGeolocationState('granted'); // Trigger map render
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
            setGeolocationState('denied');
        } else {
            alert("Could not get your location. Please check device settings.");
            handleSkipPermission(); // Fallback to default
        }
      }
    );
  }, [handleSkipPermission]);

  useEffect(() => {
    if (geolocationState === 'initial' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setGeolocationState('granted'); // FIX: Directly go to granted state to avoid deadlock.
        } else if (result.state === 'prompt') {
          setGeolocationState('prompting');
        } else if (result.state === 'denied') {
          setGeolocationState('denied');
        }
      });
    } else if (geolocationState === 'initial') {
      // Fallback for older browsers
      setGeolocationState('prompting');
    }
  }, [geolocationState]);
  
  const onMapReady = useCallback((mapInstance: L.Map) => {
    setMap(mapInstance);
    // Case 1: User just granted permission via prompt, we have their location stored.
    if (initialUserLocation) {
        mapInstance.setView(initialUserLocation, 13);
        handleFetchFields(initialUserLocation);
        return;
    }

    // Case 2: Permission was already granted, or user skipped.
    // We check the permissions API again to decide whether to fetch location or use default.
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'granted') {
                setIsFetching(true);
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const userLocation = new L.LatLng(position.coords.latitude, position.coords.longitude);
                    mapInstance.setView(userLocation, 13);
                    handleFetchFields(userLocation);
                  },
                  (error) => {
                    console.error("Geolocation error when already granted:", error);
                    handleFetchFields(mapInstance.getCenter()); // Fallback
                    setIsFetching(false);
                  }
                );
            } else {
                // User skipped or was denied, so use default map center.
                handleFetchFields(mapInstance.getCenter());
            }
        });
    } else {
        // Fallback for older browsers if permissions API is not available.
        handleFetchFields(mapInstance.getCenter());
    }
  }, [handleFetchFields, initialUserLocation, setMap, setIsFetching]);

  // Effect to refetch fields when radius filter changes
  const isInitialRender = useRef(true);
  // FIX: `useRef<number>()` is invalid because it's called without an initial value. Changed to `useRef<number | undefined>()` which correctly infers an initial value of `undefined`.
  // FIX: The error "Expected 1 arguments, but got 0" for `useRef` at this line indicates an issue with initialization. Explicitly initializing with `null` and adjusting the type is a robust fix.
  const fetchTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (isInitialRender.current || !map || geolocationState !== 'granted') {
        isInitialRender.current = false;
        return;
    }
    
    if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
    }
// Fix: Explicitly pass the map center to handleFetchFields to prevent potential issues with stale closures.
    fetchTimeoutRef.current = window.setTimeout(() => {
        handleFetchFields(map.getCenter());
    }, 500); // Debounce API call by 500ms

    return () => {
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
    }
  }, [filters.radius, handleFetchFields, map, geolocationState]);
  
  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    if (map) {
      const newCenter = new L.LatLng(lat, lng);
      map.setView(newCenter, 13);
      setSearchCenter(newCenter);
      handleFetchFields(newCenter);
    }
    setIsSearchOpen(false);
  };

  const handleAddField = async (newFieldData: Omit<Field, 'id' | 'rating' | 'players' | 'reviews' | 'chat'>, photoFile: File | null) => {
    const newFieldId = Date.now();
    let photoURL = `https://source.unsplash.com/800x600/?soccer,stadium,pitch&sig=${newFieldId}`;
    
    setIsFetching(true);

    try {
        if (photoFile) {
            const imageRef = ref(storage, `field_images/${newFieldId}`);
            const snapshot = await uploadBytes(imageRef, photoFile);
            photoURL = await getDownloadURL(snapshot.ref);
        }

        const newField: Field = {
            id: newFieldId,
            ...generateMockFieldDetails(newFieldId, newFieldData.name),
            ...newFieldData,
            photo: photoURL,
        };
        
        const fieldRef = doc(db, 'fields', newField.id.toString());
        await setDoc(fieldRef, newField);

        // Add the new field to the local state immediately for a responsive UI
        setFields(prevFields => [...prevFields, newField]);

        setView('map');
        setTimeout(() => {
            setSelectedField(newField);
            map?.setView([newField.lat, newField.lng], 16);
        }, 100);

    } catch (error) {
        console.error("Error adding new field:", error);
        alert("Could not add the new field. Please try again.");
    } finally {
        setIsFetching(false);
    }
  };

  const filteredFields = useMemo(() => {
    const centerForFilter = searchCenter || map?.getCenter();

    return fields.filter(field => {
      const statusMatch = filters.status === 'all' || field.status === filters.status;
      const surfaceMatch = filters.surface === 'all' || field.surface === filters.surface;
      const ratingMatch = field.rating >= filters.rating;
      const favoritesMatch = !filters.showFavorites || (user.favoriteFields && user.favoriteFields.includes(field.id));
      const playersMatch = field.players.length >= filters.minPlayers;
      
      let radiusMatch = true;
      if (centerForFilter) {
          const fieldLatLng = L.latLng(field.lat, field.lng);
          const distance = centerForFilter.distanceTo(fieldLatLng);
          radiusMatch = distance <= filters.radius;
      }

      return statusMatch && surfaceMatch && ratingMatch && radiusMatch && favoritesMatch && playersMatch;
    });
  }, [fields, filters, searchCenter, map, user.favoriteFields]);

  if (geolocationState !== 'granted') {
    return (
        <GeolocationPrompt 
            status={geolocationState}
            // Fix: Pass handler directly as its signature `() => void` matches the prop type. The wrapper is unnecessary.
            onAllow={handlePermissionRequest}
            onSkip={handleSkipPermission}
        />
    );
  }

  return (
    <div className="h-full w-full">
        <MapContainer center={[55.7558, 37.6173]} zoom={11} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer
            key={theme}
            url={tileLayerUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController onMapReady={onMapReady} />
          <FieldCluster 
            fields={filteredFields}
            onFieldClick={setSelectedField}
          />
        </MapContainer>

        {isFetching && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50/80 dark:bg-gray-900/80 p-4 rounded-lg flex items-center gap-3 z-20 shadow-lg">
                <LoadingSpinner/>
                <span className="text-gray-900 dark:text-white">{t('searchingFields')}</span>
            </div>
        )}

        {showErrorToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 dark:bg-red-900/80 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 z-20 shadow-lg backdrop-blur-sm">
                <p className="font-semibold">{fetchError}</p>
                <button onClick={() => setShowErrorToast(false)} className="text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100">
                    <XMarkIcon />
                </button>
            </div>
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <button onClick={() => setIsFilterPanelOpen(prev => !prev)} className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-110" aria-label="Toggle filters">
                <FilterIcon />
            </button>
            <button onClick={() => setIsSearchOpen(true)} className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-110" aria-label="Search addresses">
                <SearchIcon />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isFilterPanelOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                 <FilterPanel filters={filters} onFilterChange={setFilters} />
            </div>
        </div>
        
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
            <button onClick={locateUser} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110" aria-label="Find my location">
                <LocationIcon />
            </button>
             {/* FIX: Explicitly pass map center to handleFetchFields to ensure it uses the current view and fix argument error. */}
             <button onClick={() => map && handleFetchFields(map.getCenter())} disabled={isFetching || !map} className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 disabled:bg-gray-500 disabled:cursor-not-allowed" aria-label="Refresh fields">
                <RefreshIcon />
            </button>
            <button onClick={() => setView('addField')} className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110" aria-label="Add new field">
                <AddIcon />
            </button>
        </div>

        <FieldDetailPanel
          field={selectedField}
          onClose={() => setSelectedField(null)}
          onUpdateField={onUpdateField}
          currentUser={user}
          onOpenChat={onOpenChat}
          onUpdateUser={onUpdateUser}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
          onViewProfile={onViewProfile}
        />

        {isSearchOpen && (
            <AddressSearch
                onLocationSelect={handleAddressSelect}
                onClose={() => setIsSearchOpen(false)}
            />
        )}

        {view === 'addField' && map && (
            <AddNewField
                center={map.getCenter()}
                onClose={() => setView('map')}
                onAdd={handleAddField}
            />
        )}
    </div>
  );
};