import { createStore } from "@shared/lib/storeFactory";

export interface CodeFile {
  name: string;
  content: string;
  language: "python" | "markdown" | "csv" | "json" | "text";
}

export interface CodeProject {
  id: string;
  name: string;
  files: CodeFile[];
  lastModified: number;
}

interface CodeState {
  projects: CodeProject[];
  activeProjectId: string | null;
  activeFileName: string;

  // Actions
  createProject: (name: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  setActiveFile: (fileName: string) => void;
  updateFile: (projectId: string, fileName: string, content: string) => void;
  addFile: (projectId: string, file: CodeFile) => void;
  deleteFile: (projectId: string, fileName: string) => void;
  getActiveProject: () => CodeProject | undefined;
  getActiveFile: () => CodeFile | undefined;
}

const DEFAULT_PROJECT: CodeProject = {
  id: "default-pws",
  name: "PWS Data Analyse",
  lastModified: Date.now(),
  files: [
    {
      name: "main.py",
      language: "python",
      content: `# PWS Data Analyse Template
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 1. Voorbeeld Data (vervang met je eigen CSV)
data = {
    'Meting': range(1, 11),
    'Temperatuur': [20.1, 20.5, 21.2, 21.8, 22.1, 22.5, 22.9, 23.1, 23.4, 23.8],
    'Druk': [101.3, 101.5, 101.8, 102.1, 102.3, 102.5, 102.7, 102.9, 103.1, 103.3]
}
df = pd.DataFrame(data)

# 2. Beschrijvende Statistiek
print("=== Data Overzicht ===")
print(df.describe())

# 3. Correlatie Analyse
correlatie = df['Temperatuur'].corr(df['Druk'])
print(f"\\nCorrelatie Temp-Druk: {correlatie:.3f}")

# 4. Visualisatie
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Lijnplot
axes[0].plot(df['Meting'], df['Temperatuur'], 'o-', color='#38bdf8', label='Temperatuur')
axes[0].set_xlabel('Meting #')
axes[0].set_ylabel('Temperatuur (°C)')
axes[0].set_title('Temperatuur per Meting')
axes[0].grid(True, alpha=0.3)

# Scatterplot
axes[1].scatter(df['Temperatuur'], df['Druk'], c='#a855f7', s=80, alpha=0.8)
axes[1].set_xlabel('Temperatuur (°C)')
axes[1].set_ylabel('Druk (kPa)')
axes[1].set_title(f'Correlatie: r = {correlatie:.3f}')
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
`,
    },
  ],
};

const WISKUNDE_D_PROJECT: CodeProject = {
  id: "wiskunde-d-modellen",
  name: "Wiskunde D Modellen",
  lastModified: Date.now() - 86400000,
  files: [
    {
      name: "main.py",
      language: "python",
      content: `# Wiskunde D: Differentiaalvergelijkingen
import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint

# SIR Model (Epidemiologie)
def sir_model(y, t, beta, gamma):
    S, I, R = y
    dSdt = -beta * S * I
    dIdt = beta * S * I - gamma * I
    dRdt = gamma * I
    return [dSdt, dIdt, dRdt]

# Parameters
N = 1000           # Populatie
I0 = 1             # Geïnfecteerden bij t=0
I0 = 1             # Geïnfecteerden bij t=0
R0 = 0             # Hersteld bij t=0
S0 = N - I0 - R0   # Vatbaar bij t=0

beta = 0.3         # Besmettingssnelheid
gamma = 0.1        # Herstelsnelheid

# Tijdsas
t = np.linspace(0, 160, 160)

# Oplossen
y0 = [S0/N, I0/N, R0/N]
solution = odeint(sir_model, y0, t, args=(beta, gamma))
S, I, R = solution.T

# Plot
plt.figure(figsize=(10, 6))
plt.plot(t, S*N, 'b-', label='Vatbaar (S)', linewidth=2)
plt.plot(t, I*N, 'r-', label='Geïnfecteerd (I)', linewidth=2)
plt.plot(t, R*N, 'g-', label='Hersteld (R)', linewidth=2)
plt.xlabel('Tijd (dagen)')
plt.ylabel('Aantal Personen')
plt.title(f'SIR Model (β={beta}, γ={gamma})')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

print(f"Reproductiegetal R₀ = β/γ = {beta/gamma:.2f}")
print(f"Maximale infecties: {max(I)*N:.0f} personen")
`,
    },
  ],
};

export const useCodeStore = createStore<CodeState>(
  (set, get) => ({
    projects: [DEFAULT_PROJECT, WISKUNDE_D_PROJECT],
    activeProjectId: DEFAULT_PROJECT.id,
    activeFileName: "main.py",

    createProject: (name) =>
      set((state) => {
        const newProject: CodeProject = {
          id: crypto.randomUUID(),
          name,
          files: [
            {
              name: "main.py",
              language: "python",
              content: '# Nieuw Python script\n\nprint("Hallo!")',
            },
          ],
          lastModified: Date.now(),
        };
        return {
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id,
          activeFileName: "main.py",
        };
      }),

    deleteProject: (id) =>
      set((state) => {
        const remaining = state.projects.filter((p) => p.id !== id);
        return {
          projects: remaining,
          activeProjectId:
            state.activeProjectId === id
              ? remaining[0]?.id || null
              : state.activeProjectId,
        };
      }),

    setActiveProject: (id) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === id);
        return {
          activeProjectId: id,
          activeFileName: project?.files[0]?.name || "main.py",
        };
      }),

    setActiveFile: (fileName) => set({ activeFileName: fileName }),

    updateFile: (projectId, fileName, content) =>
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
              ...p,
              lastModified: Date.now(),
              files: p.files.map((f) =>
                f.name === fileName ? { ...f, content } : f,
              ),
            }
            : p,
        ),
      })),

    addFile: (projectId, file) =>
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
              ...p,
              lastModified: Date.now(),
              files: [...p.files, file],
            }
            : p,
        ),
      })),

    deleteFile: (projectId, fileName) =>
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
              ...p,
              files: p.files.filter((f) => f.name !== fileName),
            }
            : p,
        ),
      })),

    getActiveProject: () => {
      const state = get();
      return state.projects.find((p) => p.id === state.activeProjectId);
    },

    getActiveFile: () => {
      const state = get();
      const project = state.projects.find(
        (p) => p.id === state.activeProjectId,
      );
      return project?.files.find((f) => f.name === state.activeFileName);
    },
  }),
  { name: "code-lab" }
);
