/**
 * 界面文案字典 —— 真理源（design/0007 §4）。
 *
 * 扁平 key（`区块.细分.名字`），值支持 `{name}` 占位符（`index.ts` 的
 * `t()` 负责替换）。**这里只放界面 chrome**：按钮、标题、提示、空状态、
 * 确认弹窗、报错、aria-label。
 *
 * 不放这里的东西（design/0007 §1 的「数据不是界面」）：
 *   - 餐厅名 / 地址 / 菜品名（`src/data/seed-restaurants.ts`、Places 抓回来的事实）
 *   - 菜系 code 的中文名（`src/lib/engine/cuisine.ts` 的 `CATEGORY_LABELS`，
 *     该文件不可改；英文映射见 `./categories.ts`）
 *   - LLM 生成的分类 `reason`（`Restaurant.reason`）
 *   - 套餐的 `nameZh/nameEn/descZh/descEn`、锚点的 `labelZh/labelEn`
 *     （`src/data/packages.ts`、`src/lib/catalog/location.ts` 已经自带双语字段）
 *
 * `MessageKey = keyof typeof zh`；`messages.en.ts` 必须实现全部 key，
 * 漏一个 TS 就编译不过 —— 这是唯一防止字典漂移的机制。
 */
export const zh = {
  // ── 通用 ──────────────────────────────────────────────────────────
  'common.loading': '加载中…',
  'common.back': '返回',
  'common.parenCount': '（{count}）',

  // ── 底部导航 ──────────────────────────────────────────────────────
  'nav.roll': '摇',
  'nav.pool': '池',
  'nav.history': '记录',
  'nav.explore': '探索',

  // ── 顶部标题 ──────────────────────────────────────────────────────
  'topbar.title.home': '今天吃什么',
  'topbar.title.pool': '店铺池',
  'topbar.title.history': '决策记录',
  'topbar.title.explore': '探索',
  'topbar.title.packages': '套餐',
  'topbar.title.settings': '位置与半径',

  // ── 时钟 / 时段 ───────────────────────────────────────────────────
  'clock.slot.dawn': '凌晨',
  'clock.slot.morning': '早',
  'clock.slot.noon': '午',
  'clock.slot.afternoon': '下午',
  'clock.slot.evening': '晚',
  'clock.slot.night': '夜',

  // ── 跳过原因（摇一摇的换一个 sheet + 历史记录复用同一份 code）──────
  'skip.too_far': '太远了',
  'skip.too_pricey': '太贵了',
  'skip.just_ate': '刚吃过',
  'skip.wrong_cuisine': '不想吃这个菜系',
  'skip.closed': '关门了',
  'skip.no_mood': '就是不想吃',
  'skip.other': '不说',

  // ── 首页 / 摇一摇 ─────────────────────────────────────────────────
  'home.reasonSheet.title': '哪儿不对？',
  'home.reasonSheet.desc': '一次多余的点击，换六个干净的特征。不说也行，直接换。',
  'home.reasonSheet.skipOther': '不说，直接换一个',
  'home.feedback.eyebrow': '今天吃什么 · 补问',
  'home.feedback.question': '上次的 {name} 怎么样？',
  'home.feedback.good': '👍 好吃',
  'home.feedback.ok': '😐 一般',
  'home.feedback.bad': '👎 不好吃',
  'home.feedback.noShow': '没去成',
  'home.locked.eyebrow': '今天就是它了 · Locked',
  'home.locked.decisionSummary': '决策用了 {seconds} 秒，摇了 {rolls} 次。晚 8 点我会来问你好不好吃。',
  'home.locked.openMaps': '在 Google Maps 打开',
  'home.locked.reroll': '重新摇（今晚变卦了）',
  'home.empty.title': '今晚没有开门的候选',
  'home.idle.rollLabel': '摇一摇',
  'home.idle.poolHint': '池子里 {count} 家，按概率抽样，不取最大值 —— 所以每天不一样。',
  'home.rolling.label': '翻牌…',
  'home.downgrade.title': '行，你自己挑',
  'home.downgrade.desc': '摇三次都不满意，说明今天我不懂你。三个候选，直接选。',
  'home.downgrade.giveUp': '今天不吃了，算了',
  'home.result.rollIndex': '第 {n} 摇',
  'home.result.accept': '就它了',
  'home.result.reroll': '换一个',
  'home.reason.neverTried': '还没试过这家',
  'home.reason.weekAgo': '1 周没吃了',
  'home.reason.weeksAgo': '{weeks} 周没吃了',
  'home.reason.dayAgo': '1 天没吃了',
  'home.reason.daysAgo': '{days} 天没吃了',
  'home.reason.googleRating': 'Google {rating}★',
  'home.reason.nearby': '就在附近',

  // ── 店铺池 ────────────────────────────────────────────────────────
  'pool.stat.total': '家在池子里',
  'pool.stat.eligibleToday': '今晚可选',
  'pool.stat.cuisineCount': '种菜系',
  'pool.distanceBasedOn': '距离基于：{anchor}',
  'pool.changeAnchor': '换一个',
  'pool.anchor.gpsCurrent': '你的当前位置',
  'pool.anchor.defaultFallback': '默认锚点',
  'pool.filteredOutHint': '有 {count} 家超出当前半径，',
  'pool.goWiden': '去放宽',
  'pool.addRestaurant': '＋ 添加餐厅',
  'pool.packages': '套餐',
  'pool.emptyPool.title': '池子空空如也',
  'pool.emptyPool.desc': '先去套餐里一键加几家，或者自己搜一家喜欢的店。',
  'pool.emptyPool.viewPackages': '看套餐',
  'pool.emptyPool.explore': '去探索',
  'pool.emptyRadius.title': '当前半径内没有店',
  'pool.emptyRadius.desc': '池子里其实有 {count} 家，只是都超出了你设的半径。',
  'pool.emptyRadius.widen': '去设置放宽半径',
  'pool.item.neverEaten': '没吃过',
  'pool.item.dayAgo': '1 天前',
  'pool.item.daysAgo': '{days} 天前',
  'pool.item.paused': '已暂停 · 不参与摇一摇',
  'pool.item.resume': '恢复',
  'pool.item.pause': '暂停',
  'pool.item.remove': '移除',
  'pool.footerNote': '进度条 = 新鲜度 1−e^(−d/τ)，满格代表该吃了。暂停不参与摇一摇但记录保留；移除需要确认，历史和口味数据都会留着。',
  'pool.removeConfirm.title': '从池子移除「{name}」？',
  'pool.removeConfirm.desc': '移除后它不再参与摇一摇，但历史记录和口味数据会保留 —— 之后加回来，之前学到的偏好还在。',
  'pool.removeConfirm.cancel': '再想想',
  'pool.removeConfirm.confirm': '确认移除',

  // ── 套餐 ──────────────────────────────────────────────────────────
  'packages.intro': '我们挑好的套餐，一键加进池子；之后还能在池子页单独摘掉不合口味的那几家。',
  'packages.empty': '暂时没有套餐可用。',
  'packages.stats': '共 {total} 家 · 你已有 {already} 家',
  'packages.apply': '加入池子',
  'packages.applied': '已全部在池子里',
  'packages.appliedBanner': '✓ 已加入池子',
  'packages.goRoll': '去摇一摇',

  // ── 决策记录 ──────────────────────────────────────────────────────
  'history.stat.total': '共 {count} 次决策',
  'history.stat.acceptRate': '接受率 {rate}%',
  'history.empty': '还没摇过，去「摇」页面开始吧。',
  'history.export': '导出全部数据 JSON',
  'history.skipLine': '跳过 {name} · {reason} · {date}',
  'history.mealDinner': '晚餐',
  'history.mealLunch': '午餐',
  'history.rollIndex': '第 {n} 摇',
  'history.rating.good': '好吃',
  'history.rating.ok': '一般',
  'history.rating.bad': '不好吃',
  'history.rating.noShow': '没去成',
  'history.rating.pending': '待反馈',
  'history.weekday.sun': '日',
  'history.weekday.mon': '一',
  'history.weekday.tue': '二',
  'history.weekday.wed': '三',
  'history.weekday.thu': '四',
  'history.weekday.fri': '五',
  'history.weekday.sat': '六',

  // ── 设置 ──────────────────────────────────────────────────────────
  'settings.location.title': '位置',
  'settings.location.gpsLocating': '定位中…',
  'settings.location.gpsActive': '✓ 用我当前位置',
  'settings.location.gpsUse': '用我当前位置',
  'settings.location.gpsErrorSuffix': '，继续使用你选择的锚点',
  'settings.gps.fail.unsupported': '这台设备不支持定位',
  'settings.gps.fail.denied': '定位权限被拒绝',
  'settings.gps.fail.unavailable': '定位暂时不可用',
  'settings.gps.fail.timeout': '定位超时',
  'settings.radius.title': '半径',
  'settings.radius.walk': '步行可达',
  'settings.radius.near': '顺路',
  'settings.radius.mid': '专程',
  'settings.radius.all': '不限',
  'settings.radius.poolCount': '当前池子 {count} 家可选。',
  'settings.language.title': '语言',
  'settings.language.zh': '简体中文',
  'settings.language.en': 'English',

  // ── 探索：入口表单 ────────────────────────────────────────────────
  'explore.tab.search': '找店名',
  'explore.tab.note': '粘贴笔记',
  'explore.search.label': '店名或关键词',
  'explore.search.placeholder': '海底捞 Markham',
  'explore.search.submit': '搜索',
  'explore.search.pending': '搜索中…',
  'explore.note.label': '粘贴笔记正文',
  'explore.note.placeholder': '粘贴小红书 / 大众点评的正文，越具体越好…',
  'explore.note.hint': '我们不抓取任何平台，只处理你主动粘贴的文字',
  'explore.note.overLimit': '超过 {max} 字了，剪短一点再试',
  'explore.note.submit': '抽取店名',
  'explore.note.pending': '抽取中…',

  // ── 探索：候选列表 ────────────────────────────────────────────────
  'explore.candidates.notFound': '没找到，换个说法再试试',
  'explore.candidates.researchAgain': '重新搜索',
  'explore.candidates.backSearch': '换个词重新搜',

  // ── 探索：笔记抽取结果 ────────────────────────────────────────────
  'explore.noteResult.empty': '没抽出可定位的店名，笔记里写具体点，或者直接用「找店名」搜',
  'explore.noteResult.pickHint': '从笔记里认出这些店，点一个去搜',
  'explore.noteResult.dishHint': '顺带抽到的菜品提及',
  'explore.noteResult.newNote': '换一篇笔记',

  // ── 探索：预览卡 ──────────────────────────────────────────────────
  'explore.preview.lowConfidence': '分类不确定',
  'explore.preview.businessHoursLine': '营业时间：{windows}',
  'explore.preview.dishesLine': '提到的菜：{dishes}',
  'explore.preview.lowConfidenceAsk': '这家的菜系我不太确定，确认一下？',
  'explore.preview.alreadyInPool': '已经在你的池子里了',
  'explore.preview.goToPool': '去池子看看',
  'explore.preview.confirmLowConfidence': '分类没问题，加入池子',
  'explore.preview.confirm': '加入池子',
  'explore.preview.confirming': '加入中…',

  // ── 探索：页面壳（demo 提示 / 换一家 / 成功页）───────────────────
  'explore.demoBanner': '演示数据 —— 还没配置 API key，这些不是真实结果',
  'explore.changeCandidate': '换一家看看',
  'explore.success.title': '加入池子成功',
  'explore.success.desc': '{name} 现在是你的一员了。',
  'explore.success.again': '再找一家',
  'explore.success.goRoll': '去摇一摇',
  'explore.error.generic': '出错了，稍后再试',
  'explore.error.network': '网络好像断了，检查一下连接再试试',
  'explore.error.badResponse': '服务器返回的内容没看懂，稍后再试',

  // ── 探索：营业时间格式化（次日 / 全天 / 周几）─────────────────────
  'explore.hours.nextDayPrefix': '次日 ',
  'explore.hours.open24': '全年 24 小时营业',
  'explore.hours.closedSuffix': '；{days}休息',
  'explore.weekday.sun': '周日',
  'explore.weekday.mon': '周一',
  'explore.weekday.tue': '周二',
  'explore.weekday.wed': '周三',
  'explore.weekday.thu': '周四',
  'explore.weekday.fri': '周五',
  'explore.weekday.sat': '周六',

  // ── 服务端错误码 → 兜底文案（design/0007 §3）──────────────────────
  // key = `apiError.` + 服务端返回的 code；查不到才退回服务端自带的中文 message。
  'apiError.places.not_found': '这家店在 Google 地图上还查不到 —— 可能是刚开的新店，还没被收录。过阵子再试试吧。',
  'apiError.places.upstream': '地图服务暂时用不了，稍后再试',
  'apiError.llm.unavailable': 'AI 分析暂时用不了，稍后再试',
  'apiError.validation.required': '请填写完整信息',
  'apiError.validation.too_long': '内容太长了，缩短一些再试',
  'apiError.validation.invalid': '请求格式不对',

  // ── 账号（云端登录）───────────────────────────────────────────────
  'account.badge.title': '{email} · 账号',
  'account.badge.noEmail': '已登录',
  'account.badge.srLabel': '账号（{email}）',
  'account.sheet.title': '账号',
  'account.sheet.desc': '数据存在云端，只有这个账号看得到。',
  'account.sheet.emailLabel': '邮箱',
  'account.sheet.personaLabel': '口味起点',
  'account.sheet.signOut': '退出登录（回到本机游客模式）',
  'account.sheet.signingOut': '退出中…',
  'account.persona.scratch': '从零开始',

  // ── Profile 门禁 ──────────────────────────────────────────────────
  'profile.pickTitle': '今晚谁在吃？',
  'profile.manage': '管理',
  'profile.manageDone': '完成',
  'profile.create': '新建',
  'profile.delete': '删除',
  'profile.deleteConfirm': '删除「{name}」？这个 Profile 的摇号与反馈会一起删掉。',
  'profile.form.nameLabel': '名字',
  'profile.form.namePlaceholder': '比如：老张',
  'profile.form.avatarLabel': '头像',
  'profile.form.personaLabel': '口味模板（可选）',
  'profile.form.personaNone': '不预设，从零开始学',
  'profile.form.submit': '创建',
  'profile.form.cancel': '取消',
  'profile.isolationNote': '每个 Profile 的口味、记录、反馈完全隔离，互不影响。',
  'profile.loginEntry': '有账号？用邮箱登录 →',
  'profile.loginNote': '登录后数据存云端、换设备也跟着走；本机这些 Profile 会原样留着。',
  'profile.badge.title': '{name} · 切换 Profile',
  'profile.badge.srLabel': '切换 Profile（当前 {name}）',

  // ── 邮箱登录 ──────────────────────────────────────────────────────
  'auth.title': '用账号登录',
  'auth.desc': '登录后口味、摇号与反馈存在云端，换设备也跟着走；不登录就还用这台机器上的本地 Profile。',
  'auth.tab.signin': '登录',
  'auth.tab.signup': '注册',
  'auth.email.label': '邮箱',
  'auth.password.label': '密码',
  'auth.password.placeholder': '至少 6 位',
  'auth.submit.processing': '处理中…',
  'auth.submit.signin': '登录',
  'auth.submit.signup': '注册并登录',
  'auth.cancel': '先不登录，用游客模式',
  'auth.notice.needConfirm': '账号建好了，但还需要邮箱确认。找 Hao 在后台点一下确认。',
  'auth.error.noSupabase': '这个环境没有配置 Supabase，只能用游客模式。',
  'auth.error.missingFields': '邮箱和密码都要填。',
  'auth.error.invalidCreds': '邮箱或密码不对，再试一次。',
  'auth.error.alreadyRegistered': '这个邮箱已经注册过了，直接登录就行。',
  'auth.error.passwordTooShort': '密码至少 6 位。',
  'auth.error.badEmail': '邮箱格式不对。',
  'auth.error.rateLimited': '操作太频繁了，等一会儿再试。',
  'auth.error.signupDisabled': '当前不开放注册，用 Hao 给你的账号登录。',

  // ── 云端数据出错 ──────────────────────────────────────────────────
  'authgate.error.title': '云端数据没读出来',
  'authgate.error.retry': '再试一次',
  'authgate.error.signOut': '退出登录',

  // ── 首次登录选口味起点 ────────────────────────────────────────────
  'persona.title': '你大概是哪一挂的？',
  'persona.firstLogin.withEmail': '{email} · 第一次登录',
  'persona.firstLogin.noEmail': '第一次登录',
  'persona.desc': '{prefix}。选一个起点，第一摇就有口味；之后每次反馈都会把它改写成你自己的样子。',
  'persona.preparing': '准备中…',
  'persona.scratchButton': '从零开始',
  'persona.footerNote': '模板只是先验，不是标签 —— 摇出来不喜欢就点「换一个」，它学得很快。',
} as const;

export type MessageKey = keyof typeof zh;
