import type { CodegenConfig } from '@graphql-codegen/cli';

// Generates TypeScript types for every GraphQL operation in src/ from the
// schema the Rails app writes (bin/rails graphql:dump_schema).
const config: CodegenConfig = {
  schema: '../backend/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        enumsAsTypes: true,
        useTypeImports: true,
        scalars: {
          ISO8601Date: 'string',
          ISO8601DateTime: 'string',
        },
      },
    },
  },
};

export default config;
