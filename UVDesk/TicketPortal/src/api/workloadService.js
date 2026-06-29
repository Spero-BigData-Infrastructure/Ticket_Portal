
import axiosInstance from "./axiosInstance";

const workloadService = {
  // Project Heatmap
  getProjectHeatmap: async (filters = {}) => {
    const response = await axiosInstance.post("/api/project-heatmap", filters);
    return response.data;
  },



  // Ticket Chat — GET /api/ticket-chat?ticket_id=N
  getTicketChat: async (ticketId) => {
    const response = await axiosInstance.get(`/api/ticket-chat?ticket_id=${ticketId}`);
    return response.data;
  },
};

export default workloadService;
