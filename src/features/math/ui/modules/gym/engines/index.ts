import { GymEngine } from "../types";
import { EconomicsMixEngine, GeographyMixEngine, HistoryMixEngine, StatisticsEngine } from "./AlphaGammaEngines";
import { DerivEngine } from "./DerivEngine";
import { DomainEngine } from "./DomainEngine";
import { ExponentEngine } from "./ExponentEngine";
import { FormulaEngine } from "./FormulaEngine";
import { FractionEngine } from "./FractionEngine";
import { GeometryEngine } from "./GeometryEngine";
import { IntegraalEngine } from "./IntegraalEngine";
import { LimitEngine } from "./LimitEngine";
import { TrigEngine } from "./TrigEngine";
import { VectorEngine as MathVectorEngine } from "./VectorEngine";

export const MATH_ENGINES_MAP: Record<string, GymEngine> = {
    fractions: FractionEngine,
    exponents: ExponentEngine,
    trig: TrigEngine,
    derivs: DerivEngine,
    formulas: FormulaEngine,
    vectors: MathVectorEngine,
    integraal: IntegraalEngine,
    limits: LimitEngine,
    domain: DomainEngine,
    geometry: GeometryEngine,
    "mix-economics": EconomicsMixEngine,
    "infinite-history": HistoryMixEngine,
    "infinite-geography": GeographyMixEngine,
    "stats-mastery": StatisticsEngine,
};

export * from "./AIGymAdapter";
export * from "./createMixEngine";
export * from "./DerivEngine";
export * from "./DomainEngine";
export * from "./ExponentEngine";
export * from "./FormulaEngine";
export * from "./FractionEngine";
export * from "./GeometryEngine";
export * from "./IntegraalEngine";
export * from "./LimitEngine";
export * from "./StaticDataEngine";
export * from "./TrigEngine";
export * from "./VectorEngine";
