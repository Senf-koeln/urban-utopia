export async function getStreetviewImage(
  latitude,
  longitude,
  heading,
  pitch,
  zoom = 1.6
) {
  const fov = 180 / 2 ** zoom;
  const size = "640x640";
  // const pitch = 10;
  const apiKey = import.meta.env.VITE_GOOGLE_STREETVIEW_API_KEY;

  // Function to calculate heading between two points
  // function calculateHeading(lat1, lng1, lat2, lng2) {
  //   // Convert degrees to radians
  //   const degToRad = (deg) => (deg * Math.PI) / 180;

  //   lat1 = degToRad(lat1);
  //   lat2 = degToRad(lat2);
  //   lng1 = degToRad(lng1);
  //   lng2 = degToRad(lng2);

  //   const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  //   const x =
  //     Math.cos(lat1) * Math.sin(lat2) -
  //     Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  //   const heading = Math.atan2(y, x);

  //   // Convert radians to degrees and normalize
  //   return ((heading * 180) / Math.PI + 360) % 360;
  // }

  // // Get the bearing (heading) of the nearest road
  // const roadApiUrl = `https://roads.googleapis.com/v1/nearestRoads?points=${latitude},${longitude}&key=${apiKey}`;
  // const roadResponse = await fetch(roadApiUrl);
  // const roadData = await roadResponse.json();

  // let heading;
  // if (
  //   roadData &&
  //   roadData.snappedPoints &&
  //   roadData.snappedPoints.length >= 2
  // ) {
  //   // Calculate heading between the first two snapped points
  //   const point1 = roadData.snappedPoints[0].location;
  //   const point2 = roadData.snappedPoints[1].location;
  //   heading = calculateHeading(
  //     point1.latitude,
  //     point1.longitude,
  //     point2.latitude,
  //     point2.longitude
  //   );
  // } else {
  //   // Fallback heading if no or insufficient road data is found
  //   heading = 235;
  // }

  // Form the Street View URL with the obtained heading
  const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;

  console.log(imageUrl);

  return imageUrl;
}
