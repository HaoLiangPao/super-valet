/**
 * 预设套餐 —— 我们自己维护的命名名单（design/0006 §4.2、ADR-0008）。
 *
 * ⚠️ 本文件由 `node scripts/build-packages.mjs` 生成。
 * 成员是**显式 placeId 名单**，不是运行时条件：
 * 「精选」意味着有人为它背书，动态条件（rating > 4.5）会把刷分店卷进来。
 *
 * 生成于 2026-09-26T05:09:02.076Z
 */
import type { RestaurantPackage } from '@/lib/catalog/types';

export const PRESET_PACKAGES: RestaurantPackage[] = [
  {
    "id": "cn_top",
    "nameZh": "精选中餐",
    "nameEn": "Highly Rated Chinese",
    "descZh": "评分和口碑都站得住的中餐，够你吃一阵子不重样。",
    "descEn": "Chinese places with both high ratings and enough reviews to trust them.",
    "placeIds": [
      "ChIJaeTnfgDV1IkRsLd7I1O40QU",
      "ChIJ-c5PgXbR1IkRH_IphL3KC1c",
      "ChIJ_fSIGGHX1IkRZE5RcrStUI8",
      "ChIJGw6_rM7R1IkRrTcMr8vsdak",
      "ChIJG13Tbw_V1IkR6BRGAF5l0hU",
      "ChIJO4lRcNg1K4gRjyQ5Y0N-Lq8"
    ]
  },
  {
    "id": "ws_value",
    "nameZh": "高性价比西餐",
    "nameEn": "Best-Value Western",
    "descZh": "人均不贵又不将就的西式正餐 —— 补上晚餐池里最缺的一块。",
    "descEn": "Western dinner spots that are easy on the wallet without being a compromise.",
    "placeIds": [
      "ChIJs6be82TX1IkRDLk290HRzGQ",
      "ChIJyScucx0rK4gRN9fhuIHdjQc",
      "ChIJ18LOQ9bW1IkRu3lnDluqcR0",
      "ChIJPVed-QDV1IkR0UePNBAb6AM",
      "ChIJ37FiYAAtK4gR-rsjoVFbQWQ",
      "ChIJ4bf1jnDW1IkRWwgwAA6fI-Y",
      "ChIJaQ9v5zjW1IkR0f4OFPPx5Wg",
      "ChIJpwUtAcHU1IkRXmDyKSdI5Ik",
      "ChIJ1azDAbbU1IkRv9OYB0zzF8k",
      "ChIJo6QV1EMqK4gRJmt5R7fyy8A",
      "ChIJb1g2IrHV1IkRqjeVXkQCPCE",
      "ChIJCztyq1HV1IkRZHRrfNPxjbI",
      "ChIJw0ASVwDX1IkRl-5wke9eMKU",
      "ChIJoadb5zjW1IkR-3Q_CdEw7fY",
      "ChIJe1mrlHLW1IkRG0JzNaEhz_Y",
      "ChIJ59JUPALV1IkR1VWLx3e5SlI",
      "ChIJKRIHhbXU1IkRI-Kj2UnKpIg"
    ]
  },
  {
    "id": "solo_quick",
    "nameZh": "一人食快手",
    "nameEn": "Quick Solo Meal",
    "descZh": "一个人进去不尴尬、不用等人、坐下就能吃 —— 面、米线、丼饭那一类。",
    "descEn": "Noodles, rice bowls and the like: sit down alone, eat, leave.",
    "placeIds": [
      "ChIJj_QzUADV1IkRSbteiFS6AdQ",
      "ChIJt0OMDN3V1IkRNKbZyDZwdKw",
      "ChIJA1VTeq_V1IkRbdp8wam0Lx4",
      "ChIJRYgRES8rK4gRLrC4DK6PsWE",
      "ChIJ3QTLOGPV1IkRG5f8DYMnCFo",
      "ChIJC8UmJADV1IkRykbZopPOveY",
      "ChIJG13Tbw_V1IkR6BRGAF5l0hU"
    ]
  },
  {
    "id": "late_night",
    "nameZh": "深夜食堂",
    "nameEn": "Late Night",
    "descZh": "加班到很晚、或者就是不想睡的时候。",
    "descEn": "For the nights that run long.",
    "placeIds": [
      "ChIJn7loA8vV1IkR03CbBg_YnYw",
      "ChIJaeTnfgDV1IkRsLd7I1O40QU",
      "ChIJRYgRES8rK4gRLrC4DK6PsWE",
      "ChIJyScucx0rK4gRN9fhuIHdjQc",
      "ChIJMQQWNMrV1IkRRar2lPiEZ-0"
    ]
  }
];
