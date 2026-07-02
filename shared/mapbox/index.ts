export interface Context {
  [key: string]: string;
}
export interface Geometry {
  coordinates: number[];
  type: string;
}
export interface Properties {
  [key: string]: string;
}
export interface Feature {
  address: string;
  center: [number, number];
  context: Context[];
  geometry: Geometry;
  id: string;
  place_name: string;
  place_name_de: string;
  place_type: string[];
  properties: Properties;
  relevance: number;
  text: string;
  text_de: string;
  type: string;
}

export const transformReverseGeocoder = (feature: Feature) => {
  if (!feature) return;
  const mapboxTerms = {} as Context;
  feature.context.forEach((acc) => {
    let zone = acc.id.split(".")[0];
    if (zone === "place") zone = "municipality";
    mapboxTerms[`${zone}Id`] = acc.id;
    mapboxTerms[`${zone}Name`] = acc.text;
  });
  mapboxTerms.placeId = feature.id;
  mapboxTerms.address = [feature.text, feature.address]
    .filter(Boolean)
    .join(" ");
  // Object.defineProperty(
  //   mapboxTerms,
  //   "municipality",
  //   Object.getOwnPropertyDescriptor(mapboxTerms, "place") || {}
  // );
  // delete mapboxTerms.place;
  // const obj = {}
  // Object.entries(mapboxTerms).forEach(([key, value]) => {
  //   if (value.id) obj[`${key}Id`] = value.id
  //   if (value.name) obj[`${key}Name`] = value.name
  // })
  return mapboxTerms;
};
