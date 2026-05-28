import { useEffect, useState } from "react";
import { Box, Container, CircularProgress } from "@mui/material";
import FilterSection from "./FilterSection";
import AgenSummaryTable from "./AgentSummaryTable";
import TicketDetails from "./TicketDetails";

export default function MainRoute() {
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState("");
  useEffect(() => {
    console.log("fromDate", fromDate, "toDate", toDate);
  }, []);
  const [toDate, setToDate] = useState("");
  const [agentData, setAgentData] = useState([]);
  const [ticketDetails, setTicketDetails] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredTickets, setFilteredTickets] = useState([]);

  useEffect(() => {
    if (!searchText) {
      setFilteredTickets(ticketDetails);
      return;
    }

    const lower = searchText.toLowerCase();

    const filtered = ticketDetails.filter((item) => {
      return (
        item.agent_name?.toLowerCase().includes(lower) ||
        item.ticket_id?.toString().toLowerCase().includes(lower) ||
        item.assigned_to?.toLowerCase().includes(lower) ||
        item.added_by?.toLowerCase().includes(lower)
      );
    });

    setFilteredTickets(filtered);

    const filteredAgents = agentData.filter((item) => {
      return item.agent?.toLowerCase().includes(lower);
    });

    setAgentData(filteredAgents);
  }, [searchText, ticketDetails]);
  useEffect(() => {
    const today = new Date();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    // const formatDate = (date) => date.toISOString().split("T")[0];

    const formatDate = (date) => {
      const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      return offsetDate.toISOString().split("T")[0];
    };

    const defaultFrom = formatDate(firstDay);
    const defaultTo = formatDate(today);

    console.log("defaultFromdefaultFrom", defaultFrom, defaultTo);

    setFromDate(defaultFrom);
    setToDate(defaultTo);

    getReportData(defaultFrom, defaultTo);
  }, []);
  const getReportData = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://192.168.1.204:8558/api/uvdesk-master-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from_date: fromDate,
            to_date: toDate,
          }),
        },
      );

      const result = await response.json();
      console.log("reportresult", result);
      const summary = result?.agent_wise_ticket_status_summary || [];

      // =========================
      // AGENT DATA (FIXED MAPPING)
      // =========================
      const formattedAgentData = summary.map((item) => ({
        agent: item.agent_name || "N/A",
        open: Number(item.open || 0),
        pending: Number(item.pending || 0),
        answered: Number(item.answered || 0),
        resolved: Number(item.resolved || 0),
        closed: Number(item.closed || 0),
        total:
          Number(item.open || 0) +
          Number(item.pending || 0) +
          Number(item.answered || 0) +
          Number(item.resolved || 0) +
          Number(item.closed || 0),
      }));

      setAgentData(formattedAgentData);

      // =========================
      // TICKET DETAILS
      // =========================
      const formattedTicketDetails =
        result?.ticket_master_report?.map((item) => ({
          ticket_id: item.ticket_id,
          issue: item.issue,
          added_by: item.added_by,
          added_date: item.added_date,
          project: item.project,
          type: item.type,
          assigned_to: item.assigned_to,
          status: item.status,
          updated_date: item.updated_date,
          closed_date: item.closed_date,
          sla_days: item.sla_days,
          sla_hours: item.sla_hours,
        })) || [];

      setTicketDetails(formattedTicketDetails);
    } catch (error) {
      console.log("API ERROR", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReportData();
  }, []);

  return (
    <Box sx={{ background: "#f4f6f8", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        {/* FILTER */}
        <FilterSection
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          getReportData={getReportData}
          ticketDetails={ticketDetails}
          searchText={searchText}
          setSearchText={setSearchText}
        />

        <Box sx={{ height: 20 }} />

        {/* LOADER */}
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="300px"
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* 👇 SEPARATE BOX WRAPPER (NO UI CHANGE) */}
            <Box>
              <AgenSummaryTable rows={agentData} />
            </Box>

            <Box sx={{ height: 20 }} />

            <Box>
              <TicketDetails rows={filteredTickets} rows2={filteredTickets} />
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
