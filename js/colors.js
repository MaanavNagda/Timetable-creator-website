(function () {
  window.Timetable = window.Timetable || {};

  const COLORS = [
    { id: 'neon-blue', name: 'Neon Blue', hex: '#2979ff' },
    { id: 'neon-green', name: 'Neon Green', hex: '#00e676' },
    { id: 'neon-orange', name: 'Neon Orange', hex: '#ff9100' },
    { id: 'neon-red', name: 'Neon Red', hex: '#ff1744' },
    { id: 'neon-purple', name: 'Neon Purple', hex: '#d500f9' },
    { id: 'neon-pink', name: 'Neon Pink', hex: '#ff4081' },
    { id: 'neon-cyan', name: 'Neon Cyan', hex: '#00e5ff' },
    { id: 'neon-lime', name: 'Neon Lime', hex: '#76ff03' },
    { id: 'neon-yellow', name: 'Neon Yellow', hex: '#ffea00' },
    { id: 'neon-magenta', name: 'Neon Magenta', hex: '#ff00e6' },
    { id: 'neon-coral', name: 'Neon Coral', hex: '#ff6f60' },
    { id: 'neon-teal', name: 'Neon Teal', hex: '#00bfa5' },
    { id: 'neon-sky', name: 'Neon Sky', hex: '#00b0ff' },
    { id: 'neon-violet', name: 'Neon Violet', hex: '#7c4dff' },
    { id: 'neon-rose', name: 'Neon Rose', hex: '#f50057' },
    { id: 'neon-amber', name: 'Neon Amber', hex: '#ffab00' },
    { id: 'neon-indigo', name: 'Neon Indigo', hex: '#536dfe' },
    { id: 'neon-emerald', name: 'Neon Emerald', hex: '#00c853' },
    { id: 'neon-fuchsia', name: 'Neon Fuchsia', hex: '#e040fb' },
    { id: 'neon-chartreuse', name: 'Neon Chartreuse', hex: '#aeea00' }
  ];

  function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return [0, 0, 0];
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(hex, 16);
    if (Number.isNaN(bigint)) return [0, 0, 0];
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }

  function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  window.Timetable.Colors = {
    all: COLORS,
    getById: (id) => COLORS.find(c => c.id === id),
    getByHex: (hex) => COLORS.find(c => c.hex.toLowerCase() === (hex || '').toLowerCase()),
    get defaultColor() { return COLORS[0]; },
    hexToRgb,
    hexToRgba
  };
})();
