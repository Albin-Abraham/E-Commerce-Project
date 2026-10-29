import { program } from "commander";
import inquirer from "inquirer";
import nodePlop from "node-plop";
import path from "path";

import { captureGitState, performRollback } from "./utils/gitRollback.js";

// Load Plop registry
const plop = await nodePlop(path.resolve(process.cwd(), "plopfile.cjs"));

program
  .name("scaffold")
  .description("Enterprise Scaffolding CLI Engine")
  .argument(
    "[type]",
    "Type of generator (e.g., zenos-module, feature, zenos-repository)"
  )
  .argument("[name]", "Name of the module or entity")
  .option("-m, --includeMutations", "Scaffold write mutations")
  .option("-u, --includeUrlParams", "Scaffold typed URL parameters")
  .action(async (type, name, options) => {
    const initialState = captureGitState();

    // 1. Handle SIGINT (Ctrl+C)
    process.on("SIGINT", () => {
      console.log("\n🛑 Process interrupted by user.");
      performRollback(initialState);
      process.exit(1);
    });

    try {
      // 2. Interactive Fallback (if type or name is missing)
      let resolvedType = type;
      let resolvedName = name;
      const resolvedOptions = { ...options };

      if (!resolvedType) {
        const generators = plop.getGeneratorList().map((g) => g.name);
        const ans = await inquirer.prompt([
          {
            type: "list",
            name: "type",
            message: "What would you like to generate?",
            choices: generators,
          },
        ]);
        resolvedType = ans.type;
      }

      const generator = plop.getGenerator(resolvedType);

      // If name wasn't provided, run standard plop prompts, otherwise we skip them by providing answers
      let finalData = {};
      if (!resolvedName) {
        console.log(
          "💡 Missing arguments detected. Falling back to interactive prompts...\n"
        );
        finalData = await generator.runPrompts();
      } else {
        // Automatically inject the parsed CLI arguments to bypass prompts
        finalData = {
          name: resolvedName,
          includeMutations: resolvedOptions.includeMutations || false,
          includeUrlParams: resolvedOptions.includeUrlParams || false,
        };
      }

      // 3. Run Plop Actions
      console.log(`\n🚀 Scaffolding ${resolvedType}...`);
      const results = await generator.runActions(finalData);

      if (results.failures && results.failures.length > 0) {
        throw new Error(
          `Action failed: ${results.failures[0].error || results.failures[0].message}`
        );
      }

      console.log("\n✅ Scaffolding successful!");
      results.changes.forEach((change) => {
        console.log(`   + ${change.path}`);
      });
    } catch (error) {
      console.error(`\n❌ Fatal Error: ${error.message}`);
      performRollback(initialState);
      process.exit(1);
    }
  });

program.parse(process.argv);
