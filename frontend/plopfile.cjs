const { createGenerator } = require("./scripts/factories/generatorFactory.cjs");

module.exports = function (plop) {
  // Register all generators through the central Factory
  plop.setGenerator("feature", createGenerator("feature"));
  plop.setGenerator("zenos-module", createGenerator("zenos-module"));
  plop.setGenerator("zenos-repository", createGenerator("zenos-repository"));
  plop.setGenerator("zenos-facade", createGenerator("zenos-facade"));
  plop.setGenerator("zenos-presenter", createGenerator("zenos-presenter"));
  plop.setGenerator("zenos-form", createGenerator("zenos-form"));
  plop.setGenerator("form", createGenerator("zenos-form"));
};
