const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Output file paths (consistent names as requested)
const REPORT_FILE = 'css-unused-report.txt';
const SUMMARY_FILE = 'css-analysis-summary.txt';
const MISSING_CSS_REPORT = 'css-missing-report.txt';

console.log('Starting CSS analysis...');
console.log(`Working directory: ${process.cwd()}`);

// Tailwind CSS patterns to ignore as "missing"
const tailwindPatterns = [
  // Layout
  /^container$/,
  /^flex/, /^grid/, /^place-/, /^content-/, /^items-/, /^justify-/,
  /^order-/, /^float-/, /^clear-/, /^object-/,
  
  // Spacing & Sizing
  /^p[xytblr]?-/, /^m[xytblr]?-/, /^space-/,
  /^w-/, /^h-/, /^min-[wh]-/, /^max-[wh]-/,
  
  // Typography
  /^text-/, /^font-/, /^tracking-/, /^leading-/,
  /^list-/, /^whitespace-/, /^break-/, /^truncate$/,
  
  // Backgrounds
  /^bg-/,
  
  // Borders
  /^border/, /^rounded/, 
  
  // Effects
  /^shadow-/, /^opacity-/, /^transition-/, /^transform-/,
  /^scale-/, /^rotate-/, /^translate-/, /^skew-/,
  
  // Tables
  /^table-/,
  
  // Animations
  /^animate-/,
  
  // Interactivity
  /^cursor-/, /^select-/, /^resize-/, /^scroll-/, /^snap-/,
  
  // SVG
  /^fill-/, /^stroke-/,
  
  // Accessibility
  /^sr-/,
  
  // Positions
  /^static$/, /^fixed$/, /^absolute$/, /^relative$/, /^sticky$/,
  /^top-/, /^right-/, /^bottom-/, /^left-/, /^inset-/,
  /^z-/,
  
  // Display
  /^block$/, /^inline$/, /^inline-block$/, /^hidden$/,
  /^visible$/, /^invisible$/,
  
  // Flexbox/Grid specific
  /^gap-/, /^col-/, /^row-/,
  
  // Standard Tailwind Colors
  /^(bg|text|border|ring|fill|stroke|from|via|to|shadow)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/,
  
  // Dark mode
  /^dark:/,
  
  // Media query modifiers
  /^sm:/, /^md:/, /^lg:/, /^xl:/, /^2xl:/,
  
  // State modifiers
  /^hover:/, /^focus:/, /^active:/, /^disabled:/, /^visited:/,
  /^focus-within:/, /^focus-visible:/, /^group-hover:/,
  /^first:/, /^last:/, /^odd:/, /^even:/,
  
  // Pseudo-element modifiers
  /^before:/, /^after:/,
  
  // Arbitrary values
  /^\[/
];

// Patterns for common responsive class prefixes and suffixes
const responsivePatterns = [
  // Prefixes
  /^mobile-/, /^desktop-/, /^tablet-/, /^sm-/, /^md-/, /^lg-/, /^xl-/,
  // Suffixes
  /-mobile$/, /-desktop$/, /-tablet$/, /-sm$/, /-md$/, /-lg$/, /-xl$/,
  // Infixes
  /-mobile-/, /-desktop-/, /-tablet-/, /-sm-/, /-md-/, /-lg-/, /-xl-/,
  // Common responsive terms
  /responsive/, /breakpoint/, /screen/
];

/**
 * Improved CSS class extraction that properly handles media queries and nested rules
 * @param {string} cssContent - The CSS content to parse
 * @return {Object} Object with sets of classes and their sources (regular or media query)
 */
function extractCssClasses(cssContent) {
  // Store all extracted classes
  const classes = {
    regular: new Set(), // Classes outside media queries
    mediaQuery: new Set(), // Classes inside media queries
    all: new Set() // All classes (combined)
  };
  
  // Function to add a class to our tracking sets
  const addClass = (className, source) => {
    // Clean up the class name (remove pseudo-classes, attribute selectors, etc.)
    const cleanClassName = className.split(':')[0]      // Remove pseudo-classes like :hover
                                   .split('[')[0]       // Remove attribute selectors
                                   .split('.').pop()    // Get the actual class name after the dot
                                   .trim();
    
    if (cleanClassName && cleanClassName.length > 0) {
      if (source === 'media') {
        classes.mediaQuery.add(cleanClassName);
      } else {
        classes.regular.add(cleanClassName);
      }
      classes.all.add(cleanClassName);
    }
  };
  
  // 1. First handle top-level selectors (outside media queries)
  // We need to exclude content inside media query blocks
  const withoutMediaQueries = cssContent.replace(/@media[^{]+\{([^}]*\{[^}]*\})*[^}]*\}/g, '');
  
  // Extract selectors from top-level CSS
  const selectorRegex = /\.([a-zA-Z0-9_-][a-zA-Z0-9_-]*(?:[.][a-zA-Z0-9_-]+)*?)(?=[^{}]*\{)/g;
  let match;
  
  while ((match = selectorRegex.exec(withoutMediaQueries)) !== null) {
    // Handle compound selectors (e.g., .class1.class2)
    const compoundClasses = match[1].split('.');
    for (const cls of compoundClasses) {
      addClass(cls, 'regular');
    }
  }
  
  // 2. Now extract classes from within media queries
  // First find all media query blocks
  const mediaQueryRegex = /@media[^{]+\{((?:[^{}]+|{[^{}]*})*)\}/g;
  const mediaQueries = [];
  
  while ((match = mediaQueryRegex.exec(cssContent)) !== null) {
    mediaQueries.push(match[1]);
  }
  
  // For each media query block, extract classes
  for (const mediaQueryContent of mediaQueries) {
    const mediaClassRegex = /\.([a-zA-Z0-9_-][a-zA-Z0-9_-]*(?:[.][a-zA-Z0-9_-]+)*?)(?=[^{}]*\{)/g;
    
    while ((match = mediaClassRegex.exec(mediaQueryContent)) !== null) {
      // Handle compound selectors within media queries
      const compoundClasses = match[1].split('.');
      for (const cls of compoundClasses) {
        addClass(cls, 'media');
      }
    }
  }
  
  return classes;
}

async function runAnalysis() {
  try {
    console.log('Finding CSS files...');
    const cssFiles = glob.sync('./frontend/src/styles/**/*.css');
    console.log(`Found ${cssFiles.length} CSS files to analyze`);
    
    if (cssFiles.length === 0) {
      console.log('No CSS files found. Please check the path: ./frontend/src/styles/');
      return;
    }
    
    console.log('Finding content files...');
    const contentFiles = glob.sync('./frontend/src/**/*.{js,jsx,ts,tsx}');
    console.log(`Found ${contentFiles.length} content files to analyze`);
    
    if (contentFiles.length === 0) {
      console.log('No content files found. Please check the path: ./frontend/src/');
      return;
    }

    console.log('Running PurgeCSS analysis...');
    
    // Read content of all content files
    const content = [];
    const contentMap = new Map(); // Store content by file for missing CSS analysis
    for (const file of contentFiles) {
      try {
        const fileContent = fs.readFileSync(file, 'utf8');
        content.push(fileContent);
        contentMap.set(file, fileContent);
      } catch (err) {
        console.log(`Warning: Could not read file ${file}: ${err.message}`);
      }
    }
    
    // Read CSS content
    const css = [];
    let allCssContent = '';
    
    for (const file of cssFiles) {
      try {
        const cssContent = fs.readFileSync(file, 'utf8');
        css.push({
          raw: cssContent,
          name: path.basename(file)
        });
        allCssContent += cssContent + '\n';
      } catch (err) {
        console.log(`Warning: Could not read CSS file ${file}: ${err.message}`);
      }
    }
    
    // Extract defined classes with our improved method
    const extractedClasses = extractCssClasses(allCssContent);
    const definedClasses = extractedClasses.all;
    const mediaQueryClasses = extractedClasses.mediaQuery;
    
    console.log(`Found ${definedClasses.size} total CSS classes (${mediaQueryClasses.size} in media queries)`);
    
    // Create a safelist for PurgeCSS with responsive patterns
    const safelist = {
      standard: [
        'active', 'open', 'visible', 'show', 'hidden', 'expanded', 'collapsed',
        ...mediaQueryClasses // Add all classes found in media queries to safelist
      ],
      deep: [
        /^modal-/, /^tooltip-/, /^animate-/, /^fa-/, 
        /^mt-/, /^mb-/, /^pt-/, /^pb-/, /^pl-/, /^pr-/,
        // Add common responsive patterns to safelist
        ...responsivePatterns
      ]
    };
    
    // Run PurgeCSS
    const result = await new PurgeCSS().purge({
      content: [{ raw: content.join('\n'), extension: 'js' }],
      css,
      safelist,
      rejected: true
    });
    
    // Count responsive classes
    let responsiveClassCount = 0;
    for (const className of definedClasses) {
      for (const pattern of responsivePatterns) {
        if (pattern.test(className)) {
          responsiveClassCount++;
          break;
        }
      }
    }
    
    // Extract classes used in JSX/TSX files
    const classNameRegex = /className\s*=\s*["']([^"']+)["']/g;
    const referencedClasses = new Map(); // Map class to files where it's used
    
    for (const [file, content] of contentMap.entries()) {
      while ((match = classNameRegex.exec(content)) !== null) {
        const classNames = match[1].split(/\s+/);
        
        for (let className of classNames) {
          // Skip dynamic expressions like {condition ? 'class1' : 'class2'}
          if (className.includes('{') || className.includes('}')) continue;
          
          // Skip empty classes
          if (!className.trim()) continue;
          
          if (!referencedClasses.has(className)) {
            referencedClasses.set(className, new Set());
          }
          referencedClasses.get(className).add(file);
        }
      }
    }
    
    // Find missing classes (referenced but not defined)
    const missingClasses = new Map();
    let tailwindClassCount = 0;
    
    for (const [className, files] of referencedClasses.entries()) {
      // Skip classes in standard safelist
      if (safelist.standard.includes(className)) continue;
      
      // Skip classes matching deep safelist patterns
      let inSafelist = false;
      for (const pattern of safelist.deep) {
        if (pattern.test('.' + className)) {
          inSafelist = true;
          break;
        }
      }
      if (inSafelist) continue;
      
      // Check if it's a Tailwind class
      let isTailwindClass = false;
      for (const pattern of tailwindPatterns) {
        if (pattern.test(className)) {
          isTailwindClass = true;
          tailwindClassCount++;
          break;
        }
      }
      if (isTailwindClass) continue;
      
      // If not in CSS files and not a Tailwind class, it's truly missing
      if (!definedClasses.has(className)) {
        missingClasses.set(className, files);
      }
    }
    
    // Process unused CSS results
    let unusedSelectorsCount = 0;
    let report = 'CSS ANALYSIS REPORT\n';
    report += '=================\n\n';
    report += `Date: ${new Date().toLocaleString()}\n\n`;
    report += '✅ This report now properly handles classes in media queries.\n';
    report += `📱 Found ${mediaQueryClasses.size} classes in media queries (these are protected from false positives).\n\n`;
    
    for (const file of result) {
      report += `File: ${file.file}\n`;
      report += '-'.repeat(file.file.length + 6) + '\n';
      
      if (file.rejected && file.rejected.length > 0) {
        report += `Unused selectors (${file.rejected.length}):\n\n`;
        unusedSelectorsCount += file.rejected.length;
        
        for (const selector of file.rejected) {
          // Check if this selector might be a responsive style
          let isLikelyResponsive = false;
          for (const pattern of responsivePatterns) {
            if (pattern.test(selector)) {
              isLikelyResponsive = true;
              break;
            }
          }
          
          if (isLikelyResponsive) {
            report += ` - ${selector} ⚠️ (Might be a responsive style)\n`;
          } else {
            report += ` - ${selector}\n`;
          }
        }
      } else {
        report += 'No unused selectors found.\n';
      }
      
      report += '\n\n';
    }
    
    // Generate missing CSS report
    let missingReport = 'MISSING CSS CLASSES REPORT\n';
    missingReport += '=========================\n\n';
    missingReport += `Date: ${new Date().toLocaleString()}\n\n`;
    missingReport += `Total Missing Classes: ${missingClasses.size}\n`;
    missingReport += `Tailwind Classes Found: ~${tailwindClassCount}\n`;
    missingReport += `Media Query Classes (Protected): ${mediaQueryClasses.size}\n`;
    missingReport += `Responsive Named Classes: ${responsiveClassCount}\n\n`;
    
    if (missingClasses.size > 0) {
      for (const [className, files] of missingClasses.entries()) {
        missingReport += `Missing Class: "${className}"\n`;
        missingReport += '-'.repeat(className.length + 16) + '\n';
        missingReport += 'Referenced in:\n';
        
        for (const file of files) {
          missingReport += ` - ${file}\n`;
        }
        
        missingReport += '\n';
      }
    } else {
      missingReport += 'No missing CSS classes found! All referenced classes are defined.\n';
    }
    
    // Write reports
    fs.writeFileSync(REPORT_FILE, report);
    fs.writeFileSync(MISSING_CSS_REPORT, missingReport);
    
    // Create summary
    const summary = `
CSS Analysis Summary
-------------------
Date: ${new Date().toLocaleString()}
CSS Files Analyzed: ${cssFiles.length}
Content Files Analyzed: ${contentFiles.length}
Total CSS Classes Found: ${definedClasses.size}
Media Query Classes (Protected): ${mediaQueryClasses.size}
Unused Selectors Found: ${unusedSelectorsCount}
Missing CSS Classes Found: ${missingClasses.size}
Tailwind Classes Found: ~${tailwindClassCount}

Reports:
- Unused CSS: ${REPORT_FILE}
- Missing CSS: ${MISSING_CSS_REPORT}
    `.trim();
    
    fs.writeFileSync(SUMMARY_FILE, summary);
    
    console.log('\n' + summary);
    console.log('\nAnalysis complete! Check the reports for details.');
    
  } catch (error) {
    console.error('Error running CSS analysis:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Run the analysis
runAnalysis(); 