# Markham 美食候选表 (2026-10)

## 数据来源说明

**本表不含小红书内容。** `docs/design/0005-explore-import.md` 的 Non-goals 已明确否决
"爬取小红书/大众点评"作为数据源（违反平台 ToS），本表改用公开网络研究
（Tripadvisor、本地美食博客 Diary of a Toronto Girl、Restaurantji、RestaurantTrips 等）
整理而成，全部来源 URL 见每行「来源」列。

坐标、营业时间、评分、价位、`place_id` **一律不在本表**——按 0005 的硬边界，
这些事实字段只能来自 Google Places，本表只提供「查询词 + 人工线索」。

**如果你想要小红书的一手内容**：把笔记原文（或截图文字）贴给我，我按同样的格式
抽取店名/地址线索/招牌菜，这正是 EXPLORE 页「粘贴笔记」要支持的输入形式。

## 已排除（已在 `data/seed-restaurants-markham.ts` 池子里，避免重复）

Sushi Umi (Markham)、Yunshang Rice Noodle 云尚米线 (Unionville)、
Cafe De Hong Kong 良心冰室、Mei Nung Beef Noodle House 美濃、Haidilao Hot Pot 海底捞 (Markham)

## 候选表（66 家，按类别分组）

### 中餐（粤式 / 港式茶餐厅 / 地方菜）

| 店名 | 地址线索 | 招牌菜 | 来源 |
| --- | --- | --- | --- |
| 耀記 Lee's Kitchen | Markham（具体地址待 Places 确认）, (905) 471-6602 | Cantonese Chow Mein、Chicken Balls 甜酸汁、General Tao 炒饭、河粉 | restauranttrips.com |
| QQ Noodle King | Pacific Mall, Markham, (647) 469-5550 | 牛腩面配蛋 | restauranttrips.com |
| Mom's Pan-Fried Bun 老娘水煎包 | Markham, (905) 415-1858 | 水煎包、鸡汤/三鲜水饺 | restauranttrips.com |
| Vegedelight Vegetarian Restaurant | Markham, (365) 608-5889 | 猴头菇串、馄饨、茄子煲 | restauranttrips.com |
| Hai Tang Cafe & Takeout | Markham, (905) 477-8332 | 粤式家常菜 | restauranttrips.com |
| Lobster Port | 7501 Woodbine Ave, Markham, (905) 597-8508 | 脆皮片皮鸭、姜葱龙虾、点心、甜酸肉 | restauranttrips.com + diaryofatorontogirl.com |
| Fancy Chinese Cuisine 利嘉盛 | Markham, (905) 475-2822 | 片皮鸭、甜酸肉、烧卖、炸虾云吞 | restauranttrips.com |
| Yang's Braised Chicken Rice | Woodbine, Markham, (905) 604-3188 | 招牌卤鸡腿饭（辣度可调） | restauranttrips.com |
| Mandarin Restaurant (Markham) | Markham, (905) 471-5000（连锁，多店） | 自助餐，菜式齐全 | restauranttrips.com + tripadvisor + restaurantji |
| 马记牛羊馆 Whole Sheep Feast Restaurant | Metro Square, Markham, (905) 415-8988；另有 Warden & Steeles 店 | 羊肉汤、盐焗羊排 | restauranttrips.com |
| 蒙自源过桥米线 Meetrice Noodle | Markham, (905) 470-0888 | 过桥米线（自助小料台） | restauranttrips.com |
| Sam's Congee Delight | Markham, (905) 479-1074 | 港式及第粥 | restauranttrips.com |
| Chinese Dumpling House | Markham, (905) 947-9880 | 韭菜猪肉煎饺、酸辣汤、孜然羊肉 | restauranttrips.com |
| Woodstone Eatery 森石 | Markham, (905) 474-1228 | 蜜汁鸡翅、芝士叉烧蛋包饭、牛腩咖喱、焗意粉 | restauranttrips.com |
| Green Tea Restaurant | Markham, (905) 604-8260 | 火锅 | restauranttrips.com |
| Tangra Villa Hakka Chinese Restaurant (Halal) | Markham, (905) 604-6989 | 招牌辣子鸡、甜辣蒜香鸡 | restauranttrips.com |
| Dragon Legend | 25 Lanark Rd, Markham | 片皮鸭、刺身，中式自助餐 | tripadvisor |
| Ding Tai Fung (Markham) | Markham（连锁） | 小笼包、点心 | tripadvisor |
| Congee Queen | Hwy7 & Leslie / Hwy7 & McCowan，Markham（连锁） | 粥品、豉椒炒蚬、姜葱龙虾 | tripadvisor + diaryofatorontogirl.com |
| Casa Victoria | Markham | 点心（工作日 8 折） | tripadvisor |
| Graceful Vegetarian Restaurant | Markham | 素食中餐 | tripadvisor |
| Ritzy Palace Chinese Cuisine | Markham | 镬气点心、蒜蓉 Maggi 酱煎炒 | tripadvisor |
| QJD Peking Duck Restaurant | Markham | 北京烤鸭 | tripadvisor |
| Wonton Hut | Markham | 大只云吞 | tripadvisor |
| Asian Legend | Markham | 炒杂菜配蛋 | tripadvisor |
| M & Y Restaurant | Unionville（"hidden gem"） | 瓦煲焖鸡、四季豆肉末、五花肉 | tripadvisor |
| Win's Seafood Restaurant | Unionville | 海鲜 | tripadvisor |
| Skyview Fusion Cuisine | Markham | 海鲜 fusion | tripadvisor |
| Legend Chinese | Markham | 例汤、甜品、叉烧拼盘点心 | tripadvisor |
| A la Kitchen | Unionville | 上海面食（高性价比） | tripadvisor |
| Very Good Congee And Noodles | King Square, Markham | 粥、面 | tripadvisor |
| Top Choice Restaurant | Markham | 海鲜 | tripadvisor |
| 369 Shanghai Dim Sum | Markham | 上海点心 | tripadvisor |
| Shanghai Shikumen Fine Cuisine | Markham | 正宗上海菜 | tripadvisor |
| Xin Jiang Restaurant | 3636 Steeles Ave E Unit 106, Markham | 新疆烤串、川菜、全餐 halal | tripadvisor + diaryofatorontogirl.com |
| The Noodle Bar | 3603 Hwy 7 #106, Markham | 自选粤式汤面（叉烧/猪手/咖喱鱼蛋） | tripadvisor + diaryofatorontogirl.com |
| Good Catch Bar & Café | 179 Enterprise Blvd #109, Unionville | 沙嗲牛肉菠萝油、茄汁猪扒芝士焗意粉 | diaryofatorontogirl.com |
| New City Restaurant | 8392 Kennedy Rd, Unionville | 老牌港式茶餐厅（焗饭/意粉/汤面，送例汤例饮） | diaryofatorontogirl.com |
| Good Taste Casserole Rice | 8392 Kennedy Rd a9, Unionville | 四宝煲仔饭（腊味/腊鸭/叉烧鳗） | diaryofatorontogirl.com |
| Big Beef Bowl | 8362 Kennedy Rd, Unionville | 兰州拉面、红烧牛腩面、自制辣椒油 | diaryofatorontogirl.com |
| Yin Ji Chang Fen | Markville Mall 对面 / Warden & Steeles，Markham（连锁） | 肠粉（油条/鲜虾韭菜猪肉） | diaryofatorontogirl.com |
| New Century Restaurant | 398 Ferrier St, Markham | 潮州点心、烧卖、蒸凤爪 | diaryofatorontogirl.com |
| Chat Bar | 187 Main St, Unionville | 烤串（孜然羊肉）、炭烤带子 | diaryofatorontogirl.com |
| Bingz Crispy Burger | Markham（连锁） | 中式脆皮肉夹馍 | restaurantji.com |

### 日料 / 其他亚洲菜

| 店名 | 地址线索 | 招牌菜 | 来源 |
| --- | --- | --- | --- |
| Gyubee Japanese Grill (Markham) | Markham | 日式烤肉自助 | restaurantji.com |
| Anji Izakaya | Markham | 鸡南蛮、叉烧丼 | restaurantji.com |
| Wagyu Suki 喜和牛 | Markham | 和牛寿喜烧/涮涮锅 | restaurantji.com |
| Mabu Generation | Yonge St, Markham | 台式料理 | restaurantji.com |

### 其他菜系

| 店名 | 地址线索 | 招牌菜 | 来源 |
| --- | --- | --- | --- |
| Chiang Rai Thai Kitchen and Bar | Markham | 泰式料理 | restaurantji.com |
| sukhoTHAI | Markham (near Scarborough border) | 泰式料理 | restaurantji.com |
| Santorini Estiatorio | Markham | 希腊菜 | restaurantji.com |
| Desi Bar & Grill (Markham) | Markham | 印度菜 + 现场音乐 | restaurantji.com |

### 甜品 / 烘焙

| 店名 | 地址线索 | 招牌 | 来源 |
| --- | --- | --- | --- |
| Demetres Desserts Downtown Markham | Downtown Markham | 甜品 | restaurantji.com |
| Patisserie Fleur | Markham | 法式烘焙 | restaurantji.com |
| Bon Cake | Markham | 蛋糕 | restaurantji.com |
| Roll Me Up Ice Cream & Desserts Markham | Markham | 炒酸奶/冰淇淋卷 | restaurantji.com |

### 奶茶

| 店名 | 地址线索 | 招牌饮品 | 来源 |
| --- | --- | --- | --- |
| Chatime | Downtown Markham / Markville Mall 等 5 店 | 招牌奶茶、泰式奶茶 | diaryofatorontogirl.com |
| The Alley | Markham（2 店） | 黑糖珍珠鹿角巷 | diaryofatorontogirl.com |
| Machi Machi | 3985 Hwy 7 E Suite 105, Markham | 草莓奶霜拿铁 | diaryofatorontogirl.com |
| Comebuy | 8110 Birchmount Rd #4, Markham | 海王绿茶、经典珍珠奶茶、芋头冰沙 | diaryofatorontogirl.com |
| Gong Cha | 8380 Kennedy Rd Unit C7, Unionville (New Kennedy Square) | 贡茶系列 | diaryofatorontogirl.com |
| Yang Teashop | 8570 Woodbine Ave D3, Markham | 芝士黑糖波霸拿铁 | diaryofatorontogirl.com |
| M Chá Bar | 3621 Highway 7 Unit 122, Markham | 芒果柚子芋圆、黄豆奶茶 | diaryofatorontogirl.com |
| Palgong Tea | 3636 Steeles Ave E #125, Markham (Metro Square) | 黑糖奶茶、枫糖奶茶 | diaryofatorontogirl.com |
| Mr. Sun Tea | 4300 Steeles Ave E D60, Markham (Pacific Mall) | "The Hulk"（宇治抹茶+奶盖） | diaryofatorontogirl.com |
| CoCo Fresh Tea & Juice | 多店，含 Hwy7 & Warden / New Kennedy Square, Markham | 红豆抹茶奶茶、芋头奶茶 | diaryofatorontogirl.com |

## 下一步

1. 从上表挑店 → 在 supper-valet EXPLORE 页「输入店名」逐个走 Places 查询（配套 CSV
   `markham-food-candidates-2026-10.csv` 的 `places_query` 列就是查询词）。
2. 低置信度/连锁店（"Various locations"）记得在预览卡里核对地址是不是你要的那家分店
   —— design/0005 §6 实测过 Places Text Search 模糊匹配不会返回空，选错店不会报错。
3. 想补小红书的一手内容：直接贴笔记原文给我，我按同样字段抽取，走"粘贴笔记"入口。
