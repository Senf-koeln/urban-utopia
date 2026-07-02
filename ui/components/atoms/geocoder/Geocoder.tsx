/**
 * Geocoder Component with Value/Label Separation
 *
 * This component now properly separates the data value from the display value:
 * - `value`: What gets saved to the database (display label)
 * - `selectedValue`: Internal JSON string containing full location data
 * - `callback`: Receives the full MapboxFeature for additional processing
 *
 * Example usage:
 * ```tsx
 * const [address, setAddress] = useState("");
 *
 * <Geocoder
 *   value={address}
 *   setValue={setAddress}
 *   callback={(feature) => {
 *     // Access full location data: feature.center, feature.place_type, etc.
 *     console.log('Coordinates:', feature.center);
 *   }}
 * />
 * ```
 */

import MapboxClient from "mapbox";
import type React from "react";
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Combobox, type ComboboxOption } from "../../core/inputs/Combobox";
import { geolocateControl } from "../map/hooks/useGeolocateControl";
import { reverseGeocode } from "../map/utils/reverseGeocode";
import type {
  GeocoderConfig,
  GeocoderProps,
  MapboxFeature,
} from "./Geocoder.types";

const contextTypes = ["neighborhood", "postcode", "place", "region", "country"];

/**
 * Builds primary and secondary label strings from a Mapbox feature by
 * resolving its context types (neighborhood, place, region, etc.) and
 * ordering them so the feature's own type comes first.
 */
function getPrimaryAndSecondaryLabelsFromFeature(item: MapboxFeature): {
  primaryContent: string;
  secondaryContent: string;
  optionValue: string;
} {
  const getType = (id?: string) => id?.split(".")[0];
  const itemType = getType(item.id);
  const types = [
    ...(itemType && !contextTypes.includes(itemType) ? [itemType] : []),
    ...contextTypes,
  ];
  const typeSet = new Set(types);
  const typeIndex = Object.fromEntries(types.map((t, i) => [t, i])) as Record<
    string,
    number
  >;

  const context: Record<string, string> = Object.create(null);

  for (const c of item.context ?? []) {
    const t = getType(c.id);
    if (t && typeSet.has(t)) context[t] = c.text;
  }

  if (itemType && item.text) context[itemType] = item.text;

  const start = itemType && itemType in typeIndex ? typeIndex[itemType] : 0;

  const [primaryContent, ...secondary] = types
    .slice(start)
    .map((t) => context[t])
    .filter(Boolean);

  const secondaryContent = secondary.join(", ");

  const optionValue = `${primaryContent}-${item.id || item.place_name}`;

  return { primaryContent, secondaryContent, optionValue };
}

// Default configuration
const DEFAULT_CONFIG: Omit<GeocoderConfig, "language"> = {
  debounceMs: 300,
  minSearchLength: 3,
  maxResults: 5,
  cacheSize: 50,
};

// Simple LRU cache for geocoding results
class GeocodingCache {
  private cache = new Map<
    string,
    { results: MapboxFeature[]; timestamp: number }
  >();
  private maxSize: number;
  private ttl = 5 * 60 * 1000; // 5 minutes

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): MapboxFeature[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.results;
  }

  set(key: string, results: MapboxFeature[]): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { results, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

const Geocoder: FC<GeocoderProps & { config?: Partial<GeocoderConfig> }> = ({
  statefulMap,
  leadingIcon,
  bbox,
  callback,
  value,
  setValue,
  types = "country,region,postcode,district,place,locality,neighborhood,address,poi",
  proximity,
  placeholder,
  label,
  onFocus,
  onBlur,
  shouldFly = true,
  config: userConfig,
  size,
  className,
  classNames,
  dropdownRef,
  geolocate = true,
  ref,
}) => {
  const { t, i18n } = useTranslation();
  const config = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      language: i18n.resolvedLanguage,
      ...userConfig,
    }),
    [userConfig, i18n.resolvedLanguage],
  );

  // State management
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);
  const [geocoder, setGeocoder] = useState<MapboxClient | null>(null);
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [featureMap, setFeatureMap] = useState<Map<string, MapboxFeature>>(
    new Map(),
  );

  // Refs for cleanup and caching
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new GeocodingCache(config.cacheSize));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track the current geocoding promise
  const geocodePromiseRef = useRef<Promise<unknown> | null>(null);

  // Initialize Mapbox geocoder
  useEffect(() => {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("Mapbox access token is required for Geocoder");
      setHasError(true);
      setErrorMessage(
        t("global:missingMapboxToken") || "Mapbox access token is missing",
      );
      return;
    }

    try {
      const mapboxGeocoder = new MapboxClient(accessToken);
      setGeocoder(mapboxGeocoder);
    } catch (error) {
      console.error("Failed to initialize Mapbox geocoder:", error);
      setHasError(true);
      setErrorMessage(
        t("global:geocoderInitError", "Failed to initialize geocoder"),
      );
    }
  }, [t]);

  // Update search term when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setIsValidAddress(Boolean(value));
      setSearchTerm(value);
    }
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoize getContent function with better formatting
  const getContent = useCallback(
    (item: MapboxFeature): ComboboxOption => {
      const { primaryContent, secondaryContent, optionValue } =
        getPrimaryAndSecondaryLabelsFromFeature(item);

      // Store the full feature in the map
      setFeatureMap((prev) => new Map(prev.set(optionValue, item)));

      return {
        data: item,
        value: optionValue,
        label: primaryContent,
        subLabel: secondaryContent,
        leadingIcon: leadingIcon !== false ? (leadingIcon ?? "pin") : undefined,
      } satisfies ComboboxOption;
    },
    [leadingIcon],
  );

  // Create cache key for geocoding requests
  const createCacheKey = useCallback(
    (searchTerm: string) => {
      return `${searchTerm}|${types}|${bbox?.join(",") || ""}|${proximity?.longitude || ""},${proximity?.latitude || ""}`;
    },
    [types, bbox, proximity],
  );

  // Debounced geocoding search with caching
  useEffect(() => {
    if (!geocoder || !searchTerm) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Clear previous operations
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchTerm?.length < config.minSearchLength) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = createCacheKey(searchTerm);
    const cachedResults = cacheRef.current.get(cacheKey);
    if (cachedResults) {
      setResults(cachedResults);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Store the geocoding promise in a ref
    geocodePromiseRef.current = new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          abortControllerRef.current = new AbortController();

          const response = await geocoder.geocodeForward(searchTerm, {
            limit: config.maxResults,
            autocomplete: true,
            fuzzyMatch: true,
            language: config.language,
            bbox,
            types,
            proximity,
          });

          if (abortControllerRef.current.signal.aborted) {
            resolve(null);
            return;
          }

          const features = response.entity.features || [];
          cacheRef.current.set(cacheKey, features);

          setResults(features);
          setHasError(false);
          setErrorMessage("");
          resolve(features);
        } catch (error) {
          if (abortControllerRef.current?.signal.aborted) {
            resolve(null);
            return;
          }

          console.error("Geocoder search error:", error);
          setResults([]);
          setHasError(true);
          setErrorMessage(
            t("global:geocoderSearchError", "Search failed. Please try again."),
          );
          resolve(null);
        } finally {
          setIsLoading(false);
        }
      }, config.debounceMs);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, geocoder, bbox, types, proximity, config, createCacheKey, t]);

  // Custom onBlur handler to await geocoding before clearing input
  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      // Wait for any in-progress geocoding
      if (geocodePromiseRef.current) {
        await geocodePromiseRef.current;
      }
      // After geocoding, check if the input matches a valid result
      const cacheKey = createCacheKey(searchTerm);
      const cachedResults = cacheRef.current.get(cacheKey) || [];
      const match = cachedResults.find(
        (feature) => feature.text?.toLowerCase() === searchTerm.toLowerCase(),
      );
      if (!match) {
        setValue?.("");
        setSearchTerm("");
        setIsValidAddress(false);
      }
      // Call user-provided onBlur if present
      if (typeof onBlur === "function") {
        onBlur(e);
      }
    },
    [searchTerm, setValue, createCacheKey, onBlur],
  );

  // Memoize zoom level calculation
  const getZoomLevel = useCallback((placeType: string): number => {
    const zoomLevels: Record<string, number> = {
      country: 5,
      region: 9,
      district: 10,
      place: 12,
      locality: 12,
      neighborhood: 12,
      address: 16.5,
      poi: 16.5,
    };
    return zoomLevels[placeType] || 12;
  }, []);

  // Handle selection with map integration
  const onSelected = useCallback(
    (
      item:
        | ComboboxOption<string, MapboxFeature>
        | ComboboxOption<string, MapboxFeature>[],
    ) => {
      try {
        // Handle single selection (item is ComboboxOption)
        const selectedItem = Array.isArray(item) ? item[0] : item;
        if (
          !selectedItem ||
          !("label" in selectedItem && "value" in selectedItem)
        )
          return;

        // Get the full feature from the map (prefer over selectedItem.data which
        // can be undefined when Combobox passes synthetic options or stale state)
        const fullFeature =
          featureMap.get(selectedItem.value?.toString() || "") ??
          (selectedItem.data as MapboxFeature | undefined);

        if (!fullFeature) {
          setValue?.(null);
          setSearchTerm("");
          return;
        }

        // Update component state
        setIsValidAddress(true);
        setErrorMessage("");
        setHasError(false);
        // Update external value with the display label; pass fullFeature for reliability
        setValue?.(selectedItem.label || null, fullFeature);
        setSearchTerm(selectedItem.label || "");

        // Execute callback with the full feature
        try {
          callback?.(fullFeature);
        } catch (error) {
          console.error("Error in geocoder callback:", error);
        }

        // Handle map navigation
        if (shouldFly && fullFeature.geometry?.coordinates) {
          try {
            if (statefulMap) {
              const zoomLevel = getZoomLevel(fullFeature.place_type[0]);
              statefulMap.flyTo({
                center: fullFeature.geometry?.coordinates,
                zoom: zoomLevel,
                speed: 1,
                pitch: 30,
              });
            }
          } catch (error) {
            console.error("Error flying to location:", error);
          }
        }
      } catch (error) {
        console.error("Error parsing selected option:", error);
      }
    },
    [
      callback,
      shouldFly,
      statefulMap,
      getZoomLevel,
      setValue,
      featureMap,
    ],
  );

  const [geolocateLoading, setGeolocateLoading] = useState(false);
  const handleGeolocate = useCallback(async () => {
    if (!statefulMap) return;
    setGeolocateLoading(true);
    const feature = await geolocateControl(statefulMap);
    setGeolocateLoading(false);
    if (feature) {
      return await reverseGeocode(feature);
    }
  }, [statefulMap]);
  const [open, setOpen] = useState(false);

  const [geolocatedAddress, setGeolocatedAddress] = useState<string>();

  const setCurrentAddress = useCallback(async () => {
    await handleGeolocate().then((feature) => {
      if (feature) {
        setGeolocatedAddress(
          [feature.address, feature.municipalityName, feature.countryName].join(
            ", ",
          ),
        );
      }
    });
  }, [handleGeolocate]);

  useEffect(() => {
    // current implementation of geolocation moves the map to the location of user, so we should not use it on mount
    // navigator.permissions.query({ name: "geolocation" }).then((result) => {
    //   if (result.state === "granted") {
    //     setCurrentAddress();
    //   }
    // });
  }, []);

  // Format options for display
  const formattedOptions = useMemo<ComboboxOption[]>(() => {
    const options = results.map((item) => getContent(item));
    const noResultsOptions =
      results.length === 0 && !geolocateLoading && searchTerm?.length > 2
        ? [
            {
              value: "noResults",
              label: t("global:placeNotFound"),
              leadingIcon:
                leadingIcon === false ? undefined : "pin-strikethrough",
              disabled: true,
            } satisfies ComboboxOption,
          ]
        : [];
    const geolocateOption =
      geolocate && statefulMap
        ? [
            (options.length > 0 || noResultsOptions.length > 0) &&
              ({
                value: "divider",
                label: "",
                divider: true,
              } satisfies ComboboxOption),
            {
              value: "geolocate",
              label: t("dialogMap:add.geolocate"),
              subLabel: geolocatedAddress,
              leadingIcon: geolocateLoading ? "loading" : "locate-arrow",
              onClick: (e) => {
                e.preventDefault();
                setCurrentAddress().then(() => {
                  setOpen?.(false);
                });
              },
            } satisfies ComboboxOption,
            {
              value: "hide",
              label: t("dialogMap:add.findOnMap"),
              leadingIcon: "map",
              onClick: (e) => {
                e.preventDefault();
                setOpen?.(false);
              },
            } satisfies ComboboxOption,
          ].filter((e) => !!e)
        : [];
    return [...noResultsOptions, ...options, ...geolocateOption];
  }, [
    results,
    getContent,
    geolocateLoading,
    t,
    geolocate,
    setCurrentAddress,
    geolocatedAddress,
    leadingIcon,
    searchTerm?.length,
    statefulMap,
  ]);

  return (
    <Combobox
      ref={ref}
      onFocus={onFocus}
      className={className}
      classNames={classNames}
      options={formattedOptions}
      label={label}
      leadingIcon={leadingIcon !== false ? (leadingIcon ?? "pin") : undefined}
      value={searchTerm}
      onValueChange={setSearchTerm}
      onChange={onSelected}
      placeholder={placeholder || t("util:input", { val: t("global:address") })}
      open={open}
      onOpenChange={setOpen}
      emptyMessage={
        hasError
          ? t("global:geocoderError", "Search failed. Please try again.")
          : t("global:noResults", "No results found")
      }
      loading={isLoading}
      disabled={!geocoder || hasError}
      error={hasError ? errorMessage : undefined}
      size={size}
      dropdownRef={dropdownRef}
      onBlur={handleBlur}
    />
  );
};

export default Geocoder;
