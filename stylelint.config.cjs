module.exports = {
  extends: ["stylelint-config-recommended-scss", "stylelint-config-recess-order"],
  rules: {
    "no-empty-source": null,
    "no-invalid-position-declaration": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global"],
      },
    ],
  },
};
