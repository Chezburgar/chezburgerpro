// ChezburgerPRO theme registry. Each theme is 10 tokens, in this order:
// bg, panel, panel2, line, text, mut, a1 (accent light), a2 (accent mid),
// a3 (accent deep), ink (text sitting ON the accent).
// The accent is always used as a ramp (a1→a2→a3) so it reads metallic.

export const THEME_VARS = [
  "--bg",
  "--panel",
  "--panel2",
  "--line",
  "--text",
  "--mut",
  "--a1",
  "--a2",
  "--a3",
  "--ink",
] as const;

export type Theme = {
  id: string;
  name: string;
  light?: boolean;
  v: [string, string, string, string, string, string, string, string, string, string];
};

export const DEFAULT_THEME_ID = "obsidian-gold";
export const THEME_STORAGE_KEY = "cbp-theme";

export const THEMES: Theme[] = [
  { id: "obsidian-gold", name: "Obsidian & Gold", v: ["#0a0a0c", "#121216", "#1a1a20", "#26262e", "#f5f2ea", "#8f8c84", "#f6d97a", "#d4a94a", "#96702a", "#1a1305"] },
  { id: "royal-gold", name: "Royal Gold", v: ["#060607", "#0e0e10", "#161618", "#232326", "#f8f4e8", "#918d80", "#ffe08a", "#e0b04f", "#a37b2c", "#201607"] },
  { id: "champagne", name: "Champagne", v: ["#0d0c0a", "#151412", "#1d1c19", "#2a2823", "#f7f1e3", "#96907f", "#f4e3b2", "#dcc078", "#a68f4b", "#1f1a0c"] },
  { id: "bronze-age", name: "Bronze Age", v: ["#0b0908", "#141110", "#1c1816", "#2a2420", "#f2e9df", "#94897c", "#e8b98a", "#c08a4e", "#8a5f2e", "#1e1409"] },
  { id: "copper-forge", name: "Copper Forge", v: ["#0c0908", "#151110", "#1e1815", "#2c221d", "#f4ebe4", "#97897f", "#f0a878", "#cf7d43", "#94512a", "#211107"] },
  { id: "rose-gold", name: "Rose Gold", v: ["#0d0a0b", "#151112", "#1e181a", "#2c2226", "#f6edee", "#988a8d", "#f2b8ac", "#d98d80", "#a05c50", "#231110"] },
  { id: "sterling", name: "Sterling Silver", v: ["#0a0b0d", "#121316", "#1a1b1f", "#27282e", "#f1f2f4", "#8b8e94", "#e8ecf2", "#b8c0cc", "#7d8592", "#14161a"] },
  { id: "platinum", name: "Platinum", v: ["#08090a", "#101113", "#18191c", "#242629", "#f4f5f6", "#8f9296", "#f0f2f4", "#c9cdd3", "#8f959e", "#131518"] },
  { id: "gunmetal", name: "Gunmetal", v: ["#0a0c0e", "#121518", "#1a1e22", "#272d33", "#e9edf1", "#87909a", "#b9c6d4", "#8b9aab", "#5b6875", "#10151a"] },
  { id: "emerald-vault", name: "Emerald Vault", v: ["#070b09", "#0e1512", "#151f1a", "#213028", "#eaf4ee", "#83948a", "#8fe3b3", "#4bbd7f", "#2b7d52", "#07160e"] },
  { id: "jade-temple", name: "Jade Temple", v: ["#080b0a", "#101614", "#17201d", "#24322d", "#ecf3f0", "#87958f", "#a8e6cc", "#63c19a", "#3a8368", "#0a1712"] },
  { id: "ruby-casino", name: "Ruby Casino", v: ["#0c0708", "#150e10", "#1f1518", "#302026", "#f6ecee", "#9a888c", "#f28fa0", "#d4566d", "#96323f", "#1e090d"] },
  { id: "crimson-velvet", name: "Crimson Velvet", v: ["#0b0607", "#140c0e", "#1e1215", "#2e1c21", "#f4ebec", "#978789", "#e88a8a", "#c14848", "#872c2c", "#1c0808"] },
  { id: "sapphire-night", name: "Sapphire Night", v: ["#06080d", "#0d1118", "#131a24", "#1f2a3a", "#eaf0f8", "#84909f", "#8ab8f2", "#4d84d4", "#2c5694", "#081120"] },
  { id: "royal-purple", name: "Royal Purple", v: ["#09070d", "#110e18", "#191424", "#28203a", "#f0ecf7", "#8f8a9c", "#c2a2f2", "#9264d4", "#5f3a96", "#140a24"] },
  { id: "amethyst", name: "Amethyst", v: ["#0a080d", "#131018", "#1c1723", "#2c2438", "#f2eef8", "#928c9e", "#d4b3f4", "#a878dc", "#71499c", "#170c26"] },
  { id: "midnight-blue", name: "Midnight Blue", v: ["#05070b", "#0b0f16", "#111721", "#1c2534", "#e9eef5", "#828d9b", "#9fc0e8", "#6288b8", "#3a5678", "#0a1420"] },
  { id: "ocean-deep", name: "Ocean Deep", v: ["#050a0c", "#0b1215", "#111b1f", "#1c2b31", "#e9f2f4", "#82929a", "#8fd4e3", "#4fa5bd", "#2d6c7f", "#07171c"] },
  { id: "teal-reef", name: "Teal Reef", v: ["#060b0b", "#0d1515", "#141f1f", "#203030", "#eaf4f3", "#849492", "#8fe3da", "#4bbdb0", "#2b7d73", "#071614"] },
  { id: "cyber-cyan", name: "Cyber Cyan", v: ["#060a0c", "#0c1316", "#121d21", "#1e2e34", "#e8f4f7", "#81939a", "#7ee8f4", "#3cc0d4", "#227a89", "#062024"] },
  { id: "neon-lime", name: "Neon Lime", v: ["#090b06", "#11150c", "#181f12", "#26301d", "#f0f5e8", "#8d9581", "#cdf27e", "#9fd43c", "#688e22", "#141f04"] },
  { id: "toxic-green", name: "Toxic Green", v: ["#070b06", "#0e150c", "#151f12", "#22301d", "#ecf4ea", "#879484", "#9df28a", "#5ed444", "#379026", "#0a1e05"] },
  { id: "blood-orange", name: "Blood Orange", v: ["#0c0806", "#15100c", "#1f1712", "#30231c", "#f5eee9", "#988c82", "#f2a37e", "#d4703c", "#944a22", "#200f04"] },
  { id: "sunset", name: "Sunset", v: ["#0d0808", "#161010", "#201817", "#312422", "#f6efec", "#998e88", "#f4b48a", "#dc8054", "#a05432", "#221105"] },
  { id: "magma", name: "Magma", v: ["#0c0605", "#150d0b", "#1f1310", "#301e18", "#f4ece8", "#978a83", "#f49468", "#d65e2e", "#963d1a", "#210d03"] },
  { id: "cherry-blossom", name: "Cherry Blossom", v: ["#0d090b", "#161013", "#20171b", "#31232a", "#f7eef2", "#9a8c92", "#f4b3cd", "#dc7ea8", "#a04e74", "#230a16"] },
  { id: "bubblegum", name: "Bubblegum", v: ["#0c080b", "#150f13", "#1f161c", "#30222b", "#f6edf3", "#998b93", "#f2a0d4", "#d465ac", "#963f78", "#20081a"] },
  { id: "hot-pink", name: "Hot Pink", v: ["#0d070a", "#160e11", "#201519", "#312027", "#f7ecf0", "#9a8a90", "#f478b4", "#d43c84", "#96255c", "#22041a"] },
  { id: "synthwave", name: "Synthwave", v: ["#0a0712", "#120e1e", "#1a142c", "#2a2244", "#f0ecf8", "#8f8aa0", "#f47ee8", "#b83cd4", "#7a22a0", "#1e0426"] },
  { id: "vaporwave", name: "Vaporwave", v: ["#090a12", "#10121e", "#171a2c", "#252a44", "#eceef8", "#8b8ea0", "#8ae8f2", "#c78ae8", "#8a54b0", "#120a20"] },
  { id: "matrix", name: "Matrix", v: ["#050805", "#0a100a", "#101810", "#1a281a", "#e6f2e6", "#7f927f", "#7ef27e", "#3cd43c", "#229022", "#032003"] },
  { id: "terminal-amber", name: "Terminal Amber", v: ["#0a0805", "#12100a", "#1a1710", "#2a251a", "#f4f0e6", "#94907f", "#f2c87e", "#d4a03c", "#906a22", "#201603"] },
  { id: "paper-ink", name: "Paper & Ink", light: true, v: ["#f4f2ed", "#faf9f6", "#ffffff", "#dcd8cf", "#1c1a16", "#6e6a60", "#2a2721", "#403c33", "#1c1a16", "#f4f2ed"] },
  { id: "ivory-lux", name: "Ivory Lux", light: true, v: ["#f6f2e8", "#fbf8f0", "#ffffff", "#e2d9c4", "#241f14", "#77705d", "#c8a44e", "#a8842f", "#7c5f1e", "#fdf9ee"] },
  { id: "porcelain", name: "Porcelain", light: true, v: ["#eff2f5", "#f7f9fb", "#ffffff", "#d5dce4", "#161c24", "#5f6a78", "#4d84d4", "#2f62aa", "#1e4478", "#f2f7fd"] },
  { id: "mint-cream", name: "Mint Cream", light: true, v: ["#edf4ef", "#f5faf7", "#ffffff", "#d2e0d7", "#14201a", "#5d7066", "#37a06c", "#237c50", "#155638", "#f0faf4"] },
  { id: "blush", name: "Blush", light: true, v: ["#f6eff1", "#fbf6f8", "#ffffff", "#e6d4da", "#241418", "#7a626a", "#cf5f8b", "#ab3f6b", "#7c2749", "#fdf2f7"] },
  { id: "sandstone", name: "Sandstone", light: true, v: ["#f2ede4", "#f9f5ee", "#ffffff", "#ded4c2", "#221c12", "#746b58", "#b07d3a", "#8c5f26", "#644117", "#faf4ea"] },
  { id: "slate-storm", name: "Slate Storm", v: ["#0b0d10", "#131619", "#1b1f24", "#292f36", "#edf0f3", "#8a919a", "#a8bcd0", "#748ca4", "#4a5e70", "#0e161e"] },
  { id: "graphite-red", name: "Graphite Red", v: ["#0b0a0a", "#131212", "#1c1a1a", "#2a2727", "#f2efef", "#938d8d", "#f27e7e", "#d43c3c", "#902222", "#200404"] },
  { id: "forest-night", name: "Forest Night", v: ["#070a07", "#0e130e", "#141c14", "#202c20", "#ecf2ec", "#879287", "#a8d4a0", "#6fac64", "#44743c", "#0c180a"] },
  { id: "olive-brass", name: "Olive Brass", v: ["#0a0a06", "#12120c", "#1a1a12", "#28281d", "#f2f2e8", "#929282", "#d4cc7e", "#aca04a", "#746a2a", "#1c1a06"] },
  { id: "coffee", name: "Coffee", v: ["#0b0907", "#13100d", "#1b1713", "#2a231d", "#f2ede8", "#948b82", "#d4a878", "#a87c4a", "#70512c", "#1c1206"] },
  { id: "chocolate-gold", name: "Chocolate Gold", v: ["#0d0a06", "#16110b", "#201811", "#31251a", "#f5efe6", "#988f7f", "#f2cc7e", "#cfa044", "#8e6c26", "#211604"] },
  { id: "deep-sea", name: "Deep Sea", v: ["#04070a", "#0a0f14", "#0f161e", "#19242f", "#e8eef4", "#808c98", "#7eb8e8", "#4484bc", "#265680", "#04121e"] },
  { id: "arctic-ice", name: "Arctic Ice", light: true, v: ["#eef3f6", "#f6fafc", "#ffffff", "#d3dfe6", "#121c22", "#5c6c76", "#3a94c0", "#22729a", "#124e6c", "#eef8fe"] },
  { id: "lavender-haze", name: "Lavender Haze", v: ["#0a090f", "#121018", "#1a1722", "#292437", "#f0eef6", "#8f8b9c", "#c8b8f0", "#9c84d8", "#6a549e", "#120c26"] },
  { id: "wine-cellar", name: "Wine Cellar", v: ["#0c0709", "#150e11", "#1f1519", "#302128", "#f4ecef", "#97898d", "#d88ca4", "#ac5472", "#763348", "#1e0812"] },
  { id: "carbon-blue", name: "Carbon Blue", v: ["#08090b", "#0f1114", "#16191d", "#22262c", "#eef1f4", "#8c9198", "#9cc2e8", "#6490c0", "#3c5e84", "#0a1524"] },
  { id: "pure-noir", name: "Pure Noir", v: ["#050505", "#0d0d0d", "#151515", "#222222", "#f6f6f6", "#8e8e8e", "#ffffff", "#d4d4d4", "#8e8e8e", "#0a0a0a"] },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(id: string): void {
  const theme = getTheme(id);
  const root = document.documentElement;
  const vars: Record<string, string> = {};
  THEME_VARS.forEach((name, i) => {
    root.style.setProperty(name, theme.v[i]);
    vars[name] = theme.v[i];
  });
  root.style.colorScheme = theme.light ? "light" : "dark";
  root.dataset.cbpTheme = theme.id;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    // Cached resolved vars: index.html applies these before first paint.
    localStorage.setItem(
      "cbp-theme-vars",
      JSON.stringify({ vars, light: theme.light ?? false }),
    );
  } catch {
    // localStorage unavailable — theme applies for this visit only
  }
}

export function savedThemeId(): string {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    // fall through to default
  }
  return DEFAULT_THEME_ID;
}
