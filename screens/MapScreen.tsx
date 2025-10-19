import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Field, FieldStatus, Player, SurfaceType } from '../types';
import { generateMockFieldDetails } from '../mockData';
import { FieldDetailPanel } from '../components/FieldDetailPanel';
import { FilterPanel } from '../components/FilterPanel';
import { AddNewField } from '../components/AddNewField';
import { LoadingSpinner, LocationIcon, AddIcon, RefreshIcon, FilterIcon, XMarkIcon } from '../components/icons';
import { MapController } from '../components/MapController';
import { GeolocationPrompt } from '../components/GeolocationPrompt';
import { FieldCluster } from '../components/FieldCluster';
import { useSettings } from '../contexts/SettingsContext';
import { db, storage } from '../firebase';
// FIX: Use Firebase v8 compat imports
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

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
    onViewProfile: (playerOrId: Player | string) => void;
    isFetching: boolean;
    setIsFetching: React.Dispatch<React.SetStateAction<boolean>>;
    fetchError: string | null;
    map: L.Map | null;
    setMap: React.Dispatch<React.SetStateAction<L.Map | null>>;
    filters: {
        radius: number;
        showFavorites: boolean;
        minPlayers: number;
        minRating: number;
        hasTournaments: boolean;
        isOpen: boolean;
        surface: string;
        lighting: boolean;
        size: string;
    };
    setFilters: React.Dispatch<React.SetStateAction<MapScreenProps['filters']>>;
    handleFetchFields: (centerOverride?: L.LatLng) => Promise<void>;
    searchCenter: L.LatLng | null;
    setSearchCenter: React.Dispatch<React.SetStateAction<L.LatLng | null>>;
}

export const MapScreen: React.FC<MapScreenProps> = ({ 
    user, fields, setFields, selectedField, setSelectedField, onUpdateField, onUpdateUser, onOpenChat,
    onCheckIn, onCheckOut, onViewProfile,
    isFetching, setIsFetching, fetchError, map, setMap, filters, setFilters, handleFetchFields,
    searchCenter, setSearchCenter
}) => {
  const [view, setView] = useState<View>('map');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [geolocationState, setGeolocationState] = useState<GeolocationState>('initial');
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

  useEffect(() => {
    if (selectedField && map) {
        map.setView([selectedField.lat, selectedField.lng], 16, {
            animate: true,
            pan: {
                duration: 0.5
            }
        });
    }
  }, [selectedField, map]);

  useEffect(() => {
    // When the component unmounts, invalidate the map instance in the parent to prevent using a stale map instance.
    return () => {
        setMap(null);
    };
  }, [setMap]);


  const locateUser = useCallback(() => {
    if (!map) return;
    setIsFetching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = new L.LatLng(position.coords.latitude, position.coords.longitude);
        map.setView(userLocation, 14);
        handleFetchFields(userLocation); // Fetch fields for the new location
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get your location.");
        setIsFetching(false);
      }
    );
  }, [map, handleFetchFields, setIsFetching]);
  
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
          setGeolocationState('granted');
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
    if (initialUserLocation) {
        mapInstance.setView(initialUserLocation, 13);
        handleFetchFields(initialUserLocation);
        return;
    }

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
                handleFetchFields(mapInstance.getCenter());
            }
        });
    } else {
        handleFetchFields(mapInstance.getCenter());
    }
  }, [handleFetchFields, initialUserLocation, setMap, setIsFetching]);

  const isInitialRender = useRef(true);
  const fetchTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (isInitialRender.current || !map || geolocationState !== 'granted') {
        isInitialRender.current = false;
        return;
    }
    
    if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = window.setTimeout(() => {
        handleFetchFields(map.getCenter());
    }, 500); // Debounce API call by 500ms

    return () => {
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
    }
  }, [filters.radius, handleFetchFields, map, geolocationState]);
  
  const handleAddField = async (newFieldData: Omit<Field, 'id' | 'rating' | 'players' | 'reviews' | 'chat'>, photoFile: File | null) => {
    const newFieldId = Date.now();
    let photoURL = `https://source.unsplash.com/800x600/?soccer,stadium,pitch&sig=${newFieldId}`;
    
    setIsFetching(true);

    try {
        if (photoFile) {
            // FIX: Use v8 compat Storage syntax
            const imageRef = storage.ref(`field_images/${newFieldId}`);
            const snapshot = await imageRef.put(photoFile);
            photoURL = await snapshot.ref.getDownloadURL();
        }

        const newField: Field = {
            id: newFieldId,
            ...generateMockFieldDetails(newFieldId, newFieldData.name),
            ...newFieldData,
            photo: photoURL,
        };
        
        // FIX: Use v8 compat Firestore syntax
        const fieldRef = db.collection('fields').doc(newField.id.toString());
        await fieldRef.set(newField);

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
        let radiusMatch = true;
        if (centerForFilter) {
            const fieldLatLng = L.latLng(field.lat, field.lng);
            const distance = centerForFilter.distanceTo(fieldLatLng);
            radiusMatch = distance <= filters.radius;
        }

        const favoritesMatch = !filters.showFavorites || (user.favoriteFields && user.favoriteFields.includes(field.id));
        const playersMatch = field.players.length >= filters.minPlayers;
        const ratingMatch = field.rating >= filters.minRating;
        const tournamentsMatch = !filters.hasTournaments || (field.tournaments && field.tournaments.length > 0);
        const openMatch = !filters.isOpen || field.status !== FieldStatus.Closed;
        const surfaceMatch = filters.surface === 'all' || field.surface === filters.surface;
        const lightingMatch = !filters.lighting || field.lighting === true;
        const sizeMatch = filters.size === 'all' || field.size === filters.size;
      
        return radiusMatch && favoritesMatch && playersMatch && ratingMatch && tournamentsMatch && openMatch && surfaceMatch && lightingMatch && sizeMatch;
    });
  }, [fields, filters, searchCenter, map, user.favoriteFields]);


  if (geolocationState !== 'granted') {
    return (
        <GeolocationPrompt 
            status={geolocationState}
            onAllow={handlePermissionRequest}
            onSkip={handleSkipPermission}
        />
    );
  }

  return (
    <div className="h-full w-full">
        <MapContainer center={[55.7558, 37.6173]} zoom={11} scrollWheelZoom={true} className="h-full w-full z-0" zoomControl={false}>
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/80 p-4 rounded-lg flex items-center gap-3 z-20 shadow-lg backdrop-blur-sm">
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

        <div className="absolute top-4 left-4 z-10">
            <button onClick={() => setIsFilterPanelOpen(prev => !prev)} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-105" aria-label="Toggle filters">
                <FilterIcon />
            </button>
            <div className={`mt-2 transition-all duration-300 ease-in-out ${isFilterPanelOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                 <FilterPanel filters={filters} onFilterChange={setFilters} />
            </div>
        </div>
        
        <div className="absolute bottom-[72px] md:bottom-6 right-4 z-10 flex flex-col gap-3">
            <button onClick={locateUser} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-105" aria-label="Find my location">
                <LocationIcon />
            </button>
             <button onClick={() => map && handleFetchFields(map.getCenter())} disabled={isFetching || !map} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Refresh fields">
                <RefreshIcon />
            </button>
            <button onClick={() => setView('addField')} className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-105" aria-label="Add new field">
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