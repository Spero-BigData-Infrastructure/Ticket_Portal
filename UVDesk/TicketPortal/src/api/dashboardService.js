import axiosInstance from "./axiosInstance"; // Apna sahi path check kar lena

const dashboardService = {
  /**
   * Fetch summary for all projects
   */
  getProjectSummary: async () => {
    const response = await axiosInstance.get("/api/project-summary");
    return response.data;
  },

  /**
   * Fetch agent summary for a specific project
   * @param {string|number} projectId
   */
  getProjectAgentSummary: async (projectId) => {
    const response = await axiosInstance.get(
      `/api/project-agent-summary?project_id=${projectId}`,
    );
    return response.data;
  },
};

export default dashboardService;
