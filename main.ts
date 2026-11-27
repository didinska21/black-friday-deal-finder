import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Resolve inputs beside this entrypoint so packaging also works from another cwd.
const outputDirectory = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

await mkdir(outputDirectory, { recursive: true });
for (const folder of ['app', 'screenshots']) {
  const inputDirectory = new URL(`./${folder}/`, import.meta.url);
  const copyDirectory = join(outputDirectory, folder);
  await mkdir(copyDirectory, { recursive: true });
  if (existsSync(inputDirectory)) await cp(inputDirectory, copyDirectory, { recursive: true });
}

try {
  const dossierBytes = buildDossier(outputDirectory, dossierLimits);
  await writeFile(join(outputDirectory, 'dossier.json'), dossierBytes);
  console.log(`Packaged Midnight Ledger in ${outputDirectory} (${dossierBytes.length} dossier bytes).`);
} catch (error) {
  console.error(`App and screenshot folders copied to ${outputDirectory}.`);
  console.error(`Dossier could not be written: ${(error as Error).message}`);
  process.exitCode = 1;
}
