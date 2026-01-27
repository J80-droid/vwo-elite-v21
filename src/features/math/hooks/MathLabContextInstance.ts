import { createContext } from "react";

import type { MathLabContextValue } from "../types";

export const MathLabContext = createContext<MathLabContextValue | null>(null);
