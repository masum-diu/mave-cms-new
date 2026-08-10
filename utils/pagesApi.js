import instance from "../axios";

const isPagesNotFound = (error) => {
  const message = error?.response?.data?.message || "";
  return (
    error?.response?.status === 404 &&
    message.includes("No query results for model [App\\Models\\Pages]")
  );
};

export const fetchPagesList = async (query = "") => {
  try {
    const url = query ? `/pages?${query}` : "/pages";
    const response = await instance.get(url);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (isPagesNotFound(error)) {
      return [];
    }
    throw error;
  }
};

export const fetchPage = async (pageRef) => {
  try {
    const response = await instance.get(`/pages/${pageRef}`);
    return response.data;
  } catch (error) {
    if (isPagesNotFound(error)) {
      return null;
    }
    throw error;
  }
};
