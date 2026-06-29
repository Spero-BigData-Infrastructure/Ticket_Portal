
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Tooltip, Dialog, DialogContent, DialogTitle,
  IconButton, Paper, Avatar, Stack, alpha, CircularProgress,
  Chip, Drawer, TextField, InputAdornment, TablePagination,
  Select, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from "@mui/material";
import CloseIcon    from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon   from "@mui/icons-material/Search";
import ReceiptIcon  from "@mui/icons-material/ReceiptLongOutlined";
import { motion }   from "framer-motion";
import {
  Dashboard          as DashboardIcon,
  Assessment         as AssessmentIcon,
  GridView           as GridViewIcon,
  ConfirmationNumber as TicketIcon,
  FolderOpen         as FolderIcon,
  Whatshot           as PeakIcon,
  CheckCircle        as ResolvedIcon,
} from "@mui/icons-material";

import workloadService from "../../api/workloadService";
import TicketChatModal from "../ReportModule/TicketChatModal";

const MotionBox   = motion(Box);
const MotionPaper = motion(Paper);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Month name → month number (1-based)
const MONTH_NUM = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };

const PROJECT_COLORS = [
  "#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6",
  "#8B5CF6","#EF4444","#14B8A6","#F97316","#06B6D4",
  "#84CC16","#A855F7",
];

const STATUS_CONFIG = {
  open:     { label:"Open",     color:"#F59E0B", bg:"#FEF3C7", dot:"#F59E0B" },
  pending:  { label:"Pending",  color:"#3B82F6", bg:"#DBEAFE", dot:"#3B82F6" },
  answered: { label:"Answered", color:"#10B981", bg:"#D1FAE5", dot:"#10B981" },
  resolved: { label:"Resolved", color:"#8B5CF6", bg:"#EDE9FE", dot:"#8B5CF6" },
  closed:   { label:"Closed",   color:"#6B7280", bg:"#F3F4F6", dot:"#6B7280" },
};

const getStatusColor = (status) => {
  const map = {
    open:"#F59E0B", pending:"#3B82F6", answered:"#10B981", resolved:"#8B5CF6", closed:"#6B7280",
    Open:"#F59E0B", Pending:"#3B82F6", Answered:"#10B981", Resolved:"#8B5CF6", Closed:"#6B7280",
  };
  return map[status] || "#6366F1";
};

const formatDate = (val) => {
  if (!val) return "-";
  try {
    return new Date(val).toLocaleDateString("en-GB", {
      day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit",
    });
  } catch { return val; }
};

// Convert month name + year → { from_date, to_date }
function monthToDateRange(monthName, year) {
  const m = MONTH_NUM[monthName];
  if (!m) return { from_date: null, to_date: null };
  const pad = (n) => String(n).padStart(2,"0");
  const lastDay = new Date(year, m, 0).getDate();
  return {
    from_date: `${year}-${pad(m)}-01`,
    to_date:   `${year}-${pad(m)}-${pad(lastDay)}`,
  };
}

function getHeatColor(count, max, isDark) {
  if (!count || count === 0) return {
    bg:   isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
    text: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
    glow: null,
  };
  const r = count / max;
  if (r >= 0.8) return { bg:"#1E40AF", text:"#fff", glow:"0 0 10px rgba(37,99,235,0.6)" };
  if (r >= 0.6) return { bg:"#2563EB", text:"#fff", glow:"0 0 8px rgba(59,130,246,0.5)" };
  if (r >= 0.4) return { bg:"#60A5FA", text:"#1E3A5F", glow:null };
  if (r >= 0.2) return { bg:"#BFDBFE", text:"#1E40AF", glow:null };
  return { bg:"#DBEAFE", text:"#3B82F6", glow:null };
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ title, value, color, icon, delay=0 }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <MotionPaper
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", stiffness:100, damping:15, delay }}
      whileHover={{ scale:1.02, y:-3 }} elevation={0}
      sx={{
        position:"relative", overflow:"hidden", height:"100%", width:"100%",
        px:{xs:1.5,sm:2}, py:{xs:1.5,sm:2}, borderRadius:"20px",
        background: isDark
          ? `linear-gradient(135deg,${color}25 0%,${color}10 45%,${theme.palette.background.paper} 100%)`
          : `linear-gradient(135deg,${color}14 0%,${color}08 45%,#ffffff 100%)`,
        border:`2px solid ${color}${isDark?"30":"18"}`,
        boxShadow: isDark?"0 10px 30px rgba(0,0,0,0.2)":"0 10px 30px rgba(0,0,0,0.04)",
        display:"flex", alignItems:"center",
      }}
    >
      <Box sx={{ position:"absolute",top:"-45px",right:"-45px",width:"140px",height:"140px",borderRadius:"50%",background:`${color}${isDark?"20":"10"}`,pointerEvents:"none" }} />
      <Box sx={{ position:"absolute",bottom:-15,right:-10,opacity:isDark?0.1:0.05,pointerEvents:"none","& > svg":{ fontSize:{xs:80,sm:110},color } }}>{icon}</Box>
      <Box sx={{ display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:2,width:"100%" }}>
        <Box sx={{ display:"flex",alignItems:"center",gap:{xs:1.5,sm:2},flex:1,minWidth:0 }}>
          <Avatar sx={{ width:{xs:42,sm:46},height:{xs:42,sm:46},flexShrink:0,background:`linear-gradient(135deg,${color} 0%,${color}CC 100%)`,boxShadow:`0 10px 20px ${color}30`,"& > svg":{ fontSize:{xs:20,sm:22},color:"#fff" } }}>{icon}</Avatar>
          <Stack spacing={0.2} sx={{ minWidth:0 }}>
            <Typography fontWeight={700} sx={{ color:"text.secondary",fontSize:{xs:10,sm:11},textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap" }}>{title}</Typography>
            <Typography fontWeight={800} sx={{ color:"text.primary",fontSize:{xs:20,sm:24},lineHeight:1,fontFamily:"'Poppins',sans-serif" }}>{value}</Typography>
          </Stack>
        </Box>
        <Box sx={{ width:{xs:28,sm:32},height:{xs:28,sm:32},borderRadius:"50%",bgcolor:`${color}${isDark?"25":"15"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,"& > svg":{ color,fontSize:{xs:13,sm:15} } }}>{icon}</Box>
      </Box>
    </MotionPaper>
  );
}

// ── Ticket Table Drawer ────────────────────────────────────────
function TicketTableDrawer({ open, onClose, title, statusKey, tickets, loading, isDark, onTicketClick }) {
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => { setSearch(""); setPage(0); setStatusFilter("All"); }, [open, statusKey]);

  const cfg         = STATUS_CONFIG[statusKey] || {};
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textMuted   = isDark ? "#94A3B8" : "#64748B";
  const borderClr   = isDark ? "#334155" : "#e2e8f0";
  const hdrBg       = isDark ? "#1e293b"  : "#f8fafc";
  const paperBg     = isDark ? "#111827"  : "#fff";
  const rowHoverBg  = isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9";

  const filtered = (tickets || []).filter((t) => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      (t.ticket_id || "").toLowerCase().includes(s) ||
      (t.subject    || "").toLowerCase().includes(s) ||
      (t.agent_name || "").toLowerCase().includes(s) ||
      (t.project    || "").toLowerCase().includes(s) ||
      (t.type       || "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "All" || (t.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{
  sx: {
    width: { xs: "100vw", md: "65vw", lg: "55vw" },
    maxWidth: "900px",   // 👈 add this (VERY IMPORTANT)
    display: "flex",
    flexDirection: "column",
  }
}}
    >
      <Paper elevation={0} sx={{
        m:1.5, mb:0, p:2, borderRadius:"16px",
        bgcolor:paperBg, border:2, borderColor:"#2962ff",
        boxShadow: isDark?"0 8px 30px rgba(41,98,255,0.1)":"0 12px 40px rgba(41,98,255,0.15)",
        flex:1, display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        {/* Header */}
        <Box sx={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:2, mb:2.5 }}>
          <Typography variant="subtitle1" fontWeight={700}
            sx={{ display:"flex", alignItems:"center", gap:1, color:isDark?"#fff":"#1e293b", flexGrow:1 }}
          >
            <ReceiptIcon sx={{ color:"#2962ff" }} />
            {title}
            {cfg.label && (
              <span style={{ color:cfg.color||"#2962ff", marginLeft:4 }}>{cfg.label}</span>
            )}
          </Typography>
          <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
            <TextField size="small" placeholder="Search tickets..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment:<InputAdornment position="start"><SearchIcon sx={{ color:"#94a3b8",fontSize:18 }} /></InputAdornment> }}
              sx={{
                minWidth:240,
                "& .MuiOutlinedInput-root":{
                  bgcolor:isDark?"rgba(255,255,255,0.03)":"#f8fafc", borderRadius:"8px", color:isDark?"#fff":"#1e293b",
                  "& fieldset":{ borderColor:borderClr }, "&:hover fieldset":{ borderColor:"#2962ff" }, "&.Mui-focused fieldset":{ borderColor:"#2962ff" },
                },
              }}
            />
            <IconButton size="small" onClick={onClose}
              sx={{ bgcolor:isDark?alpha("#fff",0.05):alpha("#000",0.04), "&:hover":{ bgcolor:"#ef4444", color:"#fff" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ border:1, borderColor:borderClr, borderRadius:"12px", overflow:"hidden", flex:1 }}>
          <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                {["Ticket ID","Subject","Project","Type","Agent","Created","Status","Updated","SLA Hrs"].map((head) => (
                  <TableCell key={head} sx={{ bgcolor:hdrBg, color:isDark?"#94a3b8":"#64748b", fontWeight:700, borderBottom:`1px solid ${borderClr}`, whiteSpace:"nowrap", padding:"8px 10px" }}>
                    {head === "Status" ? (
                      <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        size="small" variant="standard" disableUnderline
                        sx={{ color:"inherit", fontWeight:700, fontSize:"0.875rem", "& .MuiSelect-icon":{ color:"inherit" } }}
                      >
                        <MenuItem value="All">Status (All)</MenuItem>
                        <MenuItem value="Open">Open</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Answered">Answered</MenuItem>
                        <MenuItem value="Resolved">Resolved</MenuItem>
                        <MenuItem value="Closed">Closed</MenuItem>
                      </Select>
                    ) : head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py:6 }}>
                    <CircularProgress size={28} sx={{ color:"#2962ff" }} />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py:6, color:"text.secondary", fontWeight:500 }}>
                    {search || statusFilter !== "All" ? "No tickets match your filters." : "No tickets found."}
                  </TableCell>
                </TableRow>
              ) : paginated.map((t, idx) => (
                <TableRow key={t.ticket_id || idx}
                  onClick={() => onTicketClick && onTicketClick(t)}
                  sx={{
                    cursor:"pointer",
                    "&:hover":{ bgcolor:rowHoverBg },
                    "& td":{ borderBottom:`1px solid ${isDark?"#1e293b":"#f1f5f9"}`, padding:"7px 10px" },
                    "&:last-child td":{ borderBottom:"none" },
                  }}
                >
                  <TableCell sx={{ fontWeight:700, color:"#2962ff", whiteSpace:"nowrap" }}>{t.ticket_id}</TableCell>
<TableCell sx={{
  maxWidth: 160,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}}>                    <Tooltip title={t.subject||""} placement="top-start">
                      <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis" }}>{t.subject||"-"}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color:"text.primary", whiteSpace:"nowrap" }}>{t.project||"-"}</TableCell>
                 <TableCell sx={{
  maxWidth: 160,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "text.primary"
}}>
  {t.type || "-"}
</TableCell><TableCell sx={{
  maxWidth: 140,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "text.primary"
}}>
  {t.agent_name || "-"}
</TableCell>
                  <TableCell sx={{ color:"text.primary", whiteSpace:"nowrap" }}>{formatDate(t.created_at)}</TableCell>
                  <TableCell>
                    {t.status ? (
                      <Chip label={t.status} size="small" sx={{
                        bgcolor:alpha(getStatusColor(t.status),0.12), color:getStatusColor(t.status),
                        fontWeight:700, borderRadius:"6px", height:22,
                      }} />
                    ) : "-"}
                  </TableCell>
                  <TableCell sx={{ color:"text.primary", whiteSpace:"nowrap" }}>{formatDate(t.updated_at)}</TableCell>
                  <TableCell sx={{ fontWeight:700, color:"text.primary", whiteSpace:"nowrap" }}>{t.sla_hours||"-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5,10,25,50]} component="div"
            count={filtered.length} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value,10)); setPage(0); }}
            sx={{ color:isDark?"#94a3b8":"#64748b", mt:0.5, "& .MuiTablePagination-selectIcon":{ color:isDark?"#94a3b8":"#64748b" } }}
          />
        )}
      </Paper>
    </Drawer>
  );
}

// ── Breakdown Modal ────────────────────────────────────────────
function BreakdownModal({ open, onClose, projName, month, total, breakdown, loadingBreakdown, isDark, onStatusClick }) {
  if (!open) return null;
  const cardBg      = isDark ? "#1E293B" : "#FFFFFF";
  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const textMuted   = isDark ? "#94A3B8" : "#64748B";
  const borderClr   = isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.12)";

  return (
    <Dialog open={open} onClose={onClose}
      PaperProps={{ sx:{ background:cardBg, borderRadius:"18px", border:`1px solid ${borderClr}`,
        boxShadow:isDark?"0 20px 60px rgba(0,0,0,0.5)":"0 20px 60px rgba(99,102,241,0.15)",
        minWidth:340, maxWidth:440 } }}
    >
      <DialogTitle sx={{ pb:1 }}>
        <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Box>
            <Typography sx={{ fontSize:16, fontWeight:800, color:textPrimary, letterSpacing:"-0.3px" }}>{projName}</Typography>
            <Typography sx={{ fontSize:12, color:textMuted, mt:0.3 }}>{month} · Ticket Breakdown</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color:textMuted }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt:0 }}>
        <Box sx={{ background:"linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius:"12px", p:2, mb:2, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Typography sx={{ color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:600 }}>Total Tickets</Typography>
          <Typography sx={{ color:"#fff", fontSize:28, fontWeight:900, lineHeight:1 }}>{total}</Typography>
        </Box>

        {loadingBreakdown ? (
          <Box sx={{ display:"flex", justifyContent:"center", py:3 }}>
            <CircularProgress size={28} sx={{ color:"#6366F1" }} />
          </Box>
        ) : (
          <Box sx={{ display:"flex", flexDirection:"column", gap:1 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = breakdown?.[key] || 0;
              const pct   = total > 0 ? Math.round((count/total)*100) : 0;
              return (
                <Box key={key} onClick={() => count > 0 && onStatusClick(key, count)}
                  sx={{
                    background:isDark?"rgba(255,255,255,0.04)":cfg.bg,
                    borderRadius:"10px", p:1.5,
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    border:`1px solid ${isDark?"rgba(255,255,255,0.06)":"transparent"}`,
                    cursor:count > 0 ? "pointer" : "default",
                    transition:"all 0.15s",
                    "&:hover": count > 0 ? { transform:"scale(1.01)", boxShadow:`0 4px 14px ${cfg.dot}30`, borderColor:`${cfg.dot}40` } : {},
                  }}
                >
                  <Box sx={{ display:"flex", alignItems:"center", gap:1.2 }}>
                    <Box sx={{ width:10, height:10, borderRadius:"50%", background:cfg.dot, flexShrink:0, boxShadow:`0 0 6px ${cfg.dot}88` }} />
                    <Typography sx={{ fontSize:13, fontWeight:600, color:isDark?"#CBD5E1":cfg.color }}>{cfg.label}</Typography>
                  </Box>
                  <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
                    <Box sx={{ width:80, height:6, borderRadius:3, background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)", overflow:"hidden" }}>
                      <Box sx={{ width:`${pct}%`, height:"100%", background:cfg.color, borderRadius:3, transition:"width 0.5s ease" }} />
                    </Box>
                    <Typography sx={{ fontSize:13, fontWeight:800, color:textPrimary, minWidth:20, textAlign:"right" }}>{count}</Typography>
                    <Typography sx={{ fontSize:11, color:textMuted, minWidth:30 }}>{pct}%</Typography>
                    {count > 0 && <OpenInNewIcon sx={{ fontSize:13, color:cfg.color, opacity:0.7 }} />}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
        {!loadingBreakdown && (
          <Typography sx={{ fontSize:10, color:textMuted, mt:1.5, textAlign:"center", fontStyle:"italic" }}>
            Click any status row to view tickets
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Cell Tooltip ───────────────────────────────────────────────
function CellTooltip({ projName, month, total, breakdown }) {
  return (
    <Box sx={{ p:1, minWidth:180 }}>
      <Typography sx={{ fontWeight:700, fontSize:12, mb:0.5, color:"#fff" }}>{projName} · {month}</Typography>
      <Typography sx={{ fontSize:11, mb:0.8, color:"#94A3B8" }}>Total: <b style={{ color:"#fff" }}>{total}</b></Typography>
      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
        const count = breakdown?.[key] || 0;
        return count > 0 ? (
          <Box key={key} sx={{ display:"flex", justifyContent:"space-between", gap:2, mb:0.3 }}>
            <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
              <Box sx={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />
              <Typography sx={{ fontSize:11, color:"#CBD5E1" }}>{cfg.label}</Typography>
            </Box>
            <Typography sx={{ fontSize:11, fontWeight:700, color:"#fff" }}>{count}</Typography>
          </Box>
        ) : null;
      })}
      <Typography sx={{ fontSize:10, color:"#6366F1", mt:0.8, fontStyle:"italic" }}>Click for details</Typography>
    </Box>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function WorkloadPage() {
  const theme    = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark   = theme.palette.mode === "dark";

  // Heatmap state
  const [projectDropdown, setProjectDropdown] = useState([]);
  const [projects, setProjects]               = useState([]);
  const [maxCount, setMaxCount]               = useState(1);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [fromDate, setFromDate]               = useState("");
  const [toDate, setToDate]                   = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [lookup, setLookup]                   = useState({});

  // Breakdown modal state
  const [modalOpen, setModalOpen]           = useState(false);
  const [modalData, setModalData]           = useState(null);   // { projName, month, total, breakdown }
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  // Active filters used when breakdown was opened (for ticket-details call)
  const [activeFromDate, setActiveFromDate] = useState("");
  const [activeToDate, setActiveToDate]     = useState("");

  // Ticket table drawer
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [drawerTitle, setDrawerTitle]       = useState("");
  const [drawerStatusKey, setDrawerStatusKey] = useState(null);
  const [drawerTickets, setDrawerTickets]   = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Ticket chat modal
  const [chatOpen, setChatOpen]             = useState(false);
  const [activeTicketForChat, setActiveTicketForChat] = useState(null);

  const currentMonthIdx = new Date().getMonth();
  const currentMonth    = MONTHS[currentMonthIdx];
  const currentYear     = new Date().getFullYear();

  const activeTab = location.pathname.includes("report-module") ? "report"
    : location.pathname.includes("workload") ? "workload" : "dashboard";

  // ── Fetch Heatmap ──────────────────────────────────────────
  const fetchData = useCallback(async (fd, td, sp) => {
    setLoading(true); setError(null);
    try {
      const payload = {};
      if (fd && td) { payload.from_date = fd; payload.to_date = td; }
      if (sp) payload.project_name = sp;

      const res = await workloadService.getProjectHeatmap(payload);
      if (!res.status) throw new Error(res.message || "Failed to load");

      setProjectDropdown(res.project_dropdown || []);
      const newLookup = {};
      let max = 1;

      (res.data || []).forEach((monthObj) => {
        newLookup[monthObj.month] = {};
        (monthObj.projects || []).forEach((p) => {
          const count = p.total ?? p.ticket_count ?? 0;
          // status_breakdown: { open:N, pending:N, ... }
          const bd = p.status_breakdown || {};
          newLookup[monthObj.month][p.project_id] = { total:count, breakdown:bd, projectName:p.project_name };
          if (count > max) max = count;
        });
      });

      setLookup(newLookup);
      setMaxCount(max);

      const allProjects = (res.project_dropdown || [])
        .filter((p) => sp ? Object.values(newLookup).some((ml) => ml[p.project_id]?.total > 0) : true)
        .map((p) => ({ id:p.project_id, name:p.project_name }));

      allProjects.sort((a,b) =>
        (newLookup[currentMonth]?.[b.id]?.total||0) - (newLookup[currentMonth]?.[a.id]?.total||0)
      );
      setProjects(allProjects);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [currentMonth]);

  useEffect(() => { fetchData("","",""); }, []);

  const handleClear = () => { setFromDate(""); setToDate(""); setSelectedProject(""); fetchData("","",""); };
  const handleApply = () => fetchData(fromDate, toDate, selectedProject);

  // ── Cell Click → show breakdown modal ─────────────────────
  const handleCellClick = (proj, month) => {
    const cell = lookup[month]?.[proj.id];
    if (!cell || cell.total === 0) return;

    // Determine date range for this cell
    // If user has applied a date filter, use that; else use the month range
    let fd = fromDate, td = toDate;
    if (!fd || !td) {
      const range = monthToDateRange(month, currentYear);
      fd = range.from_date;
      td = range.to_date;
    }
    setActiveFromDate(fd);
    setActiveToDate(td);

    setModalData({
      projName:  proj.name,
      month,
      total:     cell.total,
      breakdown: cell.breakdown,
      projectId: proj.id,
    });
    setModalOpen(true);
  };

  // ── Status row click → fetch ticket-details & open drawer ─
  const handleStatusClick = async (statusKey, count) => {
    if (!modalData) return;

    const drawerTitleStr = `Showing Tickets For Status: `;
    setDrawerTitle(drawerTitleStr);
    setDrawerStatusKey(statusKey);
    setDrawerTickets([]);
    setLoadingTickets(true);
    setDrawerOpen(true);

    try {
      const payload = {
        status:     statusKey,
        from_date:  activeFromDate || null,
        to_date:    activeToDate   || null,
      };

      const res = await workloadService.getTicketDetails(payload);

      if (res?.status && res?.tickets_by_status) {
  const projName = (modalData.projName || "").trim().toLowerCase();

  const tickets = res.tickets_by_status[statusKey] || [];

  const filtered = tickets.filter((t) => {
    if (!projName || projName === "unassigned") return true;

    return (t.project || "").trim().toLowerCase() === projName;
  });

  setDrawerTickets(filtered);
} else {
  setDrawerTickets([]);
}
    } catch (err) {
      console.error("Ticket details error:", err);
      setDrawerTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  // ── Ticket row click → open chat modal ────────────────────
  const handleTicketClick = (ticket) => {
    setActiveTicketForChat({
      ...ticket,
      ticket_id: ticket.ticket_id,
      issue:     ticket.subject || ticket.issue,
    });
    setChatOpen(true);
  };

  // ── Computed totals from lookup ────────────────────────────
  const totalByMonth = MONTHS.map((m) =>
    projects.reduce((s,p) => s + (lookup[m]?.[p.id]?.total||0), 0)
  );
  const grandTotal    = totalByMonth.reduce((a,b) => a+b, 0);
  const activeCount   = projects.reduce((s,p) =>
    s + Object.values(lookup).reduce((ms,ml) => {
      const bd = ml[p.id]?.breakdown || {};
      return ms + (bd.open||0) + (bd.pending||0) + (bd.answered||0);
    }, 0), 0);
  const resolvedCount = projects.reduce((s,p) =>
    s + Object.values(lookup).reduce((ms,ml) => ms + (ml[p.id]?.breakdown?.resolved||0), 0), 0);
  const closedCount   = projects.reduce((s,p) =>
    s + Object.values(lookup).reduce((ms,ml) => ms + (ml[p.id]?.breakdown?.closed||0), 0), 0);

  // ── Theme tokens ───────────────────────────────────────────
  const border      = isDark ? alpha("#ffffff",0.05) : alpha("#000",0.04);
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textMuted   = isDark ? "#94a3b8" : "#64748b";
  const stickyHead  = isDark ? "#162032" : "#F5F3FF";
  const stickyBg    = isDark ? "#1E293B" : "#FFFFFF";
  const headerBg    = isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.06)";
  const rowHover    = isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)";
  const heatBorder  = isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.12)";

  const tabs = [
    { id:"dashboard", label:"Dashboard", icon:<DashboardIcon sx={{ mr:1,fontSize:16 }}/>, path:"/" },
    { id:"report",    label:"Report",    icon:<AssessmentIcon sx={{ mr:1,fontSize:16 }}/>, path:"/report-module" },
    { id:"workload",  label:"Workload",  icon:<GridViewIcon sx={{ mr:1,fontSize:16 }}/>,   path:"/workload" },
  ];

  const kpis = [
    { title:"Total Tickets",    value:grandTotal,      color:"#4F46E5", icon:<TicketIcon />   },
    { title:"Active Tickets",   value:activeCount,     color:"#F59E0B", icon:<FolderIcon />   },
    { title:"Resolved Tickets", value:resolvedCount,   color:"#8B5CF6", icon:<ResolvedIcon /> },
    { title:"Closed Tickets",   value:closedCount,     color:"#EF4444", icon:<TicketIcon />   },
    { title:"Projects",         value:projects.length, color:"#10B981", icon:<PeakIcon />     },
  ];

  return (
    <Box sx={{ width:"100%", fontFamily:"'Inter','Poppins',sans-serif" }}>
      <MotionBox initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}>

        {/* ── TOP BAR ── */}
        <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:2, mb:1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, letterSpacing:"-0.5px", color:textPrimary }}>
              Project Workload
            </Typography>
            <Typography variant="body2" sx={{ color:textMuted, fontWeight:500, mt:0.2 }}>
              Ticket heatmap for {currentYear} · click any cell for status breakdown
            </Typography>
          </Box>
          <Box sx={{ display:"flex", bgcolor:isDark?alpha("#000",0.3):"#f1f5f9", borderRadius:"10px", padding:"3px", border:"1px solid", borderColor:border }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Box key={tab.id} onClick={() => navigate(tab.path)}
                  sx={{ position:"relative", px:2, py:0.6, cursor:"pointer", zIndex:1, display:"flex", alignItems:"center", borderRadius:"7px" }}
                >
                  {isActive && (
                    <MotionBox layoutId="workloadTabBg" initial={false}
                      transition={{ type:"spring", stiffness:500, damping:35 }}
                      sx={{ position:"absolute", inset:0, bgcolor:theme.palette.primary.main, borderRadius:"7px", zIndex:-1, boxShadow:`0 3px 8px ${alpha(theme.palette.primary.main,0.35)}` }}
                    />
                  )}
                  <Typography sx={{ display:"flex", alignItems:"center", fontWeight:700, fontSize:"0.78rem", fontFamily:"'Poppins',sans-serif", color:isActive?"#fff":isDark?"#94a3b8":"#64748b", transition:"color 0.2s" }}>
                    {tab.icon}{tab.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── FILTERS + KPI ── */}
        <Paper elevation={0} sx={{
          p:{ xs:2, md:2.5 }, mb:1.5, borderRadius:"20px",
          background:isDark?"linear-gradient(145deg,rgba(22,28,45,0.9) 0%,rgba(15,23,42,0.98) 100%)":"linear-gradient(145deg,#ffffff 0%,#f8fafc 100%)",
          border:"1px solid", borderColor:border,
          boxShadow:isDark?"0 10px 30px -10px rgba(0,0,0,0.7)":"0 15px 35px -10px rgba(148,163,184,0.12)",
        }}>
          <Box sx={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:2, mb:2 }}>
            <Box sx={{ display:"flex", alignItems:"center", gap:1.5, bgcolor:isDark?alpha("#fff",0.02):"#fff", px:2, py:0.5, borderRadius:"12px", border:"1px solid", borderColor:isDark?alpha("#fff",0.06):"#e2e8f0" }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform:"uppercase", fontSize:"0.7rem" }}>From</Typography>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                style={{ border:"none", outline:"none", background:"transparent", fontWeight:600, fontSize:"0.85rem", color:isDark?"#f8fafc":"#1e293b", colorScheme:isDark?"dark":"light", fontFamily:"inherit" }} />
              <Box sx={{ width:"1px", height:24, bgcolor:isDark?alpha("#fff",0.1):"#cbd5e1" }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform:"uppercase", fontSize:"0.7rem" }}>To</Typography>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                style={{ border:"none", outline:"none", background:"transparent", fontWeight:600, fontSize:"0.85rem", color:isDark?"#f8fafc":"#1e293b", colorScheme:isDark?"dark":"light", fontFamily:"inherit" }} />
            </Box>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              style={{ border:`1.5px solid ${isDark?"rgba(255,255,255,0.1)":"#E2E8F0"}`, borderRadius:10, padding:"8px 14px", fontSize:13, color:isDark?"#f8fafc":"#1e293b", background:isDark?"#1E293B":"#fff", outline:"none", minWidth:180, fontFamily:"inherit", cursor:"pointer", fontWeight:600 }}
            >
              <option value="">All Projects</option>
              {projectDropdown.map((p) => <option key={p.project_id} value={p.project_name}>{p.project_name}</option>)}
            </select>
            <button onClick={handleApply} style={{ height:42, background:"linear-gradient(135deg,#4F46E5 0%,#3B82F6 100%)", color:"#fff", border:"none", borderRadius:10, padding:"0 22px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(59,130,246,0.3)", fontFamily:"inherit" }}>Apply</button>
            <button onClick={handleClear} style={{ height:42, background:isDark?alpha("#fff",0.06):"#f1f5f9", color:isDark?"#fff":"#334155", border:`1.5px solid ${isDark?alpha("#fff",0.15):"#cbd5e1"}`, borderRadius:10, padding:"0 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Reset</button>
            <Box sx={{ display:"flex", alignItems:"center", gap:0.8, ml:"auto" }}>
              <Typography sx={{ fontSize:10, color:textMuted, fontWeight:600 }}>Less</Typography>
              {["#DBEAFE","#BFDBFE","#60A5FA","#2563EB","#1E40AF"].map((c) => <Box key={c} sx={{ width:18, height:18, borderRadius:"4px", background:c }} />)}
              <Typography sx={{ fontSize:10, color:textMuted, fontWeight:600 }}>More</Typography>
            </Box>
          </Box>

          {/* ✅ 5 KPI cards — one row */}
          <Box sx={{ display:"flex", gap:1.5, width:"100%" }}>
            {kpis.map((kpi, idx) => (
              <Box key={idx} sx={{ flex:1, minWidth:0, height:90 }}>
                <StatCard title={kpi.title} value={kpi.value} color={kpi.color} icon={kpi.icon} delay={idx*0.05} />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* ── HEATMAP TABLE ── */}
        {loading ? (
          <Box sx={{ display:"flex", flexDirection:"column", alignItems:"center", py:10, gap:2 }}>
            <CircularProgress sx={{ color:"#6366F1" }} />
            <Typography sx={{ color:textMuted, fontSize:13 }}>Loading heatmap...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign:"center", py:8 }}>
            <Typography sx={{ color:"#EF4444", fontSize:14 }}>⚠ {error}</Typography>
          </Box>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign:"center", py:8 }}>
            <Typography sx={{ color:textMuted }}>No data found.</Typography>
          </Box>
        ) : (
          <Paper elevation={0} sx={{ borderRadius:"16px", overflow:"hidden", border:"1px solid", borderColor:border, boxShadow:isDark?"0 4px 20px rgba(0,0,0,0.3)":"0 15px 35px -10px rgba(148,163,184,0.12)" }}>
            <Box sx={{ overflowX:"auto", maxHeight:"calc(100vh - 440px)", overflowY:"auto",
              "&::-webkit-scrollbar":{ width:"6px", height:"6px" },
              "&::-webkit-scrollbar-thumb":{ background:isDark?"rgba(255,255,255,0.15)":"rgba(99,102,241,0.3)", borderRadius:"10px" },
            }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:"left", padding:"12px 16px", fontSize:10, fontWeight:800, color:textMuted, textTransform:"uppercase", letterSpacing:"0.8px", borderBottom:`1px solid ${heatBorder}`, position:"sticky", left:0, top:0, zIndex:5, background:stickyHead, minWidth:180, whiteSpace:"nowrap" }}>Project</th>
                    {MONTHS.map((m) => (
                      <th key={m} style={{ textAlign:"center", padding:"12px 4px", fontSize:10, fontWeight:800, color:m===currentMonth?"#6366F1":textMuted, textTransform:"uppercase", letterSpacing:"0.6px", borderBottom:`1px solid ${heatBorder}`, minWidth:52, position:"sticky", top:0, zIndex:4, background:stickyHead, borderLeft:m===currentMonth?"2px solid #6366F133":"none" }}>
                        {m}
                        {m===currentMonth && <Box sx={{ width:4, height:4, borderRadius:"50%", background:"#6366F1", mx:"auto", mt:0.3 }} />}
                      </th>
                    ))}
                    <th style={{ textAlign:"center", padding:"12px 14px", fontSize:10, fontWeight:800, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.6px", borderBottom:`1px solid ${heatBorder}`, minWidth:64, position:"sticky", top:0, zIndex:4, background:stickyHead }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj, idx) => {
                    const rowTotal = MONTHS.reduce((s,m) => s+(lookup[m]?.[proj.id]?.total||0), 0);
                    const dotColor = PROJECT_COLORS[idx % PROJECT_COLORS.length];
                    return (
                      <tr key={proj.id}
                        onMouseEnter={(e) => e.currentTarget.style.background = rowHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        style={{ transition:"background 0.15s" }}
                      >
                        <td style={{ padding:"9px 16px", borderBottom:`1px solid ${heatBorder}`, position:"sticky", left:0, zIndex:1, background:stickyBg }}>
                          <Box sx={{ display:"flex", alignItems:"center", gap:1.2 }}>
                            <Box sx={{ width:9, height:9, borderRadius:"50%", background:dotColor, flexShrink:0, boxShadow:`0 0 6px ${dotColor}88` }} />
                            <Typography sx={{ fontSize:13, fontWeight:700, color:textPrimary, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:160 }} title={proj.name}>{proj.name}</Typography>
                          </Box>
                        </td>
                        {MONTHS.map((m) => {
                          const cell  = lookup[m]?.[proj.id];
                          const count = cell?.total || 0;
                          const bd    = cell?.breakdown || {};
                          const { bg:cellBg, text:cellText, glow } = getHeatColor(count, maxCount, isDark);
                          return (
                            <td key={m} style={{ padding:"5px 3px", textAlign:"center", borderBottom:`1px solid ${heatBorder}`, borderLeft:m===currentMonth?"2px solid #6366F133":"none" }}>
                              <Tooltip
                                title={count>0 ? <CellTooltip projName={proj.name} month={m} total={count} breakdown={bd} /> : ""}
                                arrow placement="top"
                                componentsProps={{ tooltip:{ sx:{ bgcolor:"#1E293B", maxWidth:200, p:0.5, borderRadius:"10px", border:"1px solid rgba(255,255,255,0.1)" } }, arrow:{ sx:{ color:"#1E293B" } } }}
                              >
                                <Box onClick={() => handleCellClick(proj, m)}
                                  sx={{ width:38, height:32, borderRadius:"7px", background:cellBg, color:cellText, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, mx:"auto", boxShadow:glow||"none", transition:"transform 0.15s, box-shadow 0.15s", cursor:count>0?"pointer":"default", "&:hover":count>0?{ transform:"scale(1.18)", boxShadow:glow||"0 2px 8px rgba(99,102,241,0.3)" }:{} }}
                                >
                                  {count > 0 ? count : ""}
                                </Box>
                              </Tooltip>
                            </td>
                          );
                        })}
                        <td style={{ textAlign:"center", padding:"5px 14px", borderBottom:`1px solid ${heatBorder}` }}>
                          <Box sx={{ display:"inline-flex", alignItems:"center", justifyContent:"center", background:rowTotal>0?"linear-gradient(135deg,#6366F1,#8B5CF6)":(isDark?"rgba(255,255,255,0.05)":"#F1F5F9"), color:rowTotal>0?"#fff":textMuted, borderRadius:"20px", px:1.5, py:0.4, fontSize:11, fontWeight:800, minWidth:34, boxShadow:rowTotal>0?"0 2px 8px rgba(99,102,241,0.3)":"none" }}>
                            {rowTotal}
                          </Box>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td style={{ padding:"10px 16px", position:"sticky", left:0, zIndex:1, background:stickyHead, borderTop:`2px solid ${heatBorder}` }}>
                      <Typography sx={{ fontSize:10, fontWeight:800, color:"#6366F1", textTransform:"uppercase", letterSpacing:"0.6px" }}>Monthly Total</Typography>
                    </td>
                    {totalByMonth.map((t,i) => (
                      <td key={i} style={{ textAlign:"center", padding:"10px 3px", borderTop:`2px solid ${heatBorder}`, background:headerBg, borderLeft:i===currentMonthIdx?"2px solid #6366F133":"none" }}>
                        <Typography sx={{ fontSize:11, fontWeight:800, color:t>0?"#6366F1":textMuted }}>{t>0?t:"—"}</Typography>
                      </td>
                    ))}
                    <td style={{ textAlign:"center", padding:"10px 14px", borderTop:`2px solid ${heatBorder}`, background:headerBg }}>
                      <Typography sx={{ fontSize:12, fontWeight:900, color:"#6366F1" }}>{grandTotal}</Typography>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Paper>
        )}
      </MotionBox>

      {/* ── Breakdown Modal ── */}
      {modalData && (
        <BreakdownModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          projName={modalData.projName}
          month={modalData.month}
          total={modalData.total}
          breakdown={modalData.breakdown}
          loadingBreakdown={loadingBreakdown}
          isDark={isDark}
          onStatusClick={handleStatusClick}
        />
      )}

      {/* ── Ticket Table Drawer ── */}
      <TicketTableDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        statusKey={drawerStatusKey}
        tickets={drawerTickets}
        loading={loadingTickets}
        isDark={isDark}
        onTicketClick={handleTicketClick}
      />

      {/* ── Ticket Chat Modal (reused from ReportModule) ── */}
      <TicketChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        ticket={activeTicketForChat}
        isDark={isDark}
        theme={theme}
        formatDate={formatDate}
      />
    </Box>
  );
}
