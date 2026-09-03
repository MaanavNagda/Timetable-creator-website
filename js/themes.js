(function () {
  window.Timetable = window.Timetable || {};

  const THEMES = [
    { id: 'midnight-slate', name: 'Midnight Slate', type: 'solid', description: 'Deep blue-grey slate' },
    { id: 'obsidian', name: 'Obsidian', type: 'solid', description: 'Pure dark obsidian' },
    { id: 'deep-space', name: 'Deep Space', type: 'gradient', description: 'Purple-black space gradient' },
    { id: 'neon-grid', name: 'Neon Grid', type: 'geometric', description: 'Glowing grid on black' },
    { id: 'aurora-gradient', name: 'Aurora Gradient', type: 'gradient', description: 'Flowing green and violet aurora' },
    { id: 'geometric-dark', name: 'Geometric Dark', type: 'geometric', description: 'Subtle dark triangles' },
    { id: 'cosmic-purple', name: 'Cosmic Purple', type: 'gradient', description: 'Violet and blue cosmic cloud' },
    { id: 'forest-glow', name: 'Forest Glow', type: 'picture', description: 'Deep forest greens at night' },
    { id: 'sunset-horizon', name: 'Sunset Horizon', type: 'gradient', description: 'Warm sunset reds and oranges' },
    { id: 'ocean-depths', name: 'Ocean Depths', type: 'gradient', description: 'Deep blue and teal ocean' },
    { id: 'galaxy-spiral', name: 'Galaxy Spiral', type: 'picture', description: 'Swirling galaxy core' },
    { id: 'northern-lights', name: 'Northern Lights', type: 'picture', description: 'Bands of aurora light' },
    { id: 'cyber-mesh', name: 'Cyber Mesh', type: 'geometric', description: 'Circuit-like mesh pattern' },
    { id: 'mountain-mist', name: 'Mountain Mist', type: 'picture', description: 'Layered mountain silhouettes' },
    { id: 'stardust', name: 'Stardust', type: 'picture', description: 'Scattered star field' },
    { id: 'volcanic', name: 'Volcanic', type: 'gradient', description: 'Smouldering red and black' }
  ];

  const DEFAULT_THEME = 'midnight-slate';

  window.Timetable.Themes = {
    all: THEMES,
    getById: (id) => THEMES.find(t => t.id === id),
    getDefault: () => DEFAULT_THEME,
    getTypes: () => [...new Set(THEMES.map(t => t.type))]
  };
})();
