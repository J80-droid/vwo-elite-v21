export const countSignificantFigures = (value: string): number => {
    let clean = value.trim().replace(",", ".");
    if (isNaN(parseFloat(clean))) return 0;

    // Remove negative sign
    clean = clean.replace("-", "");

    // Handle scientific notation (e.g., 1.2e-3 -> 1.2)
    if (clean.includes("e")) {
        clean = clean.split("e")[0]!;
    }

    // Remove decimal point for counting
    const hasDecimal = clean.includes(".");
    const parts = clean.split(".");
    const combined = parts.join("");

    // Remove leading zeros
    const withoutLeading = combined.replace(/^0+/, "");

    if (withoutLeading === "") return 0;

    // If there's a decimal, tailing zeros are significant
    if (hasDecimal) {
        return withoutLeading.length;
    }

    // For whole numbers, trailing zeros are usually NOT significant in VWO rules
    // unless specified, but we'll stick to the standard: 100 is 1 sig fig, 100.0 is 4.
    return withoutLeading.replace(/0+$/, "").length;
};

export const validateScientific = (input: string, correct: string, requiredSigFigs?: number) => {
    const inputVal = parseFloat(input.trim().replace(",", "."));
    const correctVal = parseFloat(correct.trim().replace(",", "."));

    if (isNaN(inputVal)) return { correct: false, feedback: "Voer een geldig getal in." };

    // Standard numeric check (within 2% margin for calculation variations)
    const margin = Math.abs(correctVal * 0.02);
    const numericCorrect = Math.abs(inputVal - correctVal) <= margin;

    if (!numericCorrect) {
        return { correct: false, feedback: `Fout getal. Het juiste antwoord is ${correct}.` };
    }

    // Significant Figures check
    if (requiredSigFigs) {
        const inputSigFigs = countSignificantFigures(input);
        if (inputSigFigs !== requiredSigFigs) {
            return {
                correct: false,
                feedback: `Getal is correct, maar let op de significantie! Je hebt ${inputSigFigs} cijfers, het moeten er ${requiredSigFigs} zijn.`
            };
        }
    }

    return { correct: true };
};
