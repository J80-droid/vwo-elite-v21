export const SNIPPETS = [
  {
    name: "Data Inladen (CSV)",
    code: `import pandas as pd

# Laad je CSV bestand (upload eerst via "Load Dataset")
df = pd.read_csv('data.csv')

print("Eerste 5 rijen:")
print(df.head())

print("\\nKolommen:", df.columns.tolist())
print("Aantal rijen:", len(df))`,
  },
  {
    name: "Grafiek Maken",
    code: `import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')
plt.xlabel('X-as')
plt.ylabel('Y-as')
plt.title('Mijn Grafiek')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`,
  },
  {
    name: "Statistiek",
    code: `import pandas as pd
import numpy as np

# Voorbeeld data
data = [23.5, 24.1, 22.8, 25.2, 23.9, 24.5, 22.1, 25.8, 24.3, 23.7]

gemiddelde = np.mean(data)
std = np.std(data, ddof=1)  # Steekproef std
mediaan = np.median(data)

print(f"Gemiddelde: {gemiddelde:.2f}")
print(f"Standaardafwijking: {std:.2f}")
print(f"Mediaan: {mediaan:.2f}")
print(f"Min: {min(data):.2f}")
print(f"Max: {max(data):.2f}")`,
  },
  {
    name: "Curve Fitting",
    code: `import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

# Definieer model functie
def lineair(x, a, b):
    return a * x + b

# Meetdata
x_data = np.array([1, 2, 3, 4, 5, 6, 7, 8])
y_data = np.array([2.1, 4.3, 5.8, 8.1, 10.2, 11.9, 14.1, 16.0])

# Fit
popt, pcov = curve_fit(lineair, x_data, y_data)
a, b = popt

print(f"y = {a:.3f}x + {b:.3f}")
print(f"Fout in a: ±{np.sqrt(pcov[0,0]):.3f}")

# Plot
x_fit = np.linspace(0, 10, 100)
y_fit = lineair(x_fit, a, b)

plt.scatter(x_data, y_data, label='Meetpunten', color='#38bdf8', s=80)
plt.plot(x_fit, y_fit, 'r--', label=f'Fit: y={a:.2f}x+{b:.2f}')
plt.xlabel('x')
plt.ylabel('y')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`,
  },
];
