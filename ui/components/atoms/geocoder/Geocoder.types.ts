import type { Feature } from "@shared/mapbox";
import type { ComboboxProps } from "../../core/inputs/Combobox";

export type MapboxFeature = {
  place_name: string;
  place_type: string[];
  center: [number, number];
  address?: string;
  context?: Array<{ text: string; id: string; [key: string]: string }>;
  bbox?: number[];
  geometry?: {
    coordinates: [number, number];
    type: string;
  };
  id?: string;
  properties?: Record<string, unknown>;
  relevance?: number;
  text?: string;
  countryId?: string;
  countryName?: string;
  countryCode?: string;
  regionId?: string;
  regionName?: string;
};

export type GeocoderConfig = {
  debounceMs: number;
  minSearchLength: number;
  maxResults: number;
  language: string;
  cacheSize: number;
};

export type GeocoderProps = Partial<ComboboxProps> & {
  statefulMap?: mapboxgl.Map;
  extraOptions?: boolean;
  callback?: (result: MapboxFeature) => void;
  value?: string;
  setValue?: (value: string | null, data?: MapboxFeature) => void;
  types?: string;
  proximity?: { longitude: number; latitude: number };
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  bbox?: [number, number, number, number];
  shouldFly?: boolean;
  geolocate?: boolean;
};

export type { Feature };
