from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from database import database
import time
import json
import asyncio
import hashlib
from fastapi.middleware.cors import CORSMiddleware


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
        json.dumps(data, sort_keys=True).encode()
    ).hexdigest()


@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await websocket.accept()

    last_hash = None

    try:
        while True:

            # 🔥 STATUS SUMMARY
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
                            WHEN DATE(created_at) = CURDATE()
                            THEN 1 ELSE 0
                        END
                    ) AS today,

                    SUM(
                        CASE
                            WHEN MONTH(created_at) = MONTH(CURDATE())
                            AND YEAR(created_at) = YEAR(CURDATE())
                            THEN 1 ELSE 0
                        END
                    ) AS month,

                    COUNT(*) AS till_date

                FROM uv_ticket

                WHERE is_trashed != 1

                GROUP BY status_id
                ORDER BY status_id
                """,
                fetch="all"
            )

            # 🔥 TICKET TYPE SUMMARY
            ticket_type_summary = await cached_query(
                """
                SELECT 
                    tt.code AS ticket_type,

                    SUM(
                        CASE 
                            WHEN DATE(t.created_at) = CURDATE()
                            THEN 1 ELSE 0
                        END
                    ) AS today,

                    SUM(
                        CASE
                            WHEN MONTH(t.created_at) = MONTH(CURDATE())
                            AND YEAR(t.created_at) = YEAR(CURDATE())
                            THEN 1 ELSE 0
                        END
                    ) AS month,

                    COUNT(*) AS till_date

                FROM uv_ticket t

                LEFT JOIN uv_ticket_type tt
                ON t.type_id = tt.id

                WHERE t.is_trashed != 1

                GROUP BY tt.code
                ORDER BY tt.code
                """,
                fetch="all"
            )

            # 🔥 CONVERT STATUS ARRAY → OBJECT
            formatted_status = {}

            for row in status_data:
                status_name = row["status"].lower()

                formatted_status[f"{status_name}_tickets"] = {
                    "today": row["today"],
                    "month": row["month"],
                    "till_date": row["till_date"]
                }

            # 📦 FINAL RESPONSE
            data = {
                **formatted_status,
                "ticket_type_summary": [
                    dict(i) for i in ticket_type_summary or []
                ]
            }

            # 🔥 CHANGE DETECTION
            current_hash = make_hash(data)

            if current_hash != last_hash:
                await websocket.send_text(json.dumps(data))
                last_hash = current_hash
                print("📡 Dashboard updated")
            else:
                print("⏸ No changes")

            await asyncio.sleep(5)

    except WebSocketDisconnect:
        print("❌ Client disconnected")