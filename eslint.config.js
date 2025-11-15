// This is a placeholder for your ESLint configuration.
// You can extend it with your own rules.
// For example, using Airbnb's config:
// module.exports = {
//   extends: 'airbnb-base',
//   rules: {
//     // your rules here
//   },
// };

module.exports = {
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ]
}
