import { SavedLesson } from "@shared/types/index";

// Definieer de Node/Link types die react-force-graph verwacht
export interface GraphNode {
  id: string;
  name: string;
  group: "subject" | "lesson" | "concept";
  val: number; // Grootte van de node
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; // Dikte van de lijn
}

export const extractGraphFromLessons = (
  subject: string,
  lessons: SavedLesson[],
): { nodes: GraphNode[]; links: GraphLink[] } => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  // Helper om duplicaten te voorkomen
  const addNode = (node: GraphNode) => {
    if (!nodeIds.has(node.id)) {
      nodes.push(node);
      nodeIds.add(node.id);
    }
  };

  // 1. CENTRALE SUBJECT NODE (De Zon)
  const subjectId = `subject-${subject}`;
  addNode({
    id: subjectId,
    name: subject.charAt(0).toUpperCase() + subject.slice(1),
    group: "subject",
    val: 20,
  });

  // Map voor Cross-Referencing (Concept -> Les ID's)
  const conceptMap = new Map<string, string[]>();

  // 2. ITEREER DOOR LESSEN
  lessons.forEach((lesson) => {
    if (!lesson.id) return;

    // A. Les Node
    addNode({
      id: lesson.id,
      name: lesson.title,
      group: "lesson",
      val: 10,
    });

    // Link Subject -> Les
    links.push({ source: subjectId, target: lesson.id, value: 3 });

    // B. Sectie/Concept Nodes
    lesson.sections.forEach((section) => {
      // Maak een unieke ID, maar gebruik de titel als display naam
      // We cleanen de titel (verwijder 'Hoofdstuk 1: ' etc voor betere matching)
      const cleanHeading = section.heading
        .replace(/^(Hoofdstuk|Deel|§)\s*\d+[:.]?\s*/i, "")
        .trim();
      const nodeId = `concept-${cleanHeading.toLowerCase().replace(/\s+/g, "-")}`;

      addNode({
        id: nodeId,
        name: cleanHeading,
        group: "concept",
        val: 5,
      });

      // Link Les -> Concept
      links.push({ source: lesson.id!, target: nodeId, value: 1 });

      // C. Vul de map voor later (Cross-linking)
      if (!conceptMap.has(nodeId)) {
        conceptMap.set(nodeId, []);
      }
      conceptMap.get(nodeId)?.push(lesson.id!);
    });
  });

  // 3. INTELLIGENTE CROSS-LINKING
  // Als hetzelfde concept in meerdere lessen voorkomt, verbind die lessen dan!
  // Of verbind de concept-nodes als ze identiek zijn (impliciet door ID)

  // Optioneel: Verbind lessen direct als ze veel overlap hebben (Deep Linking)
  // Hier voegen we 'semantische bruggen' toe
  conceptMap.forEach((lessonIds, conceptId) => {
    if (lessonIds.length > 1) {
      // Dit concept komt voor in meerdere lessen.
      // We maken de concept node iets groter omdat hij belangrijk is.
      const node = nodes.find((n) => n.id === conceptId);
      if (node) node.val = 8; // Groter dan normaal (5)
    }
  });

  return { nodes, links };
};
