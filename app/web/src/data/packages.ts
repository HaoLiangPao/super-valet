/**
 * 预设套餐 —— 我们自己维护的命名名单（design/0006 §4.2、ADR-0008）。
 *
 * ⚠️ 本文件由 `node scripts/build-packages.mjs` 生成。
 * 成员是**显式 placeId 名单**，不是运行时条件：
 * 「精选」意味着有人为它背书，动态条件（rating > 4.5）会把刷分店卷进来。
 *
 * 生成于 2026-10-13T00:49:55.412Z
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
      "ChIJX3vySnHV1IkRaSg2twVY5ZQ",
      "ChIJseRjqSHV1IkR5gg1UDmb6MI",
      "ChIJ_fSIGGHX1IkRZE5RcrStUI8",
      "ChIJGw6_rM7R1IkRrTcMr8vsdak",
      "ChIJG13Tbw_V1IkR6BRGAF5l0hU",
      "ChIJgRoF6u3U1IkRFRJgdQOkG-A",
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
      "ChIJyScucx0rK4gRN9fhuIHdjQc",
      "ChIJ18LOQ9bW1IkRu3lnDluqcR0",
      "ChIJPVed-QDV1IkR0UePNBAb6AM",
      "ChIJ37FiYAAtK4gR-rsjoVFbQWQ",
      "ChIJ4bf1jnDW1IkRWwgwAA6fI-Y",
      "ChIJaQ9v5zjW1IkR0f4OFPPx5Wg",
      "ChIJ1fz767wsK4gRnk8U-9TQfL4",
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
    "id": "cn_canto",
    "nameZh": "粤味与茶餐厅",
    "nameEn": "Cantonese & HK Cafés",
    "descZh": "煲仔饭、粥粉面、焗饭、小炒 —— Markham 最拿手的那一路。",
    "descEn": "Claypot rice, congee, baked rice and wok dishes — what Markham does best.",
    "placeIds": [
      "ChIJKR4GLFTU1IkREPHMmBbU0Jg",
      "ChIJlerhTe3V1IkRYi9_BCFzLZA",
      "ChIJ-c5PgXbR1IkRH_IphL3KC1c",
      "ChIJLc0OlFbU1IkRZXIS_mJXVw4",
      "ChIJZ6PZDQDV1IkR5jPQuJiGXys",
      "ChIJqXFBsM3V1IkROnQ4oQCbUfw",
      "ChIJXXqDFYbT1IkRNABHDwIICnE",
      "ChIJ62YuCXfV1IkR2IoPtlAEI6g",
      "ChIJxaxx0UTU1IkR-TdtCMpEwIw",
      "ChIJmUUSWx_V1IkRowdjvbWSkhk",
      "ChIJowxa39DX1IkREbPxankjaSI",
      "ChIJU0dBsM3V1IkRQiMHLBqual0",
      "ChIJf2WIdN3U1IkRKSxV53RvQMY"
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
      "ChIJX3vySnHV1IkRaSg2twVY5ZQ",
      "ChIJseRjqSHV1IkR5gg1UDmb6MI",
      "ChIJRYgRES8rK4gRLrC4DK6PsWE",
      "ChIJ3QTLOGPV1IkRG5f8DYMnCFo",
      "ChIJF0nmu8TV1IkRexelh7JXrGE",
      "ChIJC8UmJADV1IkRykbZopPOveY",
      "ChIJG13Tbw_V1IkR6BRGAF5l0hU",
      "ChIJgRoF6u3U1IkRFRJgdQOkG-A",
      "ChIJZbukWQDT1IkRM3KXNk59t3Y"
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
      "ChIJXXqDFYbT1IkRNABHDwIICnE",
      "ChIJRYgRES8rK4gRLrC4DK6PsWE",
      "ChIJT_xhMsjV1IkRJJgKD8w0e6Y",
      "ChIJyScucx0rK4gRN9fhuIHdjQc",
      "ChIJMQQWNMrV1IkRRar2lPiEZ-0"
    ]
  }
];
