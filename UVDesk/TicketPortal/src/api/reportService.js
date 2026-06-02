import axiosInstance from "./axiosInstance"; 
const reportService = {
  /**
   * Fetch the summary of all agents
   * @param {Object} payload - { from_date, to_date, sla_filter }
   */
  getAgentSummary: async (payload) => {
    // Bina try/catch ke seedha call aur return
    const response = await axiosInstance.post("/api/uvdesk-agent-summary", payload);
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
   * Download the Excel/CSV report
   * @param {Object} payload - { from_date, to_date, sla_type, agent_name (optional) }
   */
  downloadReport: async (payload) => {
    const response = await axiosInstance.post(
      "/api/download/uvdesk-report",
      payload,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },
};

export default reportService;
