#!/usr/bin/env node

'use strict';

module.exports = main;

const minimist = require('minimist');

const { load } = require('./config');

async function main(argv) {
  argv[0] = argv[0] || 'help';

  try {
    let cmd 
    try { cmd = require(`./commands/${argv[0]}`); }
    catch (e) {
      // this command isn't feeling well
      return console.error(`An error ocurred when trying to "${argv[0]}". \n` + 
                           `If you're from a future where "${argv[0]}" is a working command, ` + 
                           `please share your knowledge at https://github.com/entropic-dev/entropic`)
    }

    const config = await load();
    const args = minimist(argv.slice(1));
    const { _, ...rest } = args;
    const env = {};
    for (var key in process.env) {
      if (key.startsWith('ent_')) {
        env[key.slice(4)] = process.env[key];
      }
    }

    const registry = (
      args.registry   ||
      config.registry ||
      env.registry    ||
      'https://registry.entropic.dev'
    );

    const registryConfig = (config.registries || {})[registry] || {};

    // env is overridden by config, which is overridden by registry-specific
    // config, ...
    await cmd({ ...env, ...config, ...registryConfig, ...args, argv: _ });

    return 0;
  } catch (err) {
    console.log(err.stack);
    return 1;
  }
}

if (require.main === module) {
  main(process.argv.slice(2))
    .then(code => {
      if (Number(code)) {
        process.exit(code);
      }
    })
    .catch(err => {
      console.error(err.stack);
      process.exit(1);
    });
}
