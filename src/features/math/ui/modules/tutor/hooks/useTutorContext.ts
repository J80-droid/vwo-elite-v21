import { useMathLabContext } from "@features/math/hooks/useMathLabContext";

export const useTutorContext = () => {
  // We assume useMathLabContext provides access to global state
  // In a real implementation, we would pull specific state slices
  const { activeModule } = useMathLabContext();

  // Genereer context voor de AI
  const getContextPrompt = () => {
    if (activeModule === "analytics") {
      // Mocking context access for now
      return `De leerling is functies aan het plotten. Vraag naar nulpunten of toppen.`;
    }
    if (activeModule === "vectors") {
      return `De leerling werkt met vectoren. Vraag naar het inproduct als de hoek 90 graden lijkt.`;
    }
    if (activeModule === "gym") {
      return `De leerling is bezig met basisvaardigheden trainen.`;
    }
    return "De leerling is aan het verkennen in het hoofdmenu.";
  };

  return { getContextPrompt };
};
