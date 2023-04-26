import { getDirContentsInfo } from "./getDirContentsInfo.ts";
import { basename, join } from "https://deno.land/std@0.184.0/path/mod.ts";
import chalk from "chalk";
import SVGSpriter from "npm:svg-sprite@2.0.2";
import { Config as SvgoConfig, optimize } from "svgo";
import {
  FontAssetType,
  generateFonts,
  OtherAssetType,
} from "npm:fantasticon@2.0.0";
import { getProjectMetadata } from "./getProjectMetadata.ts";
import { getDistRootPath, getSrcRootPath } from "./paths.ts";

type GlyphCodepoint = number;

const encoder = new TextEncoder();
const absDistLibPath = join(getDistRootPath(), "/lib");
const absIconsSrcDirPath = join(
  getSrcRootPath(),
  "/lib",
);
const absTemplatesDirPath = join(
  getSrcRootPath(),
  "/templates",
);
const glyphCodepointMappingFilePath = join(getSrcRootPath(), "mapping.json");

let currentGlyphCodepoint: GlyphCodepoint = 60000;
// eslint-disable-next-line prefer-const
const glyphCodepointsMapping: { [glyphName: string]: GlyphCodepoint } = {};

const iconsSrcDirContentsInfo = getDirContentsInfo(absIconsSrcDirPath);

iconsSrcDirContentsInfo.baseFileNames.forEach((iconBaseFilename) => {
  glyphCodepointsMapping[iconBaseFilename] = currentGlyphCodepoint;
  currentGlyphCodepoint += 1;
});

Deno.removeSync(getDistRootPath(), { recursive: true });

Deno.mkdirSync(getDistRootPath(), { recursive: true });

Deno.removeSync(glyphCodepointMappingFilePath);

Deno.writeFileSync(
  glyphCodepointMappingFilePath,
  encoder.encode(JSON.stringify(glyphCodepointsMapping, null, 2)),
);

const svgoConfig: SvgoConfig = {
  plugins: [
    {
      name: "removeAttrs",
      params: {
        attrs: "fill",
      },
    },
    {
      name: "addAttributesToSVGElement",
      params: {
        attributes: [
          {
            fill: "currentColor",
          },
        ],
      },
    },
  ],
};

Deno.mkdirSync(absDistLibPath, { recursive: true });

iconsSrcDirContentsInfo.filePaths.forEach((iconFilePath) => {
  const optimizedSvgIconFilePath = join(
    absDistLibPath,
    basename(iconFilePath),
  );
  optimizeSvgFile(iconFilePath, optimizedSvgIconFilePath, svgoConfig);
});

/**
 * Optimize a SVG file with SVGO per the specified configuration.
 * @param srcSvgFilePath The absolute path to the source (un-optimized) SVG file.
 * @param optimizedSvgFilePath The absolute path for the optimized SVG file.
 * @param svgoConfig The configuration for the SVGO optimization process.
 */
function optimizeSvgFile(
  srcSvgFilePath: string,
  optimizedSvgFilePath: string,
  svgoConfig: SvgoConfig,
) {
  try {
    const decoder = new TextDecoder("utf-8");
    const originalSvgByteData = Deno.readFileSync(srcSvgFilePath);
    const originalSvgStringData = decoder.decode(originalSvgByteData);
    const optimizedSvgData = optimize(originalSvgStringData, svgoConfig).data
      .trim();
    Deno.writeFileSync(optimizedSvgFilePath, encoder.encode(optimizedSvgData));
  } catch (err) {
    console.error(chalk.bold.red(`Could not optimize the SVG file: ${err}`));
  }
}

const projectPackageJsonData = getProjectMetadata();

generateFonts({
  name: "industricon",
  fontTypes: [FontAssetType.TTF],
  assetTypes: [OtherAssetType.CSS, OtherAssetType.HTML],
  formatOptions: {
    ttf: {
      version: `${projectPackageJsonData.fontVersion}`,
      description: projectPackageJsonData.fontDescription || "",
    },
  },
  templates: {
    html: join(absTemplatesDirPath, "preview.hbs"),
    css: join(absTemplatesDirPath, "styles.hbs"),
  },
  codepoints: glyphCodepointsMapping,
  normalize: true,
  prefix: "industricon",
  inputDir: absDistLibPath,
  outputDir: getDistRootPath(),
}).catch((err) =>
  console.error(
    chalk.bold.red(
      `Could not generate the font assets and related assets for the SVG files: ${err}`,
    ),
  )
);

const spriter = new SVGSpriter({
  mode: {
    symbol: { dest: getDistRootPath(), sprite: "industricon.svg" },
  },
});

const optimizedIconsDirContentsInfo = getDirContentsInfo(
  absDistLibPath,
);

optimizedIconsDirContentsInfo.filePaths.forEach((iconFilePath) => {
  const decoder = new TextDecoder("utf-8");
  const iconByteData = Deno.readFileSync(iconFilePath);
  const iconStringData = decoder.decode(iconByteData);
  spriter.add(iconFilePath, null, iconStringData);
});

type SpriterCompiledResource = {
  path: string | URL;
  contents: string;
};

type SpriterCompilationResult = {
  symbol: {
    sprite: SpriterCompiledResource;
  };
};

// deno-lint-ignore no-explicit-any
spriter.compile((err: any, result: SpriterCompilationResult) => {
  if (err) {
    console.error(
      chalk.bold.red(
        `SVG sprite compilation process was not successful: ${err}`,
      ),
    );
  }

  try {
    Deno.writeFileSync(
      result.symbol.sprite.path,
      encoder.encode(result.symbol.sprite.contents),
    );
  } catch (err) {
    console.error(
      chalk.bold.red(
        `Could not create the file containing inline sprites: ${err}`,
      ),
    );
  }
});
