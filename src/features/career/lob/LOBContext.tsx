/* eslint-disable react-refresh/only-export-components */
import {
  getLobResultSQL,
  logActivitySQL,
  saveLobResultSQL,
} from "@shared/api/sqliteService";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface BigFiveScores {
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
}

export interface RIASECScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

export interface ValuesScores {
  selected: string[];
  top3: string[];
}

interface LOBContextType {
  bigFiveScores: BigFiveScores | null;
  saveBigFiveScores: (scores: BigFiveScores) => void;
  riasecScores: RIASECScores | null;
  saveRiasecScores: (scores: RIASECScores) => void;
  valuesScores: ValuesScores | null;
  saveValuesScores: (scores: ValuesScores) => void;
  userGrades: Record<string, number> | null;
  saveUserGrades: (grades: Record<string, number>) => void;
  studyPreferences: Record<string, unknown> | null;
  saveStudyPreferences: (prefs: Record<string, unknown>) => void;
  loading: boolean;
  resetLOBData: () => void;
}

const LOBContext = createContext<LOBContextType | undefined>(undefined);

export const useLOBContext = () => {
  const context = useContext(LOBContext);
  if (!context) {
    throw new Error("useLOBContext must be used within a LOBProvider");
  }
  return context;
};

export const LOBProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [bigFiveScores, setBigFiveScores] = useState<BigFiveScores | null>(
    null,
  );
  const [riasecScores, setRiasecScores] = useState<RIASECScores | null>(null);
  const [valuesScores, setValuesScores] = useState<ValuesScores | null>(null);
  const [userGrades, setUserGrades] = useState<Record<string, number> | null>(
    null,
  );
  const [studyPreferences, setStudyPreferences] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from DB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const bf = await getLobResultSQL("bigfive");
        const rs = await getLobResultSQL("riasec");
        const vs = await getLobResultSQL("values");
        const grades = await getLobResultSQL("grades");
        const prefs = await getLobResultSQL("study_prefs");

        if (bf) setBigFiveScores(bf);
        if (rs) setRiasecScores(rs);
        if (vs) setValuesScores(vs);

        // Use saved grades OR mock default grades for demo purposes if empty
        if (grades) {
          setUserGrades(grades);
        } else {
          // Mock SOMTODAY data for demonstration
          setUserGrades({
            "Wiskunde B": 6.8,
            Natuurkunde: 7.2,
            Scheikunde: 6.5,
            Engels: 7.5,
            Nederlands: 6.0,
          });
        }

        if (prefs) setStudyPreferences(prefs);
      } catch (error) {
        console.error("Failed to load LOB data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveBigFiveScores = async (scores: BigFiveScores) => {
    setBigFiveScores(scores);
    await saveLobResultSQL("bigfive", scores);
    await logActivitySQL("career", "Completed Big Five Assessment", 50); // XP Reward
  };

  const saveRiasecScores = async (scores: RIASECScores) => {
    setRiasecScores(scores);
    await saveLobResultSQL("riasec", scores);
    await logActivitySQL("career", "Completed RIASEC Assessment", 50); // XP Reward
  };

  const saveValuesScores = async (scores: ValuesScores) => {
    setValuesScores(scores);
    await saveLobResultSQL("values", scores);
  };

  const saveUserGrades = async (grades: Record<string, number>) => {
    setUserGrades(grades);
    await saveLobResultSQL("grades", grades);
  };

  const saveStudyPreferences = async (prefs: Record<string, unknown>) => {
    setStudyPreferences(prefs);
    await saveLobResultSQL("study_prefs", prefs);
  };

  const resetLOBData = async () => {
    setBigFiveScores(null);
    setRiasecScores(null);
    setValuesScores(null);
    setUserGrades(null);
    setStudyPreferences(null);
  };

  return (
    <LOBContext.Provider
      value={{
        bigFiveScores,
        saveBigFiveScores,
        riasecScores,
        saveRiasecScores,
        valuesScores,
        saveValuesScores,
        userGrades,
        saveUserGrades,
        studyPreferences,
        saveStudyPreferences,
        loading,
        resetLOBData,
      }}
    >
      {children}
    </LOBContext.Provider>
  );
};
