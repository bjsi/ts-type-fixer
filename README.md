# TypeScript Type Fixer

This an LLM agent whose goal is to help you fix typescript type errors. Warning: it's a work in progress.

## Features

- Uses user defined tools to fix type errors in your local codebase.
- Integrates with the `ts-morph` TypeScript compiler API to provide type information to the LLM agent.

![meme](https://raw.githubusercontent.com/bjsi/ts-type-fixer/main/img/meme.png)

## Goals

### Automate the boring stuff

- It's boring to fix type errors, so let's automate it!
- If the agent can fix the type error, it will commit the fix directly to your codebase.
- If the agent can't fix the type error, it should at least provide a good starting point by summarizing what it learned.

### Should work in large codebases

- There's no use in having a tool that can only fix type errors in dummy projects consisting of < 10 files.
- The goal is to make this work in 100,000+ line codebases!

### Try to keep token usage reasonable

- Don't go bankrupt dumping entire files into the prompt!
- Instead give the agent tools to read specific parts of the codebase relevant to fixing the type error.

## Notes

- I initialize the `ts-morph` project on the server which runs independently of the LLM interactions. This is because the `ts-morph` project can take a while to initialize for large projects. This setup makes testing and development much faster.
- I only search files for semantic errors (aka type errors). Syntactic errors are not included.
