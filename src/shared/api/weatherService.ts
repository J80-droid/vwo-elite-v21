import SunCalc from "suncalc";

export interface WeatherSlot {
  temp: number;
  icon: string;
  description: string;
}

export interface WeatherForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  slots: {
    morning: WeatherSlot;
    afternoon: WeatherSlot;
    evening: WeatherSlot;
    night: WeatherSlot;
  };
}

export interface WeatherData {
  location: string;
  temp: number;
  description: string;
  icon: string;
  lat: number;
  lon: number;
  forecast?: WeatherForecastDay[];
  // Extended data
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
  windSpeed?: number; // km/h
  windDirection?: number; // degrees
  windGusts?: number; // km/h
  // New parameters
  feelsLike?: number; // Apparent temperature
  cape?: number; // CAPE (J/kg) - thunderstorm potential
  rain?: number; // Rain (mm)
  showers?: number; // Showers (mm)
  daylightDuration?: number; // Daylight duration (hours)
  sunshineDuration?: number; // Sunshine duration (hours)

  // Elite Widget Data
  aqi?: number; // Air Quality Index (European)
  pm25?: number; // PM2.5
  humidity?: number; // Relative Humidity (%)
  pressure?: number; // Surface Pressure (hPa)
  visibility?: number; // Visibility (km)
  cloudCover?: number; // Total cloud cover (%)
  moonPhase?: number; // 0-1
  moonrise?: string;
  moonset?: string;
  hourlyTrend?: { time: number; temp: number; rain: number }[];
}

// Multi-language weather descriptions
export type WeatherLang = "nl" | "en" | "es" | "fr";

const WEATHER_TRANSLATIONS: Record<
  number,
  { icon: string; desc: Record<WeatherLang, string> }
> = {
  0: {
    icon: "Sun",
    desc: { nl: "Onbewolkt", en: "Clear", es: "Despejado", fr: "Dégagé" },
  },
  1: {
    icon: "CloudSun",
    desc: {
      nl: "Licht bewolkt",
      en: "Mostly clear",
      es: "Mayormente despejado",
      fr: "Peu nuageux",
    },
  },
  2: {
    icon: "CloudSun",
    desc: {
      nl: "Half bewolkt",
      en: "Partly cloudy",
      es: "Parcialmente nublado",
      fr: "Partiellement nuageux",
    },
  },
  3: {
    icon: "Cloud",
    desc: { nl: "Bewolkt", en: "Cloudy", es: "Nublado", fr: "Nuageux" },
  },
  45: {
    icon: "Cloud",
    desc: { nl: "Mist", en: "Fog", es: "Niebla", fr: "Brouillard" },
  },
  48: {
    icon: "Cloud",
    desc: {
      nl: "Rijp mist",
      en: "Freezing fog",
      es: "Niebla helada",
      fr: "Brouillard givrant",
    },
  },
  51: {
    icon: "CloudRain",
    desc: {
      nl: "Lichte motregen",
      en: "Light drizzle",
      es: "Llovizna ligera",
      fr: "Bruine légère",
    },
  },
  53: {
    icon: "CloudRain",
    desc: {
      nl: "Matige motregen",
      en: "Drizzle",
      es: "Llovizna",
      fr: "Bruine",
    },
  },
  55: {
    icon: "CloudRain",
    desc: {
      nl: "Zware motregen",
      en: "Heavy drizzle",
      es: "Llovizna intensa",
      fr: "Forte bruine",
    },
  },
  56: {
    icon: "CloudSnow",
    desc: {
      nl: "Lichte ijzel",
      en: "Light freezing drizzle",
      es: "Llovizna helada ligera",
      fr: "Bruine verglaçante légère",
    },
  },
  57: {
    icon: "CloudSnow",
    desc: {
      nl: "Zware ijzel",
      en: "Freezing drizzle",
      es: "Llovizna helada",
      fr: "Bruine verglaçante",
    },
  },
  61: {
    icon: "CloudRain",
    desc: {
      nl: "Lichte regen",
      en: "Light rain",
      es: "Lluvia ligera",
      fr: "Pluie légère",
    },
  },
  63: {
    icon: "CloudRain",
    desc: { nl: "Matige regen", en: "Rain", es: "Lluvia", fr: "Pluie" },
  },
  65: {
    icon: "CloudRain",
    desc: {
      nl: "Zware regen",
      en: "Heavy rain",
      es: "Lluvia intensa",
      fr: "Forte pluie",
    },
  },
  66: {
    icon: "CloudSnow",
    desc: {
      nl: "Lichte ijzelregen",
      en: "Light freezing rain",
      es: "Lluvia helada ligera",
      fr: "Pluie verglaçante légère",
    },
  },
  67: {
    icon: "CloudSnow",
    desc: {
      nl: "Zware ijzelregen",
      en: "Freezing rain",
      es: "Lluvia helada",
      fr: "Pluie verglaçante",
    },
  },
  71: {
    icon: "CloudSnow",
    desc: {
      nl: "Lichte sneeuwval",
      en: "Light snow",
      es: "Nieve ligera",
      fr: "Neige légère",
    },
  },
  73: {
    icon: "CloudSnow",
    desc: { nl: "Matige sneeuwval", en: "Snow", es: "Nieve", fr: "Neige" },
  },
  75: {
    icon: "CloudSnow",
    desc: {
      nl: "Zware sneeuwval",
      en: "Heavy snow",
      es: "Nieve intensa",
      fr: "Forte neige",
    },
  },
  77: {
    icon: "CloudSnow",
    desc: {
      nl: "Sneeuwkorrels",
      en: "Snow grains",
      es: "Granos de nieve",
      fr: "Grains de neige",
    },
  },
  80: {
    icon: "CloudRain",
    desc: {
      nl: "Lichte buien",
      en: "Light showers",
      es: "Chubascos ligeros",
      fr: "Averses légères",
    },
  },
  81: {
    icon: "CloudRain",
    desc: { nl: "Matige buien", en: "Showers", es: "Chubascos", fr: "Averses" },
  },
  82: {
    icon: "CloudRain",
    desc: {
      nl: "Zware buien",
      en: "Heavy showers",
      es: "Chubascos intensos",
      fr: "Fortes averses",
    },
  },
  85: {
    icon: "CloudSnow",
    desc: {
      nl: "Lichte sneeuwbuien",
      en: "Light snow showers",
      es: "Chubascos de nieve ligeros",
      fr: "Averses de neige légères",
    },
  },
  86: {
    icon: "CloudSnow",
    desc: {
      nl: "Zware sneeuwbuien",
      en: "Snow showers",
      es: "Chubascos de nieve",
      fr: "Averses de neige",
    },
  },
  95: {
    icon: "CloudLightning",
    desc: { nl: "Onweer", en: "Thunderstorm", es: "Tormenta", fr: "Orage" },
  },
  96: {
    icon: "CloudLightning",
    desc: {
      nl: "Onweer met hagel",
      en: "Thunderstorm with hail",
      es: "Tormenta con granizo",
      fr: "Orage avec grêle",
    },
  },
  99: {
    icon: "CloudLightning",
    desc: {
      nl: "Zwaar onweer",
      en: "Severe thunderstorm",
      es: "Tormenta severa",
      fr: "Orage violent",
    },
  },
};

const getWeatherInfo = (code: number, lang: WeatherLang = "nl") => {
  const info = WEATHER_TRANSLATIONS[code];
  if (!info)
    return { desc: lang === "nl" ? "Onbekend" : "Unknown", icon: "Cloud" };
  return { desc: info.desc[lang] || info.desc.en, icon: info.icon };
};

// Dutch city name translations
const CITY_TRANSLATIONS: Record<string, Record<WeatherLang, string>> = {
  "The Hague": {
    nl: "Den Haag",
    en: "The Hague",
    es: "La Haya",
    fr: "La Haye",
  },
  Amsterdam: {
    nl: "Amsterdam",
    en: "Amsterdam",
    es: "Ámsterdam",
    fr: "Amsterdam",
  },
  Rotterdam: {
    nl: "Rotterdam",
    en: "Rotterdam",
    es: "Rotterdam",
    fr: "Rotterdam",
  },
  Utrecht: { nl: "Utrecht", en: "Utrecht", es: "Utrecht", fr: "Utrecht" },
  Eindhoven: {
    nl: "Eindhoven",
    en: "Eindhoven",
    es: "Eindhoven",
    fr: "Eindhoven",
  },
  Groningen: {
    nl: "Groningen",
    en: "Groningen",
    es: "Groninga",
    fr: "Groningue",
  },
  Maastricht: {
    nl: "Maastricht",
    en: "Maastricht",
    es: "Maastricht",
    fr: "Maastricht",
  },
};

const translateCity = (city: string, lang: WeatherLang): string => {
  const translations = CITY_TRANSLATIONS[city];
  return translations ? translations[lang] : city;
};

// Check if it's nighttime using actual sunrise/sunset times
const isNightTime = (sunriseISO?: string, sunsetISO?: string): boolean => {
  if (!sunriseISO || !sunsetISO) {
    // Fallback if no sunrise/sunset data
    const hour = new Date().getHours();
    return hour < 7 || hour >= 18;
  }

  const now = new Date();
  const sunrise = new Date(sunriseISO);
  const sunset = new Date(sunsetISO);

  // It's night if current time is before sunrise OR after sunset
  return now < sunrise || now > sunset;
};

// Get the night version of weather icons
const getNightIcon = (
  icon: string,
  sunriseISO?: string,
  sunsetISO?: string,
): string => {
  if (!isNightTime(sunriseISO, sunsetISO)) return icon;
  // Map day icons to night equivalents
  switch (icon) {
    case "Sun":
      return "Moon";
    case "CloudSun":
      return "CloudMoon";
    default:
      return icon; // Cloud icons stay the same at night
  }
};

export const getUserLocation = async (
  forceRefresh = false,
): Promise<{ lat: number; lon: number; city: string }> => {
  // Check cache first
  const cached = localStorage.getItem("vwo-elite-location");
  if (cached && !forceRefresh) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.lat && parsed.lon) {
        return parsed;
      }
    } catch {
      /* ignore parse errors */
    }
  }

  const fallback = { lat: 52.3676, lon: 4.9041, city: "Amsterdam" };

  // Try IP-based geolocation first (ip-api.com supports CORS and is free)
  try {
    const response = await fetch(
      "https://ip-api.com/json/?fields=status,city,lat,lon",
      { headers: { "User-Agent": "VWO-Elite/1.0" } }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        const location = {
          lat: data.lat,
          lon: data.lon,
          city: data.city || "Amsterdam",
        };
        localStorage.setItem("vwo-elite-location", JSON.stringify(location));
        return location;
      }
    }
  } catch {
    // Silent fallback
  }

  // Fallback to browser's Geolocation API (requires user permission)
  const browserLocation = await new Promise<{
    lat: number;
    lon: number;
    city: string;
  } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Try to get city name via reverse geocoding
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
            { headers: { "User-Agent": "VWO-Elite/1.0" } },
          );
          const geoData = await geoRes.json();
          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            "Unknown";
          resolve({ lat: latitude, lon: longitude, city });
        } catch {
          resolve({ lat: latitude, lon: longitude, city: "Unknown" });
        }
      },
      () => resolve(null),
      { timeout: 3000, enableHighAccuracy: false },
    );
  });

  if (browserLocation) {
    localStorage.setItem("vwo-elite-location", JSON.stringify(browserLocation));
    return browserLocation;
  }

  // Final fallback to Amsterdam
  localStorage.setItem("vwo-elite-location", JSON.stringify(fallback));
  return fallback;
};

const getFallbackWeather = (lang: WeatherLang = "nl"): WeatherData => {
  const fallbackDesc = lang === "nl" ? "Fout bij laden" : "Error loading";
  const fallbackLoc = lang === "nl" ? "Onbekend" : "Unknown";
  return {
    location: fallbackLoc,
    temp: 0,
    description: fallbackDesc,
    icon: "Cloud",
    lat: 52.3676,
    lon: 4.9041,
    forecast: [],
    uvIndex: 0,
    windSpeed: 0,
    windDirection: 0,
    windGusts: 0,
    feelsLike: 0,
    cape: 0,
    rain: 0,
    showers: 0,
    daylightDuration: 0,
    sunshineDuration: 0,
    aqi: 0,
    pm25: 0,
    humidity: 0,
    pressure: 0,
    visibility: 0,
    cloudCover: 0,
    moonPhase: 0,
    moonrise: "--:--",
    moonset: "--:--",
    hourlyTrend: [],
  };
};

/**
 * Optimized fetch for city name via reverse geocoding.
 * Independent of weather data.
 */
export const getCityName = async (
  lat: number,
  lon: number,
  lang: WeatherLang = "nl",
): Promise<string> => {
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      {
        headers: { "User-Agent": "VWO-Elite/1.0" },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const rawCity =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        "Unknown";
      return translateCity(rawCity, lang);
    }
  } catch {
    /* Silent failure */
  }
  return "Unknown";
};

/**
 * 100% Future Proof Weather Fetcher
 * Decouples Weather, AQI, and Geocoding.
 */
export const fetchWeather = async (
  lat?: number,
  lon?: number,
  lang: WeatherLang = "nl",
  forceRefresh = false,
): Promise<WeatherData> => {
  try {
    let city = "Amsterdam";
    let targetLat = lat;
    let targetLon = lon;

    // 1. Resolve Location (Parallel or Cached)
    if (targetLat === undefined || targetLon === undefined) {
      const loc = await getUserLocation(forceRefresh);
      targetLat = loc.lat;
      targetLon = loc.lon;
      city = loc.city;
    }

    // 2. Parallel Executes with individual error handling
    // Track promises for independent completion
    const weatherPromise = fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,daylight_duration,sunshine_duration&hourly=weathercode,temperature_2m,windgusts_10m,apparent_temperature,cape,rain,showers,relative_humidity_2m,surface_pressure,cloud_cover,visibility&timezone=auto`,
    ).then((r) => r.json());

    const aqiPromise = fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${targetLat}&longitude=${targetLon}&current=european_aqi,pm2_5`,
      { signal: AbortSignal.timeout(3000) },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    // Fetch City Name independently if it was "Unknown" or if we are forcing refresh
    const cityPromise =
      city === "Unknown" || forceRefresh
        ? getCityName(targetLat, targetLon, lang)
        : Promise.resolve(city);

    // Wait for main weather (CRITICAL)
    // We let AQI and City Name be optional
    const [weatherData, aqiDataRaw, resolvedCity] = await Promise.all([
      weatherPromise,
      aqiPromise,
      cityPromise,
    ]);

    if (weatherData.error)
      throw new Error(weatherData.reason || "Weather API Error");

    const current = weatherData.current_weather;
    const weatherInfo = getWeatherInfo(current.weathercode, lang);
    const aqiData = aqiDataRaw || { current: { european_aqi: 0, pm2_5: 0 } };

    // Process daily forecast
    let forecast: WeatherForecastDay[] = [];
    if (weatherData.daily && weatherData.hourly) {
      forecast = weatherData.daily.time
        .map((time: string, index: number) => {
          const dayStartIndex = index * 24;
          const getSlot = (hourOffset: number): WeatherSlot => {
            const idx = dayStartIndex + hourOffset;
            const code = weatherData.hourly.weathercode[idx];
            const info = getWeatherInfo(code, lang);
            return {
              temp: Math.round(weatherData.hourly.temperature_2m[idx]),
              icon: info.icon,
              description: info.desc,
            };
          };

          return {
            date: time,
            maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
            minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
            slots: {
              night: getSlot(0),
              morning: getSlot(6),
              afternoon: getSlot(12),
              evening: getSlot(18),
            },
          };
        })
        .slice(0, 7);
    }

    const currentHour = new Date().getHours();
    const getHourly = (param: string, fallback = 0) => {
      const val = weatherData.hourly?.[param]?.[currentHour];
      return val !== undefined ? val : fallback;
    };

    const formatTime = (isoString: string | Date) => {
      const date =
        typeof isoString === "string" ? new Date(isoString) : isoString;
      return date.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const sunriseISO = weatherData.daily?.sunrise?.[0];
    const sunsetISO = weatherData.daily?.sunset?.[0];

    const hourlyTrend = Array.from({ length: 6 }).map((_, i) => {
      const safeIdx = currentHour + i;
      return {
        time: (currentHour + i) % 24,
        temp: weatherData.hourly?.temperature_2m?.[safeIdx] || 0,
        rain: weatherData.hourly?.rain?.[safeIdx] || 0,
      };
    });

    const now = new Date();
    const moonTimes = SunCalc.getMoonTimes(now, targetLat!, targetLon!);
    const moonIllum = SunCalc.getMoonIllumination(now);

    return {
      location: resolvedCity,
      temp: Math.round(current.temperature),
      description: weatherInfo.desc,
      icon: getNightIcon(weatherInfo.icon, sunriseISO, sunsetISO),
      lat: targetLat!,
      lon: targetLon!,
      forecast,
      uvIndex: weatherData.daily?.uv_index_max?.[0] || 0,
      ...(weatherData.daily?.sunrise?.[0]
        ? { sunrise: formatTime(weatherData.daily.sunrise[0]) }
        : {}),
      ...(weatherData.daily?.sunset?.[0]
        ? { sunset: formatTime(weatherData.daily.sunset[0]) }
        : {}),
      windSpeed: Math.round(current.windspeed || 0),
      windDirection: Math.round(current.winddirection || 0),
      windGusts: Math.round(getHourly("windgusts_10m")),
      feelsLike: Math.round(
        getHourly("apparent_temperature", current.temperature),
      ),
      cape: Math.round(getHourly("cape")),
      rain: getHourly("rain"),
      showers: getHourly("showers"),
      ...(weatherData.daily?.daylight_duration?.[0]
        ? {
          daylightDuration:
            Math.round((weatherData.daily.daylight_duration[0] / 3600) * 10) /
            10,
        }
        : {}),
      ...(weatherData.daily?.sunshine_duration?.[0]
        ? {
          sunshineDuration:
            Math.round((weatherData.daily.sunshine_duration[0] / 3600) * 10) /
            10,
        }
        : {}),
      aqi: aqiData.current?.european_aqi || 0,
      pm25: aqiData.current?.pm2_5 || 0,
      humidity: Math.round(getHourly("relative_humidity_2m")),
      pressure: Math.round(getHourly("surface_pressure")),
      visibility: Math.round(getHourly("visibility") / 1000),
      cloudCover: Math.round(getHourly("cloud_cover")),
      moonPhase: moonIllum.phase,
      moonrise: moonTimes.rise ? formatTime(moonTimes.rise) : "--:--",
      moonset: moonTimes.set ? formatTime(moonTimes.set) : "--:--",
      hourlyTrend,
    };
  } catch (error) {
    console.error("[WeatherService] Critical failure:", error);
    return getFallbackWeather(lang);
  }
};
