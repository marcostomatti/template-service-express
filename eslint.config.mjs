import baseConfig from '@open-tomato/eslint-config';

/**
 * ESLint flat config: the shared open-tomato base, plus what is this
 * service's own.
 *
 * @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ['drizzle/**'] },
  ...baseConfig,
  {
    // The MCP SDK resolves through package `exports` subpaths, which the
    // TS resolver can't follow for files excluded from tsconfig (tests).
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^bun:', '^@modelcontextprotocol/sdk/'] }],
    },
  },
];
