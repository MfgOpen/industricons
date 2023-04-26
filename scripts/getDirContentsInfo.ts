import { join, parse } from "https://deno.land/std@0.184.0/path/mod.ts";
import chalk from "chalk";

type DirContentsInfo = {
  // Absolute file paths.
  filePaths: string[];
  // File names including the file extension (if any).
  baseFileNames: string[];
  // File names without the file extension.
  fileNames: string[];
};

/**
 * Returns an object that contains arrays of file path and file name information
 * of the contents of the specified absolute directory path.
 * @param absDirPath The absolute path to the directory.
 * @returns An object that contains arrays of file path and file name
 * information.
 *
 * @remarks The specified directory path should not contain any sub-directories
 * as they will not be handled appropriately by this function.
 *
 * @remarks On macOS systems, this function will exclude ".DS_Store" files
 * found in the specified directory path. On Windows systems, "Thumbs.db" files
 * will be excluded.
 */
export function getDirContentsInfo(absDirPath: string): DirContentsInfo {
  const filePaths: string[] = [];
  const baseFileNames: string[] = [];
  const fileNames: string[] = [];

  for (const dirEntry of Deno.readDirSync(absDirPath)) {
    const fileName = dirEntry.name;
    const baseFileName = parse(fileName).name;

    if ([".DS_Store", "Thumbs.db"].includes(fileName)) {
      continue;
    }

    filePaths.push(join(absDirPath, fileName));
    baseFileNames.push(baseFileName);
    fileNames.push(fileName);
  }

  if (filePaths.length === 0) {
    console.warn(chalk.bold.yellow(`No files were found.`));
  }

  filePaths.sort((a, b) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  baseFileNames.sort((a, b) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  fileNames.sort((a, b) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return { filePaths, baseFileNames, fileNames };
}
