/**
 * 餐厅目录 —— 我们维护的全部餐厅（ADR-0008 的「目录」层）。
 *
 * ⚠️ 本文件由 `node scripts/build-catalog.mjs` 生成，**不要手改**。
 * 数据经过与用户导入完全相同的流水线：Google Places 出事实，
 * DeepSeek 出分类，防幻觉边界见 design/0005 §4.2。
 *
 * 生成于 2026-09-26T05:07:59.847Z
 * 共 59 家（不含种子 15 家；`CATALOG` 会把两者合并）
 *
 * 每家店的 `fetchedAt` 用于 30 天 TTL（design/0005 §4.8）。
 */
import { SEED_RESTAURANTS } from './seed-restaurants';
import type { SeedRestaurant } from './seed-restaurants';

export interface CatalogEntry {
  restaurant: SeedRestaurant;
  fetchedAt: string;
  summary: string;
}

export const IMPORTED_CATALOG: CatalogEntry[] = [
  {
    "restaurant": {
      "placeId": "ChIJJcQQDFHX1IkR3Xj5_40qUmM",
      "name": "Bhima's",
      "address": "5694 Hwy 7, Markham, ON L3P 1P3, Canada",
      "lat": 43.8720548,
      "lng": -79.2682373,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.6,
      "ratingCount": 443,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "22:00"
        }
      ],
      "primary": "AS_INDIAN",
      "tags": [
        "AS_INDIAN",
        "CN_VEG"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "印度素食餐厅，提供多种印度菜",
      "distanceKm": 4.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:07:59.496Z",
    "summary": "Bhima's · AS_INDIAN(0.90) · ★4.6/443 · 价位1 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJOwseaInX1IkRZupi0TeDDRQ",
      "name": "Raja Chettinad Fine Indian Kitchen",
      "address": "825 Passmore Ave C101, Scarborough, ON M1X 0B8, Canada",
      "lat": 43.831027299999995,
      "lng": -79.2469498,
      "dineIn": true,
      "priceLevel": null,
      "rating": 4.8,
      "ratingCount": 734,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "08:00",
          "close": "27:00"
        },
        {
          "day": 1,
          "open": "08:00",
          "close": "27:00"
        },
        {
          "day": 2,
          "open": "14:00",
          "close": "26:00"
        },
        {
          "day": 3,
          "open": "14:00",
          "close": "26:00"
        },
        {
          "day": 4,
          "open": "08:00",
          "close": "27:00"
        },
        {
          "day": 5,
          "open": "08:00",
          "close": "27:00"
        },
        {
          "day": 6,
          "open": "08:00",
          "close": "27:00"
        }
      ],
      "primary": "AS_INDIAN",
      "tags": [
        "AS_INDIAN"
      ],
      "soloFriendly": true,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "正宗南印度菜系",
      "distanceKm": 6.6,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:02:48.005Z",
    "summary": "Raja Chettinad Fine Indian Kitchen · AS_INDIAN(0.90) · ★4.8/734 · 价位未知 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJHTSXy5HX1IkRH2co1D4PzXk",
      "name": "Shaaz | Indian Cuisine | Markham",
      "address": "66 Copper Creek Dr, Markham, ON L6B 0P2, Canada",
      "lat": 43.866551799999996,
      "lng": -79.23034559999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 913,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "23:15"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "23:15"
        }
      ],
      "primary": "AS_INDIAN",
      "tags": [
        "AS_INDIAN"
      ],
      "soloFriendly": true,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "店名与评论均指向印度菜",
      "distanceKm": 7.5,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:02:53.827Z",
    "summary": "Shaaz | Indian Cuisine | Markham · AS_INDIAN(0.90) · ★4.6/913 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJlbPffRfV1IkRpISScKoQQIE",
      "name": "KUROKI IZAKAYA 黑木居酒屋",
      "address": "28 South Unionville Ave #1056, Unionville, ON L3R 1J5, Canada",
      "lat": 43.855885699999995,
      "lng": -79.3038527,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 397,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 1,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 2,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 3,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 4,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 5,
          "open": "12:00",
          "close": "25:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "25:00"
        }
      ],
      "primary": "AS_IZAKAYA",
      "tags": [
        "AS_IZAKAYA",
        "AS_SUSHI"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "居酒屋风格，提供多种日式料理",
      "distanceKm": 1.5,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:02:34.443Z",
    "summary": "KUROKI IZAKAYA 黑木居酒屋 · AS_IZAKAYA(0.90) · ★4.6/397 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJc0XZfwDT1IkRTZJSDl7ARiQ",
      "name": "Sangoku Japanese BBQ",
      "address": "7050 Warden Ave., Markham, ON L3R 5Y3, Canada",
      "lat": 43.8212364,
      "lng": -79.32558159999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.8,
      "ratingCount": 501,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 1,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 2,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 3,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 4,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 5,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "24:00"
        }
      ],
      "primary": "AS_KBBQ",
      "tags": [
        "AS_KBBQ",
        "AS_IZAKAYA"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "日式烤肉，类似Gyubee",
      "distanceKm": 3.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:08.699Z",
    "summary": "Sangoku Japanese BBQ · AS_KBBQ(0.90) · ★4.8/501 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJoc8lWQDT1IkR_lVKgrZMhdw",
      "name": "Anju Korean Kitchen",
      "address": "7333 Woodbine Ave Unit 4, Markham, ON L3R 1C4, Canada",
      "lat": 43.8224174,
      "lng": -79.35027699999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 649,
      "closedDays": [
        1
      ],
      "serviceWindows": [
        {
          "day": null,
          "open": "12:00",
          "close": "15:00"
        },
        {
          "day": null,
          "open": "17:00",
          "close": "21:30"
        }
      ],
      "primary": "AS_KOREAN",
      "tags": [
        "AS_KOREAN",
        "AS_IZAKAYA"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "韩式海鲜料理与居酒屋风格",
      "distanceKm": 4.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:28.531Z",
    "summary": "Anju Korean Kitchen · AS_KOREAN(0.90) · ★4.4/649 · 价位2 · 2段营业 · 周1休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJN6enL7vV1IkRvWeuPaVQipI",
      "name": "Chicko Chicken Markham",
      "address": "9390 Woodbine Ave #1FC7, Markham, ON L6C 0M5, Canada",
      "lat": 43.872621599999995,
      "lng": -79.3647244,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.4,
      "ratingCount": 106,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "22:00"
        }
      ],
      "primary": "AS_KOREAN",
      "tags": [
        "AS_KOREAN",
        "AS_KFC_KOREAN"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "韩式炸鸡专门店",
      "distanceKm": 4,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:16.182Z",
    "summary": "Chicko Chicken Markham · AS_KOREAN(0.90) · ★4.4/106 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJn7loA8vV1IkR03CbBg_YnYw",
      "name": "Kore chicken",
      "address": "28 South Unionville Ave #10, Unionville, ON L3R 4P9, Canada",
      "lat": 43.8557445,
      "lng": -79.3040858,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.7,
      "ratingCount": 578,
      "closedDays": [
        1,
        2
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "20:30"
        },
        {
          "day": 3,
          "open": "12:00",
          "close": "20:30"
        },
        {
          "day": 4,
          "open": "12:00",
          "close": "20:30"
        },
        {
          "day": 5,
          "open": "12:00",
          "close": "21:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "21:00"
        }
      ],
      "primary": "AS_KOREAN",
      "tags": [
        "AS_KOREAN",
        "AS_KFC_KOREAN"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner",
        "latenight"
      ],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "韩式炸鸡专门店",
      "distanceKm": 1.5,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:19.207Z",
    "summary": "Kore chicken · AS_KOREAN(0.90) · ★4.7/578 · 价位1 · 5段营业 · 周12休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJHT9dFTfR1IkRExgGdTmAgP4",
      "name": "Malaysian Garam Masala",
      "address": "1001 Sandhurst Cir, Scarborough, ON M1V 1Z6, Canada",
      "lat": 43.8090541,
      "lng": -79.26377520000001,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.6,
      "ratingCount": 497,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "16:00",
          "close": "25:00"
        }
      ],
      "primary": "AS_MALAY",
      "tags": [
        "AS_MALAY"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "店名与评论均指向马来西亚菜",
      "distanceKm": 6.8,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:02:58.356Z",
    "summary": "Malaysian Garam Masala · AS_MALAY(0.80) · ★4.6/497 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJj_QzUADV1IkRSbteiFS6AdQ",
      "name": "Konjiki Ramen x Saryo Cafe Markham",
      "address": "8600 Woodbine Ave c2, Markham, ON L3R 4X8, Canada",
      "lat": 43.8520162,
      "lng": -79.3591072,
      "dineIn": true,
      "priceLevel": null,
      "rating": 5,
      "ratingCount": 11,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "21:00"
        }
      ],
      "primary": "AS_RAMEN",
      "tags": [
        "AS_RAMEN",
        "AS_IZAKAYA"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "拉面专门店，含居酒屋小食",
      "distanceKm": 2.9,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:34.917Z",
    "summary": "Konjiki Ramen x Saryo Cafe Markham · AS_RAMEN(0.90) · ★5/11 · 价位未知 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJSSvHDFLU1IkRnSxGp6-IuHc",
      "name": "Sansotei Ramen",
      "address": "3987 Hwy 7 #4, Markham, ON L3R 5M6, Canada",
      "lat": 43.8568883,
      "lng": -79.3238307,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.1,
      "ratingCount": 1724,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "21:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "21:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "21:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "21:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "21:30"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "21:30"
        }
      ],
      "primary": "AS_RAMEN",
      "tags": [
        "AS_RAMEN"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "拉面专门店",
      "distanceKm": 0.4,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:06:32.003Z",
    "summary": "Sansotei Ramen · AS_RAMEN(0.90) · ★4.1/1724 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJT7gqGgDV1IkRyyUopdwO_q0",
      "name": "kome sushi 米壽司",
      "address": "8360 Kennedy Rd Unit 46A, Markham, ON L3R 9W4, Canada",
      "lat": 43.8593407,
      "lng": -79.30470179999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.7,
      "ratingCount": 370,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "21:00"
        }
      ],
      "primary": "AS_SUSHI",
      "tags": [
        "AS_SUSHI"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "寿司专门店",
      "distanceKm": 1.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:02:30.980Z",
    "summary": "kome sushi 米壽司 · AS_SUSHI(0.90) · ★4.7/370 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ77LYzT3V1IkRHGexiT8aEOo",
      "name": "Chiang Rai Thai Kitchen and Bar",
      "address": "7750 Kennedy Rd, Markham, ON L3R 0A7, Canada",
      "lat": 43.842905599999995,
      "lng": -79.30603579999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 3748,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "10:30",
          "close": "22:30"
        },
        {
          "day": 1,
          "open": "10:30",
          "close": "22:30"
        },
        {
          "day": 2,
          "open": "10:30",
          "close": "22:30"
        },
        {
          "day": 3,
          "open": "10:30",
          "close": "22:30"
        },
        {
          "day": 4,
          "open": "10:30",
          "close": "22:30"
        },
        {
          "day": 5,
          "open": "10:30",
          "close": "23:00"
        },
        {
          "day": 6,
          "open": "10:30",
          "close": "23:00"
        }
      ],
      "primary": "AS_THAI",
      "tags": [
        "AS_THAI"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "正宗泰式料理",
      "distanceKm": 1.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:25.510Z",
    "summary": "Chiang Rai Thai Kitchen and Bar · AS_THAI(0.90) · ★4.5/3748 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJX72xBCfV1IkR090ozdlUdL8",
      "name": "Khao by Thai Story",
      "address": "Unit 1SK8 9390 Woodbine Ave Foodcourt at King Square Shopping Centre, Markham, ON L6C 0M5, Canada",
      "lat": 43.872242299999996,
      "lng": -79.3659155,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 5,
      "ratingCount": 45,
      "closedDays": [
        0
      ],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:30",
          "close": "19:30"
        }
      ],
      "primary": "AS_THAI",
      "tags": [
        "AS_THAI"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "正宗泰式料理",
      "distanceKm": 4,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:23.004Z",
    "summary": "Khao by Thai Story · AS_THAI(0.90) · ★5/45 · 价位1 · 1段营业 · 周0休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJt0OMDN3V1IkRNKbZyDZwdKw",
      "name": "Pho Dac Biet Vietnamese Cuisine",
      "address": "8360 Kennedy Rd Unit B1, Unionville, ON L3R 9W4, Canada",
      "lat": 43.859083899999995,
      "lng": -79.30367009999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.7,
      "ratingCount": 2381,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "24:00"
        }
      ],
      "primary": "AS_VIETNAM",
      "tags": [
        "AS_VIETNAM"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "越南餐厅，提供正餐",
      "distanceKm": 1.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:02:43.431Z",
    "summary": "Pho Dac Biet Vietnamese Cuisine · AS_VIETNAM(0.90) · ★4.7/2381 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJA1VTeq_V1IkRbdp8wam0Lx4",
      "name": "越香 Pho Viet Aroma",
      "address": "3621 Hwy 7 #111, Markham, ON L3R 0G6, Canada",
      "lat": 43.8541102,
      "lng": -79.33713829999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 274,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "22:00"
        }
      ],
      "primary": "AS_VIETNAM",
      "tags": [
        "AS_VIETNAM"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "越南菜餐厅，适合单人",
      "distanceKm": 1.2,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:02:39.533Z",
    "summary": "越香 Pho Viet Aroma · AS_VIETNAM(0.90) · ★4.6/274 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJaeTnfgDV1IkRsLd7I1O40QU",
      "name": "Number One BBQ Bar & Live Entertainment 南波萬烧烤酒馆",
      "address": "3760 Hwy 7 Unit 1, Markham, ON L3R 0N2, Canada",
      "lat": 43.856665899999996,
      "lng": -79.3328873,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.7,
      "ratingCount": 535,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "17:00",
          "close": "26:00"
        },
        {
          "day": 1,
          "open": "17:00",
          "close": "26:00"
        },
        {
          "day": 2,
          "open": "17:00",
          "close": "26:00"
        },
        {
          "day": 3,
          "open": "17:00",
          "close": "26:00"
        },
        {
          "day": 4,
          "open": "17:00",
          "close": "26:00"
        },
        {
          "day": 5,
          "open": "17:00",
          "close": "27:30"
        },
        {
          "day": 6,
          "open": "17:00",
          "close": "27:30"
        }
      ],
      "primary": "CN_BBQ_MEAT",
      "tags": [
        "CN_BBQ_MEAT",
        "AS_IZAKAYA"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner",
        "latenight"
      ],
      "isMainMeal": true,
      "priorBias": 0.9,
      "confidence": 0.85,
      "reason": "烧烤酒馆+夜间娱乐",
      "distanceKm": 0.9,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:01:44.267Z",
    "summary": "Number One BBQ Bar & Live Entertainment 南波萬烧烤酒馆 · CN_BBQ_MEAT(0.85) · ★4.7/535 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJAdkyAADV1IkRvOOh1wdIPDw",
      "name": "Cantonese Best BBQ 港式燒味大王",
      "address": "11 Fairburn Dr Unit 19, Markham, ON L6G 0A4, Canada",
      "lat": 43.847734599999995,
      "lng": -79.3481742,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 3.9,
      "ratingCount": 170,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "19:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_BBQ_MEAT"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "港式烧味主打粤式烧烤",
      "distanceKm": 2.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:50.505Z",
    "summary": "Cantonese Best BBQ 港式燒味大王 · CN_CANTON(0.90) · ★3.9/170 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJCw-AHgDV1IkRESGVjeQ47PI",
      "name": "Fortune Landing Seafood Cuisine",
      "address": "50 Lockridge Ave, Markham, ON L3R 7R6, Canada",
      "lat": 43.8715458,
      "lng": -79.3435981,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.8,
      "ratingCount": 137,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "09:00",
          "close": "22:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_DIMSUM"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "粤菜风格，提供点心",
      "distanceKm": 2.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:07:28.417Z",
    "summary": "Fortune Landing Seafood Cuisine · CN_CANTON(0.80) · ★3.8/137 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ-c5PgXbR1IkRH_IphL3KC1c",
      "name": "Hee Kee Seafood Restaurant 喜記海鮮小炒大排檔",
      "address": "3250 Midland Ave Unit G101, Scarborough, ON M1V 0C7, Canada",
      "lat": 43.804790600000004,
      "lng": -79.2887606,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 785,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:30",
          "close": "22:30"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "AS_IZAKAYA"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "粤式海鲜大排档",
      "distanceKm": 6.1,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:01:39.343Z",
    "summary": "Hee Kee Seafood Restaurant 喜記海鮮小炒大排檔 · CN_CANTON(0.90) · ★4.5/785 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJq6qmctLV1IkRwWu7_BI1Dxg",
      "name": "名粤軒 Amazing Seafood House",
      "address": "4721 Hwy 7 #4, Markham, ON L3R 1M7, Canada",
      "lat": 43.862812,
      "lng": -79.3008021,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.7,
      "ratingCount": 1210,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "09:00",
          "close": "22:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_DIMSUM"
      ],
      "soloFriendly": false,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "粤菜为主，提供点心",
      "distanceKm": 2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:04:10.847Z",
    "summary": "名粤軒 Amazing Seafood House · CN_CANTON(0.90) · ★3.7/1210 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJZ6PZDQDV1IkR5jPQuJiGXys",
      "name": "嘴留香隆江猪脚饭 Markham Authentic Chaosan Tastes",
      "address": "3255 Hwy 7 Unit 255, Markham, ON L3R 3P9, Canada",
      "lat": 43.849610399999996,
      "lng": -79.3472723,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.7,
      "ratingCount": 254,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "20:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "隆江猪脚饭是潮汕特色",
      "distanceKm": 2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:07:42.271Z",
    "summary": "嘴留香隆江猪脚饭 Markham Authentic Chaosan Tastes · CN_CANTON(0.80) · ★4.7/254 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJgTz7yM7V1IkRHuvHQMsio8A",
      "name": "Longing Fusion Cuisine 龙庭食府",
      "address": "1661 Denison St T1, Markham, ON L3R 6E4, Canada",
      "lat": 43.833172999999995,
      "lng": -79.3056269,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.8,
      "ratingCount": 192,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "09:00",
          "close": "22:00"
        }
      ],
      "primary": "CN_DIMSUM",
      "tags": [
        "CN_DIMSUM",
        "CN_CANTON"
      ],
      "soloFriendly": false,
      "slotLock": [
        "breakfast",
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "提供早茶点心，评论提及传统与现代点心",
      "distanceKm": 2.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:07:10.279Z",
    "summary": "Longing Fusion Cuisine 龙庭食府 · CN_DIMSUM(0.80) · ★3.8/192 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJnTZ52fHX1IkRHdjA-YMVqEU",
      "name": "Big Way Hot Pot (Markham)",
      "address": "5284 Hwy 7 #3, Markham, ON L3P 1B9, Canada",
      "lat": 43.868256699999996,
      "lng": -79.2830087,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.3,
      "ratingCount": 336,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "26:00"
        }
      ],
      "primary": "CN_HOTPOT",
      "tags": [
        "CN_HOTPOT"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.95,
      "reason": "火锅店，适合多人聚餐",
      "distanceKm": 3.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:46.983Z",
    "summary": "Big Way Hot Pot (Markham) · CN_HOTPOT(0.95) · ★4.3/336 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ_fSIGGHX1IkRZE5RcrStUI8",
      "name": "Haidilao Hot Pot Markham - 海底捞火锅",
      "address": "5328 Hwy 7 Ste 4, Markham, ON L3P 1B9, Canada",
      "lat": 43.868893899999996,
      "lng": -79.28151230000002,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.8,
      "ratingCount": 7363,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "26:00"
        }
      ],
      "primary": "CN_HOTPOT",
      "tags": [
        "CN_HOTPOT",
        "WS_BUFFET"
      ],
      "soloFriendly": false,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 1,
      "reason": "海底捞火锅主营火锅",
      "distanceKm": 3.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:00:59.743Z",
    "summary": "Haidilao Hot Pot Markham - 海底捞火锅 · CN_HOTPOT(1.00) · ★4.8/7363 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJOXCQi03U1IkRntixfiMDGlU",
      "name": "Xiang Zi HotPot",
      "address": "3989 Hwy 7, Markham, ON L3R 5M6, Canada",
      "lat": 43.8565,
      "lng": -79.3236,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 3801,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "22:30"
        }
      ],
      "primary": "CN_HOTPOT",
      "tags": [
        "CN_HOTPOT",
        "CN_SICHUAN"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "四川风格火锅店",
      "distanceKm": 0.3,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:06:43.833Z",
    "summary": "Xiang Zi HotPot · CN_HOTPOT(0.90) · ★4.4/3801 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ9xuAMXfV1IkR5O0In2P-bt4",
      "name": "喜烫麻辣烫 Xi Tang Malatang",
      "address": "3229 Hwy 7 #9, Markham, ON L3R 3P3, Canada",
      "lat": 43.848199099999995,
      "lng": -79.349576,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.2,
      "ratingCount": 208,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:30",
          "close": "22:00"
        }
      ],
      "primary": "CN_HOTPOT",
      "tags": [
        "CN_HOTPOT",
        "CN_NOODLE"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "麻辣烫属于单人火锅类",
      "distanceKm": 2.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:02:23.712Z",
    "summary": "喜烫麻辣烫 Xi Tang Malatang · CN_HOTPOT(0.90) · ★4.2/208 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJBxOVZkXV1IkRHTN0w-MjEjE",
      "name": "渝作火锅 Yoozone Hot Pot",
      "address": "3225 Hwy 7 #3, Markham, ON L3R 3P9, Canada",
      "lat": 43.848456999999996,
      "lng": -79.35013479999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.2,
      "ratingCount": 203,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:30",
          "close": "24:00"
        }
      ],
      "primary": "CN_HOTPOT",
      "tags": [
        "CN_HOTPOT"
      ],
      "soloFriendly": false,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "店名明确为火锅",
      "distanceKm": 2.3,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:01:34.994Z",
    "summary": "渝作火锅 Yoozone Hot Pot · CN_HOTPOT(0.90) · ★4.2/203 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJRYgRES8rK4gRLrC4DK6PsWE",
      "name": "Magic Noodle Richmond Hill 大槐树兰州拉面 - Open 24 Hours",
      "address": "1383 16th Ave, Richmond Hill, ON L4B 1J3, Canada",
      "lat": 43.861340399999996,
      "lng": -79.3896625,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.4,
      "ratingCount": 4586,
      "closedDays": [],
      "serviceWindows": [],
      "primary": "CN_NOODLE",
      "tags": [
        "CN_NOODLE",
        "CN_XIBEI"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "兰州拉面，24小时营业",
      "distanceKm": 5.4,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:02:11.042Z",
    "summary": "Magic Noodle Richmond Hill 大槐树兰州拉面 - Open 24 Hours · CN_NOODLE(0.80) · ★4.4/4586 · 价位1 · 24小时 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ3QTLOGPV1IkRG5f8DYMnCFo",
      "name": "Noodle Nation 喜食米线",
      "address": "3623 Hwy 7 Unit 101, Markham, ON L3R 8X6, Canada",
      "lat": 43.8536065,
      "lng": -79.3367086,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.5,
      "ratingCount": 100,
      "closedDays": [
        1
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "31:30"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "21:00"
        }
      ],
      "primary": "CN_NOODLE",
      "tags": [
        "CN_NOODLE",
        "CN_YUNNAN"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "米线为主，云南风味",
      "distanceKm": 1.1,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:02:04.787Z",
    "summary": "Noodle Nation 喜食米线 · CN_NOODLE(0.80) · ★4.5/100 · 价位1 · 6段营业 · 周1休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJC8UmJADV1IkRykbZopPOveY",
      "name": "YEE'S HAND PULLED NOODLES (Scarborough)老叶兰州牛肉拉面",
      "address": "668 Silver Star Blvd Unit 202, Scarborough, ON M1V 0A9, Canada",
      "lat": 43.822729599999995,
      "lng": -79.3007959,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.5,
      "ratingCount": 76,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "22:00"
        }
      ],
      "primary": "CN_NOODLE",
      "tags": [
        "CN_NOODLE",
        "CN_XIBEI"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "兰州拉面为主，西北风味",
      "distanceKm": 3.9,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:02:14.670Z",
    "summary": "YEE'S HAND PULLED NOODLES (Scarborough)老叶兰州牛肉拉面 · CN_NOODLE(0.90) · ★4.5/76 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJBZgY9csrK4gRLgFdqS50OV0",
      "name": "Northern Chinese Specialties",
      "address": "280 West Beaver Creek Rd Unit#25, Richmond Hill, ON L4B 3Z1, Canada",
      "lat": 43.8439451,
      "lng": -79.38905679999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 131,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "23:00"
        }
      ],
      "primary": "CN_NORTHEAST",
      "tags": [
        "CN_NORTHEAST",
        "CN_DUMPLING",
        "CN_SKEWER"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "东北特色菜系明确",
      "distanceKm": 5.4,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:06:39.865Z",
    "summary": "Northern Chinese Specialties · CN_NORTHEAST(0.90) · ★4.6/131 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJGw6_rM7R1IkRrTcMr8vsdak",
      "name": "成都赵三孃冒菜·麻辣烫chengdu zhaosanniang",
      "address": "4186 Finch Ave E Unit 31, Scarborough, ON M1S 5H6, Canada",
      "lat": 43.803685,
      "lng": -79.2881896,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 701,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "24:45"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "24:45"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "24:45"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "24:45"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "24:45"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "25:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "25:00"
        }
      ],
      "primary": "CN_SICHUAN",
      "tags": [
        "CN_SICHUAN",
        "CN_HOTPOT"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "正宗四川冒菜麻辣烫",
      "distanceKm": 6.2,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:02:27.570Z",
    "summary": "成都赵三孃冒菜·麻辣烫chengdu zhaosanniang · CN_SICHUAN(0.90) · ★4.6/701 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJm8G-1NUrK4gRkxaQTthDzak",
      "name": "红辣椒 冒菜川菜red pepper",
      "address": "550 Hwy 7 Unit 83, Richmond Hill, ON L4B 3Z4, Canada",
      "lat": 43.8450918,
      "lng": -79.384709,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 212,
      "closedDays": [
        3
      ],
      "serviceWindows": [
        {
          "day": null,
          "open": "12:00",
          "close": "23:00"
        }
      ],
      "primary": "CN_SICHUAN",
      "tags": [
        "CN_SICHUAN",
        "CN_HOTPOT"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "川菜与冒菜特色",
      "distanceKm": 5.1,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:00:41.294Z",
    "summary": "红辣椒 冒菜川菜red pepper · CN_SICHUAN(0.90) · ★4.5/212 · 价位2 · 1段营业 · 周3休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJxdpzi17T1IkRPijDbB7Ab44",
      "name": "肠酒烧烤&Changjiu BBQ Restaurant",
      "address": "3101 Kennedy Rd Unit B10, Scarborough, ON M1V 5P4, Canada",
      "lat": 43.8119218,
      "lng": -79.2993032,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 114,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "26:00"
        },
        {
          "day": 1,
          "open": "16:00",
          "close": "26:00"
        },
        {
          "day": 2,
          "open": "16:00",
          "close": "26:00"
        },
        {
          "day": 3,
          "open": "16:00",
          "close": "26:00"
        },
        {
          "day": 4,
          "open": "16:00",
          "close": "26:00"
        },
        {
          "day": 5,
          "open": "16:00",
          "close": "26:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "26:00"
        }
      ],
      "primary": "CN_SKEWER",
      "tags": [
        "CN_SKEWER",
        "CN_BBQ_MEAT"
      ],
      "soloFriendly": false,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 0.9,
      "confidence": 0.9,
      "reason": "烤串为主，兼有热菜",
      "distanceKm": 5,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:02:19.703Z",
    "summary": "肠酒烧烤&Changjiu BBQ Restaurant · CN_SKEWER(0.90) · ★4.6/114 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJG13Tbw_V1IkR6BRGAF5l0hU",
      "name": "HOJA mi-sua",
      "address": "3235 Hwy 7 #27, Markham, ON L3R 3P9, Canada",
      "lat": 43.8487857,
      "lng": -79.34779499999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.6,
      "ratingCount": 1446,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "22:30"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "22:30"
        }
      ],
      "primary": "CN_TAIWAN",
      "tags": [
        "CN_TAIWAN",
        "CN_NOODLE",
        "CN_BUBBLETEA"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "台湾小吃与面线专卖",
      "distanceKm": 2.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:07:45.737Z",
    "summary": "HOJA mi-sua · CN_TAIWAN(0.90) · ★4.6/1446 · 价位1 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJO4lRcNg1K4gRjyQ5Y0N-Lq8",
      "name": "Vegedelight Vegetarian Restaurant Markham",
      "address": "398 Ferrier St Unit 63, Markham, ON L3R 2Z5, Canada",
      "lat": 43.8195859,
      "lng": -79.3311837,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 430,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "21:00"
        }
      ],
      "primary": "CN_VEG",
      "tags": [
        "CN_VEG",
        "CN_DUMPLING",
        "CN_NOODLE"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "素食中餐厅，提供面条和饺子",
      "distanceKm": 3.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:07:55.994Z",
    "summary": "Vegedelight Vegetarian Restaurant Markham · CN_VEG(0.80) · ★4.6/430 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ579UxX_V1IkRNlImu55znS8",
      "name": "山野炊青 Qing Asian Fusion Bistro ( 云贵川菜系)",
      "address": "11 Fairburn Dr Unit 18, Markham, ON L6G 0A4, Canada",
      "lat": 43.847806399999996,
      "lng": -79.3482247,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.2,
      "ratingCount": 231,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "24:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "24:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "24:00"
        }
      ],
      "primary": "CN_YUNNAN",
      "tags": [
        "CN_YUNNAN",
        "CN_SICHUAN",
        "CN_HOTPOT"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "云贵川菜系，含火锅",
      "distanceKm": 2.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:00:37.422Z",
    "summary": "山野炊青 Qing Asian Fusion Bistro ( 云贵川菜系) · CN_YUNNAN(0.80) · ★4.2/231 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ9UdHvp7V1IkRrzDFGuV0VBM",
      "name": "15th Ave Cafe & Bistro",
      "address": "169 Enterprise Blvd Unit L103, Markham, ON L6G 1B3, Canada",
      "lat": 43.8492982,
      "lng": -79.3238633,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.3,
      "ratingCount": 193,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "09:00",
          "close": "16:00"
        }
      ],
      "primary": "WS_BRUNCH",
      "tags": [
        "WS_BRUNCH",
        "WS_CAFE"
      ],
      "soloFriendly": true,
      "slotLock": [
        "breakfast",
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "法式早午餐咖啡馆",
      "distanceKm": 0.5,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:04:20.757Z",
    "summary": "15th Ave Cafe & Bistro · WS_BRUNCH(0.90) · ★4.3/193 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJHbcd_DnV1IkRRYCclxbbdbA",
      "name": "Sisters & Co Markham",
      "address": "7725 Birchmount Rd Unit 18, Markham, ON L6G 1A8, Canada",
      "lat": 43.8403081,
      "lng": -79.32005319999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 945,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "08:00",
          "close": "15:30"
        },
        {
          "day": 1,
          "open": "08:30",
          "close": "15:00"
        },
        {
          "day": 2,
          "open": "08:30",
          "close": "15:00"
        },
        {
          "day": 3,
          "open": "08:30",
          "close": "15:00"
        },
        {
          "day": 4,
          "open": "08:30",
          "close": "15:00"
        },
        {
          "day": 5,
          "open": "08:30",
          "close": "15:00"
        },
        {
          "day": 6,
          "open": "08:00",
          "close": "15:30"
        }
      ],
      "primary": "WS_BRUNCH",
      "tags": [
        "WS_BRUNCH",
        "WS_CAFE"
      ],
      "soloFriendly": true,
      "slotLock": [
        "breakfast",
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "用户评论明确提到brunch体验",
      "distanceKm": 1.5,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:06:55.630Z",
    "summary": "Sisters & Co Markham · WS_BRUNCH(0.90) · ★4.4/945 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJs6be82TX1IkRDLk290HRzGQ",
      "name": "Gyu Gyu Hot Pot & Japanese Grill | Buffet",
      "address": "39 Main Street Markham N Unit 2, Markham, ON L3P 1X3, Canada",
      "lat": 43.8754868,
      "lng": -79.2597565,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 592,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 1,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 2,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 3,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 4,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 5,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "24:00"
        }
      ],
      "primary": "WS_BUFFET",
      "tags": [
        "WS_BUFFET",
        "CN_HOTPOT",
        "AS_IZAKAYA"
      ],
      "soloFriendly": false,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "火锅与日式烧烤自助",
      "distanceKm": 5.6,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:06:12.541Z",
    "summary": "Gyu Gyu Hot Pot & Japanese Grill | Buffet · WS_BUFFET(0.90) · ★4.5/592 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJyScucx0rK4gRN9fhuIHdjQc",
      "name": "Burger Factory",
      "address": "1480 Major Mackenzie Dr E, Richmond Hill, ON L4S 0A1, Canada",
      "lat": 43.8807584,
      "lng": -79.3938998,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.4,
      "ratingCount": 463,
      "closedDays": [],
      "serviceWindows": [],
      "primary": "WS_BURGER",
      "tags": [
        "WS_BURGER"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.9,
      "reason": "汉堡店，评价一般",
      "distanceKm": 6.5,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:03:27.520Z",
    "summary": "Burger Factory · WS_BURGER(0.90) · ★4.4/463 · 价位1 · 24小时 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ18LOQ9bW1IkRu3lnDluqcR0",
      "name": "Habibz Corner",
      "address": "2761 Markham Rd a5, Scarborough, ON M1X 0A4, Canada",
      "lat": 43.8213243,
      "lng": -79.24617719999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 5319,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "30:00"
        }
      ],
      "primary": "WS_BURGER",
      "tags": [
        "WS_BURGER",
        "WS_DELI"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.8,
      "reason": "主营汉堡与三明治",
      "distanceKm": 7.1,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:07:48.631Z",
    "summary": "Habibz Corner · WS_BURGER(0.80) · ★4.4/5319 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJPVed-QDV1IkR0UePNBAb6AM",
      "name": "Hong Bo Burger & Poutine",
      "address": "3255 Hwy 7 Unit 251, Markham, ON L3R 3P9, Canada",
      "lat": 43.849514,
      "lng": -79.34703259999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.8,
      "ratingCount": 381,
      "closedDays": [
        4
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "17:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "19:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "19:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "19:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "19:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "19:00"
        }
      ],
      "primary": "WS_BURGER",
      "tags": [
        "WS_BURGER"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "汉堡与肉汁奶酪薯条专卖店",
      "distanceKm": 2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:03:30.665Z",
    "summary": "Hong Bo Burger & Poutine · WS_BURGER(0.90) · ★4.8/381 · 价位1 · 6段营业 · 周4休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ37FiYAAtK4gR-rsjoVFbQWQ",
      "name": "Lobster Boil Seafood House",
      "address": "180 Steeles Ave W Unit 25, Thornhill, ON L4J 2L1, Canada",
      "lat": 43.7969487,
      "lng": -79.42665939999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 940,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "22:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "22:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "22:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "22:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "22:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "23:00"
        }
      ],
      "primary": "WS_CANADIAN",
      "tags": [
        "WS_CANADIAN"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "海鲜为主，适合晚餐",
      "distanceKm": 10.5,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:04:07.922Z",
    "summary": "Lobster Boil Seafood House · WS_CANADIAN(0.80) · ★4.5/940 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ4bf1jnDW1IkRWwgwAA6fI-Y",
      "name": "Ithaca Greek Mediterranean Restaurant",
      "address": "5308 Hwy 7, Markham, ON L3P 1B9, Canada",
      "lat": 43.8683961,
      "lng": -79.2827306,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 1316,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "21:30"
        }
      ],
      "primary": "WS_GREEK",
      "tags": [
        "WS_GREEK",
        "WS_MIDEAST"
      ],
      "soloFriendly": true,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "希腊地中海餐厅",
      "distanceKm": 3.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:03:34.278Z",
    "summary": "Ithaca Greek Mediterranean Restaurant · WS_GREEK(0.90) · ★4.4/1316 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJaQ9v5zjW1IkR0f4OFPPx5Wg",
      "name": "Main Street Greek",
      "address": "60 Main Street Markham N, Markham, ON L3P 1X5, Canada",
      "lat": 43.876266699999995,
      "lng": -79.2607178,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 1066,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "21:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "21:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "21:30"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "21:30"
        }
      ],
      "primary": "WS_GREEK",
      "tags": [
        "WS_GREEK"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "正宗希腊餐厅",
      "distanceKm": 5.6,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:03:37.351Z",
    "summary": "Main Street Greek · WS_GREEK(0.90) · ★4.4/1066 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJpwUtAcHU1IkRXmDyKSdI5Ik",
      "name": "Novita Italian Cuisine",
      "address": "25 Cochrane Dr, Markham, ON L3R 9S1, Canada",
      "lat": 43.848729,
      "lng": -79.36079339999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.2,
      "ratingCount": 1508,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "16:00",
          "close": "22:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "23:00"
        }
      ],
      "primary": "WS_ITALIAN",
      "tags": [
        "WS_ITALIAN"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "意大利餐厅，评论一致",
      "distanceKm": 3.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:03:03.857Z",
    "summary": "Novita Italian Cuisine · WS_ITALIAN(0.90) · ★4.2/1508 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ1azDAbbU1IkRv9OYB0zzF8k",
      "name": "Scaddabush Italian Kitchen & Bar Richmond Hill",
      "address": "155 York Blvd, Richmond Hill, ON L4B 3B4, Canada",
      "lat": 43.847311999999995,
      "lng": -79.374402,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 13602,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "22:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "22:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "23:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "24:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "24:00"
        }
      ],
      "primary": "WS_ITALIAN",
      "tags": [
        "WS_ITALIAN"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "意大利餐厅，评论一致",
      "distanceKm": 4.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:03:09.498Z",
    "summary": "Scaddabush Italian Kitchen & Bar Richmond Hill · WS_ITALIAN(0.90) · ★4.6/13602 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJMQQWNMrV1IkRRar2lPiEZ-0",
      "name": "Unionville Arms Pub & Grill",
      "address": "189 Main St Unionville, Unionville, ON L3R 2G8, Canada",
      "lat": 43.8677758,
      "lng": -79.3120161,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.1,
      "ratingCount": 2175,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "23:30"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "23:30"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "24:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "24:30"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "25:30"
        },
        {
          "day": 6,
          "open": "10:30",
          "close": "25:30"
        }
      ],
      "primary": "WS_ITALIAN",
      "tags": [
        "WS_ITALIAN",
        "WS_BURGER",
        "WS_STEAK"
      ],
      "soloFriendly": true,
      "slotLock": [
        "dinner",
        "latenight"
      ],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.6,
      "reason": "经典酒吧餐食",
      "distanceKm": 1.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:04:13.960Z",
    "summary": "Unionville Arms Pub & Grill · WS_ITALIAN(0.60) · ★4.1/2175 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJo6QV1EMqK4gRJmt5R7fyy8A",
      "name": "MEXICAN AMIGOS - Dine In | Take Out | Delivery | Catering | Private Events",
      "address": "10720 Yonge St, Richmond Hill, ON L4C 3C9, Canada",
      "lat": 43.8891518,
      "lng": -79.44217139999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 3345,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "24:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "24:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "24:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "24:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "24:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "25:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "25:00"
        }
      ],
      "primary": "WS_MEXICAN",
      "tags": [
        "WS_MEXICAN"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "墨西哥餐厅，适合正餐",
      "distanceKm": 10.4,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:03:41.079Z",
    "summary": "MEXICAN AMIGOS - Dine In | Take Out | Delivery | Catering | Private Events · WS_MEXICAN(0.90) · ★4.4/3345 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJb1g2IrHV1IkRqjeVXkQCPCE",
      "name": "Shelby's Legendary Shawarma",
      "address": "3000 Hwy 7 a12, Markham, ON L3R 6E1, Canada",
      "lat": 43.8506284,
      "lng": -79.35694339999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.5,
      "ratingCount": 2249,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "10:00",
          "close": "26:00"
        }
      ],
      "primary": "WS_MIDEAST",
      "tags": [
        "WS_MIDEAST"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "中东烤肉卷餐厅",
      "distanceKm": 2.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:03:44.723Z",
    "summary": "Shelby's Legendary Shawarma · WS_MIDEAST(0.90) · ★4.5/2249 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJCztyq1HV1IkRZHRrfNPxjbI",
      "name": "Tahini's Shawarma",
      "address": "3150 Hwy 7, Markham, ON L3R 5A1, Canada",
      "lat": 43.851292699999995,
      "lng": -79.35390459999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.5,
      "ratingCount": 404,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "24:00"
        },
        {
          "day": 1,
          "open": "10:00",
          "close": "24:00"
        },
        {
          "day": 2,
          "open": "10:00",
          "close": "24:00"
        },
        {
          "day": 3,
          "open": "10:00",
          "close": "24:00"
        },
        {
          "day": 4,
          "open": "10:00",
          "close": "26:00"
        },
        {
          "day": 5,
          "open": "10:00",
          "close": "26:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "26:00"
        }
      ],
      "primary": "WS_MIDEAST",
      "tags": [
        "WS_MIDEAST"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主营沙威玛，中东菜系",
      "distanceKm": 2.5,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:03:50.326Z",
    "summary": "Tahini's Shawarma · WS_MIDEAST(0.90) · ★4.5/404 · 价位1 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJw0ASVwDX1IkRl-5wke9eMKU",
      "name": "Turkish Flames",
      "address": "7677 Markham Rd, Markham, ON L3S 3J9, Canada",
      "lat": 43.8533549,
      "lng": -79.2538028,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 273,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "09:00",
          "close": "22:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "22:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "23:00"
        },
        {
          "day": 6,
          "open": "09:00",
          "close": "23:00"
        }
      ],
      "primary": "WS_MIDEAST",
      "tags": [
        "WS_MIDEAST"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "土耳其餐厅，中东菜系",
      "distanceKm": 5.5,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:07:52.453Z",
    "summary": "Turkish Flames · WS_MIDEAST(0.80) · ★4.5/273 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJKR4GLFTU1IkRnEmZPcOoGGE",
      "name": "Pizza Pizza",
      "address": "8601 Warden Ave. Unit 1B, Markham, ON L3R 0B5, Canada",
      "lat": 43.8579298,
      "lng": -79.33185499999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4,
      "ratingCount": 721,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "26:00"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "26:00"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "26:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "26:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "27:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "27:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "27:00"
        }
      ],
      "primary": "WS_PIZZA",
      "tags": [
        "WS_PIZZA"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 1,
      "reason": "披萨餐厅，适合单人用餐",
      "distanceKm": 0.9,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:03:20.702Z",
    "summary": "Pizza Pizza · WS_PIZZA(1.00) · ★4/721 · 价位1 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJoadb5zjW1IkR-3Q_CdEw7fY",
      "name": "Slice of Fire Pizza",
      "address": "60 Main Street Markham N Unit 5, Markham, ON L3P 1X5, Canada",
      "lat": 43.8765846,
      "lng": -79.2606491,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 875,
      "closedDays": [
        1
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "19:30"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "20:00"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "20:00"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "20:00"
        },
        {
          "day": 5,
          "open": "11:00",
          "close": "20:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "20:00"
        }
      ],
      "primary": "WS_PIZZA",
      "tags": [
        "WS_PIZZA"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.8,
      "reason": "披萨店，适合单人",
      "distanceKm": 5.6,
      "bucket": "MID"
    },
    "fetchedAt": "2026-09-26T05:03:24.501Z",
    "summary": "Slice of Fire Pizza · WS_PIZZA(0.80) · ★4.4/875 · 价位2 · 6段营业 · 周1休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJe1mrlHLW1IkRG0JzNaEhz_Y",
      "name": "Big Bone BBQ & Wicked Wings",
      "address": "180 Bullock Dr, Markham, ON L3P 7N2, Canada",
      "lat": 43.875022699999995,
      "lng": -79.2804012,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 1171,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "21:00"
        },
        {
          "day": 1,
          "open": "12:00",
          "close": "20:00"
        },
        {
          "day": 2,
          "open": "12:00",
          "close": "20:00"
        },
        {
          "day": 3,
          "open": "12:00",
          "close": "20:00"
        },
        {
          "day": 4,
          "open": "12:00",
          "close": "20:00"
        },
        {
          "day": 5,
          "open": "12:00",
          "close": "20:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "20:00"
        }
      ],
      "primary": "WS_STEAK",
      "tags": [
        "WS_STEAK",
        "CN_BBQ_MEAT"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "美式烧烤餐厅",
      "distanceKm": 4.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:04:17.612Z",
    "summary": "Big Bone BBQ & Wicked Wings · WS_STEAK(0.90) · ★4.4/1171 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ59JUPALV1IkR1VWLx3e5SlI",
      "name": "Ruth's Chris Steak House",
      "address": "170 Enterprise Blvd Unit J101, Markham, ON L6G 0E6, Canada",
      "lat": 43.8499237,
      "lng": -79.3241115,
      "dineIn": true,
      "priceLevel": null,
      "rating": 4.5,
      "ratingCount": 1683,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "15:00",
          "close": "21:00"
        },
        {
          "day": 1,
          "open": "15:00",
          "close": "22:00"
        },
        {
          "day": 2,
          "open": "15:00",
          "close": "22:00"
        },
        {
          "day": 3,
          "open": "15:00",
          "close": "22:00"
        },
        {
          "day": 4,
          "open": "15:00",
          "close": "22:00"
        },
        {
          "day": 5,
          "open": "15:00",
          "close": "22:00"
        },
        {
          "day": 6,
          "open": "15:00",
          "close": "22:00"
        }
      ],
      "primary": "WS_STEAK",
      "tags": [
        "WS_STEAK",
        "WS_ITALIAN"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.95,
      "reason": "高端牛排馆，适合特殊场合",
      "distanceKm": 0.4,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-09-26T05:03:13.142Z",
    "summary": "Ruth's Chris Steak House · WS_STEAK(0.95) · ★4.5/1683 · 价位未知 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJKRIHhbXU1IkRI-Kj2UnKpIg",
      "name": "Touro Brazilian Steak House & Wine - Richmond Hill",
      "address": "125 York Blvd, Richmond Hill, ON L4B 3B4, Canada",
      "lat": 43.8470669,
      "lng": -79.3763737,
      "dineIn": true,
      "priceLevel": null,
      "rating": 4.3,
      "ratingCount": 4794,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "14:00"
        },
        {
          "day": 0,
          "open": "16:30",
          "close": "21:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "14:00"
        },
        {
          "day": 1,
          "open": "16:30",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "14:00"
        },
        {
          "day": 2,
          "open": "16:30",
          "close": "21:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "14:00"
        },
        {
          "day": 3,
          "open": "16:30",
          "close": "21:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "14:00"
        },
        {
          "day": 4,
          "open": "16:30",
          "close": "21:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "14:00"
        },
        {
          "day": 5,
          "open": "16:30",
          "close": "22:00"
        },
        {
          "day": 6,
          "open": "16:30",
          "close": "22:00"
        }
      ],
      "primary": "WS_STEAK",
      "tags": [
        "WS_STEAK",
        "WS_BUFFET"
      ],
      "soloFriendly": false,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.95,
      "reason": "巴西烤肉自助",
      "distanceKm": 4.4,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-09-26T05:03:17.032Z",
    "summary": "Touro Brazilian Steak House & Wine - Richmond Hill · WS_STEAK(0.95) · ★4.3/4794 · 价位未知 · 13段营业 · 无固定休 · 有堂食"
  }
];

/** 目录 = 种子 15 家 + 批量导入的；同 placeId 以种子为准（人工校对过） */
export const CATALOG: SeedRestaurant[] = (() => {
  const byId = new Map<string, SeedRestaurant>();
  for (const e of IMPORTED_CATALOG) byId.set(e.restaurant.placeId, e.restaurant);
  for (const r of SEED_RESTAURANTS) byId.set(r.placeId, r);
  return [...byId.values()];
})();

export const CATALOG_FETCHED_AT: Record<string, string> =
  Object.fromEntries(IMPORTED_CATALOG.map((e) => [e.restaurant.placeId, e.fetchedAt]));
