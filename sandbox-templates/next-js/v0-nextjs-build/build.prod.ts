import { Template, defaultBuildLogger } from 'e2b'
import { template } from './template'

async function main() {
  await Template.build(template, 'v0-nextjs-build', {
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);