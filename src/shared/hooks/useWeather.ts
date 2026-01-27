import { fetchWeather, WeatherData, WeatherLang } from "@shared/api/weatherService";
import { useCallback, useEffect, useRef,useState } from "react";

export function useWeather(lang: string) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const widgetRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    const updateWeather = useCallback(async (forceRefresh = false) => {
        setIsRefreshing(true);
        try {
            const data = await fetchWeather(
                undefined,
                undefined,
                lang as WeatherLang,
                forceRefresh,
            );
            setWeather(data);
            // Cache the successful result
            localStorage.setItem(
                "vwo-elite-weather-cache",
                JSON.stringify({
                    data,
                    timestamp: new Date().getTime(),
                }),
            );
            setLastUpdated(new Date());
        } catch (err) {
            console.warn("Weather update failed:", err);
        } finally {
            setIsRefreshing(false);
        }
    }, [lang]);

    useEffect(() => {
        // Stale-While-Revalidate: Try to load from cache immediately
        const cached = localStorage.getItem("vwo-elite-weather-cache");
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                setWeather(data);
                setLastUpdated(new Date(timestamp));
            } catch {
                /* ignore fallback to fresh fetch */
            }
        }

        // Trigger background refresh
        updateWeather();

        // 30 minute auto-refresh
        const interval = setInterval(() => {
            updateWeather();
        }, 1800000);

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideWidget = widgetRef.current?.contains(target);
            const isInsidePortal = portalRef.current?.contains(target);

            if (!isInsideWidget && !isInsidePortal) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [lang, updateWeather]);

    return {
        weather,
        isOpen,
        setIsOpen,
        showMap,
        setShowMap,
        isRefreshing,
        lastUpdated,
        updateWeather,
        widgetRef,
        portalRef
    };
}
