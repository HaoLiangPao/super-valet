"""
GTA 餐厅种子数据 v2 — Downtown Markham 锚点

数据来源：Google Places API（2026-08 抓取），place_id / 坐标 / 营业时间为真实数据。
分类字段由分类器 + 人工判定。

距离锚点：Downtown Markham (43.8536, -79.3227)
"""

RESTAURANTS = [
    # ══════════════════════════════════════════════════════════
    # WALK  < 1.2 km —— Downtown Markham / Hwy 7 走廊
    # ══════════════════════════════════════════════════════════
    {
        "place_id": "ChIJ9UdHvp7V1IkRrzDFGuV0VBM",
        "name": "15th Ave Cafe & Bistro",
        "address": "169 Enterprise Blvd, Markham",
        "lat": 43.8492982,
        "lng": -79.3238633,
        "primary": "WS_BRUNCH",
        "tags": ["WS_BRUNCH", "WS_CAFE"],
        "solo_friendly": True,
        "slot_lock": ["breakfast", "lunch"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 2,
        "rating": 4.3,
        "rating_count": 170,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "09:00", "close": "16:00"}],
        "distance_km": 0.5,
        "bucket": "WALK",
    },
    {
        "place_id": "ChIJaeTnfgDV1IkRsLd7I1O40QU",
        "name": "Number One BBQ Bar 南波萬烧烤酒馆",
        "address": "3760 Hwy 7 Unit 1, Markham",
        "lat": 43.8566659,
        "lng": -79.3328873,
        "primary": "CN_SKEWER",
        "tags": ["CN_SKEWER", "CN_NORTHEAST"],
        "solo_friendly": False,
        "slot_lock": ["dinner", "latenight"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 2,
        "rating": 4.7,
        "rating_count": 513,
        "closed_days": [],
        "service_windows": [
            {"day": None, "open": "11:30", "close": "14:30"},
            {"day": 0, "open": "17:00", "close": "26:00"},
            {"day": 1, "open": "17:30", "close": "26:00"},
            {"day": 2, "open": "17:30", "close": "26:00"},
            {"day": 3, "open": "17:30", "close": "26:00"},
            {"day": 4, "open": "17:30", "close": "26:00"},
            {"day": 5, "open": "17:30", "close": "27:30"},
            {"day": 6, "open": "17:00", "close": "27:30"},
        ],
        "distance_km": 0.9,
        "bucket": "WALK",
    },
    {
        "place_id": "ChIJDzffMADV1IkRzi6wVGqcvfE",
        "name": "Akoya Izakaya",
        "address": "8601 Warden Ave, Unionville",
        "lat": 43.8581453,
        "lng": -79.3322391,
        "primary": "AS_IZAKAYA",
        "tags": ["AS_IZAKAYA", "AS_SUSHI"],
        "solo_friendly": False,
        "slot_lock": ["dinner"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": None,
        "rating": 4.4,
        "rating_count": 461,
        "closed_days": [],
        "service_windows": [
            {"day": None, "open": "11:00", "close": "14:30"},
            {"day": None, "open": "17:00", "close": "22:30"},
        ],
        "distance_km": 0.9,
        "bucket": "WALK",
    },
    {
        "place_id": "ChIJk9HrBBXV1IkRbJCRb3lYFVk",
        "name": "Sushi Umi (Markham)",
        "address": "3621 Hwy 7 Unit 104-105, Markham",
        "lat": 43.8541102,
        "lng": -79.3371383,
        "primary": "AS_SUSHI",
        "tags": ["AS_SUSHI"],
        "solo_friendly": True,
        "slot_lock": ["lunch", "dinner"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 4,
        "rating": 4.8,
        "rating_count": 950,
        "closed_days": [0],
        "service_windows": [
            {"day": 1, "open": "12:30", "close": "13:45"},
            {"day": 1, "open": "17:00", "close": "22:00"},
            {"day": 2, "open": "12:30", "close": "13:45"},
            {"day": 2, "open": "17:00", "close": "22:00"},
            {"day": 3, "open": "12:30", "close": "13:45"},
            {"day": 3, "open": "17:00", "close": "22:00"},
            {"day": 4, "open": "12:30", "close": "13:45"},
            {"day": 4, "open": "17:00", "close": "22:00"},
            {"day": 5, "open": "12:30", "close": "13:45"},
            {"day": 5, "open": "17:00", "close": "22:00"},
            {"day": 6, "open": "12:00", "close": "14:45"},
            {"day": 6, "open": "17:00", "close": "22:00"},
        ],
        "distance_km": 1.2,
        "bucket": "WALK",
    },
    # ══════════════════════════════════════════════════════════
    # NEAR  1.2 – 5 km —— Unionville / Kennedy / First Markham Place
    # ══════════════════════════════════════════════════════════
    {
        "place_id": "ChIJCSVLKujV1IkRE2jQGIG9xFA",
        "name": "Sung Won Korean Restaurant",
        "address": "4431 Hwy 7, Unionville",
        "lat": 43.8607857,
        "lng": -79.3114244,
        "primary": "AS_KOREAN",
        "tags": ["AS_KOREAN"],
        "solo_friendly": True,
        "slot_lock": [],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": False,
        "price_level": 1,
        "rating": 4.5,
        "rating_count": 401,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "10:30", "close": "21:00"}],
        "distance_km": 1.2,
        "bucket": "NEAR",
    },
    {
        "place_id": "ChIJX3vySnHV1IkRaSg2twVY5ZQ",
        "name": "Mom's Pan-Fried Bun",
        "address": "8362 Kennedy Rd, Markham",
        "lat": 43.8603242,
        "lng": -79.3033707,
        "primary": "CN_JIANGZHE",
        "tags": ["CN_JIANGZHE", "CN_DUMPLING", "CN_NOODLE"],
        "solo_friendly": True,
        "slot_lock": [],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 1,
        "rating": 4.6,
        "rating_count": 1549,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "10:00", "close": "22:00"}],
        "distance_km": 1.7,
        "bucket": "NEAR",
    },
    {
        "place_id": "ChIJdyI0n-7V1IkRhcKmL46NtYM",
        "name": "Yunshang Rice Noodle 云尚米线 (Unionville)",
        "address": "8380 Kennedy Rd C4, Markham",
        "lat": 43.8608284,
        "lng": -79.3041129,
        "primary": "CN_YUNNAN",
        "tags": ["CN_YUNNAN", "CN_NOODLE"],
        "solo_friendly": True,
        "slot_lock": [],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 1,
        "rating": 4.8,
        "rating_count": 1187,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "11:00", "close": "22:00"}],
        "distance_km": 1.7,
        "bucket": "NEAR",
    },
    {
        "place_id": "ChIJAdkyAADV1IkRvOOh1wdIPDw",
        "name": "Cantonese Best BBQ 港式燒味大王",
        "address": "11 Fairburn Dr Unit 19, Markham",
        "lat": 43.8477346,
        "lng": -79.3481742,
        "primary": "CN_BBQ_MEAT",
        "tags": ["CN_BBQ_MEAT", "CN_CANTON"],
        "solo_friendly": True,
        "slot_lock": ["lunch", "dinner"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 1,
        "rating": 3.9,
        "rating_count": 168,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "11:00", "close": "19:00"}],
        "distance_km": 2.1,
        "bucket": "NEAR",
    },
    {
        "place_id": "ChIJ5_XZWHrV1IkRVEAkrR6jQ4k",
        "name": "Cafe De Hong Kong 良心冰室",
        "address": "11 Fairburn Dr Unit 12-15, Markham",
        "lat": 43.8477774,
        "lng": -79.34849,
        "primary": "CN_HK_CAFE",
        "tags": ["CN_HK_CAFE", "CN_CANTON"],
        "solo_friendly": True,
        "slot_lock": ["breakfast", "lunch"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 1,
        "rating": 4.1,
        "rating_count": 1467,
        "closed_days": [2],
        "service_windows": [{"day": None, "open": "10:00", "close": "19:00"}],
        "distance_km": 2.2,
        "bucket": "NEAR",
    },
    {
        "place_id": "ChIJfyEHtu7U1IkRpFr5oTysvdo",
        "name": "Mei Nung Beef Noodle House 美濃",
        "address": "3229 Hwy 7 Unit 15, Markham",
        "lat": 43.8483038,
        "lng": -79.3491405,
        "primary": "CN_TAIWAN",
        "tags": ["CN_TAIWAN", "CN_NOODLE"],
        "solo_friendly": True,
        "slot_lock": [],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 1,
        "rating": 4.2,
        "rating_count": 704,
        "closed_days": [2],
        "service_windows": [{"day": None, "open": "11:30", "close": "21:00"}],
        "distance_km": 2.2,
        "bucket": "NEAR",
    },
    {
        "place_id": "ChIJ_fSIGGHX1IkRZE5RcrStUI8",
        "name": "Haidilao Hot Pot 海底捞 (Markham)",
        "address": "5328 Hwy 7 Ste 4, Markham",
        "lat": 43.8688939,
        "lng": -79.2815123,
        "primary": "CN_HOTPOT",
        "tags": ["CN_HOTPOT", "CN_SICHUAN"],
        "solo_friendly": False,
        "slot_lock": ["dinner", "latenight"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 2,
        "rating": 4.8,
        "rating_count": 7311,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "11:00", "close": "26:00"}],
        "distance_km": 3.7,
        "bucket": "NEAR",
    },
    {
        "place_id": "ChIJHRoMY_zT1IkRJxQPeox8fJc",
        "name": "Magic Noodle 一碗面",
        "address": "2190 McNicoll Ave #119, Scarborough",
        "lat": 43.8144605,
        "lng": -79.2943562,
        "primary": "CN_NOODLE",
        "tags": ["CN_NOODLE", "CN_NORTHEAST", "CN_DUMPLING"],
        "solo_friendly": True,
        "slot_lock": [],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 1,
        "rating": 4.5,
        "rating_count": 5340,
        "closed_days": [],
        "service_windows": [],
        "distance_km": 4.9,
        "bucket": "NEAR",
    },
    # ══════════════════════════════════════════════════════════
    # MID  5 – 15 km —— Richmond Hill / West Beaver Creek
    # ══════════════════════════════════════════════════════════
    {
        "place_id": "ChIJNZwyQjErK4gRiq6FhWcnkOU",
        "name": "Nian Yi Kuai Zi 廿一筷子",
        "address": "505 Hwy 7, Markham",
        "lat": 43.8419956,
        "lng": -79.3870018,
        "primary": "CN_SICHUAN",
        "tags": ["CN_SICHUAN"],
        "solo_friendly": False,
        "slot_lock": [],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 2,
        "rating": 4.7,
        "rating_count": 3071,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "11:30", "close": "22:30"}],
        "distance_km": 5.3,
        "bucket": "MID",
    },
    {
        "place_id": "ChIJBZgY9csrK4gRLgFdqS50OV0",
        "name": "Northern Chinese Specialties",
        "address": "280 West Beaver Creek Rd #25, Richmond Hill",
        "lat": 43.8439451,
        "lng": -79.3890568,
        "primary": "CN_NORTHEAST",
        "tags": ["CN_NORTHEAST", "CN_SKEWER"],
        "solo_friendly": False,
        "slot_lock": [],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": 2,
        "rating": 4.6,
        "rating_count": 127,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "11:00", "close": "23:00"}],
        "distance_km": 5.4,
        "bucket": "MID",
    },
    {
        "place_id": "ChIJHbAbOkkrK4gR765Ghi3euGk",
        "name": "Yu Seafood 御",
        "address": "270 West Beaver Creek Rd, Richmond Hill",
        "lat": 43.8444398,
        "lng": -79.3873724,
        "primary": "CN_DIMSUM",
        "tags": ["CN_DIMSUM", "CN_CANTON"],
        "solo_friendly": False,
        "slot_lock": ["breakfast", "lunch"],
        "is_main_meal": True,
        "prior_bias": 1.0,
        "dine_in": True,
        "price_level": None,
        "rating": 4.0,
        "rating_count": 3988,
        "closed_days": [],
        "service_windows": [{"day": None, "open": "09:00", "close": "23:00"}],
        "distance_km": 5.3,
        "bucket": "MID",
    },
]


def is_open_at(r: dict, weekday: int, minutes: int) -> bool:
    """
    判断餐厅在某个时刻是否营业。

    Args:
        r: 餐厅字典
        weekday: 0=周日 … 6=周六
        minutes: 当天 0 点起的分钟数（0-1439）

    Returns:
        True 如果营业，False 如果关闭
    """
    if weekday in r["closed_days"]:
        return False

    wins = r["service_windows"]
    if not wins:
        return True  # 24 小时

    def parse(s):
        h, m = s.split(":")
        return int(h) * 60 + int(m)

    for win in wins:
        o, c = parse(win["open"]), parse(win["close"])
        if win["day"] is None or win["day"] == weekday:
            if c <= 1440:
                if o <= minutes < c:
                    return True
            else:
                if minutes >= o:
                    return True
                if win["day"] is None and minutes < c - 1440:
                    return True
        else:
            prev = (weekday + 6) % 7
            if win["day"] == prev and c > 1440 and minutes < c - 1440:
                return True

    return False


if __name__ == "__main__":
    assert len(RESTAURANTS) == 15, len(RESTAURANTS)
    assert len({r["place_id"] for r in RESTAURANTS}) == 15
    by_name = {r["name"]: r for r in RESTAURANTS}

    hdl = next(r for r in RESTAURANTS if "Haidilao" in r["name"])
    assert is_open_at(hdl, 3, 60) is True      # 海底捞周三凌晨 1:00，26:00 打烊 → 营业

    umi = next(r for r in RESTAURANTS if "Sushi Umi" in r["name"])
    assert is_open_at(umi, 1, 720) is False    # Sushi Umi 周一 12:00，12:30 才开
    assert is_open_at(umi, 0, 780) is False    # 周日休

    cafe = next(r for r in RESTAURANTS if "良心冰室" in r["name"])
    assert is_open_at(cafe, 2, 780) is False   # 周二休

    print("seed_data OK:", len(RESTAURANTS), "restaurants")
