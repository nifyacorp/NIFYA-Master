/**
 * Mock Data Cleanup Utility
 * 
 * This script scans the codebase for mock data references and generates
 * a report of files that need to be fixed to remove mock data in production.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../../core/logger');

// Define directories to scan
const DIRS_TO_SCAN = [
  path.join(__dirname, '..', '..', '..', 'backend'),
  path.join(__dirname, '..', '..', '..', 'subscription-worker'),
  path.join(__dirname, '..', '..', '..', 'notification-worker')
];

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'outputs', 'reports');

// Mock data detection patterns
const MOCK_DATA_PATTERNS = [
  /mock/i,
  /dummy/i,
  /sample/i,
  /test[ _-]data/i,
  /fake/i,
  /"id":\s*"mock-[\w-]+"/,
  /\bmock[\w]*\b/i
];

async function scanForMockData() {
  logger.info('Starting mock data detection scan');
  
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    const results = {
      files: [],
      totalFindings: 0
    };
    
    // Scan each directory
    for (const dir of DIRS_TO_SCAN) {
      try {
        await scanDirectory(dir, results);
      } catch (error) {
        logger.error(`Error scanning directory ${dir}:`, error);
      }
    }
    
    // Generate report
    const report = generateReport(results);
    const reportPath = path.join(OUTPUT_DIR, 'mock-data-cleanup-report.md');
    await fs.writeFile(reportPath, report);
    
    logger.info(`Found ${results.totalFindings} potential mock data instances in ${results.files.length} files`);
    logger.info(`Report saved to ${reportPath}`);
    
    return {
      success: true,
      totalFindings: results.totalFindings,
      totalFiles: results.files.length,
      reportPath
    };
  } catch (error) {
    logger.error('Error scanning for mock data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function scanDirectory(dir, results, depth = 0) {
  // Don't scan deeper than 10 levels to prevent infinite recursion
  if (depth > 10) return;
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules, .git, and dist directories
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          await scanDirectory(fullPath, results, depth + 1);
        }
        continue;
      }
      
      // Only scan JavaScript, TypeScript, and JSON files
      if (!['.js', '.ts', '.jsx', '.tsx', '.json'].includes(path.extname(entry.name))) {
        continue;
      }
      
      // Scan file content
      const findings = await scanFile(fullPath);
      
      if (findings.length > 0) {
        results.files.push({
          path: fullPath,
          findings,
          relativePath: path.relative(path.join(__dirname, '..', '..', '..'), fullPath)
        });
        
        results.totalFindings += findings.length;
      }
    }
  } catch (error) {
    logger.error(`Error reading directory ${dir}:`, error);
  }
}

async function scanFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const findings = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of MOCK_DATA_PATTERNS) {
        if (pattern.test(line)) {
          // Get some context (up to 3 lines before and after)
          const startLine = Math.max(0, i - 3);
          const endLine = Math.min(lines.length - 1, i + 3);
          const context = lines.slice(startLine, endLine + 1).join('\n');
          
          findings.push({
            lineNumber: i + 1,
            line: line.trim(),
            pattern: pattern.toString(),
            context,
            contextRange: `${startLine + 1}-${endLine + 1}`
          });
          
          // Only record one finding per line
          break;
        }
      }
    }
    
    return findings;
  } catch (error) {
    logger.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  let report = `# Mock Data Cleanup Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Files with Mock Data:** ${results.files.length}\n`;
  report += `- **Total Mock Data Instances:** ${results.totalFindings}\n\n`;
  
  report += `## Critical Issue\n\n`;
  report += `Mock data has been detected in production code. This is causing issues with API endpoints returning fake data instead of actual database results.\n\n`;
  report += `All mock data should be removed from production code and replaced with proper database interactions.\n\n`;
  
  if (results.files.length > 0) {
    report += `## Files to Fix\n\n`;
    
    // Group by directories for better organization
    const filesByDir = {};
    
    for (const file of results.files) {
      const dirName = path.dirname(file.relativePath);
      if (!filesByDir[dirName]) {
        filesByDir[dirName] = [];
      }
      filesByDir[dirName].push(file);
    }
    
    for (const [dir, files] of Object.entries(filesByDir)) {
      report += `### ${dir}\n\n`;
      
      for (const file of files) {
        report += `#### ${path.basename(file.path)}\n\n`;
        report += `Path: \`${file.relativePath}\`\n\n`;
        report += `Found ${file.findings.length} instances of mock data:\n\n`;
        
        for (const [index, finding] of file.findings.entries()) {
          report += `##### Instance ${index + 1} (Line ${finding.lineNumber})\n\n`;
          report += `\`\`\`\n${finding.context}\n\`\`\`\n\n`;
        }
      }
    }
    
    report += `## Recommendations\n\n`;
    report += `1. **Remove Mock Data Generators:** Replace all mock data with real database queries\n`;
    report += `2. **Add Environment Checks:** Ensure test data is only used in development/test environments\n`;
    report += `3. **Fix API Implementations:** Update all endpoints to return actual data from the database\n`;
    report += `4. **Add Validation:** Implement input/output validation to catch invalid data\n\n`;
    
    report += `## Implementation Guide\n\n`;
    report += `For each file listed above:\n\n`;
    report += `1. Identify if the mock data is used in production code paths\n`;
    report += `2. Replace mock data generators with database queries\n`;
    report += `3. If mock data is needed for tests, move it to dedicated test files\n`;
    report += `4. Add environment checks to prevent test data from being used in production\n\n`;
    
    report += `### Example Fix\n\n`;
    report += `Before:\n\`\`\`javascript\nfunction getSubscriptions(userId) {\n  // Mock data for testing\n  return [\n    { id: "mock-sub-1", name: "Test Subscription" },\n    { id: "mock-sub-2", name: "Another Subscription" }\n  ];\n}\n\`\`\`\n\n`;
    report += `After:\n\`\`\`javascript\nasync function getSubscriptions(userId) {\n  const result = await db.query(\n    'SELECT * FROM subscriptions WHERE user_id = $1',\n    [userId]\n  );\n  return result.rows;\n}\n\`\`\`\n\n`;
    
    report += `## Testing\n\n`;
    report += `After fixing the mock data issues, run the following tests:\n\n`;
    report += `1. Create a new subscription and verify it's stored in the database\n`;
    report += `2. List subscriptions and verify real data is returned\n`;
    report += `3. Process a subscription and verify it works with real data\n`;
  } else {
    report += `No mock data found in the scanned directories. This could mean:\n\n`;
    report += `1. The scan patterns didn't match existing mock data\n`;
    report += `2. Mock data is located in directories not included in the scan\n`;
    report += `3. There is genuinely no mock data in the codebase\n\n`;
    report += `Consider expanding the scan patterns or directories if you believe mock data exists.\n`;
  }
  
  report += `\n---\nReport generated on ${timestamp}`;
  
  return report;
}

// Run the scan if this script is executed directly
if (require.main === module) {
  scanForMockData()
    .then(result => {
      if (result.success) {
        logger.info(`Scan completed successfully. Found ${result.totalFindings} potential mock data instances in ${result.totalFiles} files.`);
        logger.info(`Report saved to ${result.reportPath}`);
        process.exit(0);
      } else {
        logger.error(`Scan failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = scanForMockData;