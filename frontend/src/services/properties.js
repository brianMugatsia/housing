import api from "./api";

export const listProperties = (params = {}) =>
  api.get("/properties/", { params }).then((r) => r.data);

export const getProperty = (id) =>
  api.get(`/properties/${id}/`).then((r) => r.data);

export const createProperty = (data) =>
  api.post("/properties/", data).then((r) => r.data);

export const updateProperty = (id, data) =>
  api.patch(`/properties/${id}/`, data).then((r) => r.data);

export const submitProperty = (id) =>
  api.post(`/properties/${id}/submit/`).then((r) => r.data);

export const uploadPropertyImages = (id, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return api
    .post(`/properties/${id}/images/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deletePropertyImage = (propertyId, imageId) =>
  api.delete(`/properties/${propertyId}/images/${imageId}/`);

export const listAmenities = () =>
  api.get("/amenities/").then((r) => r.data.results || r.data);

export const listMyProperties = () =>
  api.get("/properties/", { params: { mine: "true" } }).then((r) => r.data);
