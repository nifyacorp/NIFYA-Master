// CommonJS configuration file (using .cjs extension)
module.exports = {
  content: [
    './frontend/src/**/*.{js,jsx,ts,tsx}',
    './frontend/public/index.html'
  ],
  css: ['./frontend/src/styles/**/*.css'],
  safelist: [
    // Add classes that might be dynamically generated or added via JS
    /^modal-/, 
    /^tooltip-/,
    /^animate-/,
    /^fa-/,
    // Classes used in dynamic state management
    'active',
    'open',
    'visible',
    'show',
    'hidden',
    'expanded',
    'collapsed',
    // Utility classes that might be used programmatically
    /^mt-/,
    /^mb-/,
    /^pt-/,
    /^pb-/,
    /^pl-/,
    /^pr-/
  ],
  rejected: true,
  rejectedCss: true,
  output: './css-analysis-report'
}; 