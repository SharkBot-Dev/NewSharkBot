import asyncio
from fastapi import APIRouter, Response, Query
from utils.levels import generate_rank_card_blocking

router = APIRouter(
    prefix="/levels"
)

@router.get("/rank")
async def get_rank_card(
    name: str = "neko",
    level: int = 10,
    current_xp: int = 750,
    max_xp: int = 1000,
    avatar_url: str = "https://github.com/identicons/neko.png",
    bg: str = "static/sea.jpg",
    status: str = Query("online", pattern="^(online|idle|dnd|offline)$"),
    color: str = "#e63119"
):
    clean_color = color.replace('"', '').replace("'", "")
    
    if not clean_color.startswith("#"):
        clean_color = f"#{clean_color}"

    image_data = await asyncio.to_thread(
        generate_rank_card_blocking, 
        name, 
        level, 
        current_xp, 
        max_xp, 
        avatar_url, 
        bg,       # background_pathとして渡す
        status,   # statusを追加
        clean_color     # accent_colorとして渡す
    )
    
    return Response(content=image_data, media_type="image/png")