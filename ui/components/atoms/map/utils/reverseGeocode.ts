import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { transformReverseGeocoder } from "@shared/mapbox";

export const reverseGeocode = async (viewport: {
  longitude: number;
  latitude: number;
}) => {
  try {
    const geocodingClient = mbxGeocoding({
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    });

    const { body } = await geocodingClient
      .reverseGeocode({
        query: [viewport.longitude, viewport.latitude],
        limit: 1,
        // language: ["de"],
      })
      .send();

    const locationData = transformReverseGeocoder(body.features[0]);
    return locationData;
  } catch (error) {
    console.log(error);
    // Handle the error here
  }
};
