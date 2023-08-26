# Typescript Type Fixer

This an LLM agent whose goal is to help you fix typescript type errors. Warning: it's a work in progress.

## Features

- Uses user defined tools to fix type errors in your local codebase.
- Integrates with the `ts-morph` TypeScript compiler API to provide type information to the LLM agent.
- It tries to be smart about minimizing token usage.
- Should work even with large established codebases.
