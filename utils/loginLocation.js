import * as Location from "expo-location";

const DEFAULT_TIMEOUT_MS = 3500;

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

const readCoords = async () => {
  let position = await Location.getLastKnownPositionAsync();

  if (!position?.coords) {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  }

  return position?.coords || null;
};

async function loadLoginLocationInternal() {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission?.granted) return {};

  const coords = await readCoords();
  if (!coords) return {};

  const latitude = Number(coords.latitude);
  const longitude = Number(coords.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return {};

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
