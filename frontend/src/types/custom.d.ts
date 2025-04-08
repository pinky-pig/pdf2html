// Type declarations for modules without their own type definitions

declare module 'react-simple-maps' {
  import React from 'react';

  export interface ComposableMapProps {
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotation?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string;
    children: (props: { geographies: any[] }) => React.ReactNode;
  }

  export interface GeographyProps {
    key?: string | number;
    geography: any;
    fill?: string;
    stroke?: string;
    style?: {
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
}

declare module 'd3-scale' {
  export function scaleLinear(): {
    domain(domain: [number, number]): any;
    range(range: [string, string]): any;
  };
}
