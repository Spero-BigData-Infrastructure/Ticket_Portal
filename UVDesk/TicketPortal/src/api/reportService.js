import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const fetchMasterReport = async (fromDate, toDate) => {
  const response = await api.post("/uvdesk-master-report", {
    from_date: fromDate,
    to_date: toDate,
  });
  return response.data;
};

// GET API se file download handle karne ka tarika
export const downloadExcelReport = (fromDate, toDate) => {
  const url = `${import.meta.env.VITE_API_BASE_URL}/download/uvdesk-report?from_date=${fromDate}&to_date=${toDate}`;
  // Yeh browser me naya tab khol kar file download start kar dega
  window.open(url, "_blank");
};
