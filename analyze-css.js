const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Output file paths (consistent names as requested)
const REPORT_FILE = path.join(process.cwd(), 'css-unused-report.txt');
const SUMMARY_FILE = path.join(process.cwd(), 'css-analysis-summary.txt');

console.log('Starting CSS analysis...');
console.log(`Working directory: ${process.cwd()}`);

try {
  // Run the PurgeCSS analysis
  console.log('Running PurgeCSS analysis...');
  execSync('npm run analyze-css', { stdio: 'inherit' });
  
  console.log('Generating detailed report...');
  execSync('npm run analyze-css-report', { stdio: 'inherit' });
  
  // Read the output from PurgeCSS
  const reportExists = fs.existsSync(REPORT_FILE);
  
  if (reportExists) {
    console.log(`Reading report from: ${REPORT_FILE}`);
    const reportContent = fs.readFileSync(REPORT_FILE, 'utf8');
    
    // Extract some basic stats
    const unusedSelectors = (reportContent.match(/Unused selector/g) || []).length;
    const analyzedFiles = (reportContent.match(/Analyzing/g) || []).length;
    
    // Create a summary
    const summary = `
CSS Analysis Summary
-------------------
Date: ${new Date().toLocaleString()}
CSS Files Analyzed: ${analyzedFiles}
Unused Selectors Found: ${unusedSelectors}

For detailed results, see: ${path.basename(REPORT_FILE)}
    `.trim();
    
    // Write the summary to a file (always overwriting previous)
    fs.writeFileSync(SUMMARY_FILE, summary);
    
    console.log('\n' + summary);
    console.log('\nAnalysis complete! Check the reports for details.');
  } else {
    console.log(`Analysis completed but no report file found at: ${REPORT_FILE}`);
  }
} catch (error) {
  console.error('Error running CSS analysis:', error.message);
  if (error.stdout) console.error('Process output:', error.stdout.toString());
  if (error.stderr) console.error('Process errors:', error.stderr.toString());
  process.exit(1);
} 