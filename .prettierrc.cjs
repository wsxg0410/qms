module.exports = {
  plugins: [
    require.resolve('prettier-plugin-astro'),
    require.resolve('@ianvs/prettier-plugin-sort-imports'),
  ],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],

  singleQuote: true,
  trailingComma: 'all',
  importOrder: [
    '<BUILTIN_MODULES>',
    '<THIRD_PARTY_MODULES>',
    '',
    '^[@]',
    '^[.]',
  ],
};
