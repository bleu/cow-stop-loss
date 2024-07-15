import { Cache } from "swr";

export function localStorageProvider(): Cache {
  // Initialize the map with data from localStorage
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem("app-cache") || "[]"),
  );

  // Function to save the current state of the map to localStorage
  const saveToLocalStorage = () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem("app-cache", appCache);
  };

  // Set up an interval to save the cache every 10 seconds
  const intervalId = setInterval(saveToLocalStorage, 10_000);

  // Save to localStorage before the window unloads
  window.addEventListener("beforeunload", saveToLocalStorage);

  // Return an object with the map and cleanup function
  return map;
}
