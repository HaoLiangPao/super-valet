/**
 * 餐厅目录 —— 我们维护的全部餐厅（ADR-0008 的「目录」层）。
 *
 * ⚠️ 本文件由 `node scripts/build-catalog.mjs` 生成，**不要手改**。
 * 数据经过与用户导入完全相同的流水线：Google Places 出事实，
 * DeepSeek 出分类，防幻觉边界见 design/0005 §4.2。
 *
 * 生成于 2026-10-13T00:48:45.714Z
 * 共 104 家（不含种子 15 家；`CATALOG` 会把两者合并）
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
      "placeId": "ChIJiy-Xw9rX1IkRqqqR80daOUQ",
      "name": "Desi Bar & Grill (Markham) | Best Indian restaurant in Markham",
      "address": "7710 Markham Rd, Markham, ON L3S 4S1, Canada",
      "lat": 43.853772,
      "lng": -79.2555689,
      "dineIn": true,
      "priceLevel": null,
      "rating": 4.6,
      "ratingCount": 2308,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "12:00",
          "close": "24:00"
        },
        {
          "day": 1,
          "open": "16:00",
          "close": "24:00"
        },
        {
          "day": 2,
          "open": "16:00",
          "close": "24:00"
        },
        {
          "day": 3,
          "open": "16:00",
          "close": "24:00"
        },
        {
          "day": 4,
          "open": "16:00",
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
      "primary": "AS_INDIAN",
      "tags": [
        "AS_INDIAN"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "印度餐厅，适合晚餐",
      "distanceKm": 5.4,
      "bucket": "MID"
    },
    "fetchedAt": "2026-10-13T00:47:52.662Z",
    "summary": "Desi Bar & Grill (Markham) | Best Indian restaurant in Markham · AS_INDIAN(0.90) · ★4.6/2308 · 价位未知 · 7段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJmXAkU_ksK4gRcvE7LtNFf6g",
      "name": "Anji Izakaya",
      "address": "7059 Yonge St, Thornhill, ON L3T 2A6, Canada",
      "lat": 43.7996682,
      "lng": -79.42024719999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.7,
      "ratingCount": 1381,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "17:30",
          "close": "26:30"
        },
        {
          "day": 1,
          "open": "17:30",
          "close": "26:30"
        },
        {
          "day": 2,
          "open": "17:30",
          "close": "26:30"
        },
        {
          "day": 3,
          "open": "17:30",
          "close": "26:30"
        },
        {
          "day": 4,
          "open": "17:30",
          "close": "26:30"
        },
        {
          "day": 5,
          "open": "17:30",
          "close": "26:45"
        },
        {
          "day": 6,
          "open": "17:30",
          "close": "26:45"
        }
      ],
      "primary": "AS_IZAKAYA",
      "tags": [
        "AS_IZAKAYA",
        "AS_KOREAN"
      ],
      "soloFriendly": true,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "日式居酒屋，但韩式风味明显",
      "distanceKm": 9.9,
      "bucket": "MID"
    },
    "fetchedAt": "2026-10-13T00:47:33.758Z",
    "summary": "Anji Izakaya · AS_IZAKAYA(0.80) · ★4.7/1381 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJe8oOcm_T1IkRu3661ceOuZo",
      "name": "Gyubee Japanese Grill (Markham)",
      "address": "7100 Woodbine Ave #100, Markham, ON L3R 5J2, Canada",
      "lat": 43.8158052,
      "lng": -79.34984779999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.8,
      "ratingCount": 16411,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
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
          "open": "11:00",
          "close": "24:00"
        }
      ],
      "primary": "AS_IZAKAYA",
      "tags": [
        "AS_IZAKAYA",
        "AS_KBBQ"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "日式烧烤，适合晚餐",
      "distanceKm": 4.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:28.625Z",
    "summary": "Gyubee Japanese Grill (Markham) · AS_IZAKAYA(0.90) · ★4.8/16411 · 价位2 · 7段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJOQpVuZ_T1IkR4hFHbbjwAzw",
      "name": "Wagyu Suki",
      "address": "3636 Steeles Ave E Unit 110 - 111, Markham, ON L3R 1K9, Canada",
      "lat": 43.819437799999996,
      "lng": -79.33099419999999,
      "dineIn": true,
      "priceLevel": 4,
      "rating": 4.4,
      "ratingCount": 863,
      "closedDays": [
        2
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:15",
          "close": "14:30"
        },
        {
          "day": 0,
          "open": "16:00",
          "close": "22:30"
        },
        {
          "day": 1,
          "open": "11:15",
          "close": "14:30"
        },
        {
          "day": 1,
          "open": "16:30",
          "close": "22:30"
        },
        {
          "day": 3,
          "open": "11:15",
          "close": "14:30"
        },
        {
          "day": 3,
          "open": "16:30",
          "close": "22:30"
        },
        {
          "day": 4,
          "open": "11:15",
          "close": "14:30"
        },
        {
          "day": 4,
          "open": "16:30",
          "close": "22:30"
        },
        {
          "day": 5,
          "open": "11:15",
          "close": "14:30"
        },
        {
          "day": 5,
          "open": "16:30",
          "close": "23:00"
        },
        {
          "day": 6,
          "open": "11:15",
          "close": "14:30"
        },
        {
          "day": 6,
          "open": "16:00",
          "close": "23:00"
        }
      ],
      "primary": "AS_IZAKAYA",
      "tags": [
        "AS_IZAKAYA",
        "AS_SUSHI"
      ],
      "soloFriendly": false,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "日式火锅与寿司组合",
      "distanceKm": 3.9,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:38.164Z",
    "summary": "Wagyu Suki · AS_IZAKAYA(0.80) · ★4.4/863 · 价位4 · 12段营业 · 周2休 · 有堂食"
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
      "placeId": "ChIJXd15bDzV1IkRLFdRpk1BvHk",
      "name": "Sukhothai (in Markham by Scarborough)",
      "address": "2 Fenton Rd Unit 2, Markham, ON L3R 7B4, Canada",
      "lat": 43.827512999999996,
      "lng": -79.2924426,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.3,
      "ratingCount": 630,
      "closedDays": [
        1
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "14:30"
        },
        {
          "day": 2,
          "open": "17:00",
          "close": "21:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "14:30"
        },
        {
          "day": 3,
          "open": "17:00",
          "close": "21:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "14:30"
        },
        {
          "day": 4,
          "open": "17:00",
          "close": "21:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "14:30"
        },
        {
          "day": 5,
          "open": "17:00",
          "close": "22:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "22:00"
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
      "distanceKm": 3.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:45.596Z",
    "summary": "Sukhothai (in Markham by Scarborough) · AS_THAI(0.90) · ★4.3/630 · 价位2 · 10段营业 · 周1休 · 有堂食"
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
      "placeId": "ChIJOwfWK2rW1IkRAQMi-P2ofGs",
      "name": "Lee's Kitchen",
      "address": "5694 Hwy 7 Unit 7, Markham, ON L3P 1B4, Canada",
      "lat": 43.8719448,
      "lng": -79.268866,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.1,
      "ratingCount": 123,
      "closedDays": [
        1
      ],
      "serviceWindows": [
        {
          "day": 0,
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
      "primary": "CN_AMERICANIZED",
      "tags": [
        "CN_AMERICANIZED",
        "CN_FAST"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.8,
      "reason": "美式中餐外卖店",
      "distanceKm": 4.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:17.626Z",
    "summary": "Lee's Kitchen · CN_AMERICANIZED(0.80) · ★4.1/123 · 价位1 · 6段营业 · 周1休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJz8prIwrW1IkRqEk42TtGTKs",
      "name": "Tangra Villa",
      "address": "411 Manhattan Dr #3C, Markham, ON L3P 7P4, Canada",
      "lat": 43.881117499999995,
      "lng": -79.2887779,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.4,
      "ratingCount": 349,
      "closedDays": [
        0,
        1
      ],
      "serviceWindows": [
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
          "close": "21:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "21:00"
        }
      ],
      "primary": "CN_AMERICANIZED",
      "tags": [
        "CN_AMERICANIZED"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.8,
      "reason": "午餐特价，美式中餐风格",
      "distanceKm": 4.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:12.172Z",
    "summary": "Tangra Villa · CN_AMERICANIZED(0.80) · ★4.4/349 · 价位1 · 5段营业 · 周01休 · 有堂食"
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
      "placeId": "ChIJmby4O83V1IkRz1mI3Tf5-AI",
      "name": "Big Beef Bowl",
      "address": "8362 Kennedy Rd, Unionville, ON L3R 9W5, Canada",
      "lat": 43.8603294,
      "lng": -79.3033226,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.3,
      "ratingCount": 1265,
      "closedDays": [
        3
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "10:30",
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
          "open": "10:30",
          "close": "22:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_NOODLE"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "粤式手工面馆",
      "distanceKm": 1.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:15.101Z",
    "summary": "Big Beef Bowl · CN_CANTON(0.90) · ★4.3/1265 · 价位1 · 6段营业 · 周3休 · 有堂食"
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
      "placeId": "ChIJKR4GLFTU1IkREPHMmBbU0Jg",
      "name": "Casa Victoria Fine Dining and Banquet",
      "address": "8601 Warden Ave. Unit 4-6, Unionville, ON L3R 0B5, Canada",
      "lat": 43.8584141,
      "lng": -79.33280599999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4,
      "ratingCount": 1729,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "09:00",
          "close": "21:30"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_DIMSUM"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.95,
      "reason": "正宗粤菜与点心",
      "distanceKm": 1,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-10-13T00:46:18.907Z",
    "summary": "Casa Victoria Fine Dining and Banquet · CN_CANTON(0.95) · ★4/1729 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJlerhTe3V1IkRYi9_BCFzLZA",
      "name": "CheungKee. Greentea Restaurant",
      "address": "3235 Hwy 7 Unit 18, Markham, ON L3R 3P3, Canada",
      "lat": 43.848478199999995,
      "lng": -79.3487274,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.3,
      "ratingCount": 2430,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "22:30"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "22:30"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "22:30"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "22:30"
        },
        {
          "day": 4,
          "open": "11:00",
          "close": "22:30"
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
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_DIMSUM"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "粤菜为主，评论提及经典菜式",
      "distanceKm": 2.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:07.968Z",
    "summary": "CheungKee. Greentea Restaurant · CN_CANTON(0.90) · ★4.3/2430 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ4bf1jnDW1IkRepm1-Ro1SdM",
      "name": "Congee Queen",
      "address": "5308 Hwy 7 Unit 5-7, Markham, ON L3P 1B9, Canada",
      "lat": 43.8684838,
      "lng": -79.2823015,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.9,
      "ratingCount": 3082,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "23:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.5,
      "reason": "粤式粥品专门店",
      "distanceKm": 3.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:23.379Z",
    "summary": "Congee Queen · CN_CANTON(0.50) · ★3.9/3082 · 价位2 · 1段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJ3yXycfcsK4gRrqHHqsuX_M4",
      "name": "Legend Chinese Restaurant 麗晶酒家",
      "address": "5 Glen Cameron Rd, Thornhill, ON L3T 5W2, Canada",
      "lat": 43.804859199999996,
      "lng": -79.420512,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.2,
      "ratingCount": 1228,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "09:30",
          "close": "22:00"
        },
        {
          "day": 1,
          "open": "10:00",
          "close": "22:00"
        },
        {
          "day": 2,
          "open": "10:00",
          "close": "22:00"
        },
        {
          "day": 3,
          "open": "10:00",
          "close": "22:00"
        },
        {
          "day": 4,
          "open": "10:00",
          "close": "22:00"
        },
        {
          "day": 5,
          "open": "10:00",
          "close": "22:30"
        },
        {
          "day": 6,
          "open": "09:30",
          "close": "22:30"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_DIMSUM"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "传统粤菜及点心",
      "distanceKm": 9.5,
      "bucket": "MID"
    },
    "fetchedAt": "2026-10-13T00:46:52.494Z",
    "summary": "Legend Chinese Restaurant 麗晶酒家 · CN_CANTON(0.90) · ★4.2/1228 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJJx_YY2XT1IkRON5cac93zKQ",
      "name": "QJD Peking Duck （Markham）Restaurant",
      "address": "7095 Woodbine Ave, Markham, ON L3R 1A3, Canada",
      "lat": 43.8167158,
      "lng": -79.34870839999999,
      "dineIn": true,
      "priceLevel": null,
      "rating": 4.2,
      "ratingCount": 2172,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "10:00",
          "close": "21:30"
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
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打北京烤鸭，但整体为经典中餐",
      "distanceKm": 4.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:30.090Z",
    "summary": "QJD Peking Duck （Markham）Restaurant · CN_CANTON(0.90) · ★4.2/2172 · 价位未知 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJw1hyf2TT1IkRd18P7fC0nxg",
      "name": "Ritzy Palace Chinese Cuisine",
      "address": "7301 Woodbine Ave, Markham, ON L3R 3V7, Canada",
      "lat": 43.8212602,
      "lng": -79.34968660000001,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.7,
      "ratingCount": 1611,
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
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "传统港式点心茶楼",
      "distanceKm": 4.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:25.259Z",
    "summary": "Ritzy Palace Chinese Cuisine · CN_CANTON(0.90) · ★3.7/1611 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ65AvR83V1IkRz-T5DpaJIDg",
      "name": "Top Choice Restaurant",
      "address": "8362 Kennedy Rd, Unionville, ON L3R 9W5, Canada",
      "lat": 43.8600432,
      "lng": -79.3035156,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.9,
      "ratingCount": 985,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "16:00",
          "close": "22:30"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "用户评论提到正宗粤菜",
      "distanceKm": 1.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:01.959Z",
    "summary": "Top Choice Restaurant · CN_CANTON(0.90) · ★3.9/985 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJLc0OlFbU1IkRZXIS_mJXVw4",
      "name": "Wonton Hut Noodle Bar",
      "address": "3760 Hwy 7, Markham, ON L3R 0N2, Canada",
      "lat": 43.8566329,
      "lng": -79.3325613,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.4,
      "ratingCount": 851,
      "closedDays": [
        1
      ],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "20:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_NOODLE",
        "CN_HK_CAFE"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打港式云吞面，评论提及香港风味",
      "distanceKm": 0.9,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-10-13T00:46:34.152Z",
    "summary": "Wonton Hut Noodle Bar · CN_CANTON(0.90) · ★4.4/851 · 价位1 · 1段营业 · 周1休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJualBTaXV1IkRwaUxO9CZ-Rw",
      "name": "Yang's Braised Chicken Rice(First Markham Place)",
      "address": "3235 Hwy 7 Unit 17, Markham, ON L3R 3P3, Canada",
      "lat": 43.8484618,
      "lng": -79.3488775,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.1,
      "ratingCount": 327,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "26:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_NOODLE",
        "CN_DUMPLING"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.7,
      "reason": "炖鸡饭为主，粤式风格",
      "distanceKm": 2.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:37.870Z",
    "summary": "Yang's Braised Chicken Rice(First Markham Place) · CN_CANTON(0.70) · ★4.1/327 · 价位1 · 1段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJqXFBsM3V1IkROnQ4oQCbUfw",
      "name": "知味煲仔饭 (Unionville) Good Taste Casserole Rice",
      "address": "8392 Kennedy Rd, Unionville, ON L3R 0W4, Canada",
      "lat": 43.8612396,
      "lng": -79.3049303,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.1,
      "ratingCount": 793,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "22:00"
        }
      ],
      "primary": "CN_CANTON",
      "tags": [
        "CN_CANTON",
        "CN_BREAKFAST",
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
      "reason": "粤式煲仔饭为主",
      "distanceKm": 1.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:11.731Z",
    "summary": "知味煲仔饭 (Unionville) Good Taste Casserole Rice · CN_CANTON(0.90) · ★4.1/793 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJs35acgjT1IkRdJzhIHj0K-4",
      "name": "Sam’s Congee Delight",
      "address": "7354 Woodbine Ave, Markham, ON L3R 1A5, Canada",
      "lat": 43.822372,
      "lng": -79.35166199999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 3.9,
      "ratingCount": 1492,
      "closedDays": [
        2
      ],
      "serviceWindows": [
        {
          "day": null,
          "open": "08:30",
          "close": "17:00"
        }
      ],
      "primary": "CN_CONGEE",
      "tags": [
        "CN_CONGEE",
        "CN_CANTON",
        "CN_BREAKFAST"
      ],
      "soloFriendly": true,
      "slotLock": [
        "breakfast",
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "专营粤式粥品与港式早点",
      "distanceKm": 4.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:54.296Z",
    "summary": "Sam’s Congee Delight · CN_CONGEE(0.90) · ★3.9/1492 · 价位1 · 1段营业 · 周2休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJXXqDFYbT1IkRNABHDwIICnE",
      "name": "Yin Ji Chang Fen",
      "address": "7020-7080, 7010 Warden Ave. #17-18, Markham, ON L3R 5Y3, Canada",
      "lat": 43.8202393,
      "lng": -79.3252497,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.2,
      "ratingCount": 2118,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "08:00",
          "close": "25:00"
        }
      ],
      "primary": "CN_CONGEE",
      "tags": [
        "CN_CONGEE",
        "CN_CANTON",
        "CN_BREAKFAST"
      ],
      "soloFriendly": true,
      "slotLock": [
        "breakfast",
        "lunch",
        "dinner",
        "latenight"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "广式粥粉专门店",
      "distanceKm": 3.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:18.897Z",
    "summary": "Yin Ji Chang Fen · CN_CONGEE(0.90) · ★4.2/2118 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ62YuCXfV1IkR2IoPtlAEI6g",
      "name": "滿意粥粉面 Very Good Congee & Noodle",
      "address": "2R1, 9390 Woodbine Ave Fl 2, Markham, ON L6C 0M5, Canada",
      "lat": 43.872499,
      "lng": -79.364375,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4,
      "ratingCount": 586,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "10:00",
          "close": "20:00"
        }
      ],
      "primary": "CN_CONGEE",
      "tags": [
        "CN_CONGEE",
        "CN_NOODLE",
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打粥粉面，港式风味",
      "distanceKm": 3.9,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:58.668Z",
    "summary": "滿意粥粉面 Very Good Congee & Noodle · CN_CONGEE(0.90) · ★4/586 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJuzMz3MzV1IkRU_FkewPd91o",
      "name": "369 Shanghai Dim Sum",
      "address": "8380 Kennedy Rd c8, Unionville, ON L3R 2N9, Canada",
      "lat": 43.8607601,
      "lng": -79.3043524,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.6,
      "ratingCount": 473,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "22:00"
        }
      ],
      "primary": "CN_DIMSUM",
      "tags": [
        "CN_DIMSUM",
        "CN_DUMPLING",
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打点心与粤式小菜",
      "distanceKm": 1.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:05.494Z",
    "summary": "369 Shanghai Dim Sum · CN_DIMSUM(0.90) · ★3.6/473 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJM6NNOcjT1IkReiN83hXNSvI",
      "name": "Century Banquet Restaurant",
      "address": "398 Ferrier St, Markham, ON L3R 2Z5, Canada",
      "lat": 43.8195763,
      "lng": -79.3312677,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.9,
      "ratingCount": 1548,
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
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打点心，适合午餐",
      "distanceKm": 3.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:41.867Z",
    "summary": "Century Banquet Restaurant · CN_DIMSUM(0.90) · ★3.9/1548 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJ0wRrUjzU1IkRY7Pc6F1VDTk",
      "name": "Fancy Chinese Cuisine",
      "address": "7750 Kennedy Rd #4, Markham, ON L3R 0A7, Canada",
      "lat": 43.842621,
      "lng": -79.30600629999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.9,
      "ratingCount": 1931,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "09:00",
          "close": "21:00"
        }
      ],
      "primary": "CN_DIMSUM",
      "tags": [
        "CN_DIMSUM",
        "CN_CANTON",
        "CN_BUBBLETEA"
      ],
      "soloFriendly": true,
      "slotLock": [
        "breakfast",
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "传统早茶点心为主",
      "distanceKm": 1.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:34.111Z",
    "summary": "Fancy Chinese Cuisine · CN_DIMSUM(0.90) · ★3.9/1931 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJI1tMqYsrK4gRdkPWW2pXn-4",
      "name": "Lobster Port",
      "address": "7501 Woodbine Ave, Markham, ON L3R 2W1, Canada",
      "lat": 43.8266792,
      "lng": -79.350956,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.1,
      "ratingCount": 2166,
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
      "soloFriendly": true,
      "slotLock": [
        "breakfast",
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打点心与粤式海鲜",
      "distanceKm": 3.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:14.652Z",
    "summary": "Lobster Port · CN_DIMSUM(0.90) · ★4.1/2166 · 价位2 · 1段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJh7SnFpXU1IkRIkOVxRqcj7g",
      "name": "Skyview Fusion Cuisine",
      "address": "8261 Woodbine Ave #8, Markham, ON L3R 8Z5, Canada",
      "lat": 43.8444991,
      "lng": -79.35481,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.9,
      "ratingCount": 3621,
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
        "lunch"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打点心，评论多次提及",
      "distanceKm": 2.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:48.463Z",
    "summary": "Skyview Fusion Cuisine · CN_DIMSUM(0.90) · ★3.9/3621 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJZZ5q1UkrK4gRkqMPRqSUJd4",
      "name": "Chinese Dumpling House",
      "address": "505 Hwy 7, Thornhill, ON L3T 7T1, Canada",
      "lat": 43.8419551,
      "lng": -79.3864098,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.2,
      "ratingCount": 1061,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "22:30"
        }
      ],
      "primary": "CN_DUMPLING",
      "tags": [
        "CN_DUMPLING",
        "CN_NOODLE"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "主打饺子，兼售面条",
      "distanceKm": 5.3,
      "bucket": "MID"
    },
    "fetchedAt": "2026-10-13T00:45:58.069Z",
    "summary": "Chinese Dumpling House · CN_DUMPLING(0.80) · ★4.2/1061 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJX3vySnHV1IkRaSg2twVY5ZQ",
      "name": "Mom's Pan-Fried Bun",
      "address": "8362 Kennedy Rd, Markham, ON L3R 9W5, Canada",
      "lat": 43.8603242,
      "lng": -79.3033707,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.6,
      "ratingCount": 1559,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "10:00",
          "close": "22:00"
        }
      ],
      "primary": "CN_DUMPLING",
      "tags": [
        "CN_DUMPLING",
        "CN_NOODLE",
        "CN_FAST"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "主打煎包和面食",
      "distanceKm": 1.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:25.153Z",
    "summary": "Mom's Pan-Fried Bun · CN_DUMPLING(0.90) · ★4.6/1559 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJseRjqSHV1IkR5gg1UDmb6MI",
      "name": "Bingz Crispy Burger",
      "address": "3229 Hwy 7 Unit 11&12, Markham, ON L3R 3P3, Canada",
      "lat": 43.8483015,
      "lng": -79.34933339999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.5,
      "ratingCount": 2389,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "25:00"
        }
      ],
      "primary": "CN_FAST",
      "tags": [
        "CN_FAST",
        "WS_BURGER"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.8,
      "reason": "中式快餐连锁，主营汉堡小吃",
      "distanceKm": 2.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:24.632Z",
    "summary": "Bingz Crispy Burger · CN_FAST(0.80) · ★4.5/2389 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJxaxx0UTU1IkR-TdtCMpEwIw",
      "name": "Good Catch Bar & Cafe",
      "address": "179 Enterprise Blvd #109, Unionville, ON L6G 0A2, Canada",
      "lat": 43.8496628,
      "lng": -79.3224182,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4,
      "ratingCount": 3668,
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
          "close": "26:00"
        },
        {
          "day": 6,
          "open": "11:00",
          "close": "26:00"
        }
      ],
      "primary": "CN_HK_CAFE",
      "tags": [
        "CN_HK_CAFE",
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.8,
      "reason": "港式茶餐厅风格，提供经典港式菜品",
      "distanceKm": 0.4,
      "bucket": "WALK"
    },
    "fetchedAt": "2026-10-13T00:48:35.441Z",
    "summary": "Good Catch Bar & Cafe · CN_HK_CAFE(0.80) · ★4/3668 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJmUUSWx_V1IkRowdjvbWSkhk",
      "name": "Hai Tang Cafe & Takeout",
      "address": "38 Buttonfield Rd, Markham, ON L3R 9G9, Canada",
      "lat": 43.8685136,
      "lng": -79.357751,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4,
      "ratingCount": 1447,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "08:00",
          "close": "21:00"
        }
      ],
      "primary": "CN_HK_CAFE",
      "tags": [
        "CN_HK_CAFE",
        "CN_BREAKFAST",
        "CN_BUBBLETEA"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "港式茶餐厅",
      "distanceKm": 3.3,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:29.530Z",
    "summary": "Hai Tang Cafe & Takeout · CN_HK_CAFE(0.90) · ★4/1447 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJowxa39DX1IkREbPxankjaSI",
      "name": "M & Y Restaurant",
      "address": "8 Washington St, Markham, ON L3P 2R2, Canada",
      "lat": 43.8748998,
      "lng": -79.25917369999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4,
      "ratingCount": 236,
      "closedDays": [
        3
      ],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "20:00"
        }
      ],
      "primary": "CN_HK_CAFE",
      "tags": [
        "CN_HK_CAFE",
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.8,
      "reason": "用户评论提到港式食物和经典港式咖啡馆",
      "distanceKm": 5.6,
      "bucket": "MID"
    },
    "fetchedAt": "2026-10-13T00:46:41.930Z",
    "summary": "M & Y Restaurant · CN_HK_CAFE(0.80) · ★4/236 · 价位1 · 1段营业 · 周3休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJU0dBsM3V1IkRQiMHLBqual0",
      "name": "New City Restaurant",
      "address": "8392 Kennedy Rd, Unionville, ON L3R 0W4, Canada",
      "lat": 43.861219899999995,
      "lng": -79.3050986,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.1,
      "ratingCount": 885,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "08:00",
          "close": "20:00"
        }
      ],
      "primary": "CN_HK_CAFE",
      "tags": [
        "CN_HK_CAFE",
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "港式茶餐厅，提供多种港式经典菜品",
      "distanceKm": 1.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:38.404Z",
    "summary": "New City Restaurant · CN_HK_CAFE(0.90) · ★4.1/885 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJf2WIdN3U1IkRKSxV53RvQMY",
      "name": "Woodstone Eatery",
      "address": "10 Apple Creek Blvd, Markham, ON L3R 0P4, Canada",
      "lat": 43.8575024,
      "lng": -79.3590351,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.1,
      "ratingCount": 1336,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "08:30",
          "close": "21:00"
        }
      ],
      "primary": "CN_HK_CAFE",
      "tags": [
        "CN_HK_CAFE",
        "CN_CANTON"
      ],
      "soloFriendly": true,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "用户评论明确提到是港式茶餐厅",
      "distanceKm": 2.9,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:04.728Z",
    "summary": "Woodstone Eatery · CN_HK_CAFE(0.90) · ★4.1/1336 · 价位1 · 1段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJF0nmu8TV1IkRexelh7JXrGE",
      "name": "QQ Noodle King",
      "address": "4300 Steeles Ave E, Markham, ON L3R 0Y5, Canada",
      "lat": 43.825233399999995,
      "lng": -79.306168,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.4,
      "ratingCount": 142,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "10:00",
          "close": "20:00"
        }
      ],
      "primary": "CN_NOODLE",
      "tags": [
        "CN_NOODLE",
        "CN_DUMPLING"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "武汉干面、牛肉面等面食为主",
      "distanceKm": 3.4,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:21.373Z",
    "summary": "QQ Noodle King · CN_NOODLE(0.90) · ★4.4/142 · 价位1 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJu_ZhGMLV1IkR9I6MBtKzzsE",
      "name": "The Noodle Bar Markham",
      "address": "3603 Hwy 7 #106, Markham, ON L3R 8W3, Canada",
      "lat": 43.8534272,
      "lng": -79.33807999999999,
      "dineIn": true,
      "priceLevel": 1,
      "rating": 4.1,
      "ratingCount": 457,
      "closedDays": [
        2
      ],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:30",
          "close": "19:30"
        }
      ],
      "primary": "CN_NOODLE",
      "tags": [
        "CN_NOODLE",
        "CN_CANTON",
        "CN_HK_CAFE"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "主打车仔面，港式风味",
      "distanceKm": 1.2,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:30.838Z",
    "summary": "The Noodle Bar Markham · CN_NOODLE(0.80) · ★4.1/457 · 价位1 · 1段营业 · 周2休 · 有堂食"
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
      "placeId": "ChIJT_xhMsjV1IkRJJgKD8w0e6Y",
      "name": "Chat Bar",
      "address": "187 Main St Unionville, Unionville, ON L3R 2G8, Canada",
      "lat": 43.8675898,
      "lng": -79.3119739,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 2476,
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
          "open": "15:00",
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
        "CN_SKEWER"
      ],
      "soloFriendly": false,
      "slotLock": [
        "latenight"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "用户评论提到烤串，适合深夜聚餐",
      "distanceKm": 1.8,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:45.362Z",
    "summary": "Chat Bar · CN_SKEWER(0.80) · ★4.5/2476 · 价位2 · 7段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJgRoF6u3U1IkRFRJgdQOkG-A",
      "name": "Mabu Generation",
      "address": "3235 Hwy 7 #23-26, Markham, ON L3R 3P9, Canada",
      "lat": 43.8486385,
      "lng": -79.34794819999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.5,
      "ratingCount": 5001,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:00",
          "close": "24:30"
        },
        {
          "day": 1,
          "open": "11:00",
          "close": "24:30"
        },
        {
          "day": 2,
          "open": "11:00",
          "close": "24:30"
        },
        {
          "day": 3,
          "open": "11:00",
          "close": "24:30"
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
          "open": "11:00",
          "close": "25:30"
        }
      ],
      "primary": "CN_TAIWAN",
      "tags": [
        "CN_TAIWAN",
        "CN_BUBBLETEA"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "台湾餐厅，提供传统菜肴和奶茶",
      "distanceKm": 2.1,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:47:42.336Z",
    "summary": "Mabu Generation · CN_TAIWAN(0.90) · ★4.5/5001 · 价位2 · 7段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJuRzyjg7U1IkRogTNupqWyl8",
      "name": "Graceful Vegetarian Restaurant 法海素食軒",
      "address": "4675 Steeles Ave E, Scarborough, ON M1V 0B7, Canada",
      "lat": 43.8235606,
      "lng": -79.3026208,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 501,
      "closedDays": [
        3
      ],
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
        "CN_DIMSUM",
        "CN_CANTON"
      ],
      "soloFriendly": false,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "素食粤菜点心",
      "distanceKm": 3.7,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:46:22.004Z",
    "summary": "Graceful Vegetarian Restaurant 法海素食軒 · CN_VEG(0.90) · ★4.4/501 · 价位2 · 1段营业 · 周3休 · 有堂食"
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
      "placeId": "ChIJfzHd9IPT1IkRXg-ES4L43Lw",
      "name": "Xin Jiang Restaurant",
      "address": "3636 Steeles Ave E Unit106, Markham, ON L3R 2Z5, Canada",
      "lat": 43.8191912,
      "lng": -79.33081990000001,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.4,
      "ratingCount": 2203,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "23:00"
        }
      ],
      "primary": "CN_XIBEI",
      "tags": [
        "CN_XIBEI",
        "CN_SKEWER",
        "CN_NOODLE"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "西北菜与烧烤特色",
      "distanceKm": 3.9,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:27.179Z",
    "summary": "Xin Jiang Restaurant · CN_XIBEI(0.90) · ★4.4/2203 · 价位2 · 1段营业 · 无固定休 · 有堂食"
  },
  {
    "restaurant": {
      "placeId": "ChIJx_EImobT1IkR60yNXRdufvM",
      "name": "马记牛羊馆 Whole Sheep Feast Restaurant",
      "address": "3636 Steeles Ave E #116, Markham, ON L3R 1K9, Canada",
      "lat": 43.81942,
      "lng": -79.3306537,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 3.7,
      "ratingCount": 340,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "23:00"
        }
      ],
      "primary": "CN_XIBEI",
      "tags": [
        "CN_XIBEI",
        "CN_SKEWER",
        "CN_HOTPOT"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "西北菜为主，含烤串和火锅",
      "distanceKm": 3.9,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:46.655Z",
    "summary": "马记牛羊馆 Whole Sheep Feast Restaurant · CN_XIBEI(0.80) · ★3.7/340 · 价位2 · 1段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJZbukWQDT1IkRM3KXNk59t3Y",
      "name": "蒙自源过桥米线 Meetrice Noodle (Markham)",
      "address": "20 Gibson Dr, Markham, ON L3R 4N5, Canada",
      "lat": 43.8244822,
      "lng": -79.32660489999999,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.3,
      "ratingCount": 197,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": null,
          "open": "11:00",
          "close": "23:00"
        }
      ],
      "primary": "CN_YUNNAN",
      "tags": [
        "CN_YUNNAN",
        "CN_NOODLE"
      ],
      "soloFriendly": true,
      "slotLock": [],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.8,
      "reason": "蒙自源过桥米线，云南特色",
      "distanceKm": 3.3,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:50.849Z",
    "summary": "蒙自源过桥米线 Meetrice Noodle (Markham) · CN_YUNNAN(0.80) · ★4.3/197 · 价位2 · 1段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJh5_58r_U1IkRDbXuFBKjVdQ",
      "name": "Dragon Legend",
      "address": "25 Lanark Rd, Markham, ON L3R 2N8, Canada",
      "lat": 43.845038200000005,
      "lng": -79.3584221,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.1,
      "ratingCount": 8119,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "15:30"
        },
        {
          "day": 0,
          "open": "16:30",
          "close": "21:30"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 1,
          "open": "17:00",
          "close": "21:30"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 2,
          "open": "17:00",
          "close": "21:30"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 3,
          "open": "17:00",
          "close": "21:30"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 4,
          "open": "17:00",
          "close": "21:30"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 5,
          "open": "17:00",
          "close": "22:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "15:30"
        },
        {
          "day": 6,
          "open": "16:30",
          "close": "22:00"
        }
      ],
      "primary": "WS_BUFFET",
      "tags": [
        "WS_BUFFET",
        "AS_SUSHI",
        "CN_CANTON"
      ],
      "soloFriendly": false,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 0.7,
      "confidence": 0.9,
      "reason": "泛亚自助餐，含寿司和粤菜",
      "distanceKm": 3,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:48:18.927Z",
    "summary": "Dragon Legend · WS_BUFFET(0.90) · ★4.1/8119 · 价位2 · 14段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJM9BWlp7U1IkRyZkN7z_GJQs",
      "name": "Mandarin Restaurant",
      "address": "7660 Woodbine Ave, Markham, ON L3R 2N2, Canada",
      "lat": 43.829716999999995,
      "lng": -79.3535907,
      "dineIn": true,
      "priceLevel": 2,
      "rating": 4.6,
      "ratingCount": 9879,
      "closedDays": [],
      "serviceWindows": [
        {
          "day": 0,
          "open": "11:30",
          "close": "15:30"
        },
        {
          "day": 0,
          "open": "16:30",
          "close": "21:00"
        },
        {
          "day": 1,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 1,
          "open": "17:00",
          "close": "21:00"
        },
        {
          "day": 2,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 2,
          "open": "17:00",
          "close": "21:00"
        },
        {
          "day": 3,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 3,
          "open": "17:00",
          "close": "21:00"
        },
        {
          "day": 4,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 4,
          "open": "17:00",
          "close": "21:00"
        },
        {
          "day": 5,
          "open": "11:30",
          "close": "15:00"
        },
        {
          "day": 5,
          "open": "17:00",
          "close": "22:00"
        },
        {
          "day": 6,
          "open": "11:30",
          "close": "15:30"
        },
        {
          "day": 6,
          "open": "16:30",
          "close": "22:00"
        }
      ],
      "primary": "WS_BUFFET",
      "tags": [
        "WS_BUFFET",
        "CN_AMERICANIZED",
        "AS_SUSHI"
      ],
      "soloFriendly": false,
      "slotLock": [
        "lunch",
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 0.8,
      "confidence": 0.9,
      "reason": "自助餐为主，含美式中餐和寿司",
      "distanceKm": 3.6,
      "bucket": "NEAR"
    },
    "fetchedAt": "2026-10-13T00:45:41.736Z",
    "summary": "Mandarin Restaurant · WS_BUFFET(0.90) · ★4.6/9879 · 价位2 · 14段营业 · 无固定休 · 有堂食"
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
      "placeId": "ChIJ1fz767wsK4gRnk8U-9TQfL4",
      "name": "Santorini Estiatorio",
      "address": "288 John St., Markham, ON L3T 6M8, Canada",
      "lat": 43.819938,
      "lng": -79.3990134,
      "dineIn": true,
      "priceLevel": null,
      "rating": 4.5,
      "ratingCount": 2484,
      "closedDays": [
        1
      ],
      "serviceWindows": [
        {
          "day": 0,
          "open": "16:00",
          "close": "22:00"
        },
        {
          "day": 2,
          "open": "12:00",
          "close": "22:00"
        },
        {
          "day": 3,
          "open": "12:00",
          "close": "22:00"
        },
        {
          "day": 4,
          "open": "12:00",
          "close": "22:00"
        },
        {
          "day": 5,
          "open": "12:00",
          "close": "23:00"
        },
        {
          "day": 6,
          "open": "12:00",
          "close": "23:00"
        }
      ],
      "primary": "WS_GREEK",
      "tags": [
        "WS_GREEK",
        "WS_STEAK"
      ],
      "soloFriendly": false,
      "slotLock": [
        "dinner"
      ],
      "isMainMeal": true,
      "priorBias": 1,
      "confidence": 0.9,
      "reason": "高端希腊餐厅，适合晚餐",
      "distanceKm": 7.2,
      "bucket": "MID"
    },
    "fetchedAt": "2026-10-13T00:47:49.419Z",
    "summary": "Santorini Estiatorio · WS_GREEK(0.90) · ★4.5/2484 · 价位未知 · 6段营业 · 周1休 · 有堂食"
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
