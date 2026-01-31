import { GYM_CATALOG } from "@features/math/ui/modules/gym/config/gymCatalog";

import { DOMAIN_LABELS } from "./constants";
import { ConfidencePoint, ErrorDNAItem, SyllabusItem } from "./types";

export const mapErrorData = (sqlData: { error_type: string; count: number }[]): ErrorDNAItem[] => {
    const total = sqlData.reduce((acc, curr) => acc + curr.count, 0) || 1;
    return sqlData.map(item => {
        // Capitalize first letter
        const name = item.error_type.charAt(0).toUpperCase() + item.error_type.slice(1);
        const colorMap: Record<string, string> = {
            "Conceptueel": "#ef4444", "Slordigheid": "#f59e0b", "Leesfout": "#3b82f6", "Tijdnood": "#a855f7",
            "Strikvraag (misread/format)": "#fb7185" // Neon Rose for tactical alerts
        };
        const colorKey = name.toLowerCase().includes("strikvraag") ? "Strikvraag (misread/format)" : name;
        return {
            name,
            value: Math.round((item.count / total) * 100),
            color: colorMap[colorKey] || "#64748b"
        };
    }).sort((a, b) => b.value - a.value);
};

export const mapSyllabusData = (levels: { engine_id: string; box_level: number }[]): SyllabusItem[] => {
    const domainStats: Record<string, { sum: number; count: number }> = {};
    const levelMap = new Map(levels.map(l => [l.engine_id, l.box_level]));

    GYM_CATALOG.forEach((mod) => {
        if (!mod.examDomain) return;
        if (!domainStats[mod.examDomain]) domainStats[mod.examDomain] = { sum: 0, count: 0 };

        const lvl = levelMap.get(mod.id) || 1;
        const stats = domainStats[mod.examDomain]!;
        stats.sum += lvl;
        stats.count++;
    });

    return Object.keys(domainStats).map(id => {
        const stats = domainStats[id];
        if (!stats) return null;
        const { sum, count } = stats;

        // Strategic weighting: Find max weight in this domain
        const maxWeight = Math.max(...GYM_CATALOG.filter(m => m.examDomain === id).map(m => m.examWeight || 5));

        return {
            id,
            name: DOMAIN_LABELS[id] || id,
            type: (["L-C", "L-D", "L-E", "PH-A", "F", "G"].includes(id) ? "SE" : "CE") as "CE" | "SE",
            coverage: Math.round((sum / (count * 5)) * 100),
            weight: maxWeight
        };
    }).filter((x): x is SyllabusItem & { weight: number } => x !== null).sort((a, b) => b.weight - a.weight || b.coverage - a.coverage);
};

export const mapConfidenceData = (sqlData: { confidence_level: string; correctness_rate: number; count: number }[]): ConfidencePoint[] => {
    return sqlData.map(d => {
        const confVal = d.confidence_level === "high" ? 9 : d.confidence_level === "low" ? 2 : 5;
        return {
            conf: confVal,
            correct: d.correctness_rate,
            size: Math.min(400, d.count * 20),
            name: confVal > 7 ? "Master Zone" : confVal < 4 ? "Danger Zone" : "Learning Zone"
        };
    });
};
