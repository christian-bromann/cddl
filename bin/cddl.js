#!/usr/bin/env node

import run from '../build/cli/index.js'

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'test'
}

run()