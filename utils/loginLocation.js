import * as Location from "expo-location";

const DEFAULT_TIMEOUT_MS = 5000; // Increased to 5s to accommodate retries

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({}), timeoutMs)),
  ]);

const formatAddress = (place) => {
  if (!place) return "";
  const parts = [
    place.name,
    place.street,
    place.subregion,
    place.city,
    place.region,
    place.postalCode,
    place.country,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return [...new Set(parts)].join(", ");
};

const isValidCoords = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  if (latitude === 0 && longitude === 0) return false; // Ignore default/error fix
  return true;
};

const readCoords = async (maxRetries = 2) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      let position = await Location.getLastKnownPositionAsync();

      if (!position?.coords || !isValidCoords(position.coords.latitude, position.coords.longitude)) {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (position?.coords && isValidCoords(position.coords.latitude, position.coords.longitude)) {
        return position.coords;
      }
    } catch (e) {
      // Ignore and allow loop to retry
    }

    if (i < maxRetries) {
      await new Promise(r => setTimeout(r, 800)); // Delay between retries
    }
  }

  return null;
};

async function loadLoginLocationInternal() {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission?.granted) return {};

  const coords = await readCoords();
  if (!coords) return {};

  const latitude = Number(coords.latitude);
  const longitude = Number(coords.longitude);
  
  if (!isValidCoords(latitude, longitude)) return {};

  let address = "";
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    address = formatAddress(places?.[0]);
  } catch (_error) {
    address = "";
  }

  return {
    latitude,
    longitude,
    ...(address ? { address } : {}),
  };
}

export const getLoginLocationPayload = async ({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  try {
    return await withTimeout(loadLoginLocationInternal(), timeoutMs);
  } catch (_error) {
    return {};
  }
};

export default {};
