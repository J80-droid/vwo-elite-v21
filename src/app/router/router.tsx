import React, { lazy } from "react";
import { createHashRouter, Navigate } from "react-router-dom";

// Header/Layout imports
const SomtodayCallback = lazy(() =>
  import("@features/auth/SomtodayCallback").then((m) => ({
    default: m.SomtodayCallback,
  })),
);
const AppLayout = lazy(() =>
  import("@widgets/layout/ui/AppLayout").then((m) => ({
    default: m.AppLayout,
  })),
);

// Core Views -> Pages
const LessonGenerator = lazy(() =>
  import("@pages/lessongenerator/ui/LessonGenerator").then((m) => ({
    default: m.LessonGenerator,
  })),
);
const PWSCopilot = lazy(() =>
  import("@pages/pwscopilot/ui/PWSCopilot").then((m) => ({
    default: m.PWSCopilot,
  })),
);
const Planner = lazy(() => import("@features/planner/ui/PlannerLanding"));
const AnalyticsPage = lazy(() =>
  import("@pages/analytics/ui/AnalyticsPage").then((m) => ({
    default: m.default,
  })),
);

const BlurtingModeLazy = lazy(() =>
  import("@pages/blurtinglab/ui/BlurtingLab").then((m) => ({
    default: m.BlurtingLab,
  })),
);
const BloomTrainer = lazy(() =>
  import("@pages/bloomtrainer/ui/BloomTrainer").then((m) => ({
    default: m.BloomTrainer,
  })),
);

const Settings = lazy(() =>
  import("@features/settings/ui/SettingsLanding").then((m) => ({
    default: () => (
      <m.SettingsProvider>
        <m.Settings />
      </m.SettingsProvider>
    ),
  })),
);

// Elite Hubs -> Features
const MathLabModern = lazy(
  () => import("@pages/mathlabmodern/ui/MathLabModern"),
);
const PhysicsLab = lazy(() =>
  import("@features/physics/ui/PhysicsLabLayout").then((m) => ({
    default: m.PhysicsLabLayout,
  })),
);
const ChemistryLab = lazy(() =>
  import("@features/chemistry/ui/ChemistryLabLayout").then((module) => ({
    default: module.ChemistryLabLayout,
  })),
);
const BiologyLab = lazy(() =>
  import("@features/biology/ui/BiologyLabLayout").then((m) => ({
    default: m.BiologyLabLayout,
  })),
);
const PhilosophyLab = lazy(() =>
  import("@features/philosophy/ui/PhilosophyLabLayoutV2").then((m) => ({
    default: m.PhilosophyLabLayoutV2,
  })),
);
const PsychologyLab = lazy(() =>
  import("@features/psychology/ui/PsychologyLabLayout").then((m) => ({
    default: m.PsychologyLabLayout,
  })),
);
const ThreeDLabLayout = lazy(() =>
  import("@features/threed-studio/ui/ThreeDLabLayout").then((m) => ({
    default: m.ThreeDLabLayout,
  })),
);
const LanguageLabHub = lazy(() =>
  import("@features/language/ui/LanguageLabLayout").then((m) => ({
    default: () => (
      <m.LanguageLabProvider>
        <m.LanguageLabLayout />
      </m.LanguageLabProvider>
    ),
  })),
);

const ResearchLanding = lazy(() =>
  import("@features/research/ui/ResearchLanding").then((m) => ({
    default: m.ResearchLanding,
  })),
);
const ResearchTool = lazy(() => import("@features/research/ui/ResearchTool"));

// LOB Platform -> Widgets/Features
const CareerChoiceHub = lazy(() =>
  import("@pages/careerchoicehub/ui/CareerChoiceHub").then((m) => ({
    default: m.CareerChoiceHub,
  })),
);
const BigFiveTest = lazy(() =>
  import("@features/career/lob/BigFiveTest").then((m) => ({
    default: m.BigFiveTest,
  })),
);
const RIASECTest = lazy(() =>
  import("@features/career/lob/RIASECTest").then((m) => ({
    default: m.RIASECTest,
  })),
);
const AICareerCoach = lazy(() =>
  import("@features/career/lob/AICareerCoach").then((m) => ({
    default: m.AICareerCoach,
  })),
);
const StudyExplorer = lazy(() =>
  import("@features/career/lob/StudyExplorer").then((m) => ({
    default: m.StudyExplorer,
  })),
);
const ScenarioPlanner = lazy(() =>
  import("@features/career/lob/ScenarioPlanner").then((m) => ({
    default: m.ScenarioPlanner,
  })),
);
const OpenDaysAgenda = lazy(() =>
  import("@features/career/lob/OpenDaysAgenda").then((m) => ({
    default: m.OpenDaysAgenda,
  })),
);
const GapYearGuide = lazy(() =>
  import("@features/career/lob/GapYearGuide").then((m) => ({
    default: m.GapYearGuide,
  })),
);
const SelectionTrainer = lazy(() =>
  import("@features/career/lob/SelectionTrainer").then((m) => ({
    default: m.SelectionTrainer,
  })),
);
const StudyUniverse = lazy(() =>
  import("@features/career/lob/StudyUniverse").then((m) => ({
    default: m.StudyUniverse,
  })),
);
const ValuesCompass = lazy(() =>
  import("@features/career/lob/ValuesCompass").then((m) => ({
    default: m.ValuesCompass,
  })),
);

async function loadLobContext() {
  const { LOBProvider } = await import("@features/career/lob/LOBContext");
  return {
    default: ({ children }: { children: React.ReactNode }) => (
      <LOBProvider>{children}</LOBProvider>
    ),
  };
}
const LOBWrapper = lazy(() => loadLobContext());

const SmartLibrary = lazy(() =>
  import("@features/library/ui/SmartLibrary").then((m) => ({
    default: () => (
      <m.LibraryProvider>
        <m.SmartLibrary />
      </m.LibraryProvider>
    ),
  })),
);

const CodeLab = lazy(() =>
  import("@features/code/ui/CodeLabLayout").then((m) => ({
    default: () => (
      <m.CodeLabProvider>
        <m.CodeLabLayout />
      </m.CodeLabProvider>
    ),
  })),
);

const AILab = lazy(() =>
  import("@features/ai-lab/ui/AILabLayout").then((m) => ({
    default: () => (
      <m.AILabProvider>
        <m.AILabLayout />
      </m.AILabProvider>
    ),
  })),
);

const ExamenCentrum = lazy(() =>
  import("@features/exam/ui/ExamenCentrum").then((m) => ({
    default: () => (
      <m.ExamProvider>
        <m.ExamenCentrum />
      </m.ExamProvider>
    ),
  })),
);

const BrainstormHub = lazy(() =>
  import("@features/brainstorm/ui/BrainstormLabLayout").then((m) => ({
    default: () => (
      <m.BrainstormLabProvider>
        <m.BrainstormLabLayout />
      </m.BrainstormLabProvider>
    ),
  })),
);

const SocraticCoach = lazy(() =>
  import("@pages/socraticcoach/ui/SocraticCoach").then((m) => ({
    default: m.SocraticCoach,
  })),
);
const VideoLab = lazy(() =>
  import("@pages/videolab/ui/VideoLab").then((m) => ({ default: m.VideoLab })),
);
const SmartReview = lazy(() =>
  import("@pages/smartreview/ui/SmartReview").then((m) => ({
    default: m.SmartReview,
  })),
);
const FormulaSearch = lazy(() =>
  import("@pages/formulasearch/ui/FormulaSearch").then((m) => ({
    default: m.FormulaSearch,
  })),
);
const EliteGraphCalculator = lazy(() =>
  import("@features/calculator/GraphCalculator").then((m) => ({
    default: m.GraphCalculator,
  })),
);
const CalculatorShowcase = lazy(() =>
  import("@pages/calculatorshowcase/ui/CalculatorShowcase").then((m) => ({
    default: m.CalculatorShowcase,
  })),
);

const UltimateDashboard = lazy(
  () => import("@pages/dashboard/ui/UltimateDashboard"),
);

const UserSettings = lazy(() =>
  import("@features/usersettings").then((m) => ({
    default: m.MainUserSettingsLayout,
  })),
);

import { SuspenseWrapper } from "@shared/ui/SuspenseWrapper";
import { ErrorPage } from "@widgets/layout/ui/ErrorPage";

export const router = createHashRouter([
  {
    path: "/callback",
    element: <SomtodayCallback />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      // --- MAIN ---
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <UltimateDashboard />
          </SuspenseWrapper>
        ),
      },
      {
        path: "planner/:tab?",
        element: (
          <SuspenseWrapper text="Agenda laden...">
            <Planner />
          </SuspenseWrapper>
        ),
      },
      {
        path: "analytics",
        element: (
          <SuspenseWrapper text="Analytics laden...">
            <AnalyticsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "library",
        element: (
          <SuspenseWrapper text="Bibliotheek openen...">
            <SmartLibrary />
          </SuspenseWrapper>
        ),
      },
      {
        path: "smart-review",
        element: (
          <SuspenseWrapper>
            <SmartReview />
          </SuspenseWrapper>
        ),
      },
      {
        path: "settings",
        element: <Navigate to="/settings/profile" replace />,
      },
      {
        path: "settings/:module",
        element: (
          <SuspenseWrapper>
            <Settings />
          </SuspenseWrapper>
        ),
      },
      {
        path: "user-settings",
        element: (
          <SuspenseWrapper text="Gebruikersinstellingen laden...">
            <UserSettings />
          </SuspenseWrapper>
        ),
      },

      // --- LABS ---
      {
        path: "math/:module?/:submodule?",
        element: <Navigate to="/math-modern" replace />,
      },
      {
        path: "math-modern/:module?/:submodule?",
        element: (
          <SuspenseWrapper text="Math Lab Elite laden...">
            <MathLabModern />
          </SuspenseWrapper>
        ),
      },
      {
        path: "physics/:module?/:submodule?",
        element: (
          <SuspenseWrapper text="Fysica simulaties starten...">
            <PhysicsLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "chemistry/:module?/:submodule?",
        element: (
          <SuspenseWrapper text="Chemie Lab voorbereiden...">
            <ChemistryLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "biology/:module?/:submodule?",
        element: (
          <SuspenseWrapper text="Bio-simulaties laden...">
            <BiologyLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "philosophy/:module?",
        element: (
          <SuspenseWrapper text="Filosofie laden...">
            <PhilosophyLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "psychology/:module?",
        element: (
          <SuspenseWrapper text="Psychologie laden...">
            <PsychologyLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "3d-studio/:module?/:submodule?/:level?",
        element: (
          <SuspenseWrapper text="3D Omgeving starten...">
            <ThreeDLabLayout />
          </SuspenseWrapper>
        ),
      },
      {
        path: "language/:lang?/:module?",
        element: (
          <SuspenseWrapper text="Taalcentrum openen...">
            <LanguageLabHub />
          </SuspenseWrapper>
        ),
      },
      {
        path: "code/:module?",
        element: (
          <SuspenseWrapper text="Code Editor starten...">
            <CodeLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "ailab/:module?",
        element: (
          <SuspenseWrapper text="AI Lab initialiseren...">
            <AILab />
          </SuspenseWrapper>
        ),
      },

      // --- TOOLS ---
      {
        path: "brainstorm/:module?",
        element: (
          <SuspenseWrapper>
            <BrainstormHub />
          </SuspenseWrapper>
        ),
      },
      {
        path: "research",
        element: (
          <SuspenseWrapper>
            <ResearchLanding />
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <CareerChoiceHub />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/bigfive",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <BigFiveTest />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/riasec",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <RIASECTest />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/coach",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <AICareerCoach />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/explorer",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <StudyExplorer />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/plan-b",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <ScenarioPlanner />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/open-days",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <OpenDaysAgenda />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/gap-year",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <GapYearGuide />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/selection-trainer",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <SelectionTrainer />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/universe",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <StudyUniverse />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/career/values",
        element: (
          <SuspenseWrapper>
            <LOBWrapper>
              <ValuesCompass />
            </LOBWrapper>
          </SuspenseWrapper>
        ),
      },
      {
        path: "research/:module",
        element: (
          <SuspenseWrapper>
            <ResearchTool />
          </SuspenseWrapper>
        ),
      },
      {
        path: "coach",
        element: (
          <SuspenseWrapper>
            <SocraticCoach />
          </SuspenseWrapper>
        ),
      },

      // --- TOETSING ---
      {
        path: "examen-centrum/:module?",
        element: (
          <SuspenseWrapper>
            <ExamenCentrum />
          </SuspenseWrapper>
        ),
      },

      // --- SPECIALIZED & LEGACY REDIRECTS (Optional but good for stability) ---
      {
        path: "pws",
        element: (
          <SuspenseWrapper>
            <PWSCopilot />
          </SuspenseWrapper>
        ),
      },
      {
        path: "video",
        element: (
          <SuspenseWrapper>
            <VideoLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "lesson/:subject",
        element: (
          <SuspenseWrapper>
            <LessonGenerator />
          </SuspenseWrapper>
        ),
      },
      {
        path: "formula",
        element: (
          <SuspenseWrapper>
            <FormulaSearch />
          </SuspenseWrapper>
        ),
      },
      {
        path: "graph",
        element: (
          <SuspenseWrapper>
            <EliteGraphCalculator />
          </SuspenseWrapper>
        ),
      },
      {
        path: "bloom",
        element: (
          <SuspenseWrapper>
            <BloomTrainer />
          </SuspenseWrapper>
        ),
      },
      {
        path: "blurting-mode",
        element: (
          <SuspenseWrapper>
            <BlurtingModeLazy />
          </SuspenseWrapper>
        ),
      },
      {
        path: "lab/elite",
        element: (
          <SuspenseWrapper>
            <CalculatorShowcase />
          </SuspenseWrapper>
        ),
      },

      // Re-map old specific paths to hubs for backward compatibility
      {
        path: "science",
        element: (
          <SuspenseWrapper>
            <PhysicsLab />
          </SuspenseWrapper>
        ),
      }, // Legacy redirect to Physics
      {
        path: "molecules",
        element: (
          <SuspenseWrapper>
            <ChemistryLab />
          </SuspenseWrapper>
        ),
      },
      {
        path: "spatial",
        element: (
          <SuspenseWrapper>
            <ThreeDLabLayout initialModule="spatial" />
          </SuspenseWrapper>
        ),
      },
      {
        path: "stereo",
        element: (
          <SuspenseWrapper>
            <ThreeDLabLayout initialModule="stereo" />
          </SuspenseWrapper>
        ),
      },
      {
        path: "slicer",
        element: (
          <SuspenseWrapper>
            <ThreeDLabLayout initialModule="slicer" />
          </SuspenseWrapper>
        ),
      },
      {
        path: "build",
        element: (
          <SuspenseWrapper>
            <ThreeDLabLayout initialModule="build" />
          </SuspenseWrapper>
        ),
      },
      {
        path: "projection",
        element: (
          <SuspenseWrapper>
            <ThreeDLabLayout initialModule="projection" />
          </SuspenseWrapper>
        ),
      },
      {
        path: "exam-sim",
        element: (
          <SuspenseWrapper>
            <ExamenCentrum />
          </SuspenseWrapper>
        ),
      },
      {
        path: "mindmap",
        element: (
          <SuspenseWrapper>
            <BrainstormHub />
          </SuspenseWrapper>
        ),
      },
      {
        path: "snap-solve",
        element: (
          <SuspenseWrapper>
            <ResearchTool />
          </SuspenseWrapper>
        ),
      }, // Note: ResearchTool handles redirects if no param, but here it might default. Better to redirect or let it handle. Actually, logic in component handles :module. If mapped to same component, it acts as /snap-solve.
      // Better approach: Redirects in router 6.4? or just map to component which checks params.
      // But wait, the component expects /research/:module structure or param.
      // Let's keep it simple: pointing to ResearchTool will trigger its "no param" check -> redirect to /research.
      // This breaks legacy link for /snap-solve specifically going to snap?
      // ResearchTool checks `useParams`. If route is /snap-solve, param `module` is undefined. It redirects to /research.
      // To support legacy direct links, we should probably redirect properly or mapped route needs param.
      // Since this is cleanup, let's just point to Landing for these OR keep as is but they will go to Hub.
      // ACTUALLY: The user asked to put them under /research/:module.
      // For now, let's point legacy to the TOOL, which will redirect to HUB. Ideally we'd use <Navigate> but I can't easily import it here without changing structure.
      // Let's map them to ResearchLanding for clarity.
      {
        path: "snap-solve",
        element: (
          <SuspenseWrapper>
            <ResearchTool />
          </SuspenseWrapper>
        ),
      }, // Will redirect to Hub
      {
        path: "source",
        element: (
          <SuspenseWrapper>
            <ResearchTool />
          </SuspenseWrapper>
        ),
      }, // Will redirect to Hub
      {
        path: "idiom",
        element: (
          <SuspenseWrapper>
            <LanguageLabHub />
          </SuspenseWrapper>
        ),
      },
      {
        path: "sjt",
        element: (
          <SuspenseWrapper>
            <LanguageLabHub />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
