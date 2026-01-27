import { createContext } from "react";

import { UsePhysicsLabStateReturn } from "../types";

export const PhysicsLabContext = createContext<UsePhysicsLabStateReturn | null>(
  null,
);
