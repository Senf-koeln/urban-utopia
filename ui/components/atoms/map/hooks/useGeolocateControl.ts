import mapboxgl from "mapbox-gl";

export function geolocateControl(
  statefulMap: mapboxgl.Map,
): Promise<{ longitude: number; latitude: number } | null> {
  return new Promise((resolve, reject) => {
    try {
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
          timeout: 15000,
      },
      trackUserLocation: true,
      showUserLocation: true,
      showUserHeading: true,
    });

      const cleanup = () => {
        try {
          statefulMap.removeControl(geolocateControl);
        } catch (error) {
          console.warn("geolocateControl: failed to remove control", error);
        }
      };

    statefulMap.addControl(geolocateControl);

    setTimeout(() => {
        try {
      geolocateControl.trigger();
        } catch (error) {
          console.warn("geolocateControl: trigger failed", error);
        }
    }, 100);

    geolocateControl.on("geolocate", (e) => {
        cleanup();
      resolve(e.coords);
    });

    geolocateControl.on("error", (err) => {
        cleanup();
      reject(err);
    });
    } catch (error) {
      console.warn("geolocateControl: setup failed", error);
      reject(error);
    }
  });
}
