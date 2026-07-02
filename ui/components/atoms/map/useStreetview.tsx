import { useEffect, useRef, useState } from "react";
import { getStreetviewImage } from "./utils/getStreetviewImage";

const useStreetview = (handleConvertImage, index) => {
  const [startPosition, setStartPosition] = useState({
    center: {
      lat: 52.51638630318579,
      lng: 13.381018804026034,
    },
    heading: 275.62811265991866,
    pitch: 7.018883185194483,
  });
  const [pano, setPano] = useState(null);
  const panoRef = useRef(null);
  const googleMapRef = useRef(null);
  const mapInstance = useRef(null); // Ref to store the actual map instance
  const panoInstance = useRef(null); // Ref to store the actual panorama instance
  const streetviewLoaded = useRef(null); // Ref to store the actual panorama instance

  function initialize() {
    setTimeout(() => {
      if (!mapInstance.current) {
        // Initialize the map only if it doesn't already exist
        mapInstance.current = new google.maps.Map(googleMapRef.current, {
          center: startPosition.center,
          zoom: 14,
        });
      } else {
        // If the map exists, just update its center
        mapInstance.current.setCenter(startPosition.center);
      }

      const streetViewService = new google.maps.StreetViewService();

      function attemptFindPanorama(radius) {
        streetViewService.getPanorama(
          {
            location: startPosition.center,
            radius: radius,
          },
          (data, status) => {
            if (status === google.maps.StreetViewStatus.OK) {
              if (!panoInstance.current) {
                panoInstance.current = new google.maps.StreetViewPanorama(
                  panoRef.current,
                  {
                    position: data.location.latLng,
                    pov: {
                      heading: startPosition.heading,
                      pitch: startPosition.pitch,
                    },
                    zoom: 1,
                    disableDefaultUI: true,
                    enableCloseButton: false,
                    showRoadLabels: false,
                    scrollwheel: false,
                    zoomControl: false,
                  }
                );
                mapInstance.current.setStreetView(panoInstance.current);
              } else {
                // If the panorama exists, just update its position
                panoInstance.current.setPosition(data.location.latLng);
                panoInstance.current.setPov({
                  heading: startPosition.heading,
                  pitch: startPosition.pitch,
                });
              }

              google.maps.event.addListener(
                panoInstance.current,
                "position_changed",
                () => {
                  const position = panoInstance.current.getPosition();
                  setPano((prevState) => ({
                    ...prevState,
                    center: {
                      lat: position.lat(),
                      lng: position.lng(),
                    },
                  }));
                }
              );

              google.maps.event.addListener(
                panoInstance.current,
                "pov_changed",
                () => {
                  const pov = panoInstance.current.getPov();
                  setPano((prevState) => ({
                    ...prevState,
                    heading: pov.heading,
                    pitch: pov.pitch,
                  }));
                }
              );
            } else if (
              status === google.maps.StreetViewStatus.ZERO_RESULTS &&
              radius < 10000
            ) {
              attemptFindPanorama(Math.min(radius * 2, 10000));
            } else {
              console.log("No Street View found within the search limit.");
            }
          }
        );
      }

      attemptFindPanorama(50);
    }, 100);
  }

  useEffect(() => {
    if (index === 1 && !streetviewLoaded.current) {
      if (!window?.initMap) {
        handleUseStreetview();
        streetviewLoaded.current = true;
      }
    }
  }, [index]); // Depend on index to re-trigger when it changes

  useEffect(() => {
    console.log("Effect running for index", index);
    const googleMapInstance = document.getElementById("googleMap");
    const googleMapContainer = document.getElementById("googleMapContainer");

    // Store the original parent of the googleMapInstance for later use
    const originalParent = googleMapInstance?.parentNode;

    if (index === 1) {
      if (googleMapInstance && googleMapContainer) {
        console.log("Moving googleMapInstance to googleMapContainer");
        googleMapContainer.appendChild(googleMapInstance);
      } else {
        console.error("One of the elements is not found", {
          googleMapInstance,
          googleMapContainer,
        });
      }

      try {
        initialize();
      } catch (error) {
        console.error("Error initializing the map", error);
      }
    }
    return () => {
      if (
        originalParent &&
        googleMapInstance &&
        originalParent !== googleMapContainer
      ) {
        console.log("Moving googleMapInstance back to its original parent");
        originalParent.appendChild(googleMapInstance);
      }
    };
  }, [startPosition, index]); // Depend on startPosition and index

  const handleUseStreetview = () => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_STREETVIEW_API_KEY
    }&callback=initMap`;
    script.async = true;
    script.defer = true;
    // Add permissions policy
    const meta = document.createElement('meta');
    meta.httpEquiv = "permissions-policy";
    meta.content = "accelerometer=(), gyroscope=()";
    document.head.appendChild(meta);
    
    window.initMap = initialize; // Make sure the initialize function is available globally
    document.head.appendChild(script);
  };

  const handleSearchAddress = (result) => {
    const { coordinates } = result.geometry;
    const newLocation = {
      center: {
        lat: coordinates[1], // Latitude
        lng: coordinates[0], // Longitude
      },
      heading: 0,
      pitch: 0,
    };

    setStartPosition(newLocation);
  };

  const handleGetPano = async () => {
    console.log(pano);

    const finalLocation = {
      center: {
        lat: pano.center.lat, // Latitude
        lng: pano.center.lng, // Longitude
      },
      heading: pano.heading,
      pitch: pano.pitch,
    };
    setStartPosition(finalLocation);
    console.log(finalLocation);

    function calculateZoomLevel(windowWidth) {
      // Polynomial coefficients for the quartic equation
      const a = 3.2718e-12;
      const b = -2.2791e-8;
      const c = 5.8863e-5;
      const d = -6.5839e-2;
      const e = 28.2219;

      // Calculate zoom level using the quartic equation
      const zoomLevel =
        a * windowWidth ** 4 +
        b * windowWidth ** 3 +
        c * windowWidth ** 2 +
        d * windowWidth +
        e;
      return zoomLevel;
    }

    // Example usage
    const windowWidth = window.innerWidth; // Get the current browser width
    const zoomLevel = calculateZoomLevel(windowWidth); // Calculate the zoom level

    const imageUrl = await getStreetviewImage(
      finalLocation.center.lat,
      finalLocation.center.lng,
      finalLocation.heading,
      finalLocation.pitch,
      zoomLevel
    );
    console.log(imageUrl);
    handleConvertImage(imageUrl);
  };

  return {
    handleSearchAddress,
    handleGetPano,
    panoRef,
    googleMapRef,
    startPosition,
  };
};

export default useStreetview;
