function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader is not available in this environment."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (event) => reject(event.target?.error);
    reader.readAsDataURL(file);
  });
}

function createCoreIntegrations() {
  return {
    async UploadFile({ file }) {
      if (!file) {
        throw new Error("UploadFile requires a `file` property.");
      }

      if (typeof file === "string") {
        return { file_url: file };
      }

      const fileUrl = await readFileAsDataUrl(file);
      return { file_url: fileUrl };
    },
    async SendEmail() {
      return { status: "queued" };
    },
    async InvokeLLM() {
      return { output: "This feature is not yet implemented." };
    },
    async GenerateImage() {
      return { image_url: "" };
    },
    async ExtractDataFromUploadedFile() {
      return { data: {} };
    },
    async CreateFileSignedUrl() {
      return { url: "" };
    },
    async UploadPrivateFile({ file }) {
      if (!file) {
        throw new Error("UploadPrivateFile requires a `file` property.");
      }
      if (typeof file === "string") {
        return { file_url: file };
      }
      const fileUrl = await readFileAsDataUrl(file);
      return { file_url: fileUrl };
    },
  };
}

export { createCoreIntegrations };
