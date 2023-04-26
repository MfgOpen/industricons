import { getDirname } from "cross-dirname";
import { join } from "https://deno.land/std@0.184.0/path/mod.ts";

/**
 * Returns the value of the root directory path for the project.
 * @returns The value of the project root directory path.
 */
export function getProjectRootPath(): string {
  return join(getDirname(), "..");
}

/**
 * Returns the value of the 'src' directory path.
 * @returns The value of the directory path to the 'src' directory.
 */
export function getSrcRootPath(): string {
  return join(getProjectRootPath(), "src");
}

/**
 * Returns the value of the 'dist' directory path.
 * @returns The value of the directory path to the 'dist' directory.
 */
export function getDistRootPath(): string {
  return join(getProjectRootPath(), "dist");
}
