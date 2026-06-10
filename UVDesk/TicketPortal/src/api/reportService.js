import axiosInstance from "./axiosInstance";

const reportService = {
  /**
   * Fetch the summary of all agents
   * @param {Object} payload - { from_date, to_date, sla_filter }
   */
  getAgentSummary: async (payload) => {
    const response = await axiosInstance.post(
      "/api/uvdesk-agent-summary",
      payload,
    );
    return response.data;
  },

  /**
   * Fetch ticket details for a specific agent
   * @param {Object} payload - { from_date, to_date, sla_type, agent_id }
   */
  getAgentDetails: async (payload) => {
    const response = await axiosInstance.post("/api/uvdesk-agent", payload);
    return response.data;
  },

  /**
   * Fetch master ticket details based on status (KPI Click)
   * @param {Object} payload - { from_date, to_date, status }
   */
  getMasterTicketDetails: async (payload) => {
    const response = await axiosInstance.post("/api/ticket-details", payload);
    return response.data;
  },

  /**
   * Download the Excel/CSV report
   * @param {Object} payload - { from_date, to_date, sla_type, agent_name }
   */
  downloadReport: async (payload) => {
    const response = await axiosInstance.post(
      "/api/download/uvdesk-report",
      payload,
      { responseType: "blob" },
    );
    return response.data;
  },

  // 🔥 NAYI API: Ticket Chat History lane ke liye
  getTicketChat: async (ticketId) => {
    const response = await axiosInstance.get(
      `/api/ticket-chat?ticket_id=${ticketId}`,
    );
    return response.data;
  },
};

export default reportService;
