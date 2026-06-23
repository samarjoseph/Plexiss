const BASE_URL = "http://localhost:5000";

export const PlexisAPI = {
  async uploadCSV(file, optionalQuery = "") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", optionalQuery);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    return await response.json();
  },

  async askQuestion(message, datasetContextId = "") {
    const response = await fetch(`${BASE_URL}/api/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        dataset_id: datasetContextId
      }),
    });

    if (!response.ok) {
      throw new Error(`Query failed with status: ${response.status}`);
    }
    return await response.json();
  }
};