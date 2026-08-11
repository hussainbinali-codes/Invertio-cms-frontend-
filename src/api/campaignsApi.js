import axios from "./axios";

// Campaign Entities
export const getCampaignsList = () => axios.get("/campaigns/campaigns-list");
export const createCampaign = (data) => axios.post("/campaigns/campaigns-list", data);

// Lead CRUD & Pipeline
export const getLeads = (params) => axios.get("/campaigns", { params });
export const createLead = (data) => axios.post("/campaigns", data);
export const getLeadById = (id) => axios.get(`/campaigns/${id}`);
export const updateLead = (id, data) => axios.put(`/campaigns/${id}`, data);

// Stage actions
export const moveLeadStage = (id, data) => axios.patch(`/campaigns/${id}/stage`, data);
export const rejectLead = (id) => axios.patch(`/campaigns/${id}/reject`);
export const markDuplicate = (id) => axios.patch(`/campaigns/${id}/duplicate`);
export const markNotInterested = (id) => axios.patch(`/campaigns/${id}/not-interested`);
export const markLost = (id) => axios.patch(`/campaigns/${id}/mark-lost`);

// Stats
export const getCampaignStats = (params) => axios.get("/campaigns/stats", { params });

// Activities
export const getActivities = (id) => axios.get(`/campaigns/${id}/activities`);
export const addActivity = (id, data) => axios.post(`/campaigns/${id}/activities`, data);

// Documents
export const getDocuments = (id) => axios.get(`/campaigns/${id}/documents`);
export const uploadDocuments = (id, formData) =>
  axios.post(`/campaigns/${id}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDocument = (docId) => axios.delete(`/campaigns/documents/${docId}`);
