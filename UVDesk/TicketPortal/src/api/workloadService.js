import axiosInstance from "./axiosInstance";

const workloadService = {
  /**
   * Fetch project heatmap data
   * @param {Object} filters - { from_date, to_date, project_name }
   */
  getProjectHeatmap: async (filters = {}) => {
    const response = await axiosInstance.post("/api/project-heatmap", filters);
    return response.data;
  },
};

export default workloadService;