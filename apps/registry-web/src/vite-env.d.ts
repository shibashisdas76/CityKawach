/// <reference types="vite/client" />

declare module 'react-leaflet-cluster' {
  import React from 'react';
  import L from 'leaflet';

  export interface MarkerClusterGroupProps {
    children?: React.ReactNode;
    chunkedLoading?: boolean;
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    iconCreateFunction?: (cluster: any) => L.DivIcon;
    polygonOptions?: L.PolylineOptions;
  }

  const MarkerClusterGroup: React.ComponentType<MarkerClusterGroupProps>;
  export default MarkerClusterGroup;
}
