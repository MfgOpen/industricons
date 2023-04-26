import { join } from "https://deno.land/std@0.184.0/path/mod.ts";
import chalk from "chalk";
import { getProjectRootPath } from "./paths.ts";
import { ProjectMetadataSchema } from "./ProjectMetadataSchema.ts";

/**
 * Returns the data of the "meta.json" file for the project.
 */
export function getProjectMetadata(): ProjectMetadataSchema {
  const absProjectMetaJsonPath = join(
    getProjectRootPath(),
    "meta.json",
  );

  try {
    const decoder = new TextDecoder("utf-8");
    const projectMetaJsonData = Deno.readFileSync(
      absProjectMetaJsonPath,
    );
    return JSON.parse(decoder.decode(projectMetaJsonData));
  } catch (err) {
    console.error(
      chalk.bold.red(
        `Could not read the "meta.json" file: ${err}`,
      ),
    );
    Deno.exit(1);
  }
}
