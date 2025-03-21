/**
 * NIFYA Subscription Validation Fix
 * 
 * This script identifies and fixes the validation issues when creating a subscription,
 * particularly with the BOE General template.
 */

const fs = require('fs');
const path = require('path');

// Paths to the files we need to modify
const frontendDir = path.join(__dirname, 'frontend', 'src');
const subscriptionPromptPath = path.join(frontendDir, 'pages', 'SubscriptionPrompt.tsx');
const schemasPath = path.join(frontendDir, 'lib', 'api', 'schemas.ts');

// Read the current files
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
};

// Write the updated content
const writeFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    return false;
  }
};

// Fix the schema validation
const fixSchemaValidation = () => {
  console.log(`Fixing validation schema in ${schemasPath}...`);
  
  const content = readFile(schemasPath);
  if (!content) return false;
  
  // Update the schema to make typeId optional and fix any type issues
  const updated = content.replace(
    /export const CreateSubscriptionSchema = z\.object\(\{([^}]+)\}\);/s,
    (match, p1) => {
      // Replace the prompts validation to ensure it works with arrays and stringified arrays
      const updatedProps = p1.replace(
        /prompts: z\.array\(z\.string\(\)\)\.min\(1,([^)]+)\)\.max\(3,([^)]+)\)/,
        `prompts: z.union([
    z.array(z.string()).min(1, $1).max(3, $2),
    z.string().refine((val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 3;
      } catch {
        return false;
      }
    }, { message: 'Invalid prompts format: must be an array of 1-3 strings or a JSON string of the same' })
  ])`
      );
      
      return `export const CreateSubscriptionSchema = z.object({${updatedProps}});`;
    }
  );
  
  return writeFile(schemasPath, updated);
};

// Fix the subscription prompt component
const fixSubscriptionPrompt = () => {
  console.log(`Fixing subscription prompt component in ${subscriptionPromptPath}...`);
  
  const content = readFile(subscriptionPromptPath);
  if (!content) return false;
  
  // 1. Update the handleSubmit function to properly format prompts
  const withFixedSubmit = content.replace(
    /const handleSubmit = async \(e: React\.FormEvent\) => \{([^}]+)console\.log\('Creating subscription with prompts:', validPrompts\);([^}]+)const createResponse = await subscriptions\.create\(\{([^}]+)prompts: validPrompts,([^}]+)\}\);/s,
    (match, preLog, postLog, prePrompts, postPrompts) => {
      return `const handleSubmit = async (e: React.FormEvent) => {${preLog}console.log('Creating subscription with prompts:', validPrompts);
      
      // Ensure prompts are in the correct format
      const formattedPrompts = Array.isArray(validPrompts) ? validPrompts : [validPrompts];
      console.log('Formatted prompts:', formattedPrompts);${postLog}const createResponse = await subscriptions.create({${prePrompts}prompts: formattedPrompts,${postPrompts}});`;
    }
  );
  
  // 2. Add better error handling around the submission process
  const withImprovedErrorHandling = withFixedSubmit.replace(
    /console\.log\('Subscription creation response:', createResponse\);([^}]+)if \(createResponse\.error\) throw new Error\(createResponse\.error\);/s,
    (match, gap) => {
      return `console.log('Subscription creation response:', createResponse);${gap}
      // Additional error logging for better debugging
      if (createResponse.error) {
        console.error('Error details:', createResponse);
        if (createResponse.data?.validationErrors) {
          console.error('Validation errors:', createResponse.data.validationErrors);
        }
        throw new Error(createResponse.error);
      }`;
    }
  );
  
  // 3. Add a button ID for reliable testing
  const withTestId = withImprovedErrorHandling.replace(
    /<Button type="submit"([^>]+)>{submitting \? "Procesando\.\.\." : mode === 'edit' \? "Actualizar Suscripción" : "Crear Suscripción"}<\/Button>/,
    '<Button type="submit" id="create-subscription-button"$1>{submitting ? "Procesando..." : mode === \'edit\' ? "Actualizar Suscripción" : "Crear Suscripción"}</Button>'
  );
  
  return writeFile(subscriptionPromptPath, withTestId);
};

// Run the fixes
console.log('Starting subscription validation fixes...');

let success = true;
if (!fixSchemaValidation()) success = false;
if (!fixSubscriptionPrompt()) success = false;

if (success) {
  console.log('\n✅ All fixes applied successfully!');
  console.log('The subscription form validation should now work correctly.');
} else {
  console.log('\n⚠️ Some fixes could not be applied. Please check the errors above.');
}

// Instructions for manual verification
console.log(`
To verify the fix:
1. Build and deploy the frontend code
2. Log in to the application
3. Try to create a new BOE General subscription
4. Check that the form submits without validation errors
`); 