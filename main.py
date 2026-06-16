import os
import json
import asyncio
import base64
import tempfile
import hashlib
from io import BytesIO
from datetime import datetime, timedelta, time as dt_time
from collections import defaultdict
from typing import Optional
import time as time_module
from pydantic import BaseModel
from argon2 import PasswordHasher
from openpyxl import Workbook
from openpyxl.styles import Font
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response, Body, Query
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from zoneinfo import ZoneInfo
from database import database

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
# @app.get("/api/project-summary")
# async def project_summary_api():

#     try:

#         project_summary = await cached_query(
#             """
#             SELECT

#                 st.id AS project_id,

#                 st.name AS project_name,

#                 -- OPEN
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 1
#                         AND DATE(t.created_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS open_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 1
#                         AND MONTH(t.created_at) = MONTH(CURDATE())
#                         AND YEAR(t.created_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS open_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 1
#                         THEN 1 ELSE 0
#                     END
#                 ) AS open_till_date,


#                 -- PENDING
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 2
#                         AND DATE(t.created_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS pending_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 2
#                         AND MONTH(t.created_at) = MONTH(CURDATE())
#                         AND YEAR(t.created_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS pending_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 2
#                         THEN 1 ELSE 0
#                     END
#                 ) AS pending_till_date,


#                 -- ANSWERED
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 3
#                         AND DATE(t.created_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS answered_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 3
#                         AND MONTH(t.created_at) = MONTH(CURDATE())
#                         AND YEAR(t.created_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS answered_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 3
#                         THEN 1 ELSE 0
#                     END
#                 ) AS answered_till_date,


#                 -- RESOLVED
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 4
#                         AND DATE(t.updated_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS resolved_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 4
#                         AND MONTH(t.updated_at) = MONTH(CURDATE())
#                         AND YEAR(t.updated_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS resolved_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 4
#                         THEN 1 ELSE 0
#                     END
#                 ) AS resolved_till_date,


#                 -- CLOSED
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 5
#                         AND DATE(t.updated_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS closed_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 5
#                         AND MONTH(t.updated_at) = MONTH(CURDATE())
#                         AND YEAR(t.updated_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS closed_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 5
#                         THEN 1 ELSE 0
#                     END
#                 ) AS closed_till_date

#             FROM uv_support_team st

#             LEFT JOIN uv_ticket t
#             ON (
#                 t.subject LIKE CONCAT('%',

#                     CASE

#                         WHEN st.name LIKE '%MP%'
#                         THEN 'MPEms'

#                         WHEN st.name LIKE '%MHEMS%'
#                         THEN 'MHEms'

#                         WHEN st.name LIKE '%DMS%'
#                         THEN 'DMS'

#                         WHEN st.name LIKE '%UNIM%'
#                         THEN 'UNIM'

#                         WHEN st.name LIKE '%HHC%'
#                         THEN 'HHC'

#                         WHEN st.name LIKE '%Raipur%'
#                         THEN 'Raipur'

#                         WHEN st.name LIKE '%ALF%'
#                         THEN 'ALF'

#                         ELSE st.name

#                     END,

#                 '%')
#             )

#             LEFT JOIN uv_user u
#             ON t.agent_id = u.id

#             WHERE t.is_trashed != 1
#             AND u.is_enabled != 2

#             GROUP BY st.id, st.name

#             ORDER BY st.name
#             """,
#             fetch="all"
#         )

#         formatted_data = []

#         for row in project_summary or []:

#             # =====================================
#             # ACTIVE TICKETS
#             # =====================================

#             active_today = (
#                 int(row["open_today"] or 0)
#                 + int(row["pending_today"] or 0)
#                 + int(row["answered_today"] or 0)
#             )

#             active_this_month = (
#                 int(row["open_this_month"] or 0)
#                 + int(row["pending_this_month"] or 0)
#                 + int(row["answered_this_month"] or 0)
#             )

#             active_till_date = (
#                 int(row["open_till_date"] or 0)
#                 + int(row["pending_till_date"] or 0)
#                 + int(row["answered_till_date"] or 0)
#             )

#             # =====================================
#             # TOTAL TICKETS
#             # =====================================

#             total_today = (
#                 int(row["open_today"] or 0)
#                 + int(row["pending_today"] or 0)
#                 + int(row["answered_today"] or 0)
#                 + int(row["resolved_today"] or 0)
#                 + int(row["closed_today"] or 0)
#             )

#             total_this_month = (
#                 int(row["open_this_month"] or 0)
#                 + int(row["pending_this_month"] or 0)
#                 + int(row["answered_this_month"] or 0)
#                 + int(row["resolved_this_month"] or 0)
#                 + int(row["closed_this_month"] or 0)
#             )

#             total_till_date = (
#                 int(row["open_till_date"] or 0)
#                 + int(row["pending_till_date"] or 0)
#                 + int(row["answered_till_date"] or 0)
#                 + int(row["resolved_till_date"] or 0)
#                 + int(row["closed_till_date"] or 0)
#             )

#             formatted_data.append({

#                 "project_id": int(row["project_id"] or 0),

#                 "project_name": str(row["project_name"] or ""),

#                 "total_tickets": {
#                     "today": total_today,
#                     "this_month": total_this_month,
#                     "till_date": total_till_date
#                 },

#                 "open": {
#                     "today": int(row["open_today"] or 0),
#                     "this_month": int(row["open_this_month"] or 0),
#                     "till_date": int(row["open_till_date"] or 0),
#                 },

#                 "pending": {
#                     "today": int(row["pending_today"] or 0),
#                     "this_month": int(row["pending_this_month"] or 0),
#                     "till_date": int(row["pending_till_date"] or 0),
#                 },

#                 "answered": {
#                     "today": int(row["answered_today"] or 0),
#                     "this_month": int(row["answered_this_month"] or 0),
#                     "till_date": int(row["answered_till_date"] or 0),
#                 },

#                 "resolved": {
#                     "today": int(row["resolved_today"] or 0),
#                     "this_month": int(row["resolved_this_month"] or 0),
#                     "till_date": int(row["resolved_till_date"] or 0),
#                 },

#                 "closed": {
#                     "today": int(row["closed_today"] or 0),
#                     "this_month": int(row["closed_this_month"] or 0),
#                     "till_date": int(row["closed_till_date"] or 0),
#                 },

#                 "active_tickets": {
#                     "today": active_today,
#                     "this_month": active_this_month,
#                     "till_date": active_till_date
#                 }

#             })

#         return {
#             "status": True,
#             "project_wise_ticket_summary": formatted_data
#         }

#     except Exception as e:

#         return {
#             "status": False,
#             "message": str(e)
#         }


@app.get("/api/project-summary")
async def project_summary_api():

    try:

        project_summary = await cached_query(
            """
            SELECT

                st.id AS project_id,
                st.name AS project_name,

                SUM(CASE WHEN t.status_id = 1 AND DATE(t.created_at) = CURDATE() THEN 1 ELSE 0 END) AS open_today,
                SUM(CASE WHEN t.status_id = 1 AND MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS open_this_month,
                SUM(CASE WHEN t.status_id = 1 THEN 1 ELSE 0 END) AS open_till_date,

                SUM(CASE WHEN t.status_id = 2 AND DATE(t.created_at) = CURDATE() THEN 1 ELSE 0 END) AS pending_today,
                SUM(CASE WHEN t.status_id = 2 AND MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS pending_this_month,
                SUM(CASE WHEN t.status_id = 2 THEN 1 ELSE 0 END) AS pending_till_date,

                SUM(CASE WHEN t.status_id = 3 AND DATE(t.created_at) = CURDATE() THEN 1 ELSE 0 END) AS answered_today,
                SUM(CASE WHEN t.status_id = 3 AND MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS answered_this_month,
                SUM(CASE WHEN t.status_id = 3 THEN 1 ELSE 0 END) AS answered_till_date,

                SUM(CASE WHEN t.status_id = 4 AND DATE(t.updated_at) = CURDATE() THEN 1 ELSE 0 END) AS resolved_today,
                SUM(CASE WHEN t.status_id = 4 AND MONTH(t.updated_at) = MONTH(CURDATE()) AND YEAR(t.updated_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS resolved_this_month,
                SUM(CASE WHEN t.status_id = 4 THEN 1 ELSE 0 END) AS resolved_till_date,

                SUM(CASE WHEN t.status_id = 5 AND DATE(t.updated_at) = CURDATE() THEN 1 ELSE 0 END) AS closed_today,
                SUM(CASE WHEN t.status_id = 5 AND MONTH(t.updated_at) = MONTH(CURDATE()) AND YEAR(t.updated_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS closed_this_month,
                SUM(CASE WHEN t.status_id = 5 THEN 1 ELSE 0 END) AS closed_till_date

            FROM uv_support_team st

            LEFT JOIN uv_ticket t
                ON t.subGroup_id = st.id

            LEFT JOIN uv_user u
                ON t.agent_id = u.id

            WHERE (t.is_trashed IS NULL OR t.is_trashed != 1)
              AND (u.is_enabled IS NULL OR u.is_enabled != 2)

            GROUP BY st.id, st.name
            ORDER BY st.name
            """,
            fetch="all"
        )

        formatted_data = []

        for row in project_summary or []:

            active_today = int(row["open_today"] or 0) + int(row["pending_today"] or 0) + int(row["answered_today"] or 0)
            active_this_month = int(row["open_this_month"] or 0) + int(row["pending_this_month"] or 0) + int(row["answered_this_month"] or 0)
            active_till_date = int(row["open_till_date"] or 0) + int(row["pending_till_date"] or 0) + int(row["answered_till_date"] or 0)

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
        return {"status": False, "message": str(e)}

# #########################################project wise agent summary###############################################################
# @app.get("/api/project-agent-summary")
# async def project_agent_summary_api(project_id: int):
#     try:

    
#         # =====================================
#         # GET PROJECT NAME
#         # =====================================

#         project_query = f"""
#             SELECT name
#             FROM uv_support_team
#             WHERE id = {project_id}
#             LIMIT 1
#         """

#         project_row = await cached_query(
#             project_query,
#             fetch="one"
#         )

#         if not project_row:
#             return {
#                 "status": False,
#                 "message": "Project not found"
#             }

#         project_name = str(project_row["name"] or "").strip()

#         # =====================================
#         # PROJECT KEYWORD LOGIC
#         # =====================================

#         project_keyword = (
#             project_name
#             .replace("Spero", "")
#             .replace("-", "")
#             .replace("Goa", "")
#             .replace("Project", "")
#             .strip()
#         )

#         # Special cases
#         if "MP" in project_name:
#             project_keyword = "MPEms"

#         elif "MHEMS" in project_name.upper():
#             project_keyword = "MHEms"

#         elif "DMS" in project_name.upper():
#             project_keyword = "DMS"

#         elif "UNIM" in project_name.upper():
#             project_keyword = "UNIM"

#         elif "HHC" in project_name.upper():
#             project_keyword = "HHC"

#         elif "RAIPUR" in project_name.upper():
#             project_keyword = "Raipur"

#         # =====================================
#         # MAIN QUERY
#         # =====================================

#         query = f"""
#             SELECT

#                 {project_id} AS project_id,

#                 '{project_name}' AS project_name,

#                 CONCAT(u.first_name, ' ', u.last_name) AS agent_name,

#                 -- OPEN
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 1
#                         AND DATE(t.created_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS open_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 1
#                         AND MONTH(t.created_at) = MONTH(CURDATE())
#                         AND YEAR(t.created_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS open_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 1
#                         THEN 1 ELSE 0
#                     END
#                 ) AS open_till_date,

#                 -- PENDING
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 2
#                         AND DATE(t.created_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS pending_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 2
#                         AND MONTH(t.created_at) = MONTH(CURDATE())
#                         AND YEAR(t.created_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS pending_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 2
#                         THEN 1 ELSE 0
#                     END
#                 ) AS pending_till_date,

#                 -- ANSWERED
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 3
#                         AND DATE(t.created_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS answered_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 3
#                         AND MONTH(t.created_at) = MONTH(CURDATE())
#                         AND YEAR(t.created_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS answered_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 3
#                         THEN 1 ELSE 0
#                     END
#                 ) AS answered_till_date,

#                 -- RESOLVED
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 4
#                         AND DATE(t.updated_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS resolved_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 4
#                         AND MONTH(t.updated_at) = MONTH(CURDATE())
#                         AND YEAR(t.updated_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS resolved_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 4
#                         THEN 1 ELSE 0
#                     END
#                 ) AS resolved_till_date,

#                 -- CLOSED
#                 SUM(
#                     CASE
#                         WHEN t.status_id = 5
#                         AND DATE(t.updated_at) = CURDATE()
#                         THEN 1 ELSE 0
#                     END
#                 ) AS closed_today,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 5
#                         AND MONTH(t.updated_at) = MONTH(CURDATE())
#                         AND YEAR(t.updated_at) = YEAR(CURDATE())
#                         THEN 1 ELSE 0
#                     END
#                 ) AS closed_this_month,

#                 SUM(
#                     CASE
#                         WHEN t.status_id = 5
#                         THEN 1 ELSE 0
#                     END
#                 ) AS closed_till_date

#             FROM uv_ticket t

#             LEFT JOIN uv_user u
#             ON t.agent_id = u.id

#             WHERE t.is_trashed != 1
#             AND t.agent_id IS NOT NULL
#             AND u.is_enabled != 2
#             AND t.subject LIKE CONCAT('%', '{project_keyword}', '%')

#             GROUP BY t.agent_id

#             ORDER BY agent_name
#         """

#         rows = await cached_query(
#             query,
#             fetch="all"
#         )

#         agents = []

#         for row in rows or []:

#             active_today = (
#                 int(row["open_today"] or 0)
#                 + int(row["pending_today"] or 0)
#                 + int(row["answered_today"] or 0)
#             )

#             active_this_month = (
#                 int(row["open_this_month"] or 0)
#                 + int(row["pending_this_month"] or 0)
#                 + int(row["answered_this_month"] or 0)
#             )

#             active_till_date = (
#                 int(row["open_till_date"] or 0)
#                 + int(row["pending_till_date"] or 0)
#                 + int(row["answered_till_date"] or 0)
#             )

#             total_today = (
#                 int(row["open_today"] or 0)
#                 + int(row["pending_today"] or 0)
#                 + int(row["answered_today"] or 0)
#                 + int(row["resolved_today"] or 0)
#                 + int(row["closed_today"] or 0)
#             )

#             total_this_month = (
#                 int(row["open_this_month"] or 0)
#                 + int(row["pending_this_month"] or 0)
#                 + int(row["answered_this_month"] or 0)
#                 + int(row["resolved_this_month"] or 0)
#                 + int(row["closed_this_month"] or 0)
#             )

#             total_till_date = (
#                 int(row["open_till_date"] or 0)
#                 + int(row["pending_till_date"] or 0)
#                 + int(row["answered_till_date"] or 0)
#                 + int(row["resolved_till_date"] or 0)
#                 + int(row["closed_till_date"] or 0)
#             )

#             agents.append({

#                 "agent_name": str(row["agent_name"] or ""),

#                 "total_tickets": {
#                     "today": total_today,
#                     "this_month": total_this_month,
#                     "till_date": total_till_date
#                 },

#                 "open": {
#                     "today": int(row["open_today"] or 0),
#                     "this_month": int(row["open_this_month"] or 0),
#                     "till_date": int(row["open_till_date"] or 0)
#                 },

#                 "pending": {
#                     "today": int(row["pending_today"] or 0),
#                     "this_month": int(row["pending_this_month"] or 0),
#                     "till_date": int(row["pending_till_date"] or 0)
#                 },

#                 "answered": {
#                     "today": int(row["answered_today"] or 0),
#                     "this_month": int(row["answered_this_month"] or 0),
#                     "till_date": int(row["answered_till_date"] or 0)
#                 },

#                 "resolved": {
#                     "today": int(row["resolved_today"] or 0),
#                     "this_month": int(row["resolved_this_month"] or 0),
#                     "till_date": int(row["resolved_till_date"] or 0)
#                 },

#                 "closed": {
#                     "today": int(row["closed_today"] or 0),
#                     "this_month": int(row["closed_this_month"] or 0),
#                     "till_date": int(row["closed_till_date"] or 0)
#                 },

#                 "active_tickets": {
#                     "today": active_today,
#                     "this_month": active_this_month,
#                     "till_date": active_till_date
#                 }

#             })

#         return {
#             "status": True,
#             "project_id": project_id,
#             "project_name": project_name,
#             "agents": agents
#         }

#     except Exception as e:
#         return {
#             "status": False,
#             "message": str(e)
#         }

@app.get("/api/project-agent-summary")
async def project_agent_summary_api(project_id: int):

    try:

        project_row = await cached_query(
            """
            SELECT name
            FROM uv_support_team
            WHERE id = :project_id
            LIMIT 1
            """,
            fetch="one",
            params={"project_id": project_id}
        )

        if not project_row:
            return {"status": False, "message": "Project not found"}

        project_name = str(project_row["name"] or "").strip()

        rows = await cached_query(
            """
            SELECT

                t.subGroup_id AS project_id,

                CONCAT(u.first_name, ' ', u.last_name) AS agent_name,

                SUM(CASE WHEN t.status_id = 1 AND DATE(t.created_at) = CURDATE() THEN 1 ELSE 0 END) AS open_today,
                SUM(CASE WHEN t.status_id = 1 AND MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS open_this_month,
                SUM(CASE WHEN t.status_id = 1 THEN 1 ELSE 0 END) AS open_till_date,

                SUM(CASE WHEN t.status_id = 2 AND DATE(t.created_at) = CURDATE() THEN 1 ELSE 0 END) AS pending_today,
                SUM(CASE WHEN t.status_id = 2 AND MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS pending_this_month,
                SUM(CASE WHEN t.status_id = 2 THEN 1 ELSE 0 END) AS pending_till_date,

                SUM(CASE WHEN t.status_id = 3 AND DATE(t.created_at) = CURDATE() THEN 1 ELSE 0 END) AS answered_today,
                SUM(CASE WHEN t.status_id = 3 AND MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS answered_this_month,
                SUM(CASE WHEN t.status_id = 3 THEN 1 ELSE 0 END) AS answered_till_date,

                SUM(CASE WHEN t.status_id = 4 AND DATE(t.updated_at) = CURDATE() THEN 1 ELSE 0 END) AS resolved_today,
                SUM(CASE WHEN t.status_id = 4 AND MONTH(t.updated_at) = MONTH(CURDATE()) AND YEAR(t.updated_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS resolved_this_month,
                SUM(CASE WHEN t.status_id = 4 THEN 1 ELSE 0 END) AS resolved_till_date,

                SUM(CASE WHEN t.status_id = 5 AND DATE(t.updated_at) = CURDATE() THEN 1 ELSE 0 END) AS closed_today,
                SUM(CASE WHEN t.status_id = 5 AND MONTH(t.updated_at) = MONTH(CURDATE()) AND YEAR(t.updated_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS closed_this_month,
                SUM(CASE WHEN t.status_id = 5 THEN 1 ELSE 0 END) AS closed_till_date

            FROM uv_ticket t

            LEFT JOIN uv_user u
                ON t.agent_id = u.id

            WHERE (t.is_trashed IS NULL OR t.is_trashed != 1)
              AND t.agent_id IS NOT NULL
              AND (u.is_enabled IS NULL OR u.is_enabled != 2)
              AND t.subGroup_id = :project_id

            GROUP BY t.agent_id, u.first_name, u.last_name

            ORDER BY agent_name
            """,
            fetch="all",
            params={"project_id": project_id}
        )

        agents = []

        for row in rows or []:

            active_today = int(row["open_today"] or 0) + int(row["pending_today"] or 0) + int(row["answered_today"] or 0)
            active_this_month = int(row["open_this_month"] or 0) + int(row["pending_this_month"] or 0) + int(row["answered_this_month"] or 0)
            active_till_date = int(row["open_till_date"] or 0) + int(row["pending_till_date"] or 0) + int(row["answered_till_date"] or 0)

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
        return {"status": False, "message": str(e)}


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




# # =========================================================
# # AGENT REPORT API
# # =========================================================

# @app.post("/api/uvdesk-agent")
# async def uvdesk_agent_summary(
#     payload: AgentReportRequest = Body(
#         default_factory=AgentReportRequest
#     )
# ):

#     from_date = payload.from_date
#     to_date = payload.to_date
#     sla_type = payload.sla_type
#     agent_filter = payload.agent_id

#     query = """
#     SELECT
#         t.id AS ticket_id,
#         t.subject AS issue,

#         t.agent_id,

#         CONCAT(
#             a.first_name,
#             ' ',
#             a.last_name
#         ) AS agent_name,

#         CONCAT(
#             c.first_name,
#             ' ',
#             c.last_name
#         ) AS added_by,

#         t.created_at,
#         t.updated_at,

#         t.status_id,

#         sg.name AS project_name,

#         ty.code AS ticket_type,

#         CASE
#             WHEN t.status_id = 5
#             THEN TIMESTAMPDIFF(
#                 HOUR,
#                 t.created_at,
#                 t.updated_at
#             )
#             ELSE TIMESTAMPDIFF(
#                 HOUR,
#                 t.created_at,
#                 NOW()
#             )
#         END AS sla_hours

#     FROM uv_ticket t

#     INNER JOIN uv_user a
#     ON t.agent_id = a.id
#     AND a.is_enabled != 2

#     LEFT JOIN uv_user c
#     ON t.customer_id = c.id

#     LEFT JOIN uv_ticket_type ty
#     ON t.type_id = ty.id

#     LEFT JOIN uv_support_group sg
#     ON t.group_id = sg.id

#     WHERE t.is_trashed != 1
#     """

#     rows = await database.fetch_all(
#         query=query
#     )

#     agents = defaultdict(
#         lambda: {
#             "agent_id": None,
#             "agent_name": "",
#             "updated_at": None,
#             "summary": {
#                 "open": 0,
#                 "pending": 0,
#                 "answered": 0,
#                 "resolved": 0,
#                 "closed": 0,
#                 "total": 0
#             },
#             "tickets": []
#         }
#     )

#     for r in rows:

#         r = dict(r)

#         sla_hours = float(
#             r["sla_hours"] or 0
#         )

#         # =====================================
#         # SLA FILTER
#         # =====================================

#         if (
#             sla_type == "gt_48"
#             and sla_hours <= 48
#         ):
#             continue

#         if (
#             sla_type == "lt_48"
#             and sla_hours >= 48
#         ):
#             continue

#         # =====================================
#         # DATE FILTER
#         # =====================================

#         if from_date and to_date:

#             fd = datetime.strptime(
#                 from_date,
#                 "%Y-%m-%d"
#             ).date()

#             td = datetime.strptime(
#                 to_date,
#                 "%Y-%m-%d"
#             ).date()

#             if r["status_id"] in (4, 5):
#                 date_to_check = (
#                     r["updated_at"].date()
#                     if r["updated_at"]
#                     else r["created_at"].date()
#                 )
#             else:
#                 date_to_check = (
#                     r["created_at"].date()
#                 )

#             if not (
#                 fd <= date_to_check <= td
#             ):
#                 continue

#         # =====================================
#         # AGENT ID FILTER
#         # =====================================

#         if agent_filter is not None:

#             if (
#                 r["agent_id"]
#                 != agent_filter
#             ):
#                 continue

#         aid = r["agent_id"]

#         if (
#             agents[aid]["agent_id"]
#             is None
#         ):

#             agents[aid]["agent_id"] = aid

#             agents[aid]["agent_name"] = (
#                 r["agent_name"] or ""
#             )

#             agents[aid]["updated_at"] = (
#                 r["updated_at"]
#             )

#         else:

#             if (
#                 r["updated_at"]
#                 and (
#                     agents[aid]["updated_at"] is None
#                     or r["updated_at"]
#                     > agents[aid]["updated_at"]
#                 )
#             ):

#                 agents[aid]["updated_at"] = (
#                     r["updated_at"]
#                 )

#         status_id = r["status_id"]

#         if status_id == 1:

#             status = "Open"

#             agents[aid]["summary"][
#                 "open"
#             ] += 1

#         elif status_id == 2:

#             status = "Pending"

#             agents[aid]["summary"][
#                 "pending"
#             ] += 1

#         elif status_id == 3:

#             status = "Answered"

#             agents[aid]["summary"][
#                 "answered"
#             ] += 1

#         elif status_id == 4:

#             status = "Resolved"

#             agents[aid]["summary"][
#                 "resolved"
#             ] += 1

#         elif status_id == 5:

#             status = "Closed"

#             agents[aid]["summary"][
#                 "closed"
#             ] += 1

#         else:

#             status = "Unknown"

#         agents[aid]["summary"][
#             "total"
#         ] += 1

#         agents[aid]["tickets"].append({

#             "ticket_id":
#                 f"#{r['ticket_id']}",

#             "issue":
#                 r["issue"],

#             "added_by":
#                 r["added_by"],

#             "added_date":
#                 (
#                     r["created_at"].isoformat()
#                     if r["created_at"]
#                     else None
#                 ),

#             "project":
#                 r["project_name"],

#             "type":
#                 r["ticket_type"],

#             "assigned_to":
#                 r["agent_name"],

#             "status":
#                 status,

#             "updated_date":
#                 (
#                     r["updated_at"].isoformat()
#                     if r["updated_at"]
#                     else None
#                 ),

#             "closed_date":
#                 (
#                     r["updated_at"].isoformat()
#                     if status_id == 5
#                     else None
#                 ),

#             "sla_hours":
#                 round(
#                     sla_hours,
#                     2
#                 ),

#             "sla_days":
#                 round(
#                     sla_hours / 24,
#                     2
#                 )

#         })

#     # =====================================
#     # SORT BY updated_at ASCENDING
#     # (purana pehle, latest sabse niche)
#     # =====================================

#     sorted_agents = sorted(
#         agents.values(),
#         key=lambda x: (
#             x["updated_at"]
#             if x["updated_at"]
#             else datetime.min
#         ),
#         reverse=False
#     )

#     return {

#         "status": True,

#         "filters": {

#             "from_date":
#                 from_date,

#             "to_date":
#                 to_date,

#             "sla_type":
#                 sla_type,

#             "agent_id":
#                 agent_filter
#         },

#         "total_agents":
#             len(sorted_agents),

#         "data":
#             sorted_agents
#     }



# class AgentReportRequest(BaseModel):
#     from_date: str | None = None
#     to_date: str | None = None
#     sla_type: str | None = None
#     agent_id: int | None = None


# def calculate_working_hours(start: datetime, end: datetime) -> float:
#     """
#     Calculates working hours between two datetimes.
#     Monday-Friday only, max 8 hrs/day cap.
#     No office hours restriction.
#     """
#     if not start or not end or end <= start:
#         return 0.0

#     DAILY_CAP    = 8.0
#     total_hours  = 0.0
#     current_date = start.date()
#     end_date     = end.date()

#     while current_date <= end_date:

#         # Skip Saturday (5) and Sunday (6)
#         if current_date.weekday() >= 5:
#             current_date += timedelta(days=1)
#             continue

#         if current_date == start.date() == end_date:
#             hours = (
#                 end - start
#             ).total_seconds() / 3600

#         elif current_date == start.date():
#             end_of_day = datetime.combine(
#                 current_date + timedelta(days=1),
#                 datetime.min.time()
#             )
#             hours = (
#                 end_of_day - start
#             ).total_seconds() / 3600

#         elif current_date == end_date:
#             start_of_day = datetime.combine(
#                 current_date,
#                 datetime.min.time()
#             )
#             hours = (
#                 end - start_of_day
#             ).total_seconds() / 3600

#         else:
#             hours = 24.0

#         total_hours += min(hours, DAILY_CAP)

#         current_date += timedelta(days=1)

#     return round(total_hours, 2)


# @app.post("/api/uvdesk-agent")
# async def uvdesk_agent_summary(
#     payload: AgentReportRequest = Body(
#         default_factory=AgentReportRequest
#     )
# ):

#     from_date    = payload.from_date
#     to_date      = payload.to_date
#     sla_type     = payload.sla_type
#     agent_filter = payload.agent_id

#     query = """
#     SELECT
#         t.id AS ticket_id,
#         t.subject AS issue,

#         t.agent_id,

#         CONCAT(
#             a.first_name,
#             ' ',
#             a.last_name
#         ) AS agent_name,

#         CONCAT(
#             c.first_name,
#             ' ',
#             c.last_name
#         ) AS added_by,

#         t.created_at,
#         t.updated_at,

#         t.status_id,

#         sg.name AS project_name,

#         ty.code AS ticket_type

#     FROM uv_ticket t

#     INNER JOIN uv_user a
#     ON t.agent_id = a.id
#     AND a.is_enabled != 2

#     LEFT JOIN uv_user c
#     ON t.customer_id = c.id

#     LEFT JOIN uv_ticket_type ty
#     ON t.type_id = ty.id

#     LEFT JOIN uv_support_group sg
#     ON t.group_id = sg.id

#     WHERE t.is_trashed != 1
#     """

#     rows = await database.fetch_all(
#         query=query
#     )

#     agents = defaultdict(
#         lambda: {
#             "agent_id": None,
#             "agent_name": "",
#             "updated_at": None,
#             "summary": {
#                 "open": 0,
#                 "pending": 0,
#                 "answered": 0,
#                 "resolved": 0,
#                 "closed": 0,
#                 "total": 0
#             },
#             "tickets": []
#         }
#     )

#     for r in rows:

#         r = dict(r)

#         # =====================================
#         # SLA HOURS — Mon-Fri, max 8 hrs/day
#         # =====================================

#         created_at = r["created_at"]
#         updated_at = r["updated_at"]

#         if r["status_id"] == 5:
#             sla_end = updated_at if updated_at else datetime.now()
#         else:
#             sla_end = datetime.now()

#         sla_hours = calculate_working_hours(
#             created_at,
#             sla_end
#         ) if created_at else 0.0

#         # =====================================
#         # SLA FILTER
#         # =====================================

#         if (
#             sla_type == "gt_48"
#             and sla_hours <= 48
#         ):
#             continue

#         if (
#             sla_type == "lt_48"
#             and sla_hours >= 48
#         ):
#             continue

#         # =====================================
#         # DATE FILTER
#         # =====================================

#         if from_date and to_date:

#             fd = datetime.strptime(
#                 from_date,
#                 "%Y-%m-%d"
#             ).date()

#             td = datetime.strptime(
#                 to_date,
#                 "%Y-%m-%d"
#             ).date()

#             if r["status_id"] in (4, 5):
#                 date_to_check = (
#                     r["updated_at"].date()
#                     if r["updated_at"]
#                     else r["created_at"].date()
#                 )
#             else:
#                 date_to_check = (
#                     r["created_at"].date()
#                 )

#             if not (
#                 fd <= date_to_check <= td
#             ):
#                 continue

#         # =====================================
#         # AGENT ID FILTER
#         # =====================================

#         if agent_filter is not None:

#             if (
#                 r["agent_id"]
#                 != agent_filter
#             ):
#                 continue

#         aid = r["agent_id"]

#         if (
#             agents[aid]["agent_id"]
#             is None
#         ):

#             agents[aid]["agent_id"] = aid

#             agents[aid]["agent_name"] = (
#                 r["agent_name"] or ""
#             )

#             agents[aid]["updated_at"] = (
#                 r["updated_at"]
#             )

#         else:

#             if (
#                 r["updated_at"]
#                 and (
#                     agents[aid]["updated_at"] is None
#                     or r["updated_at"]
#                     > agents[aid]["updated_at"]
#                 )
#             ):

#                 agents[aid]["updated_at"] = (
#                     r["updated_at"]
#                 )

#         status_id = r["status_id"]

#         if status_id == 1:

#             status = "Open"

#             agents[aid]["summary"][
#                 "open"
#             ] += 1

#         elif status_id == 2:

#             status = "Pending"

#             agents[aid]["summary"][
#                 "pending"
#             ] += 1

#         elif status_id == 3:

#             status = "Answered"

#             agents[aid]["summary"][
#                 "answered"
#             ] += 1

#         elif status_id == 4:

#             status = "Resolved"

#             agents[aid]["summary"][
#                 "resolved"
#             ] += 1

#         elif status_id == 5:

#             status = "Closed"

#             agents[aid]["summary"][
#                 "closed"
#             ] += 1

#         else:

#             status = "Unknown"

#         agents[aid]["summary"][
#             "total"
#         ] += 1

#         agents[aid]["tickets"].append({

#             "ticket_id":
#                 f"#{r['ticket_id']}",

#             "issue":
#                 r["issue"],

#             "added_by":
#                 r["added_by"],

#             "added_date":
#                 (
#                     r["created_at"].isoformat()
#                     if r["created_at"]
#                     else None
#                 ),

#             "project":
#                 r["project_name"],

#             "type":
#                 r["ticket_type"],

#             "assigned_to":
#                 r["agent_name"],

#             "status":
#                 status,

#             "updated_date":
#                 (
#                     r["updated_at"].isoformat()
#                     if r["updated_at"]
#                     else None
#                 ),

#             "closed_date":
#                 (
#                     r["updated_at"].isoformat()
#                     if status_id == 5
#                     else None
#                 ),
#             "sla_hours":
#                 (
#                     f"{int(sla_hours * 60)} mins"
#                     if sla_hours < 1
#                     else f"{round(sla_hours, 2)}"
#                 ),

#             "sla_days":
#                 round(sla_hours / 8, 2)

#         })

#     # =====================================
#     # SORT BY updated_at ASCENDING
#     # =====================================

#     sorted_agents = sorted(
#         agents.values(),
#         key=lambda x: (
#             x["updated_at"]
#             if x["updated_at"]
#             else datetime.min
#         ),
#         reverse=False
#     )

#     return {

#         "status": True,

#         "filters": {

#             "from_date":
#                 from_date,

#             "to_date":
#                 to_date,

#             "sla_type":
#                 sla_type,

#             "agent_id":
#                 agent_filter
#         },

#         "total_agents":
#             len(sorted_agents),

#         "data":
#             sorted_agents
#     }




IST          = ZoneInfo("Asia/Kolkata")
OFFICE_START = dt_time(9, 30)
OFFICE_END   = dt_time(18, 0)


# =============================================
# HELPERS
# =============================================

def parse_dt(val):
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=None)
    if isinstance(val, date_type):
        return datetime(val.year, val.month, val.day)
    for fmt in (
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(str(val), fmt)
        except ValueError:
            continue
    try:
        return datetime.fromtimestamp(float(val))
    except (ValueError, TypeError, OSError):
        pass
    return None


def get_effective_now() -> datetime:
    now = datetime.now(IST).replace(tzinfo=None)
    if now.weekday() >= 5:
        days_back   = now.weekday() - 4
        last_friday = now - timedelta(days=days_back)
        return datetime.combine(last_friday.date(), OFFICE_END)
    if now.time() < OFFICE_START:
        return datetime.combine(now.date(), OFFICE_START)
    if now.time() > OFFICE_END:
        return datetime.combine(now.date(), OFFICE_END)
    return now


def get_sla_end(status_id: int, updated_at) -> datetime:
    if status_id == 5:
        return updated_at if updated_at else get_effective_now()
    return get_effective_now()


def calculate_working_hours(start: datetime, end: datetime) -> float:
    if not start or not end or end <= start:
        return 0.0
    total_hours = 0.0
    current_day = start.date()
    last_day    = end.date()
    while current_day <= last_day:
        if current_day.weekday() >= 5:
            current_day += timedelta(days=1)
            continue
        day_start    = datetime.combine(current_day, OFFICE_START)
        day_end      = datetime.combine(current_day, OFFICE_END)
        actual_start = max(start, day_start)
        actual_end   = min(end,   day_end)
        if actual_end > actual_start:
            total_hours += (actual_end - actual_start).total_seconds() / 3600
        current_day += timedelta(days=1)
    return round(total_hours, 2)


def format_sla_hours(sla_hours: float) -> str:
    if sla_hours < 1:
        return f"{int(sla_hours * 60)} mins"
    return f"{round(sla_hours, 2)} hrs"


# =============================================
# MODEL
# =============================================

class TicketDetailsRequest(BaseModel):
    status     : Optional[str] = None
    from_date  : Optional[str] = None
    to_date    : Optional[str] = None
    sla_filter : Optional[str] = "all"



@app.post("/api/ticket-details")
async def ticket_details(
    payload: TicketDetailsRequest = Body(
        default_factory=TicketDetailsRequest
    )
):
    ...
    from_date    = payload.from_date
    to_date      = payload.to_date
    sla_type     = payload.sla_type
    agent_filter = payload.agent_id

    query = """
    SELECT
        t.id       AS ticket_id,
        t.subject  AS issue,
        t.agent_id,

        CONCAT(a.first_name, ' ', a.last_name) AS agent_name,
        CONCAT(c.first_name, ' ', c.last_name) AS added_by,

        t.created_at,
        t.updated_at,
        t.status_id,

        sg.name AS project_name,
        ty.code AS ticket_type

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

    rows = await database.fetch_all(query=query)

    STATUS_MAP = {
        1: ("Open",     "open"),
        2: ("Pending",  "pending"),
        3: ("Answered", "answered"),
        4: ("Resolved", "resolved"),
        5: ("Closed",   "closed"),
    }

    agents = defaultdict(
        lambda: {
            "agent_id"  : None,
            "agent_name": "",
            "updated_at": None,
            "summary"   : {
                "open"    : 0,
                "pending" : 0,
                "answered": 0,
                "resolved": 0,
                "closed"  : 0,
                "total"   : 0
            },
            "tickets": []
        }
    )

    for r in rows:

        r = dict(r)

        status_id  = r["status_id"]
        created_at = parse_dt(r["created_at"])
        updated_at = parse_dt(r["updated_at"])

        # ── SLA ───────────────────────────────────────────────────────
        sla_end   = get_sla_end(status_id, updated_at)
        sla_hours = (
            calculate_working_hours(created_at, sla_end)
            if created_at else 0.0
        )

        # ── SLA filter ────────────────────────────────────────────────
        if sla_type == "gt_48" and sla_hours <= 48:
            continue
        if sla_type == "lt_48" and sla_hours >= 48:
            continue

        # ── Date filter ───────────────────────────────────────────────
        if from_date and to_date:
            fd = datetime.strptime(from_date, "%Y-%m-%d").date()
            td = datetime.strptime(to_date,   "%Y-%m-%d").date()

            if status_id in (4, 5):
                date_to_check = (
                    updated_at.date() if updated_at
                    else created_at.date() if created_at
                    else None
                )
            else:
                date_to_check = created_at.date() if created_at else None

            if not date_to_check:
                continue
            if not (fd <= date_to_check <= td):
                continue

        # ── Agent filter ──────────────────────────────────────────────
        if agent_filter is not None and r["agent_id"] != agent_filter:
            continue

        aid = r["agent_id"]
        status_label, status_key = STATUS_MAP.get(status_id, ("Unknown", None))

        # ── Agent init / updated_at track ─────────────────────────────
        if agents[aid]["agent_id"] is None:
            agents[aid]["agent_id"]   = aid
            agents[aid]["agent_name"] = r["agent_name"] or ""
            agents[aid]["updated_at"] = updated_at
        else:
            if updated_at and (
                agents[aid]["updated_at"] is None
                or updated_at > agents[aid]["updated_at"]
            ):
                agents[aid]["updated_at"] = updated_at

        # ── Summary count ─────────────────────────────────────────────
        if status_key:
            agents[aid]["summary"][status_key] += 1
        agents[aid]["summary"]["total"] += 1

        # ── Ticket append ─────────────────────────────────────────────
        agents[aid]["tickets"].append({
            "ticket_id"   : f"#{r['ticket_id']}",
            "issue"       : r["issue"],
            "added_by"    : r["added_by"],
            "added_date"  : created_at.isoformat() if created_at else None,
            "project"     : r["project_name"],
            "type"        : r["ticket_type"],
            "assigned_to" : r["agent_name"],
            "status"      : status_label,
            "updated_date": updated_at.isoformat() if updated_at else None,
            "closed_date" : (
                updated_at.isoformat() if status_id == 5 else None
            ),
            "sla_hours"   : format_sla_hours(sla_hours),
            "sla_days"    : round(sla_hours / 8.5, 2)
        })

    sorted_agents = sorted(
        agents.values(),
        key=lambda x: x["updated_at"] if x["updated_at"] else datetime.min
    )

    return {
        "status"      : True,
        "filters"     : {
            "from_date": from_date,
            "to_date"  : to_date,
            "sla_type" : sla_type,
            "agent_id" : agent_filter
        },
        "total_agents": len(sorted_agents),
        "data"        : sorted_agents
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
    
# class AgentSummaryRequest(BaseModel):
#     from_date: Optional[str] = None
#     to_date: Optional[str] = None
#     sla_filter: Optional[str] = "all"   

# # @app.post("/api/uvdesk-agent-summary")
# async def uvdesk_agent_summary(
#     payload: AgentSummaryRequest = AgentSummaryRequest()
# ):

#     try:

#         query = """
#         SELECT
#             t.agent_id,

#             CONCAT(
#                 u.first_name,
#                 ' ',
#                 u.last_name
#             ) AS agent_name,

#             t.status_id,

#             t.created_at,

#             t.updated_at,

#             CASE
#                 WHEN t.status_id = 5
#                 THEN TIMESTAMPDIFF(
#                     HOUR,
#                     t.created_at,
#                     t.updated_at
#                 )
#                 ELSE TIMESTAMPDIFF(
#                     HOUR,
#                     t.created_at,
#                     NOW()
#                 )
#             END AS sla_hours

#         FROM uv_ticket t

#         INNER JOIN uv_user u
#         ON t.agent_id = u.id
#         AND u.is_enabled != 2

#         WHERE t.is_trashed != 1
#         """

#         rows = await database.fetch_all(
#             query=query
#         )

#         agents = defaultdict(
#             lambda: {
#                 "agent_id": None,
#                 "agent_name": "",
#                 "summary": {
#                     "open": 0,
#                     "pending": 0,
#                     "answered": 0,
#                     "resolved": 0,
#                     "closed": 0,
#                     "active": 0,
#                     "total": 0
#                 }
#             }
#         )

#         # ==================================================
#         # OVERALL SUMMARY
#         # ==================================================

#         overall = {
#             "open": 0,
#             "pending": 0,
#             "answered": 0,
#             "resolved": 0,
#             "closed": 0,
#             "active": 0,
#             "total": 0
#         }

#         # ==================================================
#         # DATE FILTER ENABLE ONLY IF BOTH PROVIDED
#         # ==================================================

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

#         # ==================================================
#         # LOOP
#         # ==================================================

#         for row in rows:

#             r = dict(row)

#             # ==================================================
#             # DATE FILTER
#             # ==================================================

#             if use_date_filter:

#                 if r["status_id"] in (4, 5):
#                     date_to_check = (
#                         r["updated_at"].date()
#                         if r["updated_at"]
#                         else r["created_at"].date()
#                     )
#                 else:
#                     date_to_check = (
#                         r["created_at"].date()
#                     )

#                 if not (
#                     from_date
#                     <= date_to_check
#                     <= to_date
#                 ):
#                     continue

#             # ==================================================
#             # SLA FILTER
#             # ==================================================

#             sla_hours = (
#                 r["sla_hours"] or 0
#             )

#             if (
#                 payload.sla_filter
#                 == "gt_48"
#                 and sla_hours <= 48
#             ):
#                 continue

#             if (
#                 payload.sla_filter
#                 == "lt_48"
#                 and sla_hours >= 48
#             ):
#                 continue

#             aid = r["agent_id"]

#             if (
#                 agents[aid]["agent_id"]
#                 is None
#             ):

#                 agents[aid]["agent_id"] = aid

#                 agents[aid]["agent_name"] = (
#                     r["agent_name"]
#                     or "Unassigned"
#                 )

#             status = r["status_id"]

#             # ==================================================
#             # STATUS COUNTS
#             # ==================================================

#             if status == 1:

#                 agents[aid]["summary"][
#                     "open"
#                 ] += 1

#                 overall["open"] += 1

#             elif status == 2:

#                 agents[aid]["summary"][
#                     "pending"
#                 ] += 1

#                 overall["pending"] += 1

#             elif status == 3:

#                 agents[aid]["summary"][
#                     "answered"
#                 ] += 1

#                 overall["answered"] += 1

#             elif status == 4:

#                 agents[aid]["summary"][
#                     "resolved"
#                 ] += 1

#                 overall["resolved"] += 1

#             elif status == 5:

#                 agents[aid]["summary"][
#                     "closed"
#                 ] += 1

#                 overall["closed"] += 1

#             agents[aid]["summary"][
#                 "total"
#             ] += 1

#             overall["total"] += 1

#         # ==================================================
#         # ACTIVE COUNTS
#         # ==================================================

#         for aid in agents:

#             s = agents[aid]["summary"]

#             s["active"] = (

#                 s["open"]

#                 + s["pending"]

#                 + s["answered"]

#             )

#         overall["active"] = (

#             overall["open"]

#             + overall["pending"]

#             + overall["answered"]

#         )

#         # ==================================================
#         # RESPONSE
#         # ==================================================

#         return {

#             "status": True,

#             "filters": {

#                 "from_date":
#                     payload.from_date,

#                 "to_date":
#                     payload.to_date,

#                 "sla_filter":
#                     payload.sla_filter

#             },

#             "overall": overall,

#             "total_agents": len(
#                 agents
#             ),

#             "data": list(
#                 agents.values()
#             )
#         }

#     except Exception as e:

#         return {

#             "status": False,

#             "message": str(e)

#         }
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


###########################################   Authentication ##################################################

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

    return Response(status_code=200)

#########################################ticket details#######################################################

# class TicketDetailsRequest(BaseModel):
#     status: Optional[str] = None
#     from_date: Optional[str] = None
#     to_date: Optional[str] = None


# @app.post("/api/ticket-details")
# async def ticket_details(
#     payload: TicketDetailsRequest = Body(
#         default_factory=TicketDetailsRequest
#     )
# ):

#     try:

#         query = """
#         SELECT

#             t.id,
#             t.subject,
#             t.status_id,
#             t.created_at,
#             t.updated_at,

#             t.agent_id,

#             CONCAT(
#                 COALESCE(u.first_name,''),
#                 ' ',
#                 COALESCE(u.last_name,'')
#             ) AS agent_name

#         FROM uv_ticket t

#         INNER JOIN uv_user u
#             ON t.agent_id = u.id
#            AND u.is_enabled != 2

#         WHERE t.is_trashed != 1
#         """

#         rows = await database.fetch_all(query=query)

#         data = []

#         from_date = payload.from_date
#         to_date = payload.to_date

#         status_filter = (
#             payload.status.lower().strip()
#             if payload.status
#             else None
#         )

#         # =========================
#         # DATE FILTER SETUP
#         # =========================

#         fd = None
#         td = None

#         if from_date and to_date:

#             fd = datetime.strptime(
#                 from_date,
#                 "%Y-%m-%d"
#             ).date()

#             td = datetime.strptime(
#                 to_date,
#                 "%Y-%m-%d"
#             ).date()

#         for row in rows:

#             r = dict(row)

#             status_id = r["status_id"]

#             # =========================
#             # STATUS FILTER
#             # =========================

#             if status_filter:

#                 if status_filter == "active":

#                     if status_id not in (1, 2, 3):
#                         continue

#                 elif status_filter == "resolved":

#                     if status_id != 4:
#                         continue

#                 elif status_filter == "closed":

#                     if status_id != 5:
#                         continue

#                 elif status_filter == "open":

#                     if status_id != 1:
#                         continue

#                 elif status_filter == "pending":

#                     if status_id != 2:
#                         continue

#                 elif status_filter == "answered":

#                     if status_id != 3:
#                         continue

#                 elif status_filter == "total":

#                     pass

#             # =========================
#             # DATE FILTER
#             # =========================

#             if fd and td:

#                 if status_id in (4, 5):

#                     date_to_check = (
#                         r["updated_at"].date()
#                         if r["updated_at"]
#                         else r["created_at"].date()
#                     )

#                 else:

#                     date_to_check = (
#                         r["created_at"].date()
#                         if r["created_at"]
#                         else None
#                     )

#                 if not date_to_check:
#                     continue

#                 if not (
#                     fd <= date_to_check <= td
#                 ):
#                     continue

#             # =========================
#             # STATUS NAME
#             # =========================

#             status_map = {

#                 1: "Open",
#                 2: "Pending",
#                 3: "Answered",
#                 4: "Resolved",
#                 5: "Closed"

#             }

#             data.append({

#                 "ticket_id": f"#{r['id']}",

#                 "subject": r["subject"],

#                 "agent_id": r["agent_id"],

#                 "agent_name": r["agent_name"],

#                 "status": status_map.get(
#                     status_id,
#                     "Unknown"
#                 ),

#                 "created_at": (
#                     r["created_at"].isoformat()
#                     if r["created_at"]
#                     else None
#                 ),

#                 "updated_at": (
#                     r["updated_at"].isoformat()
#                     if r["updated_at"]
#                     else None
#                 )
#             })

#         return {

#             "status": True,

#             "filters": {

#                 "status": payload.status,
#                 "from_date": payload.from_date,
#                 "to_date": payload.to_date

#             },

#             "count": len(data),

#             "data": data

#         }

#     except Exception as e:

#         return {

#             "status": False,

#             "message": str(e)

#         }


# def calculate_working_hours(start: datetime, end: datetime) -> float:
#     if not start or not end or end <= start:
#         return 0.0

#     DAILY_CAP   = 8.0
#     total_hours = 0.0
#     current_date = start.date()
#     end_date     = end.date()

#     while current_date <= end_date:

#         if current_date.weekday() >= 5:
#             current_date += timedelta(days=1)
#             continue

#         if current_date == start.date() == end_date:
#             hours = (end - start).total_seconds() / 3600

#         elif current_date == start.date():
#             end_of_day = datetime.combine(
#                 current_date + timedelta(days=1),
#                 datetime.min.time()
#             )
#             hours = (end_of_day - start).total_seconds() / 3600

#         elif current_date == end_date:
#             start_of_day = datetime.combine(
#                 current_date,
#                 datetime.min.time()
#             )
#             hours = (end - start_of_day).total_seconds() / 3600

#         else:
#             hours = 24.0

#         total_hours += min(hours, DAILY_CAP)
#         current_date += timedelta(days=1)

#     return round(total_hours, 2)


# class TicketDetailsRequest(BaseModel):
#     status: Optional[str] = None
#     from_date: Optional[str] = None
#     to_date: Optional[str] = None
#     sla_filter: Optional[str] = "all"   # "all" | "gt_48" | "lt_48"


# @app.post("/api/ticket-details")
# async def ticket_details(
#     payload: TicketDetailsRequest = Body(
#         default_factory=TicketDetailsRequest
#     )
# ):
#     try:

#         query = """
#         SELECT

#             t.id          AS ticket_id,
#             t.subject,
#             t.status_id,
#             t.created_at,
#             t.updated_at,
#             t.agent_id,

#             CONCAT(
#                 COALESCE(a.first_name, ''),
#                 ' ',
#                 COALESCE(a.last_name, '')
#             ) AS agent_name,

#             CONCAT(
#                 COALESCE(c.first_name, ''),
#                 ' ',
#                 COALESCE(c.last_name, '')
#             ) AS added_by,

#             sg.name  AS project_name,
#             ty.code  AS ticket_type

#         FROM uv_ticket t

#         INNER JOIN uv_user a
#             ON t.agent_id = a.id
#            AND a.is_enabled != 2

#         LEFT JOIN uv_user c
#             ON t.customer_id = c.id

#         LEFT JOIN uv_ticket_type ty
#             ON t.type_id = ty.id

#         LEFT JOIN uv_support_group sg
#             ON t.group_id = sg.id

#         WHERE t.is_trashed != 1
#         """

#         rows = await database.fetch_all(query=query)

#         # ==================================================
#         # SETUP
#         # ==================================================

#         STATUS_MAP = {
#             1: "open",
#             2: "pending",
#             3: "answered",
#             4: "resolved",
#             5: "closed"
#         }

#         STATUS_LABEL = {
#             1: "Open",
#             2: "Pending",
#             3: "Answered",
#             4: "Resolved",
#             5: "Closed"
#         }

#         use_date_filter = bool(payload.from_date and payload.to_date)

#         if use_date_filter:
#             from_dt = datetime.strptime(payload.from_date, "%Y-%m-%d").date()
#             to_dt   = datetime.strptime(payload.to_date,   "%Y-%m-%d").date()

#         status_filter = (
#             payload.status.lower().strip()
#             if payload.status
#             else None
#         )

#         overall = {
#             "open": 0, "pending": 0, "answered": 0,
#             "resolved": 0, "closed": 0,
#             "active": 0, "total": 0
#         }

#         data = []

#         # ==================================================
#         # LOOP
#         # ==================================================

#         for row in rows:

#             r = dict(row)
#             status_id = r["status_id"]

#             # ── SLA calculation ───────────────────────────────────────
#             created_at = r["created_at"]
#             updated_at = r["updated_at"]
#             sla_end    = updated_at if status_id == 5 and updated_at else datetime.now()
#             sla_hours  = calculate_working_hours(created_at, sla_end) if created_at else 0.0

#             # ── SLA filter ────────────────────────────────────────────
#             if payload.sla_filter == "gt_48" and sla_hours <= 48:
#                 continue
#             if payload.sla_filter == "lt_48" and sla_hours >= 48:
#                 continue

#             # ── Status filter ─────────────────────────────────────────
#             if status_filter:
#                 if status_filter == "active":
#                     if status_id not in (1, 2, 3):
#                         continue
#                 elif status_filter == "resolved":
#                     if status_id != 4:
#                         continue
#                 elif status_filter == "closed":
#                     if status_id != 5:
#                         continue
#                 elif status_filter == "open":
#                     if status_id != 1:
#                         continue
#                 elif status_filter == "pending":
#                     if status_id != 2:
#                         continue
#                 elif status_filter == "answered":
#                     if status_id != 3:
#                         continue
#                 elif status_filter == "total":
#                     pass

#             # ── Date filter ───────────────────────────────────────────
#             if use_date_filter:
#                 if status_id in (4, 5):
#                     date_to_check = (
#                         r["updated_at"].date()
#                         if r["updated_at"]
#                         else r["created_at"].date()
#                     )
#                 else:
#                     date_to_check = (
#                         r["created_at"].date()
#                         if r["created_at"]
#                         else None
#                     )

#                 if not date_to_check:
#                     continue

#                 if not (from_dt <= date_to_check <= to_dt):
#                     continue

#             # ── Overall counts ────────────────────────────────────────
#             status_key = STATUS_MAP.get(status_id, "unknown")
#             if status_key in overall:
#                 overall[status_key] += 1
#             overall["total"] += 1

#             # ── Ticket append ─────────────────────────────────────────
#             data.append({
#                 "ticket_id":   f"#{r['ticket_id']}",
#                 "subject":     r["subject"],
#                 "agent_id":    r["agent_id"],
#                 "agent_name":  r["agent_name"],
#                 "added_by":    r["added_by"],
#                 "project":     r["project_name"],
#                 "type":        r["ticket_type"],
#                 "status":      STATUS_LABEL.get(status_id, "Unknown"),
#                 "created_at":  (
#                     r["created_at"].isoformat()
#                     if r["created_at"] else None
#                 ),
#                 "updated_at":  (
#                     r["updated_at"].isoformat()
#                     if r["updated_at"] else None
#                 ),
#                 "closed_at":   (
#                     r["updated_at"].strftime("%d %b %Y, %H:%M")
#                     if status_id == 5 and r["updated_at"] else None
#                 ),
#                 "sla_hours":   (
#                     f"{int(sla_hours * 60)} mins"
#                     if sla_hours < 1
#                     else f"{round(sla_hours, 2)} hrs"
#                 ),
#                 "sla_days":    round(sla_hours / 8, 2)
#             })

#         # ==================================================
#         # ACTIVE COUNT
#         # ==================================================

#         overall["active"] = (
#             overall["open"] + overall["pending"] + overall["answered"]
#         )

#         # ==================================================
#         # TICKETS BY STATUS
#         # ==================================================

#         tickets_by_status = {
#             "open":     [t for t in data if t["status"] == "Open"],
#             "pending":  [t for t in data if t["status"] == "Pending"],
#             "answered": [t for t in data if t["status"] == "Answered"],
#             "resolved": [t for t in data if t["status"] == "Resolved"],
#             "closed":   [t for t in data if t["status"] == "Closed"],
#             "active":   [t for t in data if t["status"] in ("Open", "Pending", "Answered")],
#             "total":    data
#         }

#         # ==================================================
#         # RESPONSE
#         # ==================================================

#         return {
#             "status": True,
#             "filters": {
#                 "status":     payload.status,
#                 "from_date":  payload.from_date,
#                 "to_date":    payload.to_date,
#                 "sla_filter": payload.sla_filter
#             },
#             "overall":             overall,
#             "tickets_by_status":   tickets_by_status,
#             "count":               len(data),
#             "data":                data
#         }

#     except Exception as e:
#         return {
#             "status": False,
#             "message": str(e)
#         }


# =============================================
# CONSTANTS
# =============================================
from zoneinfo import ZoneInfo
IST          = ZoneInfo("Asia/Kolkata")
OFFICE_START = dt_time(9, 30)
OFFICE_END   = dt_time(18, 0)


def parse_dt(val):
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=None)
    if isinstance(val, date_type):
        return datetime(val.year, val.month, val.day)
    for fmt in (
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(str(val), fmt)
        except ValueError:
            continue
    try:
        return datetime.fromtimestamp(float(val))
    except (ValueError, TypeError, OSError):
        pass
    return None


def get_effective_now() -> datetime:
    now = datetime.now(IST).replace(tzinfo=None)
    if now.weekday() >= 5:
        days_back   = now.weekday() - 4
        last_friday = now - timedelta(days=days_back)
        return datetime.combine(last_friday.date(), OFFICE_END)
    if now.time() < OFFICE_START:
        return datetime.combine(now.date(), OFFICE_START)
    if now.time() > OFFICE_END:
        return datetime.combine(now.date(), OFFICE_END)
    return now


def calculate_working_hours(start: datetime, end: datetime) -> float:
    if not start or not end or end <= start:
        return 0.0

    total_hours = 0.0
    current_day = start.date()
    last_day    = end.date()

    while current_day <= last_day:
        if current_day.weekday() >= 5:
            current_day += timedelta(days=1)
            continue

        work_start  = datetime.combine(current_day, OFFICE_START)
        work_end    = datetime.combine(current_day, OFFICE_END)

        clamp_start = max(start, work_start)   # ✅ start parameter safe
        clamp_end   = min(end,   work_end)     # ✅ end parameter safe

        if clamp_end > clamp_start:
            total_hours += (
                clamp_end - clamp_start
            ).total_seconds() / 3600

        current_day += timedelta(days=1)

    return round(total_hours, 2)


def format_sla_hours(sla_hours: float) -> str:
    if sla_hours < 1:
        return f"{int(sla_hours * 60)} mins"
    return f"{round(sla_hours, 2)} hrs"

# =============================================
# MODEL
# =============================================

class AgentReportRequest(BaseModel):
    from_date : str | None = None
    to_date   : str | None = None
    sla_type  : str | None = None
    agent_id  : int | None = None


# =============================================
# ENDPOINT
# =============================================

@app.post("/api/uvdesk-agent")
async def uvdesk_agent_summary(
    payload: AgentReportRequest = Body(
        default_factory=AgentReportRequest
    )
):
    from_date    = payload.from_date
    to_date      = payload.to_date
    sla_type     = payload.sla_type
    agent_filter = payload.agent_id

    query = """
    SELECT
        t.id       AS ticket_id,
        t.subject  AS issue,
        t.agent_id,

        CONCAT(a.first_name, ' ', a.last_name) AS agent_name,
        CONCAT(c.first_name, ' ', c.last_name) AS added_by,

        t.created_at,
        t.updated_at,
        t.status_id,

        sg.name AS project_name,
        ty.code AS ticket_type

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

    rows = await database.fetch_all(query=query)

 

    STATUS_MAP = {
        1: ("Open",     "open"),
        2: ("Pending",  "pending"),
        3: ("Answered", "answered"),
        4: ("Resolved", "resolved"),
        5: ("Closed",   "closed"),
    }

    agents = defaultdict(
        lambda: {
            "agent_id"  : None,
            "agent_name": "",
            "updated_at": None,
            "summary"   : {
                "open"    : 0,
                "pending" : 0,
                "answered": 0,
                "resolved": 0,
                "closed"  : 0,
                "total"   : 0
            },
            "tickets": []
        }
    )

    for r in rows:

        r = dict(r)

        status_id  = r["status_id"]
        created_at = parse_dt(r["created_at"])
        updated_at = parse_dt(r["updated_at"])

        # ── SLA ───────────────────────────────────────────────────────
        if status_id == 5:
            sla_end = updated_at if updated_at else get_effective_now()
        else:
            sla_end = get_effective_now()

        sla_hours = (
            calculate_working_hours(created_at, sla_end)
            if created_at else 0.0
        )

        # ── SLA filter ────────────────────────────────────────────────
        if sla_type == "gt_48" and sla_hours <= 48:
            continue
        if sla_type == "lt_48" and sla_hours >= 48:
            continue

        # ── Date filter ───────────────────────────────────────────────
        if from_date and to_date:
            fd = datetime.strptime(from_date, "%Y-%m-%d").date()
            td = datetime.strptime(to_date,   "%Y-%m-%d").date()

            if status_id in (4, 5):
                date_to_check = (
                    updated_at.date() if updated_at
                    else created_at.date() if created_at
                    else None
                )
            else:
                date_to_check = created_at.date() if created_at else None

            if not date_to_check:
                continue
            if not (fd <= date_to_check <= td):
                continue

        # ── Agent filter ──────────────────────────────────────────────
        if agent_filter is not None and r["agent_id"] != agent_filter:
            continue

        aid = r["agent_id"]
        status_label, status_key = STATUS_MAP.get(status_id, ("Unknown", None))

        # ── Agent init / updated_at track ─────────────────────────────
        if agents[aid]["agent_id"] is None:
            agents[aid]["agent_id"]   = aid
            agents[aid]["agent_name"] = r["agent_name"] or ""
            agents[aid]["updated_at"] = updated_at
        else:
            if updated_at and (
                agents[aid]["updated_at"] is None
                or updated_at > agents[aid]["updated_at"]
            ):
                agents[aid]["updated_at"] = updated_at

        # ── Summary count ─────────────────────────────────────────────
        if status_key:
            agents[aid]["summary"][status_key] += 1
        agents[aid]["summary"]["total"] += 1

        # ── Ticket append ─────────────────────────────────────────────
        agents[aid]["tickets"].append({
            "ticket_id"   : f"#{r['ticket_id']}",
            "issue"       : r["issue"],
            "added_by"    : r["added_by"],
            "added_date"  : created_at.isoformat() if created_at else None,
            "project"     : r["project_name"],
            "type"        : r["ticket_type"],
            "assigned_to" : r["agent_name"],
            "status"      : status_label,
            "updated_date": updated_at.isoformat() if updated_at else None,
            "closed_date" : (
                updated_at.isoformat()
                if status_id == 5 else None
            ),
            "sla_hours"   : format_sla_hours(sla_hours),
            "sla_days"    : round(sla_hours / 8.5, 2)
        })

    sorted_agents = sorted(
        agents.values(),
        key=lambda x: x["updated_at"] if x["updated_at"] else datetime.min
    )

    return {
        "status"      : True,
        "filters"     : {
            "from_date": from_date,
            "to_date"  : to_date,
            "sla_type" : sla_type,
            "agent_id" : agent_filter
        },
        "total_agents": len(sorted_agents),
        "data"        : sorted_agents
    }

##################################################################################################


 
def calculate_working_hours(start: datetime, end: datetime) -> float:
    if not start or not end or end <= start:
        return 0.0
 
    DAILY_CAP   = 8.0
    total_hours = 0.0
    current_date = start.date()
    end_date     = end.date()
 
    while current_date <= end_date:
 
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
 
        if current_date == start.date() == end_date:
            hours = (end - start).total_seconds() / 3600
 
        elif current_date == start.date():
            end_of_day = datetime.combine(
                current_date + timedelta(days=1),
                datetime.min.time()
            )
            hours = (end_of_day - start).total_seconds() / 3600
 
        elif current_date == end_date:
            start_of_day = datetime.combine(
                current_date,
                datetime.min.time()
            )
            hours = (end - start_of_day).total_seconds() / 3600
 
        else:
            hours = 24.0
 
        total_hours += min(hours, DAILY_CAP)
        current_date += timedelta(days=1)
 
    return round(total_hours, 2)
 
 
# ✅ PHIR CLASS
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
            t.id          AS ticket_id,
            t.subject     AS issue,
            t.agent_id,
 
            CONCAT(a.first_name, ' ', a.last_name) AS agent_name,
            CONCAT(c.first_name, ' ', c.last_name) AS added_by,
 
            t.created_at,
            t.updated_at,
            t.status_id,
 
            sg.name   AS project_name,
            ty.code   AS ticket_type
 
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
 
        rows = await database.fetch_all(query=query)
 
        # ==================================================
        # SETUP
        # ==================================================
 
        use_date_filter = payload.from_date and payload.to_date
 
        if use_date_filter:
            from_dt = datetime.strptime(payload.from_date, "%Y-%m-%d").date()
            to_dt   = datetime.strptime(payload.to_date,   "%Y-%m-%d").date()
 
        STATUS_MAP = {
            1: "open",
            2: "pending",
            3: "answered",
            4: "resolved",
            5: "closed"
        }
 
        STATUS_LABEL = {
            1: "Open",
            2: "Pending",
            3: "Answered",
            4: "Resolved",
            5: "Closed"
        }
 
        agents = defaultdict(lambda: {
            "agent_id":   None,
            "agent_name": "",
            "updated_at": None,
            "summary": {
                "open": 0, "pending": 0, "answered": 0,
                "resolved": 0, "closed": 0,
                "active": 0, "total": 0
            },
            "tickets": []
        })
 
        overall = {
            "open": 0, "pending": 0, "answered": 0,
            "resolved": 0, "closed": 0,
            "active": 0, "total": 0
        }
 
        # ==================================================
        # LOOP
        # ==================================================
 
        for row in rows:
 
            r = dict(row)
 
            # ── SLA calculation (working hours Mon–Fri, 8hr/day cap) ──
            created_at = r["created_at"]
            updated_at = r["updated_at"]
            sla_end    = updated_at if r["status_id"] == 5 and updated_at else datetime.now()
            sla_hours  = calculate_working_hours(created_at, sla_end) if created_at else 0.0
 
            # ── SLA filter ────────────────────────────────────────────
            if payload.sla_filter == "gt_48" and sla_hours <= 48:
                continue
            if payload.sla_filter == "lt_48" and sla_hours >= 48:
                continue
 
            # ── Date filter ───────────────────────────────────────────
            if use_date_filter:
                if r["status_id"] in (4, 5):
                    date_to_check = (
                        r["updated_at"].date()
                        if r["updated_at"]
                        else r["created_at"].date()
                    )
                else:
                    date_to_check = r["created_at"].date()
 
                if not (from_dt <= date_to_check <= to_dt):
                    continue
 
            # ── Agent init ────────────────────────────────────────────
            aid = r["agent_id"]
 
            if agents[aid]["agent_id"] is None:
                agents[aid]["agent_id"]   = aid
                agents[aid]["agent_name"] = r["agent_name"] or "Unassigned"
                agents[aid]["updated_at"] = r["updated_at"]
            else:
                if r["updated_at"] and (
                    agents[aid]["updated_at"] is None
                    or r["updated_at"] > agents[aid]["updated_at"]
                ):
                    agents[aid]["updated_at"] = r["updated_at"]
 
            # ── Status counts ─────────────────────────────────────────
            status_key   = STATUS_MAP.get(r["status_id"], "unknown")
            status_label = STATUS_LABEL.get(r["status_id"], "Unknown")
 
            if status_key in agents[aid]["summary"]:
                agents[aid]["summary"][status_key] += 1
                overall[status_key] += 1
 
            agents[aid]["summary"]["total"] += 1
            overall["total"] += 1
 
            # ── Ticket detail ─────────────────────────────────────────
            agents[aid]["tickets"].append({
                "ticket_id":   f"#{r['ticket_id']}",
                "issue":       r["issue"],
                "added_by":    r["added_by"],
                "project":     r["project_name"],
                "type":        r["ticket_type"],
                "assigned_to": r["agent_name"],
                "status":      status_label,
                "created_at":  (
                    r["created_at"].strftime("%d %b %Y, %H:%M")
                    if r["created_at"] else None
                ),
                "updated_at":  (
                    r["updated_at"].strftime("%d %b %Y, %H:%M")
                    if r["updated_at"] else None
                ),
                "closed_at":   (
                    r["updated_at"].strftime("%d %b %Y, %H:%M")
                    if r["status_id"] == 5 and r["updated_at"] else None
                ),
                "sla_hours":   (
                    f"{int(sla_hours * 60)} mins"
                    if sla_hours < 1
                    else f"{round(sla_hours, 2)} hrs"
                ),
                "sla_days":    round(sla_hours / 8, 2)
            })
 
        # ==================================================
        # ACTIVE COUNTS  (open + pending + answered)
        # ==================================================
 
        for aid in agents:
            s = agents[aid]["summary"]
            s["active"] = s["open"] + s["pending"] + s["answered"]
 
        overall["active"] = (
            overall["open"] + overall["pending"] + overall["answered"]
        )
 
        # ==================================================
        # FILTER TICKETS PER STATUS BUCKET
        # Each agent gets grouped ticket lists for easy
        # frontend click → detail mapping
        # ==================================================
 
        for aid in agents:
 
            tickets = agents[aid]["tickets"]
 
            agents[aid]["tickets_by_status"] = {
 
                "open":     [t for t in tickets if t["status"] == "Open"],
                "pending":  [t for t in tickets if t["status"] == "Pending"],
                "answered": [t for t in tickets if t["status"] == "Answered"],
                "resolved": [t for t in tickets if t["status"] == "Resolved"],
                "closed":   [t for t in tickets if t["status"] == "Closed"],
                "active":   [t for t in tickets if t["status"] in ("Open", "Pending", "Answered")],
                "total":    tickets
            }
 
        # ==================================================
        # SORT agents by updated_at ASC
        # ==================================================
 
        sorted_agents = sorted(
            agents.values(),
            key=lambda x: x["updated_at"] or datetime.min
        )
 
        # ==================================================
        # OVERALL tickets_by_status
        # ==================================================
 
        all_tickets = [
            t
            for agent in sorted_agents
            for t in agent["tickets"]
        ]
 
        overall_tickets_by_status = {
            "open":     [t for t in all_tickets if t["status"] == "Open"],
            "pending":  [t for t in all_tickets if t["status"] == "Pending"],
            "answered": [t for t in all_tickets if t["status"] == "Answered"],
            "resolved": [t for t in all_tickets if t["status"] == "Resolved"],
            "closed":   [t for t in all_tickets if t["status"] == "Closed"],
            "active":   [t for t in all_tickets if t["status"] in ("Open", "Pending", "Answered")],
            "total":    all_tickets
        }
 
        # ==================================================
        # RESPONSE
        # ==================================================
 
        return {
            "status": True,
            "filters": {
                "from_date":  payload.from_date,
                "to_date":    payload.to_date,
                "sla_filter": payload.sla_filter
            },
            "overall":                  overall,
            "overall_tickets_by_status": overall_tickets_by_status,
            "total_agents":             len(sorted_agents),
            "data":                     sorted_agents
        }
 
    except Exception as e:
        return {
            "status": False,
            "message": str(e)
        }



        ##################################
        