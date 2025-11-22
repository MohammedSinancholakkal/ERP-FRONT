// import axios from "axios";

// export const commonAPI = async (httpRequest, url, reqBody, reqHeader) => {
//   const reqConfig = {
//     method: httpRequest,
//     url,
//     data: reqBody,
//     headers: reqHeader
//       ? reqHeader
//       : {
//           "Content-Type": "application/json",
//         },
//   };

//   return await axios(reqConfig)
//     .then((res) => res)
//     .catch((err) => err);
// };



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
