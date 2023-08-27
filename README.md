# Typescript Type Fixer

This an LLM agent whose goal is to help you fix typescript type errors. Warning: it's a work in progress.

## Features

- Uses user defined tools to fix type errors in your local codebase.
- Integrates with the `ts-morph` TypeScript compiler API to provide type information to the LLM agent.

## Goals

### Automate the boring stuff

- It's boring to fix type errors, so let's automate it!
- If the agent can fix the type error, it will commit the fix directly to your codebase.
- If the agent can't fix the type error, it should at least provide a good starting point by summarizing what it learned.

### Should work in large codebases

- There's no use in having a tool that can only fix type errors in dummy projects consisting of < 10 files.
- The goal is to make this work in 100,000+ line codebases!

### Try to keep token usage reasonable

- Don't just dump entire files into the prompt, instead give the agent tools to read specific parts of the codebase relevant to fixing the type error.
