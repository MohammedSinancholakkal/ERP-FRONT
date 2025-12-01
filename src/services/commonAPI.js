import axios from "axios";

export const commonAPI = async (method, url, body = {}, isFormData = false) => {
  try {
    let headers = {};

    // Auto-detect FormData OR when isFormData = true
    if (body instanceof FormData || isFormData) {
      headers["Content-Type"] = "multipart/form-data";
    } else {
      headers["Content-Type"] = "application/json";
    }

    const response = await axios({
      method,
      url,
      data: body,
      headers,
    });

    return response;
  } catch (error) {
    console.error("API ERROR:", error);
    return error.response || { status: 500, data: { message: "Server Error" } };
  }
};
