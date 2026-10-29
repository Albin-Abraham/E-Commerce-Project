import type { RawFormField, RawFormSection } from "../fields";
import type { FormDefinition } from "../types";

/**
 * FormBuilder implements the Builder Pattern (GoF Creational).
 * Provides a fluent API to construct complex FormDefinition schemas,
 * reducing boilerplate and improving type safety.
 */
export class FormBuilder<
  TFormData extends Record<string, any> = Record<string, any>,
> {
  private definition: Partial<FormDefinition<TFormData>> = {
    settings: {},
    sections: [],
    fields: [],
    events: {},
    style: {},
    injections: { validations: {}, ui: {}, conditions: {} },
  };

  constructor(id: string, title: string) {
    this.definition.id = id;
    this.definition.title = title;
  }

  public setDescription(description: string): this {
    this.definition.description = description;
    return this;
  }

  public setSubmitLabel(label: string): this {
    this.definition.submitLabel = label;
    return this;
  }

  public addSection(section: RawFormSection<TFormData>): this {
    if (!this.definition.sections) this.definition.sections = [];
    this.definition.sections.push(section);
    return this;
  }

  public addField(field: RawFormField<any, any, TFormData>): this {
    if (!this.definition.fields) this.definition.fields = [];
    this.definition.fields.push(field);
    return this;
  }

  public enableWizardMode(
    options?: NonNullable<
      FormDefinition<TFormData>["settings"]
    >["wizard"]
  ): this {
    if (!this.definition.settings) this.definition.settings = {};
    this.definition.settings.wizard = {
      enabled: true,
      ...options,
    };
    return this;
  }

  public setLayoutMode(
    mode: NonNullable<FormDefinition<TFormData>["settings"]>["layoutMode"]
  ): this {
    if (!this.definition.settings) this.definition.settings = {};
    this.definition.settings.layoutMode = mode;
    return this;
  }

  public onInit(handler: (formData: TFormData) => void): this {
    if (!this.definition.events) this.definition.events = {};
    this.definition.events.onInit = handler;
    return this;
  }

  public onSubmit(
    handler: (formData: TFormData) => Promise<void> | void
  ): this {
    if (!this.definition.events) this.definition.events = {};
    this.definition.events.onSubmit = handler;
    return this;
  }

  public injectValidation(fieldId: string, validationRules: any): this {
    if (!this.definition.injections)
      this.definition.injections = { validations: {} };
    if (!this.definition.injections.validations)
      this.definition.injections.validations = {};
    this.definition.injections.validations[
      fieldId as keyof typeof this.definition.injections.validations
    ] = validationRules;
    return this;
  }

  /**
   * Finalizes the builder and returns the completed FormDefinition.
   */
  public build(): FormDefinition<TFormData> {
    if (!this.definition.id || !this.definition.title) {
      throw new Error(
        "FormBuilder: 'id' and 'title' are required to build a FormDefinition."
      );
    }
    return this.definition as FormDefinition<TFormData>;
  }
}
