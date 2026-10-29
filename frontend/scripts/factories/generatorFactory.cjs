/**
 * Generator Factory
 * Central registry for all scaffolding blueprints.
 */

const BLUEPRINTS = {
  feature: (data) => [
    { target: "slice.ts", template: "slice.ts.hbs" },
    { target: "listeners.ts", template: "listeners.ts.hbs" },
  ],
  "zenos-module": (data) => {
    const actions = [
      {
        target: "services/{{kebabCase name}}.repository.ts",
        template: "zenos/repository.ts.hbs",
      },
      {
        target: "services/{{kebabCase name}}.builder.ts",
        template: "zenos/builder.ts.hbs",
      },
      {
        target: "services/{{kebabCase name}}.keys.ts",
        template: "zenos/keys.ts.hbs",
      },
      {
        target: "hooks/use{{pascalCase name}}Facade.ts",
        template: "zenos/facade.ts.hbs",
      },
      {
        target: "pages/{{pascalCase name}}DetailPage.tsx",
        template: "zenos/presenter.tsx.hbs",
      },
      { target: "routes.ts", template: "zenos/routes.ts.hbs" },
      { target: "index.ts", template: "zenos/index.ts.hbs" },
    ];

    if (data.includeUrlParams) {
      actions.push({
        target: "context/{{pascalCase name}}ViewContext.tsx",
        template: "zenos/context.tsx.hbs",
      });
    }

    return actions;
  },
  "zenos-repository": (data) => [
    {
      target: "services/{{kebabCase name}}.repository.ts",
      template: "zenos/repository.ts.hbs",
    },
    {
      target: "services/{{kebabCase name}}.builder.ts",
      template: "zenos/builder.ts.hbs",
    },
  ],
  "zenos-facade": (data) => [
    {
      target: "hooks/use{{pascalCase name}}Facade.ts",
      template: "zenos/facade.ts.hbs",
    },
  ],
  "zenos-presenter": (data) => [
    {
      target: "pages/{{pascalCase name}}DetailPage.tsx",
      template: "zenos/presenter.tsx.hbs",
    },
  ],
  "zenos-form": (data) => [
    {
      target: "configs/{{kebabCase name}}-logical.ts",
      template: "zenos/form-logical.ts.hbs",
    },
    {
      target: "configs/{{kebabCase name}}-surface.ts",
      template: "zenos/form-surface.ts.hbs",
    },
    {
      target: "configs/{{kebabCase name}}-schema.ts",
      template: "zenos/form-schema.ts.hbs",
    },
  ],
};

const PROMPTS = {
  feature: [
    {
      type: "input",
      name: "name",
      message: "Feature name (e.g., example):",
    },
  ],
  "zenos-module": [
    {
      type: "input",
      name: "name",
      message: "Module name (e.g., patient, order):",
    },
    {
      type: "confirm",
      name: "includeMutations",
      message: "Would you like to scaffold write mutations?",
      default: false,
    },
    {
      type: "confirm",
      name: "includeUrlParams",
      message: "Would you like to scaffold typed URL parameters?",
      default: false,
    },
  ],
  "zenos-repository": [
    {
      type: "input",
      name: "name",
      message: "Entity name (e.g., patient):",
    },
  ],
  "zenos-facade": [
    {
      type: "input",
      name: "name",
      message: "Entity name (e.g., patient):",
    },
  ],
  "zenos-presenter": [
    {
      type: "input",
      name: "name",
      message: "Entity name (e.g., patient):",
    },
  ],
  "zenos-form": [
    {
      type: "input",
      name: "name",
      message: "Form / Entity name (e.g. user-profile, create-branch):",
    },
  ],
};

function createGenerator(type) {
  return {
    description: `Generates a ${type}`,
    prompts: PROMPTS[type] || [],
    actions: function (data) {
      const blueprintFn = BLUEPRINTS[type];
      if (!blueprintFn) throw new Error(`Unknown generator type: ${type}`);

      const blueprint = blueprintFn(data);
      // In react-vite, the structure is src/features/{{kebabCase name}}/
      const basePath = "src/features/{{kebabCase name}}/";

      return blueprint.map((item) => {
        if (item.isInjection) {
          return {
            type: "modify",
            path: basePath + item.target,
            pattern: item.pattern,
            templateFile: `plop-templates/${item.template}`,
          };
        }

        return {
          type: "add",
          path: basePath + item.target,
          templateFile: `plop-templates/${item.template}`,
        };
      });
    },
  };
}

module.exports = { createGenerator };
