from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from database import database
import time
import json
import asyncio
import hashlib
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font
import os
from fastapi import Query
from fastapi.responses import FileResponse
from openpyxl.styles import Font
import tempfile

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#########################Startup/Shutdown########################################################
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

###################################Cache Query##################################################
_cache = {}
_cache_expiry = {}

async def cached_query(sql, params=None, ttl=15, fetch="all", db=database):
    """
    Run cached query with support for multiple databases.
    
    Args:
        sql (str): SQL query
        params (tuple/dict): query params
        ttl (int): cache expiry in seconds
        fetch (str): "all" or "one"
        db (Database): which database object to use (default = database)
    """
    key = (id(db), sql, str(params), fetch)  
    now = time.time()

    if key in _cache and now < _cache_expiry[key]:
        return _cache[key]

    if fetch == "one":
        result = await db.fetch_one(sql, params)
    else:
        result = await db.fetch_all(sql, params)

    _cache[key] = result
    _cache_expiry[key] = now + ttl
    return result
##################################################################################################
def make_hash(data: dict):
    return hashlib.md5(
        json.dumps(data, sort_keys=True, default=str).encode()
    ).hexdigest()
###############################################################################################

# @app.websocket("/ws/uvdesk_dashboard")
# async def dashboard_ws(websocket: WebSocket):

#     await websocket.accept()

#     last_hash = None

#     try:
#         while True:

#             status_data = await cached_query(
#                 """
#                 SELECT 
#                     CASE 
#                         WHEN status_id = 1 THEN 'Open'
#                         WHEN status_id = 2 THEN 'Pending'
#                         WHEN status_id = 3 THEN 'Answered'
#                         WHEN status_id = 4 THEN 'Resolved'
#                         WHEN status_id = 5 THEN 'Closed'
#                     END AS status,

#                     SUM(
#                         CASE 
#                             WHEN DATE(created_at) = CURDATE()
#                             THEN 1 ELSE 0
#                         END
#                     ) AS today,

#                     SUM(
#                         CASE
#                             WHEN MONTH(created_at) = MONTH(CURDATE())
#                             AND YEAR(created_at) = YEAR(CURDATE())
#                             THEN 1 ELSE 0
#                         END
#                     ) AS this_month,

#                     COUNT(*) AS till_date

#                 FROM uv_ticket

#                 WHERE is_trashed != 1

#                 GROUP BY status_id
#                 ORDER BY status_id
#                 """,
#                 fetch="all"
#             )

        
#             ticket_type_summary = await cached_query(
#                 """
#                 SELECT 
#                     tt.code AS ticket_type,

#                     SUM(
#                         CASE 
#                             WHEN DATE(t.created_at) = CURDATE()
#                             THEN 1 ELSE 0
#                         END
#                     ) AS today,

#                     SUM(
#                         CASE
#                             WHEN MONTH(t.created_at) = MONTH(CURDATE())
#                             AND YEAR(t.created_at) = YEAR(CURDATE())
#                             THEN 1 ELSE 0
#                         END
#                     ) AS this_month,

#                     COUNT(*) AS till_date

#                 FROM uv_ticket t

#                 LEFT JOIN uv_ticket_type tt
#                 ON t.type_id = tt.id

#                 WHERE t.is_trashed != 1

#                 GROUP BY tt.code
#                 ORDER BY tt.code
#                 """,
#                 fetch="all"
#             )

#             # FORMAT STATUS DATA
#             formatted_status = {}

#             for row in status_data:

#                 status_name = str(row["status"]).lower()

#                 formatted_status[f"{status_name}_tickets"] = {

#                     "today": int(row["today"] or 0),

#                     "this_month": int(row["this_month"] or 0),

#                     "till_date": int(row["till_date"] or 0)
#                 }

#             #  FORMAT TICKET TYPES
#             formatted_ticket_types = []

#             for row in ticket_type_summary or []:

#                 formatted_ticket_types.append({

#                     "ticket_type": str(row["ticket_type"] or ""),

#                     "today": int(row["today"] or 0),

#                     "this_month": int(row["this_month"] or 0),

#                     "till_date": int(row["till_date"] or 0)

#                 })

#             # FINAL RESPONSE
#             data = {

#                 **formatted_status,

#                 "ticket_type_summary": formatted_ticket_types

#             }

#             # CHANGE DETECTION
#             current_hash = make_hash(data)

#             if current_hash != last_hash:

#                 await websocket.send_text(
#                     json.dumps(data, default=str)
#                 )

#                 last_hash = current_hash

#                 print("Dashboard updated")

#             else:
#                 print("No changes")

           
#             await asyncio.sleep(5)

#     except WebSocketDisconnect:

#         print("Client disconnected")

#     except Exception as e:

#         print(" WebSocket Error:", str(e))
# ######################################################################################################
# @app.websocket("/ws/agent-summary")
# async def agent_summary_ws(websocket: WebSocket):

#     await websocket.accept()

#     last_hash = None

#     try:
#         while True:

            
#             agent_summary = await cached_query(
#                 """
#                 SELECT 

#                     CONCAT(u.first_name,' ',u.last_name) AS agent_name,

#                     -- OPEN
#                     SUM(
#                         CASE 
#                             WHEN t.status_id = 1
#                             AND DATE(t.created_at) = CURDATE()
#                             THEN 1 ELSE 0
#                         END
#                     ) AS open_today,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 1
#                             AND MONTH(t.created_at) = MONTH(CURDATE())
#                             AND YEAR(t.created_at) = YEAR(CURDATE())
#                             THEN 1 ELSE 0
#                         END
#                     ) AS open_this_month,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 1
#                             THEN 1 ELSE 0
#                         END
#                     ) AS open_till_date,


#                     -- PENDING
#                     SUM(
#                         CASE 
#                             WHEN t.status_id = 2
#                             AND DATE(t.created_at) = CURDATE()
#                             THEN 1 ELSE 0
#                         END
#                     ) AS pending_today,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 2
#                             AND MONTH(t.created_at) = MONTH(CURDATE())
#                             AND YEAR(t.created_at) = YEAR(CURDATE())
#                             THEN 1 ELSE 0
#                         END
#                     ) AS pending_this_month,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 2
#                             THEN 1 ELSE 0
#                         END
#                     ) AS pending_till_date,


#                     -- RESOLVED
#                     SUM(
#                         CASE 
#                             WHEN t.status_id = 4
#                             AND DATE(t.updated_at) = CURDATE()
#                             THEN 1 ELSE 0
#                         END
#                     ) AS resolved_today,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 4
#                             AND MONTH(t.updated_at) = MONTH(CURDATE())
#                             AND YEAR(t.updated_at) = YEAR(CURDATE())
#                             THEN 1 ELSE 0
#                         END
#                     ) AS resolved_this_month,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 4
#                             THEN 1 ELSE 0
#                         END
#                     ) AS resolved_till_date,


#                     -- CLOSED
#                     SUM(
#                         CASE 
#                             WHEN t.status_id = 5
#                             AND DATE(t.updated_at) = CURDATE()
#                             THEN 1 ELSE 0
#                         END
#                     ) AS closed_today,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 5
#                             AND MONTH(t.updated_at) = MONTH(CURDATE())
#                             AND YEAR(t.updated_at) = YEAR(CURDATE())
#                             THEN 1 ELSE 0
#                         END
#                     ) AS closed_this_month,

#                     SUM(
#                         CASE
#                             WHEN t.status_id = 5
#                             THEN 1 ELSE 0
#                         END
#                     ) AS closed_till_date,


#                     COUNT(t.id) AS total_tickets

#                 FROM uv_ticket t

#                 LEFT JOIN uv_user u
#                 ON t.agent_id = u.id

#                 WHERE t.is_trashed != 1

#                 GROUP BY t.agent_id

#                 ORDER BY agent_name
#                 """,
#                 fetch="all"
#             )

#             #  FORMAT RESPONSE
#             formatted_data = []

#             for row in agent_summary or []:

#                 formatted_data.append({

#                     "agent_name": str(row["agent_name"] or ""),

#                     "open": {
#                         "today": int(row["open_today"] or 0),
#                         "this_month": int(row["open_this_month"] or 0),
#                         "till_date": int(row["open_till_date"] or 0),
#                     },

#                     "pending": {
#                         "today": int(row["pending_today"] or 0),
#                         "this_month": int(row["pending_this_month"] or 0),
#                         "till_date": int(row["pending_till_date"] or 0),
#                     },

#                     "resolved": {
#                         "today": int(row["resolved_today"] or 0),
#                         "this_month": int(row["resolved_this_month"] or 0),
#                         "till_date": int(row["resolved_till_date"] or 0),
#                     },

#                     "closed": {
#                         "today": int(row["closed_today"] or 0),
#                         "this_month": int(row["closed_this_month"] or 0),
#                         "till_date": int(row["closed_till_date"] or 0),
#                     },

#                     "total_tickets": int(row["total_tickets"] or 0)

#                 })

#             data = {
#                 "agent_wise_ticket_summary": formatted_data
#             }

#             # 🔥 CHANGE DETECTION
#             current_hash = make_hash(data)

#             if current_hash != last_hash:

#                 await websocket.send_text(
#                     json.dumps(data, default=str)
#                 )

#                 last_hash = current_hash

#                 print("📡 Agent summary updated")

#             else:
#                 print("⏸ No changes")

#             await asyncio.sleep(5)

#     except WebSocketDisconnect:
#         print("❌ Client disconnected")

#     except Exception as e:
#         print("❌ WebSocket Error:", str(e))

# ###############################################################################
# @app.post("/api/uvdesk-master-report")
# async def uvdesk_master_report(payload: dict = Body({})):

#     try:

#         # =====================================================
#         # GET FILTERS FROM PAYLOAD
#         # =====================================================

#         from_date = payload.get("from_date")
#         to_date = payload.get("to_date")

#         # =====================================================
#         # DEFAULT CURRENT MONTH FILTER
#         # =====================================================

#         if not from_date or not to_date:

#             current_date = datetime.now()

#             from_date = current_date.strftime("%Y-%m-01")

#             to_date = current_date.strftime("%Y-%m-%d")

#         # =====================================================
#         # DATE FILTER
#         # =====================================================

#         date_filter = f"""
#         AND DATE(t.created_at)
#         BETWEEN '{from_date}' AND '{to_date}'
#         """

#         # =====================================================
#         # AGENT SUMMARY
#         # =====================================================

#         agent_query = f"""
#         SELECT 

#             CONCAT(u.first_name,' ',u.last_name) AS agent_name,

#             SUM(
#                 CASE 
#                     WHEN t.status_id = 1 
#                     THEN 1 ELSE 0 
#                 END
#             ) AS open_count,

#             SUM(
#                 CASE 
#                     WHEN t.status_id = 2 
#                     THEN 1 ELSE 0 
#                 END
#             ) AS pending_count,

#             SUM(
#                 CASE 
#                     WHEN t.status_id = 3 
#                     THEN 1 ELSE 0 
#                 END
#             ) AS answered_count,

#             SUM(
#                 CASE 
#                     WHEN t.status_id = 4 
#                     THEN 1 ELSE 0 
#                 END
#             ) AS resolved_count,

#             SUM(
#                 CASE 
#                     WHEN t.status_id = 5 
#                     THEN 1 ELSE 0 
#                 END
#             ) AS closed_count,

#             COUNT(t.id) AS total_tickets

#         FROM uv_ticket t

#         LEFT JOIN uv_user u
#         ON t.agent_id = u.id

#         WHERE t.is_trashed != 1

# #         {date_filter}

# #         GROUP BY t.agent_id

# #         ORDER BY agent_name ASC
# #         """

# #         agent_summary = await cached_query(
# #             agent_query,
# #             fetch="all"
# #         )

# #         # =====================================================
# #         # TICKET MASTER REPORT
# #         # =====================================================

# #         ticket_query = f"""
# #         SELECT 

# #             CONCAT('#', t.id) AS ticket_id,

# #             t.subject AS issue,

# #             CONCAT(c.first_name,' ',c.last_name) AS added_by,

# #             DATE_FORMAT(
# #                 t.created_at,
# #                 '%d/%m/%Y %H:%i'
# #             ) AS added_date,

# #             sg.name AS project,

# #             ty.code AS type,

# #             CONCAT(a.first_name,' ',a.last_name) AS assigned_to,

# #             CASE 
# #                 WHEN t.status_id = 1 THEN 'Open'
# #                 WHEN t.status_id = 2 THEN 'Pending'
# #                 WHEN t.status_id = 3 THEN 'Answered'
# #                 WHEN t.status_id = 4 THEN 'Resolved'
# #                 WHEN t.status_id = 5 THEN 'Closed'
# #             END AS status,

# #             DATE_FORMAT(
# #                 t.updated_at,
# #                 '%d/%m/%Y %H:%i'
# #             ) AS updated_date,

# #             CASE 
# #                 WHEN t.status_id = 5
# #                 THEN DATE_FORMAT(
# #                     t.updated_at,
# #                     '%d/%m/%Y %H:%i'
# #                 )
# #                 ELSE ''
# #             END AS closed_date,

# #             CASE 
# #                 WHEN t.status_id = 5
# #                 THEN DATEDIFF(
# #                     t.updated_at,
# #                     t.created_at
# #                 )

# #                 ELSE DATEDIFF(
# #                     NOW(),
# #                     t.created_at
# #                 )
# #             END AS sla_days,

# #             ROUND(
# #                 CASE 
# #                     WHEN t.status_id = 5
# #                     THEN TIMESTAMPDIFF(
# #                         MINUTE,
# #                         t.created_at,
# #                         t.updated_at
# #                     )

# #                     ELSE TIMESTAMPDIFF(
# #                         MINUTE,
# #                         t.created_at,
# #                         NOW()
# #                     )
# #                 END / 60,
# #                 2
# #             ) AS sla_hours

# #         FROM uv_ticket t

# #         LEFT JOIN uv_user c
# #         ON t.customer_id = c.id

# #         LEFT JOIN uv_user a
# #         ON t.agent_id = a.id

# #         LEFT JOIN uv_ticket_type ty
# #         ON t.type_id = ty.id

# #         LEFT JOIN uv_support_group sg
# #         ON t.group_id = sg.id

# #         WHERE t.is_trashed != 1

# #         {date_filter}

# #         GROUP BY t.id

# #         ORDER BY t.id DESC
# #         """

# #         ticket_report = await cached_query(
# #             ticket_query,
# #             fetch="all"
# #         )

# #         # =====================================================
# #         # FORMAT AGENT SUMMARY
# #         # =====================================================

# #         formatted_agents = []

# #         for row in agent_summary or []:

# #             formatted_agents.append({

# #                 "agent_name": str(row["agent_name"] or ""),

# #                 "open": int(row["open_count"] or 0),

# #                 "pending": int(row["pending_count"] or 0),

# #                 "answered": int(row["answered_count"] or 0),

# #                 "resolved": int(row["resolved_count"] or 0),

# #                 "closed": int(row["closed_count"] or 0),

# #                 "total": int(row["total_tickets"] or 0)

# #             })

# #         # =====================================================
# #         # FORMAT TICKET REPORT
# #         # =====================================================

# #         formatted_tickets = []

# #         for row in ticket_report or []:

# #             formatted_tickets.append({

# #                 "ticket_id": str(row["ticket_id"] or ""),

# #                 "issue": str(row["issue"] or ""),

# #                 "added_by": str(row["added_by"] or ""),

# #                 "added_date": str(row["added_date"] or ""),

# #                 "project": str(row["project"] or ""),

# #                 "type": str(row["type"] or ""),

# #                 "assigned_to": str(row["assigned_to"] or ""),

# #                 "status": str(row["status"] or ""),

# #                 "updated_date": str(row["updated_date"] or ""),

# #                 "closed_date": str(row["closed_date"] or ""),

# #                 "sla_days": int(row["sla_days"] or 0),

# #                 "sla_hours": float(row["sla_hours"] or 0)

# #             })

# #         # =====================================================
# #         # FINAL RESPONSE
# #         # =====================================================

# #         return {

# #             "report_name": "UVdesk Ticket Master Report",

# #             "from_date": from_date,

# #             "to_date": to_date,

# #             "agent_wise_ticket_status_summary": formatted_agents,

# #             "ticket_master_report": formatted_tickets

# #         }

# #     except Exception as e:

# #         return {
# #             "status": False,
# #             "message": str(e)
# #         }
# # ####################################################################################################

# # from collections import defaultdict
# # from typing import Optional

# # @app.post("/api/uvdesk-agent-ticket-details")
# # async def uvdesk_agent_ticket_details(
# #     sla: Optional[int] = None   # default = NO filter
# # ):

# #     # =====================================================
# #     # GET ALL TICKETS (NO FILTER HERE)
# #     # =====================================================
# #     query = """
# #     SELECT
# #         t.id,
# #         t.agent_id,
# #         CONCAT(u.first_name, ' ', u.last_name) AS agent_name,

# #         t.subject,
# #         CONCAT(c.first_name, ' ', c.last_name) AS added_by,

# #         DATE_FORMAT(t.created_at, '%d/%m/%Y %H:%i') AS added_date,
# #         DATE_FORMAT(t.updated_at, '%d/%m/%Y %H:%i') AS updated_date,

# #         sg.name AS project_name,
# #         ty.code AS ticket_type,

# #         t.status_id,

# #         CASE
# #             WHEN t.status_id = 1 THEN 'Open'
# #             WHEN t.status_id = 2 THEN 'Pending'
# #             WHEN t.status_id = 3 THEN 'Answered'
# #             WHEN t.status_id = 4 THEN 'Resolved'
# #             WHEN t.status_id = 5 THEN 'Closed'
# #         END AS status,

# #         CASE
# #             WHEN t.status_id = 5
# #             THEN TIMESTAMPDIFF(MINUTE, t.created_at, t.updated_at) / 60
# #             ELSE TIMESTAMPDIFF(MINUTE, t.created_at, NOW()) / 60
# #         END AS sla_hours

# #     FROM uv_ticket t
# #     LEFT JOIN uv_user u ON t.agent_id = u.id
# #     LEFT JOIN uv_user c ON t.customer_id = c.id
# #     LEFT JOIN uv_ticket_type ty ON t.type_id = ty.id
# #     LEFT JOIN uv_support_group sg ON t.group_id = sg.id

# #     WHERE t.is_trashed != 1
# #     """

# #     rows = await database.fetch_all(query=query)

# #     # =====================================================
# #     # GROUPING
# #     # =====================================================
# #     agents = {}

# #     for r in rows:
# #         r = dict(r)
# #         aid = r["agent_id"]

# #         # -------------------------------
# #         # SLA FILTER APPLIED HERE ONLY
# #         # -------------------------------
# #         if sla is not None and r["sla_hours"] <= sla:
# #             continue

# #         if aid not in agents:
# #             agents[aid] = {
# #                 "agent_id": aid,
# #                 "agent_name": r["agent_name"],
# #                 "summary": {
# #                     "open": 0,
# #                     "pending": 0,
# #                     "answered": 0,
# #                     "resolved": 0,
# #                     "closed": 0,
# #                     "active": 0,
# #                     "total": 0
# #                 },
# #                 "tickets": []
# #             }

# #         # ================================
# #         # SUMMARY CALCULATION
# #         # ================================
# #         if r["status_id"] == 1:
# #             agents[aid]["summary"]["open"] += 1
# #         elif r["status_id"] == 2:
# #             agents[aid]["summary"]["pending"] += 1
# #         elif r["status_id"] == 3:
# #             agents[aid]["summary"]["answered"] += 1
# #         elif r["status_id"] == 4:
# #             agents[aid]["summary"]["resolved"] += 1
# #         elif r["status_id"] == 5:
# #             agents[aid]["summary"]["closed"] += 1

# #         agents[aid]["summary"]["total"] += 1

# #         agents[aid]["tickets"].append({
# #             "ticket_id": f"#{r['id']}",
# #             "issue": r["subject"],
# #             "added_by": r["added_by"],
# #             "added_date": r["added_date"],
# #             "project": r["project_name"],
# #             "type": r["ticket_type"],
# #             "status": r["status"],
# #             "updated_date": r["updated_date"],
# #             "sla_hours": round(r["sla_hours"], 2)
# #         })

# #     # ================================
# #     # ACTIVE CALCULATION
# #     # ================================
# #     for a in agents.values():
# #         a["summary"]["active"] = (
# #             a["summary"]["open"] +
# #             a["summary"]["pending"] +
# #             a["summary"]["answered"]
# #         )

# #     return {
# #         "status": True,
# #         "sla_filter": sla,
# #         "total_agents": len(agents),
# #         "data": list(agents.values())
# #     }

from pydantic import BaseModel
from typing import Optional
from collections import defaultdict
from datetime import datetime


class AgentSummaryRequest(BaseModel):
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    sla_filter: Optional[str] = "all"   # all | gt_48 | lt_48


@app.post("/api/uvdesk-agent-summary")
async def uvdesk_agent_summary(payload: AgentSummaryRequest):

    try:

        query = """
        SELECT
            t.agent_id,
            CONCAT(u.first_name, ' ', u.last_name) AS agent_name,
            t.status_id,
            t.created_at,

            CASE
                WHEN t.status_id = 5
                THEN TIMESTAMPDIFF(HOUR, t.created_at, t.updated_at)
                ELSE TIMESTAMPDIFF(HOUR, t.created_at, NOW())
            END AS sla_hours

        FROM uv_ticket t
        LEFT JOIN uv_user u ON t.agent_id = u.id
        WHERE t.is_trashed != 1
        """

        rows = await database.fetch_all(query=query)

        agents = defaultdict(lambda: {
            "agent_id": None,
            "agent_name": "",
            "summary": {
                "open": 0,
                "pending": 0,
                "answered": 0,
                "resolved": 0,
                "closed": 0,
                "active": 0,
                "total": 0
            }
        })

        for row in rows:

            r = dict(row)

            # ==========================
            # DATE FILTER
            # ==========================
            if payload.from_date and payload.to_date:

                created_date = r["created_at"].date()

                fd = datetime.strptime(
                    payload.from_date,
                    "%Y-%m-%d"
                ).date()

                td = datetime.strptime(
                    payload.to_date,
                    "%Y-%m-%d"
                ).date()

                if not (fd <= created_date <= td):
                    continue

            # ==========================
            # SLA FILTER
            # ==========================
            sla_hours = r["sla_hours"] or 0

            if payload.sla_filter == "gt_48" and sla_hours <= 48:
                continue

            if payload.sla_filter == "lt_48" and sla_hours >= 48:
                continue

            aid = r["agent_id"]

            if agents[aid]["agent_id"] is None:
                agents[aid]["agent_id"] = aid
                agents[aid]["agent_name"] = r["agent_name"]

            status = r["status_id"]

            if status == 1:
                agents[aid]["summary"]["open"] += 1

            elif status == 2:
                agents[aid]["summary"]["pending"] += 1

            elif status == 3:
                agents[aid]["summary"]["answered"] += 1

            elif status == 4:
                agents[aid]["summary"]["resolved"] += 1

            elif status == 5:
                agents[aid]["summary"]["closed"] += 1

            agents[aid]["summary"]["total"] += 1

        # ==========================
        # ACTIVE COUNT
        # ==========================
        for aid in agents:
            s = agents[aid]["summary"]

            s["active"] = (
                s["open"]
                + s["pending"]
                + s["answered"]
            )

        return {
            "status": True,
            "filters": {
                "from_date": payload.from_date,
                "to_date": payload.to_date,
                "sla_filter": payload.sla_filter
            },
            "total_agents": len(agents),
            "data": list(agents.values())
        }

    except Exception as e:
        return {
            "status": False,
            "message": str(e)
        }
    
#################################################################################################
from fastapi import Body
from datetime import datetime
from collections import defaultdict
from pydantic import BaseModel

# =========================
# REQUEST MODEL
# =========================
class AgentReportRequest(BaseModel):
    from_date: str | None = None
    to_date: str | None = None
    sla_type: str | None = None   # gt_48 | lt_48 | None
    agent_name: str | None = None


# =========================
# API
# =========================
@app.post("/api/uvdesk-agent")
async def uvdesk_agent_summary(payload: AgentReportRequest = AgentReportRequest()):

    from_date = payload.from_date
    to_date = payload.to_date
    sla_type = payload.sla_type
    agent_filter = payload.agent_name

    # =========================
    # SQL QUERY (FIXED - NO WRONG COLUMNS)
    # =========================
    query = """
    SELECT
        t.id AS ticket_id,
        t.subject AS issue,
        t.agent_id,
        CONCAT(a.first_name, ' ', a.last_name) AS agent_name,
        CONCAT(c.first_name, ' ', c.last_name) AS added_by,
        t.created_at,
        t.updated_at,
        t.status_id,
        sg.name AS project_name,
        ty.code AS ticket_type,

        CASE
            WHEN t.status_id = 5
            THEN TIMESTAMPDIFF(HOUR, t.created_at, t.updated_at)
            ELSE TIMESTAMPDIFF(HOUR, t.created_at, NOW())
        END AS sla_hours

    FROM uv_ticket t
    LEFT JOIN uv_user a ON t.agent_id = a.id
    LEFT JOIN uv_user c ON t.customer_id = c.id
    LEFT JOIN uv_ticket_type ty ON t.type_id = ty.id
    LEFT JOIN uv_support_group sg ON t.group_id = sg.id
    WHERE t.is_trashed != 1
    """

    rows = await database.fetch_all(query=query)

    agents = defaultdict(lambda: {
        "agent_id": None,
        "agent_name": "",
        "summary": {
            "open": 0,
            "pending": 0,
            "answered": 0,
            "resolved": 0,
            "closed": 0,
            "total": 0
        },
        "tickets": []
    })

    # =========================
    # PROCESS DATA
    # =========================
    for r in rows:
        r = dict(r)

        sla_hours = float(r["sla_hours"] or 0)

        # -------------------------
        # SLA FILTER
        # -------------------------
        if sla_type == "gt_48" and sla_hours <= 48:
            continue
        if sla_type == "lt_48" and sla_hours >= 48:
            continue

        # -------------------------
        # DATE FILTER
        # -------------------------
        if from_date and to_date:
            fd = datetime.strptime(from_date, "%Y-%m-%d").date()
            td = datetime.strptime(to_date, "%Y-%m-%d").date()
            created = r["created_at"].date()

            if not (fd <= created <= td):
                continue

        # -------------------------
        # AGENT FILTER (NEW)
        # -------------------------
        if agent_filter:
            if r["agent_name"] != agent_filter:
                continue

        aid = r["agent_id"]

        # init agent
        if agents[aid]["agent_id"] is None:
            agents[aid]["agent_id"] = aid
            agents[aid]["agent_name"] = r["agent_name"]

        # -------------------------
        # STATUS MAP
        # -------------------------
        status_id = r["status_id"]

        if status_id == 1:
            status = "Open"
            agents[aid]["summary"]["open"] += 1
        elif status_id == 2:
            status = "Pending"
            agents[aid]["summary"]["pending"] += 1
        elif status_id == 3:
            status = "Answered"
            agents[aid]["summary"]["answered"] += 1
        elif status_id == 4:
            status = "Resolved"
            agents[aid]["summary"]["resolved"] += 1
        elif status_id == 5:
            status = "Closed"
            agents[aid]["summary"]["closed"] += 1
        else:
            status = "Unknown"

        agents[aid]["summary"]["total"] += 1

        # -------------------------
        # FINAL TICKET FORMAT
        # -------------------------
        agents[aid]["tickets"].append({
            "ticket_id": f"#{r['ticket_id']}",
            "issue": r["issue"],
            "added_by": r["added_by"],
            "added_date": r["created_at"].isoformat() if r["created_at"] else None,
            "project": r["project_name"],
            "type": r["ticket_type"],
            "assigned_to": r["agent_name"],
            "status": status,
            "updated_date": r["updated_at"].isoformat() if r["updated_at"] else None,
            "closed_date": r["updated_at"].isoformat() if status_id == 5 else None,
            "sla_hours": round(sla_hours, 2),
            "sla_days": round(sla_hours / 24, 2)
        })

    # =========================
    # RESPONSE
    # =========================
    result = list(agents.values())

    return {
        "status": True,
        "filters": {
            "from_date": from_date,
            "to_date": to_date,
            "sla_type": sla_type,
            "agent_name": agent_filter
        },
        "total_agents": len(result),
        "data": result
    }