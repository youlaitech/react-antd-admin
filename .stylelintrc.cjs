module.exports = {
  extends: [
    "stylelint-config-recommended",
    "stylelint-config-recommended-scss",
    "stylelint-config-recess-order",
  ],
  overrides: [
    {
      files: ["**/*.{css,scss}"],
      customSyntax: "postcss-scss",
    },
  ],
  rules: {
    "no-empty-source": null,
    "declaration-property-value-no-unknown": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global"],
      },
    ],
    "no-invalid-position-declaration": null,
    "at-rule-no-unknown": null,
    "scss/at-rule-no-unknown": true,
  },
};
