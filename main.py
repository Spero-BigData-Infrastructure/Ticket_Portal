from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from database import database
import time
import json
import asyncio
import hashlib
from io import BytesIO
from datetime import datetime
import base64
from openpyxl import Workbook
from openpyxl.styles import Font
import os
import tempfile
from pydantic import BaseModel
from typing import Optional
from collections import defaultdict

app = FastAPI()

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost,http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
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

@app.websocket("/ws/uvdesk_dashboard")
async def dashboard_ws(websocket: WebSocket):

    await websocket.accept()

    last_hash = None

    try:
        while True:

            # =====================================================
            # STATUS SUMMARY
            # =====================================================

            status_data = await cached_query(
                """
                SELECT
                    CASE
                        WHEN status_id = 1 THEN 'Open'
                        WHEN status_id = 2 THEN 'Pending'
                        WHEN status_id = 3 THEN 'Answered'
                        WHEN status_id = 4 THEN 'Resolved'
                        WHEN status_id = 5 THEN 'Closed'
                    END AS status,

                    SUM(
                        CASE
                            WHEN t.status_id IN (1, 2, 3) AND DATE(t.created_at) = CURDATE()
                                THEN 1
                            WHEN t.status_id IN (4, 5) AND DATE(t.updated_at) = CURDATE()
                                THEN 1
                            ELSE 0
                        END
                    ) AS today,

                    SUM(
                        CASE
                            WHEN t.status_id IN (1, 2, 3)
                                AND MONTH(t.created_at) = MONTH(CURDATE())
                                AND YEAR(t.created_at) = YEAR(CURDATE())
                                THEN 1
                            WHEN t.status_id IN (4, 5)
                                AND MONTH(t.updated_at) = MONTH(CURDATE())
                                AND YEAR(t.updated_at) = YEAR(CURDATE())
                                THEN 1
                            ELSE 0
                        END
                    ) AS this_month,

                    COUNT(*) AS till_date

                FROM uv_ticket t

                INNER JOIN uv_user u
                ON t.agent_id = u.id
                AND u.is_enabled != 2

                WHERE t.is_trashed != 1

                GROUP BY t.status_id
                ORDER BY t.status_id
                """,
                fetch="all"
            )

            # =====================================================
            # TICKET TYPE SUMMARY
            # =====================================================

            ticket_type_summary = await cached_query(
                """
                SELECT
                    tt.code AS ticket_type,

                    SUM(
                        CASE
                            WHEN t.status_id IN (1, 2, 3) AND DATE(t.created_at) = CURDATE()
                                THEN 1
                            WHEN t.status_id IN (4, 5) AND DATE(t.updated_at) = CURDATE()
                                THEN 1
                            ELSE 0
                        END
                    ) AS today,

                    SUM(
                        CASE
                            WHEN t.status_id IN (1, 2, 3)
                                AND MONTH(t.created_at) = MONTH(CURDATE())
                                AND YEAR(t.created_at) = YEAR(CURDATE())
                                THEN 1
                            WHEN t.status_id IN (4, 5)
                                AND MONTH(t.updated_at) = MONTH(CURDATE())
                                AND YEAR(t.updated_at) = YEAR(CURDATE())
                                THEN 1
                            ELSE 0
                        END
                    ) AS this_month,

                    COUNT(*) AS till_date

                FROM uv_ticket t

                LEFT JOIN uv_ticket_type tt
                ON t.type_id = tt.id

                INNER JOIN uv_user u
                ON t.agent_id = u.id
                AND u.is_enabled != 2

                WHERE t.is_trashed != 1

                GROUP BY tt.code
                ORDER BY tt.code
                """,
                fetch="all"
            )

            # =====================================================
            # FORMAT STATUS DATA
            # =====================================================

            formatted_status = {}

            total_today = 0
            total_this_month = 0
            total_till_date = 0

            active_today = 0
            active_this_month = 0
            active_till_date = 0

            for row in status_data:

                status_name = str(row["status"]).lower()

                today = int(row["today"] or 0)
                this_month = int(row["this_month"] or 0)
                till_date = int(row["till_date"] or 0)

                formatted_status[f"{status_name}_tickets"] = {

                    "today": today,

                    "this_month": this_month,

                    "till_date": till_date
                }

                # =========================================
                # TOTAL TICKETS
                # =========================================

                total_today += today
                total_this_month += this_month
                total_till_date += till_date

                # =========================================
                # ACTIVE TICKETS
                # OPEN + PENDING + ANSWERED
                # =========================================

                if status_name in ["open", "pending", "answered"]:

                    active_today += today
                    active_this_month += this_month
                    active_till_date += till_date

            # =====================================================
            # ADD TOTAL TICKETS
            # =====================================================

            total_tickets = {

                "today": total_today,

                "this_month": total_this_month,

                "till_date": total_till_date
            }

            # =====================================================
            # ADD ACTIVE TICKETS
            # =====================================================

            active_tickets = {

                "today": active_today,

                "this_month": active_this_month,

                "till_date": active_till_date
            }

            # =====================================================
            # FORMAT TICKET TYPES
            # =====================================================

            formatted_ticket_types = []

            for row in ticket_type_summary or []:

                formatted_ticket_types.append({

                    "ticket_type": str(row["ticket_type"] or ""),

                    "today": int(row["today"] or 0),

                    "this_month": int(row["this_month"] or 0),

                    "till_date": int(row["till_date"] or 0)

                })

            # =====================================================
            # FINAL RESPONSE
            # =====================================================

            data = {

                "total_tickets": total_tickets,

                **formatted_status,

                "active_tickets": active_tickets,

                "ticket_type_summary": formatted_ticket_types

            }

            # =====================================================
            # CHANGE DETECTION
            # =====================================================

            current_hash = make_hash(data)

            if current_hash != last_hash:

                await websocket.send_text(
                    json.dumps(data, default=str)
                )

                last_hash = current_hash

                print("Dashboard updated")

            else:

                print("No changes")

            await asyncio.sleep(5)

    except WebSocketDisconnect:

        print("Client disconnected")

    except Exception as e:

        print("WebSocket Error:", str(e))


#############################################PROJECT SUMMARY############################################################
@app.get("/api/project-summary")
async def project_summary_api():

    try:

        project_summary = await cached_query(
            """
            SELECT

                st.id AS project_id,

                st.name AS project_name,

                -- OPEN
                SUM(
                    CASE
                        WHEN t.status_id = 1
                        AND DATE(t.created_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS open_today,

                SUM(
                    CASE
                        WHEN t.status_id = 1
                        AND MONTH(t.created_at) = MONTH(CURDATE())
                        AND YEAR(t.created_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS open_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 1
                        THEN 1 ELSE 0
                    END
                ) AS open_till_date,


                -- PENDING
                SUM(
                    CASE
                        WHEN t.status_id = 2
                        AND DATE(t.created_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS pending_today,

                SUM(
                    CASE
                        WHEN t.status_id = 2
                        AND MONTH(t.created_at) = MONTH(CURDATE())
                        AND YEAR(t.created_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS pending_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 2
                        THEN 1 ELSE 0
                    END
                ) AS pending_till_date,


                -- ANSWERED
                SUM(
                    CASE
                        WHEN t.status_id = 3
                        AND DATE(t.created_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS answered_today,

                SUM(
                    CASE
                        WHEN t.status_id = 3
                        AND MONTH(t.created_at) = MONTH(CURDATE())
                        AND YEAR(t.created_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS answered_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 3
                        THEN 1 ELSE 0
                    END
                ) AS answered_till_date,


                -- RESOLVED
                SUM(
                    CASE
                        WHEN t.status_id = 4
                        AND DATE(t.updated_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS resolved_today,

                SUM(
                    CASE
                        WHEN t.status_id = 4
                        AND MONTH(t.updated_at) = MONTH(CURDATE())
                        AND YEAR(t.updated_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS resolved_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 4
                        THEN 1 ELSE 0
                    END
                ) AS resolved_till_date,


                -- CLOSED
                SUM(
                    CASE
                        WHEN t.status_id = 5
                        AND DATE(t.updated_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS closed_today,

                SUM(
                    CASE
                        WHEN t.status_id = 5
                        AND MONTH(t.updated_at) = MONTH(CURDATE())
                        AND YEAR(t.updated_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS closed_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 5
                        THEN 1 ELSE 0
                    END
                ) AS closed_till_date

            FROM uv_support_team st

            LEFT JOIN uv_ticket t
            ON (
                t.subject LIKE CONCAT('%',

                    CASE

                        WHEN st.name LIKE '%MP%'
                        THEN 'MPEms'

                        WHEN st.name LIKE '%MHEMS%'
                        THEN 'MHEms'

                        WHEN st.name LIKE '%DMS%'
                        THEN 'DMS'

                        WHEN st.name LIKE '%UNIM%'
                        THEN 'UNIM'

                        WHEN st.name LIKE '%HHC%'
                        THEN 'HHC'

                        WHEN st.name LIKE '%Raipur%'
                        THEN 'Raipur'

                        WHEN st.name LIKE '%ALF%'
                        THEN 'ALF'

                        ELSE st.name

                    END,

                '%')
            )

            LEFT JOIN uv_user u
            ON t.agent_id = u.id

            WHERE t.is_trashed != 1
            AND u.is_enabled != 2

            GROUP BY st.id, st.name

            ORDER BY st.name
            """,
            fetch="all"
        )

        formatted_data = []

        for row in project_summary or []:

            # =====================================
            # ACTIVE TICKETS
            # =====================================

            active_today = (
                int(row["open_today"] or 0)
                + int(row["pending_today"] or 0)
                + int(row["answered_today"] or 0)
            )

            active_this_month = (
                int(row["open_this_month"] or 0)
                + int(row["pending_this_month"] or 0)
                + int(row["answered_this_month"] or 0)
            )

            active_till_date = (
                int(row["open_till_date"] or 0)
                + int(row["pending_till_date"] or 0)
                + int(row["answered_till_date"] or 0)
            )

            # =====================================
            # TOTAL TICKETS
            # =====================================

            total_today = (
                int(row["open_today"] or 0)
                + int(row["pending_today"] or 0)
                + int(row["answered_today"] or 0)
                + int(row["resolved_today"] or 0)
                + int(row["closed_today"] or 0)
            )

            total_this_month = (
                int(row["open_this_month"] or 0)
                + int(row["pending_this_month"] or 0)
                + int(row["answered_this_month"] or 0)
                + int(row["resolved_this_month"] or 0)
                + int(row["closed_this_month"] or 0)
            )

            total_till_date = (
                int(row["open_till_date"] or 0)
                + int(row["pending_till_date"] or 0)
                + int(row["answered_till_date"] or 0)
                + int(row["resolved_till_date"] or 0)
                + int(row["closed_till_date"] or 0)
            )

            formatted_data.append({

                "project_id": int(row["project_id"] or 0),

                "project_name": str(row["project_name"] or ""),

                "total_tickets": {
                    "today": total_today,
                    "this_month": total_this_month,
                    "till_date": total_till_date
                },

                "open": {
                    "today": int(row["open_today"] or 0),
                    "this_month": int(row["open_this_month"] or 0),
                    "till_date": int(row["open_till_date"] or 0),
                },

                "pending": {
                    "today": int(row["pending_today"] or 0),
                    "this_month": int(row["pending_this_month"] or 0),
                    "till_date": int(row["pending_till_date"] or 0),
                },

                "answered": {
                    "today": int(row["answered_today"] or 0),
                    "this_month": int(row["answered_this_month"] or 0),
                    "till_date": int(row["answered_till_date"] or 0),
                },

                "resolved": {
                    "today": int(row["resolved_today"] or 0),
                    "this_month": int(row["resolved_this_month"] or 0),
                    "till_date": int(row["resolved_till_date"] or 0),
                },

                "closed": {
                    "today": int(row["closed_today"] or 0),
                    "this_month": int(row["closed_this_month"] or 0),
                    "till_date": int(row["closed_till_date"] or 0),
                },

                "active_tickets": {
                    "today": active_today,
                    "this_month": active_this_month,
                    "till_date": active_till_date
                }

            })

        return {
            "status": True,
            "project_wise_ticket_summary": formatted_data
        }

    except Exception as e:

        return {
            "status": False,
            "message": str(e)
        }

#########################################project wise agent summary###############################################################
@app.get("/api/project-agent-summary")
async def project_agent_summary_api(project_id: int):
    try:

    
        # =====================================
        # GET PROJECT NAME
        # =====================================

        project_query = """
            SELECT name
            FROM uv_support_team
            WHERE id = :project_id
            LIMIT 1
        """

        project_row = await cached_query(
            project_query,
            values={"project_id": project_id},
            fetch="one"
        )

        if not project_row:
            return {
                "status": False,
                "message": "Project not found"
            }

        project_name = str(project_row["name"] or "").strip()

        # =====================================
        # PROJECT KEYWORD LOGIC
        # =====================================

        project_keyword = (
            project_name
            .replace("Spero", "")
            .replace("-", "")
            .replace("Goa", "")
            .replace("Project", "")
            .strip()
        )

        # Special cases
        if "MP" in project_name:
            project_keyword = "MPEms"

        elif "MHEMS" in project_name.upper():
            project_keyword = "MHEms"

        elif "DMS" in project_name.upper():
            project_keyword = "DMS"

        elif "UNIM" in project_name.upper():
            project_keyword = "UNIM"

        elif "HHC" in project_name.upper():
            project_keyword = "HHC"

        elif "RAIPUR" in project_name.upper():
            project_keyword = "Raipur"

        # =====================================
        # MAIN QUERY
        # =====================================

        query = """
            SELECT

                %s AS project_id,

                %s AS project_name,

                CONCAT(u.first_name, ' ', u.last_name) AS agent_name,

                -- OPEN
                SUM(
                    CASE
                        WHEN t.status_id = 1
                        AND DATE(t.created_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS open_today,

                SUM(
                    CASE
                        WHEN t.status_id = 1
                        AND MONTH(t.created_at) = MONTH(CURDATE())
                        AND YEAR(t.created_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS open_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 1
                        THEN 1 ELSE 0
                    END
                ) AS open_till_date,

                -- PENDING
                SUM(
                    CASE
                        WHEN t.status_id = 2
                        AND DATE(t.created_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS pending_today,

                SUM(
                    CASE
                        WHEN t.status_id = 2
                        AND MONTH(t.created_at) = MONTH(CURDATE())
                        AND YEAR(t.created_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS pending_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 2
                        THEN 1 ELSE 0
                    END
                ) AS pending_till_date,

                -- ANSWERED
                SUM(
                    CASE
                        WHEN t.status_id = 3
                        AND DATE(t.created_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS answered_today,

                SUM(
                    CASE
                        WHEN t.status_id = 3
                        AND MONTH(t.created_at) = MONTH(CURDATE())
                        AND YEAR(t.created_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS answered_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 3
                        THEN 1 ELSE 0
                    END
                ) AS answered_till_date,

                -- RESOLVED
                SUM(
                    CASE
                        WHEN t.status_id = 4
                        AND DATE(t.updated_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS resolved_today,

                SUM(
                    CASE
                        WHEN t.status_id = 4
                        AND MONTH(t.updated_at) = MONTH(CURDATE())
                        AND YEAR(t.updated_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS resolved_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 4
                        THEN 1 ELSE 0
                    END
                ) AS resolved_till_date,

                -- CLOSED
                SUM(
                    CASE
                        WHEN t.status_id = 5
                        AND DATE(t.updated_at) = CURDATE()
                        THEN 1 ELSE 0
                    END
                ) AS closed_today,

                SUM(
                    CASE
                        WHEN t.status_id = 5
                        AND MONTH(t.updated_at) = MONTH(CURDATE())
                        AND YEAR(t.updated_at) = YEAR(CURDATE())
                        THEN 1 ELSE 0
                    END
                ) AS closed_this_month,

                SUM(
                    CASE
                        WHEN t.status_id = 5
                        THEN 1 ELSE 0
                    END
                ) AS closed_till_date

            FROM uv_ticket t

            LEFT JOIN uv_user u
            ON t.agent_id = u.id

            WHERE t.is_trashed != 1
            AND t.agent_id IS NOT NULL
            AND u.is_enabled != 2
            AND t.subject LIKE CONCAT('%', %s, '%')

            GROUP BY t.agent_id

            ORDER BY agent_name
        """

        rows = await cached_query(
            query,
            fetch="all"
        )

        agents = []

        for row in rows or []:

            active_today = (
                int(row["open_today"] or 0)
                + int(row["pending_today"] or 0)
                + int(row["answered_today"] or 0)
            )

            active_this_month = (
                int(row["open_this_month"] or 0)
                + int(row["pending_this_month"] or 0)
                + int(row["answered_this_month"] or 0)
            )

            active_till_date = (
                int(row["open_till_date"] or 0)
                + int(row["pending_till_date"] or 0)
                + int(row["answered_till_date"] or 0)
            )

            total_today = (
                int(row["open_today"] or 0)
                + int(row["pending_today"] or 0)
                + int(row["answered_today"] or 0)
                + int(row["resolved_today"] or 0)
                + int(row["closed_today"] or 0)
            )

            total_this_month = (
                int(row["open_this_month"] or 0)
                + int(row["pending_this_month"] or 0)
                + int(row["answered_this_month"] or 0)
                + int(row["resolved_this_month"] or 0)
                + int(row["closed_this_month"] or 0)
            )

            total_till_date = (
                int(row["open_till_date"] or 0)
                + int(row["pending_till_date"] or 0)
                + int(row["answered_till_date"] or 0)
                + int(row["resolved_till_date"] or 0)
                + int(row["closed_till_date"] or 0)
            )

            agents.append({

                "agent_name": str(row["agent_name"] or ""),

                "total_tickets": {
                    "today": total_today,
                    "this_month": total_this_month,
                    "till_date": total_till_date
                },

                "open": {
                    "today": int(row["open_today"] or 0),
                    "this_month": int(row["open_this_month"] or 0),
                    "till_date": int(row["open_till_date"] or 0)
                },

                "pending": {
                    "today": int(row["pending_today"] or 0),
                    "this_month": int(row["pending_this_month"] or 0),
                    "till_date": int(row["pending_till_date"] or 0)
                },

                "answered": {
                    "today": int(row["answered_today"] or 0),
                    "this_month": int(row["answered_this_month"] or 0),
                    "till_date": int(row["answered_till_date"] or 0)
                },

                "resolved": {
                    "today": int(row["resolved_today"] or 0),
                    "this_month": int(row["resolved_this_month"] or 0),
                    "till_date": int(row["resolved_till_date"] or 0)
                },

                "closed": {
                    "today": int(row["closed_today"] or 0),
                    "this_month": int(row["closed_this_month"] or 0),
                    "till_date": int(row["closed_till_date"] or 0)
                },

                "active_tickets": {
                    "today": active_today,
                    "this_month": active_this_month,
                    "till_date": active_till_date
                }

            })

        return {
            "status": True,
            "project_id": project_id,
            "project_name": project_name,
            "agents": agents
        }

    except Exception as e:
        return {
            "status": False,
            "message": str(e)
        }







#########################################UVDESK AGENT#############################################################
# class AgentReportRequest(BaseModel):
#     from_date: str | None = None
#     to_date: str | None = None
#     sla_type: str | None = None
#     agent_name: str | None = None


# @app.post("/api/uvdesk-agent")
# async def uvdesk_agent_summary(
#     payload: AgentReportRequest = Body(
#         default_factory=AgentReportRequest
#     )
# ):

#     from_date = payload.from_date
#     to_date = payload.to_date
#     sla_type = payload.sla_type
#     agent_filter = payload.agent_name

#     query = """
#     SELECT
#         t.id AS ticket_id,
#         t.subject AS issue,
#         t.agent_id,
#         CONCAT(a.first_name, ' ', a.last_name) AS agent_name,
#         CONCAT(c.first_name, ' ', c.last_name) AS added_by,
#         t.created_at,
#         t.updated_at,
#         t.status_id,
#         sg.name AS project_name,
#         ty.code AS ticket_type,

#         CASE
#             WHEN t.status_id = 5
#             THEN TIMESTAMPDIFF(HOUR, t.created_at, t.updated_at)
#             ELSE TIMESTAMPDIFF(HOUR, t.created_at, NOW())
#         END AS sla_hours

#     FROM uv_ticket t
#     LEFT JOIN uv_user a ON t.agent_id = a.id
#     LEFT JOIN uv_user c ON t.customer_id = c.id
#     LEFT JOIN uv_ticket_type ty ON t.type_id = ty.id
#     LEFT JOIN uv_support_group sg ON t.group_id = sg.id

#     WHERE t.is_trashed != 1
#     """

#     rows = await database.fetch_all(query=query)

#     agents = defaultdict(lambda: {
#         "agent_id": None,
#         "agent_name": "",
#         "summary": {
#             "open": 0,
#             "pending": 0,
#             "answered": 0,
#             "resolved": 0,
#             "closed": 0,
#             "total": 0
#         },
#         "tickets": []
#     })

#     for r in rows:

#         r = dict(r)

#         sla_hours = float(r["sla_hours"] or 0)

#         # SLA FILTER

#         if sla_type == "gt_48" and sla_hours <= 48:
#             continue

#         if sla_type == "lt_48" and sla_hours >= 48:
#             continue

#         # DATE FILTER

#         if from_date and to_date:

#             fd = datetime.strptime(
#                 from_date,
#                 "%Y-%m-%d"
#             ).date()

#             td = datetime.strptime(
#                 to_date,
#                 "%Y-%m-%d"
#             ).date()

#             created = r["created_at"].date()

#             if not (fd <= created <= td):
#                 continue

#         # AGENT FILTER

#         if agent_filter:

#             if r["agent_name"] != agent_filter:
#                 continue

#         aid = r["agent_id"]

#         if agents[aid]["agent_id"] is None:

#             agents[aid]["agent_id"] = aid

#             agents[aid]["agent_name"] = (
#                 r["agent_name"] or ""
#             )

#         status_id = r["status_id"]

#         if status_id == 1:
#             status = "Open"
#             agents[aid]["summary"]["open"] += 1

#         elif status_id == 2:
#             status = "Pending"
#             agents[aid]["summary"]["pending"] += 1

#         elif status_id == 3:
#             status = "Answered"
#             agents[aid]["summary"]["answered"] += 1

#         elif status_id == 4:
#             status = "Resolved"
#             agents[aid]["summary"]["resolved"] += 1

#         elif status_id == 5:
#             status = "Closed"
#             agents[aid]["summary"]["closed"] += 1

#         else:
#             status = "Unknown"

#         agents[aid]["summary"]["total"] += 1

#         agents[aid]["tickets"].append({

#             "ticket_id": f"#{r['ticket_id']}",

#             "issue": r["issue"],

#             "added_by": r["added_by"],

#             "added_date": (
#                 r["created_at"].isoformat()
#                 if r["created_at"] else None
#             ),

#             "project": r["project_name"],

#             "type": r["ticket_type"],

#             "assigned_to": r["agent_name"],

#             "status": status,

#             "updated_date": (
#                 r["updated_at"].isoformat()
#                 if r["updated_at"] else None
#             ),

#             "closed_date": (
#                 r["updated_at"].isoformat()
#                 if status_id == 5
#                 else None
#             ),

#             "sla_hours": round(
#                 sla_hours,
#                 2
#             ),

#             "sla_days": round(
#                 sla_hours / 24,
#                 2
#             )
#         })

#     result = list(agents.values())

#     return {

#         "status": True,

#         "filters": {
#             "from_date": from_date,
#             "to_date": to_date,
#             "sla_type": sla_type,
#             "agent_name": agent_filter
#         },

#         "total_agents": len(result),

#         "data": result
#     }

class AgentReportRequest(BaseModel):
    from_date: str | None = None
    to_date: str | None = None
    sla_type: str | None = None
    agent_id: int | None = None


# =========================================================
# AGENT REPORT API
# =========================================================

@app.post("/api/uvdesk-agent")
async def uvdesk_agent_summary(
    payload: AgentReportRequest = Body(
        default_factory=AgentReportRequest
    )
):

    from_date = payload.from_date
    to_date = payload.to_date
    sla_type = payload.sla_type
    agent_filter = payload.agent_id

    query = """
    SELECT
        t.id AS ticket_id,
        t.subject AS issue,

        t.agent_id,

        CONCAT(
            a.first_name,
            ' ',
            a.last_name
        ) AS agent_name,

        CONCAT(
            c.first_name,
            ' ',
            c.last_name
        ) AS added_by,

        t.created_at,
        t.updated_at,

        t.status_id,

        sg.name AS project_name,

        ty.code AS ticket_type,

        CASE
            WHEN t.status_id = 5
            THEN TIMESTAMPDIFF(
                HOUR,
                t.created_at,
                t.updated_at
            )
            ELSE TIMESTAMPDIFF(
                HOUR,
                t.created_at,
                NOW()
            )
        END AS sla_hours

    FROM uv_ticket t

    INNER JOIN uv_user a
    ON t.agent_id = a.id
    AND a.is_enabled != 2

    LEFT JOIN uv_user c
    ON t.customer_id = c.id

    LEFT JOIN uv_ticket_type ty
    ON t.type_id = ty.id

    LEFT JOIN uv_support_group sg
    ON t.group_id = sg.id

    WHERE t.is_trashed != 1
    """

    rows = await database.fetch_all(
        query=query
    )

    agents = defaultdict(
        lambda: {
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
        }
    )

    for r in rows:

        r = dict(r)

        sla_hours = float(
            r["sla_hours"] or 0
        )

        # =====================================
        # SLA FILTER
        # =====================================

        if (
            sla_type == "gt_48"
            and sla_hours <= 48
        ):
            continue

        if (
            sla_type == "lt_48"
            and sla_hours >= 48
        ):
            continue

        # =====================================
        # DATE FILTER
        # =====================================

        if from_date and to_date:

            fd = datetime.strptime(
                from_date,
                "%Y-%m-%d"
            ).date()

            td = datetime.strptime(
                to_date,
                "%Y-%m-%d"
            ).date()

            if r["status_id"] in (4, 5):
                date_to_check = (
                    r["updated_at"].date()
                    if r["updated_at"]
                    else r["created_at"].date()
                )
            else:
                date_to_check = (
                    r["created_at"].date()
                )

            if not (
                fd <= date_to_check <= td
            ):
                continue

        # =====================================
        # AGENT ID FILTER
        # =====================================

        if agent_filter is not None:

            if (
                r["agent_id"]
                != agent_filter
            ):
                continue

        aid = r["agent_id"]

        if (
            agents[aid]["agent_id"]
            is None
        ):

            agents[aid]["agent_id"] = aid

            agents[aid]["agent_name"] = (
                r["agent_name"] or ""
            )

        status_id = r["status_id"]

        if status_id == 1:

            status = "Open"

            agents[aid]["summary"][
                "open"
            ] += 1

        elif status_id == 2:

            status = "Pending"

            agents[aid]["summary"][
                "pending"
            ] += 1

        elif status_id == 3:

            status = "Answered"

            agents[aid]["summary"][
                "answered"
            ] += 1

        elif status_id == 4:

            status = "Resolved"

            agents[aid]["summary"][
                "resolved"
            ] += 1

        elif status_id == 5:

            status = "Closed"

            agents[aid]["summary"][
                "closed"
            ] += 1

        else:

            status = "Unknown"

        agents[aid]["summary"][
            "total"
        ] += 1

        agents[aid]["tickets"].append({

            "ticket_id":
                f"#{r['ticket_id']}",

            "issue":
                r["issue"],

            "added_by":
                r["added_by"],

            "added_date":
                (
                    r["created_at"].isoformat()
                    if r["created_at"]
                    else None
                ),

            "project":
                r["project_name"],

            "type":
                r["ticket_type"],

            "assigned_to":
                r["agent_name"],

            "status":
                status,

            "updated_date":
                (
                    r["updated_at"].isoformat()
                    if r["updated_at"]
                    else None
                ),

            "closed_date":
                (
                    r["updated_at"].isoformat()
                    if status_id == 5
                    else None
                ),

            "sla_hours":
                round(
                    sla_hours,
                    2
                ),

            "sla_days":
                round(
                    sla_hours / 24,
                    2
                )

        })

    result = list(
        agents.values()
    )

    return {

        "status": True,

        "filters": {

            "from_date":
                from_date,

            "to_date":
                to_date,

            "sla_type":
                sla_type,

            "agent_id":
                agent_filter
        },

        "total_agents":
            len(result),

        "data":
            result
    }
########################################UV DESK AGENT SUMMARY#################################################################

# class AgentSummaryRequest(BaseModel):
#     from_date: Optional[str] = None
#     to_date: Optional[str] = None
#     sla_filter: Optional[str] = "all"   # all | gt_48 | lt_48


# @app.post("/api/uvdesk-agent-summary")
# async def uvdesk_agent_summary(
#     payload: AgentSummaryRequest = AgentSummaryRequest()
# ):

#     try:

#         query = """
#         SELECT
#             t.agent_id,
#             CONCAT(u.first_name, ' ', u.last_name) AS agent_name,
#             t.status_id,
#             t.created_at,

#             CASE
#                 WHEN t.status_id = 5
#                 THEN TIMESTAMPDIFF(HOUR, t.created_at, t.updated_at)
#                 ELSE TIMESTAMPDIFF(HOUR, t.created_at, NOW())
#             END AS sla_hours

#         FROM uv_ticket t
#         LEFT JOIN uv_user u
#             ON t.agent_id = u.id

#         WHERE t.is_trashed != 1
#         """

#         rows = await database.fetch_all(query=query)

#         agents = defaultdict(lambda: {
#             "agent_id": None,
#             "agent_name": "",
#             "summary": {
#                 "open": 0,
#                 "pending": 0,
#                 "answered": 0,
#                 "resolved": 0,
#                 "closed": 0,
#                 "active": 0,
#                 "total": 0
#             }
#         })

#         # ==========================================
#         # DATE FILTER ENABLE ONLY IF BOTH PROVIDED
#         # ==========================================

#         use_date_filter = (
#             payload.from_date
#             and payload.to_date
#         )

#         if use_date_filter:

#             from_date = datetime.strptime(
#                 payload.from_date,
#                 "%Y-%m-%d"
#             ).date()

#             to_date = datetime.strptime(
#                 payload.to_date,
#                 "%Y-%m-%d"
#             ).date()

#         for row in rows:

#             r = dict(row)

#             # ==========================================
#             # DATE FILTER
#             # ==========================================

#             if use_date_filter:

#                 created_date = r["created_at"].date()

#                 if not (
#                     from_date <= created_date <= to_date
#                 ):
#                     continue

#             # ==========================================
#             # SLA FILTER
#             # ==========================================

#             sla_hours = r["sla_hours"] or 0

#             if (
#                 payload.sla_filter == "gt_48"
#                 and sla_hours <= 48
#             ):
#                 continue

#             if (
#                 payload.sla_filter == "lt_48"
#                 and sla_hours >= 48
#             ):
#                 continue

#             aid = r["agent_id"]

#             if agents[aid]["agent_id"] is None:

#                 agents[aid]["agent_id"] = aid

#                 agents[aid]["agent_name"] = (
#                     r["agent_name"] or "Unassigned"
#                 )

#             status = r["status_id"]

#             if status == 1:
#                 agents[aid]["summary"]["open"] += 1

#             elif status == 2:
#                 agents[aid]["summary"]["pending"] += 1

#             elif status == 3:
#                 agents[aid]["summary"]["answered"] += 1

#             elif status == 4:
#                 agents[aid]["summary"]["resolved"] += 1

#             elif status == 5:
#                 agents[aid]["summary"]["closed"] += 1

#             agents[aid]["summary"]["total"] += 1

#         # ==========================================
#         # ACTIVE COUNT
#         # ==========================================

#         for aid in agents:

#             s = agents[aid]["summary"]

#             s["active"] = (
#                 s["open"]
#                 + s["pending"]
#                 + s["answered"]
#             )

#         return {

#             "status": True,

#             "filters": {
#                 "from_date": payload.from_date,
#                 "to_date": payload.to_date,
#                 "sla_filter": payload.sla_filter
#             },

#             "total_agents": len(agents),

#             "data": list(agents.values())
#         }

#     except Exception as e:

#         return {
#             "status": False,
#             "message": str(e)
#         }
    
class AgentSummaryRequest(BaseModel):
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    sla_filter: Optional[str] = "all"   

@app.post("/api/uvdesk-agent-summary")
async def uvdesk_agent_summary(
    payload: AgentSummaryRequest = AgentSummaryRequest()
):

    try:

        query = """
        SELECT
            t.agent_id,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS agent_name,

            t.status_id,

            t.created_at,

            t.updated_at,

            CASE
                WHEN t.status_id = 5
                THEN TIMESTAMPDIFF(
                    HOUR,
                    t.created_at,
                    t.updated_at
                )
                ELSE TIMESTAMPDIFF(
                    HOUR,
                    t.created_at,
                    NOW()
                )
            END AS sla_hours

        FROM uv_ticket t

        INNER JOIN uv_user u
        ON t.agent_id = u.id
        AND u.is_enabled != 2

        WHERE t.is_trashed != 1
        """

        rows = await database.fetch_all(
            query=query
        )

        agents = defaultdict(
            lambda: {
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
            }
        )

        # ==================================================
        # OVERALL SUMMARY
        # ==================================================

        overall = {
            "open": 0,
            "pending": 0,
            "answered": 0,
            "resolved": 0,
            "closed": 0,
            "active": 0,
            "total": 0
        }

        # ==================================================
        # DATE FILTER ENABLE ONLY IF BOTH PROVIDED
        # ==================================================

        use_date_filter = (
            payload.from_date
            and payload.to_date
        )

        if use_date_filter:

            from_date = datetime.strptime(
                payload.from_date,
                "%Y-%m-%d"
            ).date()

            to_date = datetime.strptime(
                payload.to_date,
                "%Y-%m-%d"
            ).date()

        # ==================================================
        # LOOP
        # ==================================================

        for row in rows:

            r = dict(row)

            # ==================================================
            # DATE FILTER
            # ==================================================

            if use_date_filter:

                if r["status_id"] in (4, 5):
                    date_to_check = (
                        r["updated_at"].date()
                        if r["updated_at"]
                        else r["created_at"].date()
                    )
                else:
                    date_to_check = (
                        r["created_at"].date()
                    )

                if not (
                    from_date
                    <= date_to_check
                    <= to_date
                ):
                    continue

            # ==================================================
            # SLA FILTER
            # ==================================================

            sla_hours = (
                r["sla_hours"] or 0
            )

            if (
                payload.sla_filter
                == "gt_48"
                and sla_hours <= 48
            ):
                continue

            if (
                payload.sla_filter
                == "lt_48"
                and sla_hours >= 48
            ):
                continue

            aid = r["agent_id"]

            if (
                agents[aid]["agent_id"]
                is None
            ):

                agents[aid]["agent_id"] = aid

                agents[aid]["agent_name"] = (
                    r["agent_name"]
                    or "Unassigned"
                )

            status = r["status_id"]

            # ==================================================
            # STATUS COUNTS
            # ==================================================

            if status == 1:

                agents[aid]["summary"][
                    "open"
                ] += 1

                overall["open"] += 1

            elif status == 2:

                agents[aid]["summary"][
                    "pending"
                ] += 1

                overall["pending"] += 1

            elif status == 3:

                agents[aid]["summary"][
                    "answered"
                ] += 1

                overall["answered"] += 1

            elif status == 4:

                agents[aid]["summary"][
                    "resolved"
                ] += 1

                overall["resolved"] += 1

            elif status == 5:

                agents[aid]["summary"][
                    "closed"
                ] += 1

                overall["closed"] += 1

            agents[aid]["summary"][
                "total"
            ] += 1

            overall["total"] += 1

        # ==================================================
        # ACTIVE COUNTS
        # ==================================================

        for aid in agents:

            s = agents[aid]["summary"]

            s["active"] = (

                s["open"]

                + s["pending"]

                + s["answered"]

            )

        overall["active"] = (

            overall["open"]

            + overall["pending"]

            + overall["answered"]

        )

        # ==================================================
        # RESPONSE
        # ==================================================

        return {

            "status": True,

            "filters": {

                "from_date":
                    payload.from_date,

                "to_date":
                    payload.to_date,

                "sla_filter":
                    payload.sla_filter

            },

            "overall": overall,

            "total_agents": len(
                agents
            ),

            "data": list(
                agents.values()
            )
        }

    except Exception as e:

        return {

            "status": False,

            "message": str(e)

        }
#####################################download excel filee#################################

class DownloadReportRequest(BaseModel):
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    sla_type: Optional[str] = None
    agent_name: Optional[str] = None


@app.post("/api/download/uvdesk-report")
async def download_uvdesk_report(
    payload: DownloadReportRequest = DownloadReportRequest()
):

    from_date = payload.from_date
    to_date = payload.to_date
    sla_type = payload.sla_type
    agent_name = payload.agent_name

    # =====================================================
    # DYNAMIC FILTERS
    # =====================================================

    filters = []
    params = {}

    if from_date and to_date:

        filters.append("""
            (
                (t.status_id IN (1, 2, 3) AND DATE(t.created_at) BETWEEN :from_date AND :to_date)
                OR
                (t.status_id IN (4, 5) AND DATE(t.updated_at) BETWEEN :from_date AND :to_date)
            )
        """)

        params["from_date"] = from_date
        params["to_date"] = to_date

    if agent_name:

        filters.append("""
            CONCAT(a.first_name,' ',a.last_name)
            = :agent_name
        """)

        params["agent_name"] = agent_name

    if sla_type == "gt_48":

        filters.append("""
            (
                CASE
                    WHEN t.status_id = 5
                    THEN TIMESTAMPDIFF(
                        HOUR,
                        t.created_at,
                        t.updated_at
                    )
                    ELSE TIMESTAMPDIFF(
                        HOUR,
                        t.created_at,
                        NOW()
                    )
                END
            ) > 48
        """)

    elif sla_type == "lt_48":

        filters.append("""
            (
                CASE
                    WHEN t.status_id = 5
                    THEN TIMESTAMPDIFF(
                        HOUR,
                        t.created_at,
                        t.updated_at
                    )
                    ELSE TIMESTAMPDIFF(
                        HOUR,
                        t.created_at,
                        NOW()
                    )
                END
            ) < 48
        """)

    where_clause = "WHERE t.is_trashed != 1"

    if filters:
        where_clause += " AND " + " AND ".join(filters)

    # =====================================================
    # TICKET REPORT QUERY
    # =====================================================

    ticket_query = f"""
    SELECT

        CONCAT('#', t.id) AS ticket_id,

        t.subject,

        CONCAT(
            c.first_name,' ',
            c.last_name
        ) AS added_by,

        DATE_FORMAT(
            t.created_at,
            '%d/%m/%Y %H:%i'
        ) AS created_at,

        sg.name AS project_name,

        ty.code AS type,

        CONCAT(
            a.first_name,' ',
            a.last_name
        ) AS assigned_to,

        CASE
            WHEN t.status_id = 1 THEN 'Open'
            WHEN t.status_id = 2 THEN 'Pending'
            WHEN t.status_id = 3 THEN 'Answered'
            WHEN t.status_id = 4 THEN 'Resolved'
            WHEN t.status_id = 5 THEN 'Closed'
        END AS status,

        DATE_FORMAT(
            t.updated_at,
            '%d/%m/%Y %H:%i'
        ) AS updated_at,

        CASE
            WHEN t.status_id = 5
            THEN DATE_FORMAT(
                t.updated_at,
                '%d/%m/%Y %H:%i'
            )
            ELSE ''
        END AS closed_date,

        CASE
            WHEN t.status_id = 5
            THEN DATEDIFF(
                t.updated_at,
                t.created_at
            )
            ELSE DATEDIFF(
                NOW(),
                t.created_at
            )
        END AS sla_days,

        ROUND(
            CASE
                WHEN t.status_id = 5
                THEN TIMESTAMPDIFF(
                    MINUTE,
                    t.created_at,
                    t.updated_at
                )
                ELSE TIMESTAMPDIFF(
                    MINUTE,
                    t.created_at,
                    NOW()
                )
            END / 60,
            2
        ) AS sla_hours

    FROM uv_ticket t

    LEFT JOIN uv_user c
    ON t.customer_id = c.id

    INNER JOIN uv_user a
    ON t.agent_id = a.id
    AND a.is_enabled != 2

    LEFT JOIN uv_ticket_type ty
    ON t.type_id = ty.id

    LEFT JOIN uv_support_group sg
    ON t.group_id = sg.id

    {where_clause}

    GROUP BY t.id

    ORDER BY t.id DESC
    """

    # =====================================================
    # AGENT SUMMARY QUERY
    # =====================================================

    agent_query = f"""
    SELECT

        CONCAT(
            u.first_name,' ',
            u.last_name
        ) AS Agent_Name,

        SUM(
            CASE
                WHEN t.status_id = 1
                THEN 1 ELSE 0
            END
        ) AS Open_Count,

        SUM(
            CASE
                WHEN t.status_id = 2
                THEN 1 ELSE 0
            END
        ) AS Pending_Count,

        SUM(
            CASE
                WHEN t.status_id = 3
                THEN 1 ELSE 0
            END
        ) AS Answered_Count,

        SUM(
            CASE
                WHEN t.status_id = 4
                THEN 1 ELSE 0
            END
        ) AS Resolved_Count,

        SUM(
            CASE
                WHEN t.status_id = 5
                THEN 1 ELSE 0
            END
        ) AS Closed_Count,

        COUNT(t.id) AS Total_Tickets

    FROM uv_ticket t

    INNER JOIN uv_user u
    ON t.agent_id = u.id
    AND u.is_enabled != 2

    {where_clause}

    GROUP BY t.agent_id

    ORDER BY Agent_Name
    """

    ticket_data = await database.fetch_all(
        query=ticket_query,
        values=params
    )

    agent_data = await database.fetch_all(
        query=agent_query,
        values=params
    )

    # =====================================================
    # EXCEL
    # =====================================================

    wb = Workbook()

    ws1 = wb.active
    ws1.title = "Agent Summary"

    ws1.append([
        "Agent Name",
        "Open",
        "Pending",
        "Answered",
        "Resolved",
        "Closed",
        "Total"
    ])

    for cell in ws1[1]:
        cell.font = Font(bold=True)

    for row in agent_data:

        row = dict(row)

        ws1.append([
            row["Agent_Name"],
            row["Open_Count"],
            row["Pending_Count"],
            row["Answered_Count"],
            row["Resolved_Count"],
            row["Closed_Count"],
            row["Total_Tickets"]
        ])

    ws2 = wb.create_sheet(
        title="Ticket Report"
    )

    ws2.append([
        "Ticket ID",
        "Issue",
        "Added By",
        "Added Date",
        "Project",
        "Type",
        "Assigned To",
        "Status",
        "Updated Date",
        "Closed Date",
        "SLA Days",
        "SLA Hours"
    ])

    for cell in ws2[1]:
        cell.font = Font(bold=True)

    for row in ticket_data:

        row = dict(row)

        ws2.append([
            row["ticket_id"],
            row["subject"],
            row["added_by"],
            row["created_at"],
            row["project_name"],
            row["type"],
            row["assigned_to"],
            row["status"],
            row["updated_at"],
            row["closed_date"],
            row["sla_days"],
            row["sla_hours"]
        ])

    for sheet in wb.worksheets:

        for column in sheet.columns:

            max_length = 0
            col_letter = column[0].column_letter

            for cell in column:

                if cell.value:
                    max_length = max(
                        max_length,
                        len(str(cell.value))
                    )

            sheet.column_dimensions[
                col_letter
            ].width = max_length + 5

    output = BytesIO()

    wb.save(output)

    output.seek(0)

    filename = (
        f"uvdesk_report_"
        f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition":
            f'attachment; filename="{filename}"'
        }
    )



from fastapi import FastAPI, Request, Response
from argon2 import PasswordHasher
from datetime import datetime, timedelta





@app.get("/auth-check")
async def auth_check(request: Request):

    print("AUTH CHECK HIT")

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return Response(
            status_code=401,
            headers={
                "WWW-Authenticate": "Basic"
            }
        )

    try:
        auth_type, credentials = auth_header.split()

        decoded = base64.b64decode(
            credentials
        ).decode()

        email, password = decoded.split(":", 1)

    except Exception:
        return Response(
            status_code=401,
            headers={
                "WWW-Authenticate": "Basic"
            }
        )

    # =====================================================
    # FETCH USER
    # =====================================================

    query = """
        SELECT id, password
        FROM uv_user
        WHERE email = :email
        AND is_enabled != 2
        LIMIT 1
    """

    user = await database.fetch_one(
        query=query,
        values={
            "email": email
        }
    )

    if not user:
        return Response(
            status_code=401,
            headers={
                "WWW-Authenticate": "Basic"
            }
        )

    # =====================================================
    # VERIFY PASSWORD
    # =====================================================

    try:

        ph = PasswordHasher()

        ph.verify(
            user["password"],
            password
        )

    except Exception:

        return Response(
            status_code=401,
            headers={
                "WWW-Authenticate": "Basic"
            }
        )

    # =====================================================
    # CHECK EXISTING SESSION
    # =====================================================

    session_query = """
        SELECT last_activity
        FROM auth_sessions
        WHERE username = :username
        LIMIT 1
    """

    session = await database.fetch_one(
        query=session_query,
        values={
            "username": email
        }
    )

    if session:

        last_activity = session["last_activity"]

        print("Python Now:", datetime.now())
        print("DB Last Activity:", last_activity)
        print("Difference:", datetime.now() - last_activity)

        if datetime.now() - last_activity > timedelta(minutes=10):

            await database.execute(
                query="""
                    DELETE
                    FROM auth_sessions
                    WHERE username = :username
                """,
                values={
                    "username": email
                }
            )

            return Response(
                status_code=401,
                headers={
                    "WWW-Authenticate": "Basic"
                }
            )

        # Update activity timestamp

        await database.execute(
            query="""
                UPDATE auth_sessions
                SET last_activity = NOW()
                WHERE username = :username
            """,
            values={
                "username": email
            }
        )

    else:

        # First Login

        await database.execute(
            query="""
                INSERT INTO auth_sessions
                (
                    username,
                    last_activity
                )
                VALUES
                (
                    :username,
                    NOW()
                )
            """,
            values={
                "username": email
            }
        )

    return Response(status_code=200)