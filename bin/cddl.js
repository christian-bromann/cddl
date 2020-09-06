#!/usr/bin/env node

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'test'
}

require('../build/cli').default()