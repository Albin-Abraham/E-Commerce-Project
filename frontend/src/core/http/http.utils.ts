/**
 * HTTP Utilities
 */

export const ContentTypeUtils = {
  isJSON: (type: string) => type?.includes("application/json") ?? false,
  detect: (data: any) => {
    if (data instanceof FormData) return "multipart/form-data";
    return "application/json";
  },
};

export class FormDataBuilder {
  static build(data: any): FormData {
    const formData = new FormData();
    if (!data) return formData;

    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === "object" && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    return formData;
  }
}

export class FileUploadHelper {
  static isFile(data: any): boolean {
    return data instanceof File || data instanceof Blob;
  }

  static createUploadConfig(url: string, fileConfig: any): any {
    return {
      url,
      ...fileConfig,
    };
  }

  static createFormData(config: any): FormData {
    return FormDataBuilder.build(config.fields || {});
  }

  static createMultiFileFormData(config: any): FormData {
    return FormDataBuilder.build(config.fields || {});
  }
}
