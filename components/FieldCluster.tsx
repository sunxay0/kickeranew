import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Field } from '../types';

interface FieldClusterProps {
  fields: Field[];
  onFieldClick: (field: Field) => void;
}

export const FieldCluster: React.FC<FieldClusterProps> = ({ fields, onFieldClick }) => {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster) => {
          const childCount = cluster.getChildCount();
          const totalPlayers = cluster.getAllChildMarkers().reduce((sum, marker) => {
            const field = (marker as any).field as Field;
            return sum + (field?.players?.length || 0);
          }, 0);

          // Цвет кластера зависит от количества игроков
          let color = '#22c55e'; // зеленый - мало игроков
          if (totalPlayers > 10) color = '#f59e0b'; // желтый - среднее количество
          if (totalPlayers > 20) color = '#ef4444'; // красный - много игроков

          return L.divIcon({
            html: `<div style="
              background-color: ${color};
              width: 40px;
              height: 40px;
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${childCount}</div>`,
            className: 'custom-cluster-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });
        }
      });
      map.addLayer(clusterRef.current);
    }

    // Очищаем предыдущие маркеры
    clusterRef.current.clearLayers();

    // Добавляем новые маркеры
    fields.forEach(field => {
      const marker = L.marker([field.lat, field.lng], {
        icon: createFieldIcon(field)
      });
      
      // Сохраняем ссылку на поле в маркере
      (marker as any).field = field;
      
      marker.on('click', () => {
        onFieldClick(field);
      });

      clusterRef.current!.addLayer(marker);
    });

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [fields, map, onFieldClick]);

  return null;
};

const createFieldIcon = (field: Field) => {
  const statusColors: Record<string, string> = {
    'available': '#22c55e',
    'busy': '#f59e0b', 
    'closed': '#ef4444'
  };

  const color = statusColors[field.status] || '#22c55e';
  const playerCount = field.players?.length || 0;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${playerCount}</div>
    `,
    className: 'custom-field-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

