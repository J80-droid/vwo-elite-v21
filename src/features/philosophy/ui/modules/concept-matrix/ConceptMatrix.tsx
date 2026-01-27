/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useRef, useState } from "react";
// Lazy load heavy 3D graph
const ForceGraph3D = React.lazy(() => import("react-force-graph-3d"));
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  ChevronRight,
  GitCompare,
  Info,
  Layers,
  MousePointer2,
  Search,
  Target,
  X,
} from "lucide-react";

// --- DATA: De Antropologie Matrix ---
const ANTHRO_DATA = {
  nodes: [
    {
      id: "Antropologie",
      group: "root",
      val: 20,
      label: "Wijsgerige Antropologie",
      description: "De vraag naar de mens.",
    },

    // Thema's/Domeinen
    {
      id: "Lichaam-Geest",
      group: "theme",
      val: 15,
      label: "Lichaam-Geest Probleem",
      description: "De relatie tussen het fysieke en het mentale.",
    },
    {
      id: "Vrije Wil",
      group: "theme",
      val: 15,
      label: "Vrije Wil vs Determinisme",
      description: "Heeft de mens controle over zijn handelen?",
    },
    {
      id: "Mens-Dier",
      group: "theme",
      val: 15,
      label: "Mens vs Dier",
      description: "Wat onderscheidt de mens van andere dieren?",
    },
    {
      id: "Macht-Sociale",
      group: "theme",
      val: 15,
      label: "Macht & Sociale Identiteit",
      description: "Hoe wordt de mens gevormd door structuren?",
    },

    // Filosofen (Enriched)
    {
      id: "Descartes",
      group: "phil",
      val: 12,
      label: "René Descartes",
      description:
        "Dualisme: Res Cogitans (denken) vs Res Extensa (uitgebreidheid).",
      quote: "Ik denk, dus ik besta.",
      era: "1596-1650",
      work: "Meditationes",
    },
    {
      id: "Aristoteles",
      group: "phil",
      val: 12,
      label: "Aristoteles",
      description: "Hylomorfisme: De ziel is de vorm (eidos) van het lichaam.",
      quote: "De ziel is de eerste actualiteit van een natuurlijk lichaam.",
      era: "384-322 v.Chr.",
      work: "De Anima",
    },
    {
      id: "Merleau-Ponty",
      group: "phil",
      val: 12,
      label: "Maurice Merleau-Ponty",
      description:
        "Fenomenologie: Ik *heb* geen lichaam, ik *ben* mijn lichaam.",
      quote: "Het lichaam is ons anker in de wereld.",
      era: "1908-1961",
      work: "Phénoménologie de la perception",
    },
    {
      id: "Plessner",
      group: "phil",
      val: 12,
      label: "Helmuth Plessner",
      description:
        'De mens is "van nature kunstmatig" en heeft een excentrische positie.',
      quote: "De mens staat buiten het centrum van zijn eigen leven.",
      era: "1892-1985",
      work: "Die Stufen des Organischen",
    },
    {
      id: "Foucault",
      group: "phil",
      val: 12,
      label: "Michel Foucault",
      description:
        "Moderniteit: Het lichaam wordt gedisciplineerd door machtsstructuren (Biopolitiek).",
      quote: "Waar macht is, is verzet.",
      era: "1926-1984",
      work: "Surveiller et punir",
    },
    {
      id: "Marx",
      group: "phil",
      val: 12,
      label: "Karl Marx",
      description:
        "Alienatie: Arbeid maakt de mens, maar onder kapitalisme vervreemdt het hem.",
      quote:
        "De filosofen hebben de wereld slechts geïnterpreteerd; het komt erop aan haar te veranderen.",
      era: "1818-1883",
      work: "Das Kapital",
    },
    {
      id: "Darwin",
      group: "phil",
      val: 12,
      label: "Charles Darwin",
      description: "Evolutie: Geen essentieel onderscheid tussen mens en dier.",
      quote: "Er is grandeur in deze kijk op het leven.",
      era: "1809-1882",
      work: "On the Origin of Species",
    },
    {
      id: "Singer",
      group: "phil",
      val: 12,
      label: "Peter Singer",
      description:
        "Utilitarisme & Antispecisme: Lijden is de maatstaf, niet de soort.",
      quote: "All animals are equal.",
      era: "1946-heden",
      work: "Animal Liberation",
    },
    {
      id: "Spinoza",
      group: "phil",
      val: 12,
      label: "Baruch Spinoza",
      description: "Monisme: Er is maar één substantie (God of Natuur).",
      quote: "De vrije mens denkt aan niets minder dan de dood.",
      era: "1632-1677",
      work: "Ethica",
    },
    {
      id: "Plato",
      group: "phil",
      val: 12,
      label: "Plato",
      description:
        "Dualisme: Het lichaam is de kerker van de ziel (Soma Sema).",
      quote: "De ziel is onsterfelijk en onveranderlijk.",
      era: "427-347 v.Chr.",
      work: "Phaedo",
    },

    // Kernbegrippen
    {
      id: "Dualisme",
      group: "concept",
      val: 8,
      label: "Dualisme",
      description: "Strikte scheiding tussen geest en stof.",
    },
    {
      id: "Monisme",
      group: "concept",
      val: 8,
      label: "Monisme",
      description: "De werkelijkheid bestaat uit één substantie.",
    },
    {
      id: "Hylomorfisme",
      group: "concept",
      val: 8,
      label: "Hylomorfisme",
      description: "Eenheid van materie (hyle) en vorm (morphe).",
    },
    {
      id: "Excentriciteit",
      group: "concept",
      val: 8,
      label: "Excentrische Positionaliteit",
      description: "Vermogen om buiten jezelf te treden (reflectie).",
    },
    {
      id: "Biopolitiek",
      group: "concept",
      val: 8,
      label: "Biopolitiek",
      description:
        "Machtsuitoefening over het biologische leven van de bevolking.",
    },
    {
      id: "Vervreemding",
      group: "concept",
      val: 8,
      label: "Vervreemding",
      description: "Verlies van eigen essentie door externe krachten.",
    },
  ],
  links: [
    { source: "Antropologie", target: "Lichaam-Geest" },
    { source: "Antropologie", target: "Vrije Wil" },
    { source: "Antropologie", target: "Mens-Dier" },
    { source: "Antropologie", target: "Macht-Sociale" },

    { source: "Lichaam-Geest", target: "Descartes" },
    { source: "Lichaam-Geest", target: "Aristoteles" },
    { source: "Lichaam-Geest", target: "Merleau-Ponty" },
    { source: "Lichaam-Geest", target: "Spinoza" },

    { source: "Descartes", target: "Dualisme" },
    { source: "Spinoza", target: "Monisme" },
    { source: "Aristoteles", target: "Hylomorfisme" },
    { source: "Lichaam-Geest", target: "Plato" },
    { source: "Plato", target: "Dualisme" },

    { source: "Mens-Dier", target: "Plessner" },
    { source: "Mens-Dier", target: "Darwin" },
    { source: "Mens-Dier", target: "Singer" },

    { source: "Plessner", target: "Excentriciteit" },

    { source: "Macht-Sociale", target: "Foucault" },
    { source: "Macht-Sociale", target: "Marx" },

    { source: "Foucault", target: "Biopolitiek" },
    { source: "Marx", target: "Vervreemding" },

    // Cross-links (Oppositions)
    {
      source: "Descartes",
      target: "Merleau-Ponty",
      type: "contrast",
      label: "Lichaam vs Bewustzijn",
    },
    {
      source: "Descartes",
      target: "Spinoza",
      type: "contrast",
      label: "Zubstantie-Dualisme vs Monisme",
    },
    {
      source: "Aristoteles",
      target: "Descartes",
      type: "contrast",
      label: "Eenheid vs Scheiding",
    },
    {
      source: "Plato",
      target: "Aristoteles",
      type: "contrast",
      label: "Idealisme vs Realisme",
    },
  ],
};

// Neon/Glass Palette
const GROUP_COLORS = {
  root: "#818cf8", // Indigo-400 (Brighter)
  theme: "#fbbf24", // Amber-400
  phil: "#34d399", // Emerald-400
  concept: "#a78bfa", // Violet-400
};

export const ConceptMatrix: React.FC = () => {
  const { t } = useTranslations();
  const fgRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [contrastMode, setContrastMode] = useState(false);
  const [contrastSelection, setContrastSelection] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Elite Visuals State
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  // Auto-Rotate Effect
  React.useEffect(() => {
    if (fgRef.current) {
      const controls = fgRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
      }
      // Better spacing
      fgRef.current.d3Force("charge").strength(-300);
      fgRef.current.d3Force("link").distance(70);
    }
  }, [fgRef]);

  // Spotlight Logic
  const handleNodeHover = (node: any) => {
    setHoverNode(node || null);
    if (node) {
      // Stop rotation on hover for focus
      if (fgRef.current) fgRef.current.controls().autoRotate = false;

      const neighbors = new Set();
      const links = new Set();
      ANTHRO_DATA.links.forEach((link) => {
        const sId =
          typeof link.source === "object"
            ? (link.source as any).id
            : link.source;
        const tId =
          typeof link.target === "object"
            ? (link.target as any).id
            : link.target;
        if (sId === node.id || tId === node.id) {
          neighbors.add(sId);
          neighbors.add(tId);
          links.add(link);
        }
      });
      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    } else {
      // Resume rotation
      if (fgRef.current) fgRef.current.controls().autoRotate = true;
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  };

  // Filter nodes based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return ANTHRO_DATA;
    const lowerQuery = searchTerm.toLowerCase();
    const matchedNodes = ANTHRO_DATA.nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(lowerQuery) ||
        n.description.toLowerCase().includes(lowerQuery),
    );
    const matchedIds = new Set(matchedNodes.map((n) => n.id));
    const matchedLinks = ANTHRO_DATA.links.filter((l) => {
      const sourceId =
        typeof l.source === "object" ? (l.source as any).id : l.source;
      const targetId =
        typeof l.target === "object" ? (l.target as any).id : l.target;
      return matchedIds.has(sourceId) || matchedIds.has(targetId);
    });
    return { nodes: matchedNodes, links: matchedLinks };
  }, [searchTerm]);

  const handleNodeClick = (node: any) => {
    if (contrastMode) {
      if (node.group !== "phil") return; // Only common to compare philosophers

      if (contrastSelection.find((n) => n.id === node.id)) {
        setContrastSelection(contrastSelection.filter((n) => n.id !== node.id));
      } else if (contrastSelection.length < 2) {
        setContrastSelection([...contrastSelection, node]);
      }
    } else {
      setSelectedNode(node);
      // Aim camera to node
      const distance = 100;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        3000,
      );
    }
  };

  const toggleContrastMode = () => {
    setContrastMode(!contrastMode);
    setContrastSelection([]);
    setSelectedNode(null);
  };

  const handleOpenDossier = () => {
    if (!selectedNode) return;
    // Elite Feature: Open targeted syllabus search
    const query = encodeURIComponent(
      `Filosofie VWO Examen ${selectedNode.label} uitleg`,
    );
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-black overflow-hidden perspective-1000">
      {/* Celestial Void Background (Starfield) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150"></div>
        <div className="absolute w-[2px] h-[2px] bg-white rounded-full top-1/4 left-1/4 shadow-[0_0_2px_#fff]"></div>
        <div className="absolute w-[3px] h-[3px] bg-indigo-300 rounded-full top-3/4 left-1/3 shadow-[0_0_4px_#a5b4fc]"></div>
        <div className="absolute w-[1px] h-[1px] bg-white rounded-full top-1/2 left-2/3"></div>
        {/* CSS Generated Stars would go here, simplified for inline */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
      </div>

      {/* 3D Stage */}
      <div className="flex-1 relative z-10">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-indigo-400 animate-pulse">
              Laden van Concept Matrix...
            </div>
          }
        >
          <ForceGraph3D
            ref={fgRef}
            graphData={filteredData}
            nodeLabel={(
              node: any,
            ) => `<div class="bg-black/90 border border-indigo-500/30 p-2.5 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.2)] backdrop-blur-md">
                            <strong class="text-indigo-300 text-xs tracking-wider uppercase block mb-1">${t(`philosophy.concept_matrix.${node.group}_label`, node.group)}</strong>
                            <span class="text-white font-bold text-sm">${t(`philosophy.concept_matrix.nodes.${node.id}.label`, node.label)}</span>
                        </div>`}
            // Crystalline & Spotlight Look
            nodeColor={(node: any) => {
              if (
                hoverNode &&
                !highlightNodes.has(node.id) &&
                node.id !== hoverNode.id
              ) {
                return "#1e293b"; // Slate-800 dim
              }
              return (GROUP_COLORS as any)[node.group] || "#ffffff";
            }}
            nodeOpacity={0.85} // Glassy
            nodeResolution={24}
            // Neural Web Links
            linkWidth={(link: any) =>
              highlightLinks.has(link) ? 2 : link.type === "contrast" ? 1 : 0.5
            }
            linkDirectionalParticles={contrastMode ? 0 : 2} // Active thinking
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={2}
            linkCurvature={0.25}
            linkColor={(link: any) => {
              if (hoverNode && !highlightLinks.has(link)) {
                return "#1e293b"; // Dim non-active paths
              }
              return link.type === "contrast" ? "#f43f5e" : "#4f46e5"; // Indigo paths
            }}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            onEngineStop={() => fgRef.current?.zoomToFit(1000, 100)} // Auto-center
            backgroundColor="#00000000"
            showNavInfo={false}
          />
        </React.Suspense>

        {/* Empty State */}
        {filteredData.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center max-w-md">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-2">
                {t("philosophy.concept_matrix.no_results", "Geen resultaten")}
              </h3>
              <p className="text-slate-400">
                {t(
                  "philosophy.concept_matrix.no_results_desc",
                  'Geen begrippen of filosofen gevonden voor "{{term}}".',
                  { term: searchTerm },
                )}
                <br />
                {t(
                  "philosophy.concept_matrix.try_another",
                  "Probeer een andere zoekterm.",
                )}
              </p>
            </div>
          </div>
        )}

        {/* HUD Elements */}
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-4 pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Layers className="text-indigo-400" />{" "}
              {t("philosophy.concept_matrix.title", "Concept Matrix")}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {t(
                "philosophy.concept_matrix.syllabus_theme",
                "Syllabus 2025: Wijsgerige Antropologie",
              )}
            </p>
            <div className="flex items-center gap-4 mt-3 text-[10px] font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <MousePointer2 size={12} className="text-indigo-400" />{" "}
                {t(
                  "philosophy.concept_matrix.explore_relations",
                  "Verken relaties",
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <GitCompare size={12} className="text-rose-400" />{" "}
                {t(
                  "philosophy.concept_matrix.compare_visions",
                  "Vergelijk visies",
                )}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="pointer-events-auto w-64 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 backdrop-blur-md group focus-within:border-indigo-500/50 transition-all">
            <Search
              size={16}
              className="text-slate-500 group-focus-within:text-indigo-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("philosophy.concept_matrix.search_placeholder")}
              className="bg-transparent border-none outline-none text-white placeholder-slate-500 focus:ring-0 flex-1 min-w-0 text-sm"
            />
          </div>

          {/* Legend */}
          <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {t("philosophy.concept_matrix.legend.domain", "Domein")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {t("philosophy.concept_matrix.legend.angle", "Invalshoek")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {t("philosophy.concept_matrix.legend.philosopher", "Filosoof")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {t("philosophy.concept_matrix.legend.concept", "Concept")}
              </span>
            </div>
          </div>
        </div>

        {/* Info Panel (Right Side - Moved to Root) */}
        <AnimatePresence>
          {selectedNode && !contrastMode && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="absolute top-24 right-6 max-h-[calc(100vh-8rem)] w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl z-30 flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-start">
                <div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/5 bg-white/5 mb-2 block w-fit ${(GROUP_COLORS as any)[selectedNode.group]}`}
                  >
                    {t(
                      `philosophy.concept_matrix.${selectedNode.group}_label`,
                      selectedNode.group,
                    )}
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {t(
                      `philosophy.concept_matrix.nodes.${selectedNode.id}.label`,
                      selectedNode.label,
                    )}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-indigo-500/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Extra Metadata for Philosophers */}
                {(selectedNode.quote ||
                  selectedNode.work ||
                  selectedNode.era) && (
                  <div className="space-y-4 border-b border-white/5 pb-6">
                    {selectedNode.quote && (
                      <div className="relative pl-4 border-l-2 border-indigo-500/50">
                        <p className="text-sm text-indigo-200 italic font-medium leading-relaxed">
                          "
                          {t(
                            `philosophy.concept_matrix.nodes.${selectedNode.id}.quote`,
                            selectedNode.quote,
                          )}
                          "
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.work && (
                        <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-slate-400">
                          📖 {selectedNode.work}
                        </span>
                      )}
                      {selectedNode.era && (
                        <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-slate-400">
                          ⏳ {selectedNode.era}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info size={12} />{" "}
                    {t(
                      "philosophy.concept_matrix.description_label",
                      "Beschrijving",
                    )}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    {t(
                      `philosophy.concept_matrix.nodes.${selectedNode.id}.desc`,
                      selectedNode.description,
                    )}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Target size={12} />{" "}
                    {t(
                      "philosophy.concept_matrix.connections_label",
                      "Connecties",
                    )}
                  </h4>
                  <div className="space-y-2">
                    {ANTHRO_DATA.links
                      .filter((l) => {
                        const sId =
                          typeof l.source === "object"
                            ? (l.source as any).id
                            : l.source;
                        const tId =
                          typeof l.target === "object"
                            ? (l.target as any).id
                            : l.target;
                        return (
                          sId === selectedNode.id || tId === selectedNode.id
                        );
                      })
                      .map((l, i) => {
                        const sId =
                          typeof l.source === "object"
                            ? (l.source as any).id
                            : l.source;
                        const tId =
                          typeof l.target === "object"
                            ? (l.target as any).id
                            : l.target;
                        const otherId = sId === selectedNode.id ? tId : sId;
                        const otherNode = ANTHRO_DATA.nodes.find(
                          (n) => n.id === otherId,
                        );

                        // Handle case where otherNode isn't found (rare but possible with data inconsistencies)
                        if (!otherNode) return null;

                        return (
                          <button
                            key={i}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-pointer text-left"
                            onClick={() => handleNodeClick(otherNode)}
                          >
                            <span className="text-xs text-slate-400 group-hover:text-indigo-200 transition-colors">
                              {t(
                                `philosophy.concept_matrix.nodes.${otherNode.id}.label`,
                                otherNode.label,
                              )}
                            </span>
                            <ChevronRight
                              size={14}
                              className="text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all"
                            />
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10">
                <button
                  onClick={handleOpenDossier}
                  className="w-full py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <Brain size={16} />{" "}
                  {t("philosophy.concept_matrix.open_dossier", "Open Dossier")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar Top Right (Moved) */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3 pointer-events-auto">
          <button
            onClick={toggleContrastMode}
            className={`
                            h-11 px-5 rounded-xl border flex items-center gap-3 transition-all backdrop-blur-md font-bold text-xs uppercase tracking-widest
                            ${
                              contrastMode
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                                : "bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                            }
                        `}
          >
            <GitCompare size={18} />
            {contrastMode
              ? t(
                  "philosophy.concept_matrix.contrast_mode_on",
                  "Contrast Mode: Aan",
                )
              : t("philosophy.concept_matrix.contrast_mode", "Contrast Mode")}
          </button>
        </div>

        {/* Contrast Panel (Moved & Redesigned for Right Side) */}
        <AnimatePresence>
          {contrastMode && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="absolute top-20 right-6 bottom-6 w-72 bg-rose-950/30 backdrop-blur-xl border border-rose-500/10 rounded-2xl z-20 flex flex-col shadow-xl overflow-hidden pointer-events-auto"
            >
              {contrastSelection.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-rose-300/40 p-6 text-center">
                  <GitCompare size={32} className="mb-3 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    {t(
                      "philosophy.concept_matrix.contrast_select_2",
                      "Selecteer 2 filosofen",
                    )}
                  </p>
                </div>
              ) : contrastSelection.length === 1 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
                  <div className="w-full p-4 rounded-xl bg-white/5 border border-rose-500/20 text-center">
                    <h4 className="text-sm font-black text-white">
                      {contrastSelection[0].label}
                    </h4>
                  </div>
                  <div className="text-rose-400 font-black text-lg animate-pulse">
                    VS
                  </div>
                  <div className="w-full p-4 rounded-xl border border-dashed border-rose-500/20 bg-rose-500/5 flex items-center justify-center text-rose-500/40 font-bold uppercase tracking-widest text-[9px] text-center">
                    + Selecteer 2e
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  {/* Top Fighter: Blue/Indigo Tint */}
                  <div className="flex-1 p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col h-full justify-center text-center">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                        {t(
                          "philosophy.concept_matrix.contrast_vision_a",
                          "Visie A",
                        )}
                      </span>
                      <h4 className="text-xl font-black text-white mb-3">
                        {t(
                          `philosophy.concept_matrix.nodes.${contrastSelection[0].id}.label`,
                          contrastSelection[0].label,
                        )}
                      </h4>
                      <div className="bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-sm">
                        <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                          "
                          {t(
                            `philosophy.concept_matrix.nodes.${contrastSelection[0].id}.desc`,
                            contrastSelection[0].description,
                          )}
                          "
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="h-0 flex items-center justify-center relative z-20">
                    <div className="bg-black border-4 border-rose-500 rounded-full w-12 h-12 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse">
                      <span className="text-white font-black text-sm italic">
                        VS
                      </span>
                    </div>
                  </div>

                  {/* Bottom Fighter: Rose/Red Tint */}
                  <div className="flex-1 p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col h-full justify-center text-center">
                      <div className="bg-white/5 border border-white/5 p-4 rounded-xl backdrop-blur-sm mb-3">
                        <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                          "
                          {t(
                            `philosophy.concept_matrix.nodes.${contrastSelection[1].id}.desc`,
                            contrastSelection[1].description,
                          )}
                          "
                        </p>
                      </div>
                      <h4 className="text-xl font-black text-white mb-2">
                        {t(
                          `philosophy.concept_matrix.nodes.${contrastSelection[1].id}.label`,
                          contrastSelection[1].label,
                        )}
                      </h4>
                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                        {t(
                          "philosophy.concept_matrix.contrast_vision_b",
                          "Visie B",
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setContrastSelection([])}
                    className="absolute top-2 right-2 p-2 text-slate-500 hover:text-white transition-colors z-30"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
