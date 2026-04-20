// ============================================================
// アイドルカードバトル デモ - 完全バトルエンジン + UI
// ============================================================

// --- CONSTANTS ---
const ROCK = 'rock', SCISSORS = 'scissors', PAPER = 'paper';
const GESTURES = [ROCK, SCISSORS, PAPER];
const G_NAME = { rock: 'グー', scissors: 'チョキ', paper: 'パー' };
const G_ICON = { rock: '✊', scissors: '✌️', paper: '🖐️' };
const G_COLOR = { rock: '#e67e22', scissors: '#e74c3c', paper: '#3498db' };
const COUNTER = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

// --- ジャンケン効果タイプ (per-gesture outcome modifiers) ---
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const GESTURE_MOD_TYPES = {
  neutral: [
    { id: 'retaliate', label: 'BOSS反撃', range: '1〜3ダメ', getVal: () => rnd(1,3), desc: v => v + 'ダメージ' },
    { id: 'bossHeal',  label: 'BOSS回復', range: '1〜2HP', getVal: () => rnd(1,2), desc: v => '+' + v + 'HP' },
  ],
  system: [
    { id: 'bossPassion', label: 'BOSSテンション獲得', range: '1〜3', getVal: () => rnd(1,3), desc: v => '+' + v + 'テンション' },
    { id: 'playerWeak',  label: '弱点付与',             range: '1〜2', getVal: () => rnd(1,2), desc: v => '+' + v + '弱点' },
    { id: 'lockGesture', label: '手を封印',             range: '×1',  getVal: () => 1,        desc: () => '封印×1' },
  ]
};
const SELF_DMG = 4;
const MAX_CARDS = 3;
const HAND_SIZE = 5;
const MAX_ROUNDS = 15;
const MAX_LOCKS = 2;

const SYS_NAME = {
  commercial: 'ビジネス', empathy: 'エモーション', logic: 'ロジック', neutral: 'ニュートラル'
};
const SYS_COLOR = {
  commercial: '#d4a843', empathy: '#e85d75', logic: '#4db8ff', neutral: '#a0a8b8'
};

// --- CARD LIBRARY ---
// Each card: { id, name, system, gestures:[g1,g2], desc, counterDesc, special? }
// Effects are resolved in applyCardEffect()

const CARD_LIB = {
  // === NEUTRAL ===
  n_qicheng:   { name:'旅立ち', system:'neutral', gestures:[ROCK,SCISSORS],
    desc:'6ダメージを与える', cDesc:'4ダメージを与える', fx:{dmg:6}, cfx:{dmg:4} },
  n_ganji_heal:{ name:'気合・癒', system:'neutral', gestures:[PAPER,ROCK],
    desc:'HPを7回復する', cDesc:'HPを3回復する', fx:{heal:7}, cfx:{heal:3} },
  n_youyu:     { name:'迷い', system:'neutral', gestures:[SCISSORS,PAPER],
    desc:'3ダメージ、このターン受けるダメージ-50%', cDesc:'4ダメージを与える', fx:{dmg:3,reduce:0.5}, cfx:{dmg:4} },
  n_wuchang:   { name:'無常', system:'neutral', gestures:[ROCK,PAPER],
    desc:'3ダメージ、ランダムに1手を封印する', cDesc:'5ダメージを与える', fx:{dmg:3,lock:1}, cfx:{dmg:5} },
  n_ganji_pas: { name:'気合・熱', system:'neutral', gestures:[SCISSORS,ROCK],
    desc:'2ダメージ、テンション+2', cDesc:'6ダメージを与える', fx:{dmg:2,passion:2}, cfx:{dmg:6} },
  n_shouze:    { name:'ルール', system:'neutral', gestures:[PAPER,SCISSORS],
    desc:'2ダメージ、弱点+2', cDesc:'6ダメージを与える', fx:{dmg:2,weakness:2}, cfx:{dmg:6} },
  n_genghuan:  { name:'チェンジ', system:'neutral', gestures:[ROCK,PAPER],
    desc:'4ダメージ、カードを1枚入れ替える', cDesc:'4ダメージを与える', fx:{dmg:4,swap:1}, cfx:{dmg:4} },
  n_xushi:     { name:'溜め', system:'neutral', gestures:[SCISSORS,ROCK],
    desc:'自分に2ダメージ、テンション+5', cDesc:'3ダメージを与える', fx:{selfDmg:2,passion:5}, cfx:{dmg:3} },

  // === COMMERCIAL ===
  c_daji:      { name:'プレッシャー', system:'commercial', gestures:[ROCK,SCISSORS],
    desc:'4ダメージ+手を1つ封印する', cDesc:'4ダメージ+手を1つ封印する', fx:{dmg:4,lock:1}, cfx:{dmg:4} },
  c_huanhe:    { name:'緩和', system:'commercial', gestures:[PAPER,ROCK],
    desc:'HPを6回復+手を1つ封印する', cDesc:'HPを4回復+手を1つ封印する', fx:{heal:6,lock:1}, cfx:{heal:4} },
  c_duichong: {
    name:'対応', system:'commercial', gestures:[SCISSORS,PAPER],
    desc:'3ダメージ、このターン受けるダメージ半減',
    cDesc:'手を1つ封印する',
    fx:{dmg:3,reduce:0.5},
    cfx:{lock:1}
  },
  c_zhuanli: {
    name:'ポジション取り', system:'commercial', gestures:[ROCK,PAPER],
    desc:'3ダメージ+手を1つ封印する',
    cDesc:'さらに手を1つ封印する',
    fx:{dmg:3,lock:1},
    cfx:{lock:1}
  },
  c_tuixiao:   { name:'乗じる', system:'commercial', gestures:[SCISSORS,ROCK],
    desc:'4ダメージ、封印1つにつき+2', cDesc:'効果を2回発動', fx:{dmg:4,special:'tuixiao'}, cfx:{special:'tuixiao_re'} },
  c_qingsuan:  { name:'エンドゲーム', system:'commercial', gestures:[PAPER,SCISSORS],
    desc:'全ての封印を解除し、封印1つにつき6ダメージ', cDesc:'HPを8回復する', fx:{special:'qingsuan'}, cfx:{special:'qingsuan_c'} },
  c_zhihuan: {
    name:'再編成', system:'commercial', gestures:[ROCK,PAPER],
    desc:'6ダメージ、カードを1枚入れ替える',
    cDesc:'さらにカードを1枚入れ替える',
    fx:{dmg:6,swap:1},
    cfx:{swap:1}
  },
  c_daijia: {
    name:'ベット', system:'commercial', gestures:[SCISSORS,ROCK],
    desc:'自分に2ダメージ+手を2つ封印する',
    cDesc:'封印効果が次のターンまで持続',
    fx:{selfDmg:2,lock:2},
    cfx:{special:'persist'}
  },

  // === EMPATHY ===
  e_reqing: {
    name:'共鳴', system:'empathy', gestures:[ROCK,SCISSORS],
    desc:'3ダメージ+テンションを2蓄積',
    cDesc:'4ダメージを与える',
    fx:{dmg:3,passion:2},
    cfx:{dmg:4}
  },
  e_fusu: {
    name:'ヒール', system:'empathy', gestures:[PAPER,ROCK],
    desc:'HPを5回復+テンションを2蓄積',
    cDesc:'HPを2回復',
    fx:{heal:5,passion:2},
    cfx:{heal:2}
  },
  e_kunjing: {
    name:'どん底', system:'empathy', gestures:[SCISSORS,PAPER],
    desc:'2ダメージ、このターン受けるダメージ半減',
    cDesc:'テンションを4蓄積',
    fx:{dmg:2,reduce:0.5},
    cfx:{passion:4}
  },
  e_yayi: {
    name:'積もり', system:'empathy', gestures:[ROCK,PAPER],
    desc:'自分に3ダメージ+テンションを4蓄積',
    cDesc:'4ダメージを与える',
    fx:{selfDmg:3,passion:4},
    cfx:{dmg:4}
  },
  e_tupo: {
    name:'爆発', system:'empathy', gestures:[SCISSORS,ROCK],
    desc:'5ダメージ; テンションが3以上なら3消費して追加8ダメージ',
    cDesc:'テンション+1',
    fx:{dmg:5,special:'tupo'},
    cfx:{passion:1}
  },
  e_linian:    { name:'注ぎ込む', system:'empathy', gestures:[PAPER,SCISSORS],
    desc:'6ダメージ+全テンション×3ダメージ、テンションを全て消費', cDesc:'与えたダメージの50%だけHP回復', fx:{dmg:6,special:'linian'}, cfx:{special:'linian_c'} },
  e_zhuanhuan: {
    name:'チャンス', system:'empathy', gestures:[ROCK,PAPER],
    desc:'4ダメージ、カードを1枚入れ替える',
    cDesc:'さらにカードを1枚入れ替える',
    fx:{dmg:4,swap:1},
    cfx:{swap:1}
  },
  e_guozai: {
    name:'オーバードロー', system:'empathy', gestures:[SCISSORS,ROCK],
    desc:'自分に2ダメージ+次のターンにテンションを8蓄積',
    cDesc:'HPを4回復',
    fx:{selfDmg:2,special:'guozai'},
    cfx:{heal:4}
  },

  // === LOGIC ===
  l_guancha:   { name:'洞察', system:'logic', gestures:[ROCK,SCISSORS],
    desc:'2ダメージ+BOSSに弱点を2蓄積', cDesc:'3ダメージを与える', fx:{dmg:2,weakness:2}, cfx:{dmg:3} },
  l_jiesuan:   { name:'精算', system:'logic', gestures:[PAPER,ROCK],
    desc:'HPを4回復+BOSSに弱点を2蓄積', cDesc:'HPを2回復', fx:{heal:4,weakness:2}, cfx:{heal:2} },
  l_baogao: {
    name:'分析', system:'logic', gestures:[SCISSORS,PAPER],
    desc:'3ダメージ、このターン受けるダメージ半減',
    cDesc:'BOSSに弱点を2蓄積',
    fx:{dmg:3,reduce:0.5},
    cfx:{weakness:2}
  },
  l_shencha: {
    name:'スタック', system:'logic', gestures:[ROCK,PAPER],
    desc:'BOSSに弱点を3蓄積',
    cDesc:'さらに弱点を3層付与',
    fx:{weakness:3},
    cfx:{weakness:3}
  },
  l_tuidiao:   { name:'推論', system:'logic', gestures:[SCISSORS,ROCK],
    desc:'3ダメージ+現在の弱点層分のダメージ', cDesc:'効果を2回発動', fx:{dmg:3,special:'tuidiao'}, cfx:{special:'tuidiao_c'} },
  l_hegui:     { name:'リセット', system:'logic', gestures:[PAPER,SCISSORS],
    desc:'全ての弱点を消費し、層数×2ダメージ', cDesc:'次のターン弱点が減衰しない', fx:{special:'hegui'}, cfx:{special:'hegui_c'} },
  l_zhihuan: {
    name:'リコンフィグ', system:'logic', gestures:[ROCK,PAPER],
    desc:'5ダメージ、カードを1枚入れ替える',
    cDesc:'さらにカードを1枚入れ替える',
    fx:{dmg:5,swap:1},
    cfx:{swap:1}
  },
  l_fushen: {
    name:'チャージ', system:'logic', gestures:[SCISSORS,ROCK],
    desc:'自分に4ダメージ+次のターンBOSSに弱点を3蓄積',
    cDesc:'HPを4回復',
    fx:{selfDmg:4,special:'fushen'},
    cfx:{heal:4}
  }
};

// --- DECK CONFIGS (12 cards, each with ONE fixed gesture assigned at deck-build time) ---
// デッキ構築時に各カードに手を1つ固定で割り当て、バトル中は変更不可
const DECKS = {
  commercial: [
    {id:'c_daji',g:ROCK}, {id:'c_daji',g:SCISSORS},
    {id:'c_huanhe',g:PAPER}, {id:'c_duichong',g:SCISSORS},
    {id:'c_duichong',g:PAPER}, {id:'c_zhuanli',g:ROCK},
    {id:'c_zhuanli',g:PAPER}, {id:'c_tuixiao',g:SCISSORS},
    {id:'c_tuixiao',g:ROCK}, {id:'c_qingsuan',g:PAPER},
    {id:'c_zhihuan',g:ROCK}, {id:'c_daijia',g:SCISSORS},
  ],
  empathy: [
    {id:'e_reqing',g:ROCK}, {id:'e_reqing',g:SCISSORS},
    {id:'e_fusu',g:PAPER}, {id:'e_fusu',g:ROCK},
    {id:'e_kunjing',g:PAPER}, {id:'e_yayi',g:ROCK},
    {id:'e_yayi',g:PAPER}, {id:'e_tupo',g:SCISSORS},
    {id:'e_tupo',g:ROCK}, {id:'e_linian',g:SCISSORS},
    {id:'e_zhuanhuan',g:PAPER}, {id:'e_guozai',g:SCISSORS},
  ],
  logic: [
    {id:'l_guancha',g:ROCK}, {id:'l_guancha',g:SCISSORS},
    {id:'l_jiesuan',g:PAPER}, {id:'l_baogao',g:SCISSORS},
    {id:'l_shencha',g:ROCK}, {id:'l_shencha',g:PAPER},
    {id:'l_tuidiao',g:SCISSORS}, {id:'l_tuidiao',g:ROCK},
    {id:'l_hegui',g:PAPER}, {id:'l_zhihuan',g:PAPER},
    {id:'l_fushen',g:SCISSORS}, {id:'l_fushen',g:ROCK},
  ],
};

const BOSSES = {
  commercial: {
    name: 'ビジネス監査官',
    hp: 80,
    mods: ['ランダム封印','封印ダメージ強化','ターン終了時HP3回復'],
    desc: '毎ターンランダムであなたの手を1つ封印｜封印1つにつき+2ダメージ｜ターン終了時にHPを3回復'
  },
  empathy: {
    name: '共感を喰らう者',
    hp: 80,
    mods: ['勝利でテンション3','引き分けでテンション2','不利でテンション2','ターン終了時2ダメージ'],
    desc: 'ジャンケン勝利でBOSSテンション+3｜引き分けで+2｜不利で+2｜ターン終了時あなたに2ダメージ'
  },
  logic: {
    name: 'ロジック裁定者',
    hp: 80,
    mods: ['勝利で弱点4','ターン終了時弱点1','2以下ダメージ無効'],
    desc: 'ジャンケン勝利時あなたに弱点+4｜ターン終了時弱点+1｜2以下のダメージを無効化'
  },
};

// ============================================================
// BATTLE ENGINE
// ============================================================
class BattleEngine {
  constructor(systemKey, modCount, enableProtection, bossHp, opts) {
    this.systemKey = systemKey;
    opts = opts || {};
    this.bossModsEnabled = opts.bossModsEnabled !== false;
    this.gestureModsEnabled = !!opts.gestureModsEnabled;
    this.gestureModTier = opts.gestureModTier || 'basic';
    // Modifier pool from design document, with system-appropriate counter mods
    const ALL_MODS = [
      // 汎用ニュートラル効果
      'ターン終了時2ダメージ',
      'ターン終了時HP3回復',
      'ジャンケン勝利で2ダメージ追加',
      '3枚目に6ダメージ',
      '2以下ダメージ無効',
      // エモーション系
      '勝利でテンション3', '引き分けでテンション2', '不利でテンション2',
      // ロジック系
      '勝利で弱点4', 'ターン終了時弱点1',
      // ビジネス系（ビジネス選択時のみ追加）
      ...(systemKey === 'commercial' ? ['ランダム封印', '封印ダメージ強化', '解除反撃4'] : []),
      // カウンター系（バランス用）
      'ジャンケンでテンション-1',     // 毎回ジャンケン時プレイヤー-1テンション（エモーション対策）
      'ジャンケンで弱点-2',           // 毎回ジャンケン時BOSS弱点-2（ロジック対策）
    ];
    const BOSS_NAMES = [
      'ジャッジ', 'カオス裁決者', '深淵監察官', '無形の裁判者',
      '境界の支配者', '運命操作人', '異変の門番', 'ルールブレイカー',
    ];
    const mc = Math.min(modCount || 3, ALL_MODS.length);
    const shuffledAll = [...ALL_MODS].sort(() => Math.random() - 0.5);
    const selectedMods = shuffledAll.slice(0, mc);
    const bossConf = {
      name: BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)],
      hp: 80,
      mods: selectedMods,
      desc: selectedMods.join(' | ')
    };
    this.modBonus = (modCount >= 4) ? 1 : 0;
    this.enableProtection = !!enableProtection;
    if (bossHp) bossConf.hp = bossHp; // super hard: all mod values +1
    // Build deck (card objects with unique instance ids)
    this.deck = DECKS[systemKey].map((entry, i) => ({
      ...CARD_LIB[entry.id],
      id: entry.id + '_' + i,
      cardId: entry.id,
      gesture: entry.g  // 固定の手、デッキ構築時に指定済み
    }));

    // State
    this.s = {
      playerHp: 100, playerMaxHp: 100,
      bossHp: bossConf.hp, bossMaxHp: bossConf.hp,
      // Resources
      passion: 0,          // player passion (テンション)
      bossPassion: 0,      // boss passion (empathy boss)
      bossWeakness: 0,     // weakness ON boss (player applied)
      playerWeakness: 0,   // weakness ON player (boss applied)
      bossLocks: new Set(),   // gestures locked on boss (player wins auto)
      playerLocks: new Set(), // gestures locked on player (boss wins auto)
      // Round
      round: 0,
      cardsPlayedThisRound: 0,
      damageReduce: 0,     // damage reduction this round (0-1)
      // Flags
      bossPassiveActive: true,
      threshold50Triggered: false,
      bossPassiveRoundsLeft: 0,
      noWeaknessDecay: false,
      // Delayed effects
      nextRoundPassion: 0,
      nextRoundWeakness: 0,
      persistLocks: false,
      // Boss config
      bossMods: bossConf.mods,
      bossName: bossConf.name,
      bossDesc: bossConf.desc,
      // Game over
      gameOver: false,
      winner: null,
    };

    this.hand = [];
    this.log = [];
    this.roundLog = [];
    this.pendingSwaps = 0;
    this.gestureModifiers = null;
    this.fixedModTypes = null; // 2効果: バトル中固定のタイプ
  }

  // --- Draw hand ---
  drawHand() {
    const shuffled = [...this.deck].sort(() => Math.random() - 0.5);
    this.hand = shuffled.slice(0, HAND_SIZE);
    return this.hand;
  }

  // --- Boss gesture (random, revealed) ---
  rollBossGesture() {
    return GESTURES[Math.floor(Math.random() * 3)];
  }

  // --- Start new round ---
  startRound() {
    this.s.round++;
    this.s.cardsPlayedThisRound = 0;
    this.s.damageReduce = 0;
    this.roundLog = [];

    // Apply delayed effects
    if (this.s.nextRoundPassion > 0) {
      this.s.passion += this.s.nextRoundPassion;
      this.addLog(`遅延効果: +${this.s.nextRoundPassion}テンション`);
      this.s.nextRoundPassion = 0;
    }
    if (this.s.nextRoundWeakness > 0) {
      this.s.bossWeakness += this.s.nextRoundWeakness;
      this.addLog(`遅延効果: BOSSに弱点+${this.s.nextRoundWeakness}`);
      this.s.nextRoundWeakness = 0;
    }

    // Check 50HP threshold recovery
    if (!this.s.bossPassiveActive && this.s.threshold50Triggered) {
      if (this.s.bossPassiveRoundsLeft <= 0) {
        this.s.bossPassiveActive = true;
        this.s.bossLocks = new Set();
        this.addLog('BOSSパッシブが復帰');
      }
    }

    // Clear non-persistent locks on player
    if (!this.s.persistLocks) {
      this.s.playerLocks.clear();
    }
    this.s.persistLocks = false;

    // Boss mod: ランダム封印 (lock one of player's gestures at round start)
    if (this.s.bossMods.includes('ランダム封印') && this.s.bossPassiveActive) {
      if (this.s.playerLocks.size < MAX_LOCKS) {
        const unlocked = GESTURES.filter(g => !this.s.playerLocks.has(g));
        if (unlocked.length > 0) {
          const g = unlocked[Math.floor(Math.random() * unlocked.length)];
          this.s.playerLocks.add(g);
          this.addLog(`BOSSランダム封印: ${G_NAME[g]}${G_ICON[g]}`);
        }
      } else {
        this.addLog(`BOSSランダム封印失敗: 既に${MAX_LOCKS}手封印済み`);
      }
    }

    this.drawHand();
    this.currentBossGesture = this.rollBossGesture();
    this.rollGestureModifiers();
    this.addLog(`=== 第${this.s.round}ターン ===`);
    this.addLog(`BOSSの手: ${G_NAME[this.currentBossGesture]}${G_ICON[this.currentBossGesture]}`);
    return this.currentBossGesture;
  }

  // --- ジャンケン効果生成 ---
  rollGestureModifiers() {
    if (!this.gestureModsEnabled) { this.gestureModifiers = null; return; }
    const fullPool = [...GESTURE_MOD_TYPES.neutral, ...GESTURE_MOD_TYPES.system];
    const mk = (t) => ({ ...t, revealed: false, value: null });
    let slotPool;
    if (this.gestureModTier === 'mixed') {
      // ミックス：毎ターン3枠を独立に再抽選
      slotPool = fullPool;
    } else {
      // 2効果：バトル全体を通して2種類固定、毎ターン割り当てだけ変える
      if (!this.fixedModTypes) {
        const shuffled = [...fullPool].sort(() => Math.random() - 0.5);
        this.fixedModTypes = [shuffled[0], shuffled[1]];
      }
      slotPool = this.fixedModTypes;
    }
    const pick = () => mk(slotPool[Math.floor(Math.random() * slotPool.length)]);
    this.gestureModifiers = { win: pick(), draw: pick(), lose: pick() };
  }

  // --- ジャンケン効果適用 ---
  applyGestureMod(mod, result) {
    if (!mod) return;
    const v = mod.getVal(); // roll value NOW (at trigger time)
    mod.value = v;
    mod.revealed = true;
    mod.text = mod.desc(v);
    switch (mod.id) {
      case 'retaliate':
        this.s.playerHp -= v;
        result.events.push('ジャンケン効果: BOSS反撃 ' + v + 'ダメージ');
        break;
      case 'bossHeal':
        this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + v);
        result.events.push('ジャンケン効果: BOSSが' + v + '回復');
        break;
      case 'bossPassion':
        this.s.bossPassion += v;
        result.events.push('ジャンケン効果: BOSSがテンション' + v + '獲得');
        break;
      case 'playerWeak':
        this.s.playerWeakness += v;
        result.events.push('ジャンケン効果: あなたに弱点+' + v);
        break;
      case 'lockGesture': {
        const g = GESTURES[Math.floor(Math.random() * 3)];
        this.s.playerLocks.add(g);
        result.events.push('ジャンケン効果: あなたの' + G_NAME[g] + 'を封印');
        break;
      }
    }
  }

  // --- RPS resolution ---
  resolveRPS(playerGesture, bossGesture) {
    // 50HP threshold: all boss gestures locked → player auto wins
    if (!this.s.bossPassiveActive) return 'counter';
    // Boss gesture locked by player → player auto wins
    if (this.s.bossLocks.has(bossGesture)) return 'counter';
    // Player gesture locked by boss → boss auto wins
    if (this.s.playerLocks.has(playerGesture)) return 'lose';
    // Normal RPS
    if (COUNTER[playerGesture] === bossGesture) return 'counter';
    if (playerGesture === bossGesture) return 'draw';
    return 'lose';
  }

  // --- Play one card (gesture is fixed from deck building) ---
  playCard(card) {
    if (this.s.gameOver) return null;
    const chosenGesture = card.gesture; // 固定された手
    const cardIndex = this.s.cardsPlayedThisRound;
    this.s.cardsPlayedThisRound++;
    const bossG = this.currentBossGesture;
    const rpsResult = this.resolveRPS(chosenGesture, bossG);
    const isCounter = rpsResult === 'counter';
    const isLose = rpsResult === 'lose';

    const result = {
      card, chosenGesture, bossGesture: bossG, rpsResult, isCounter,
      events: [], damageDealt: 0, healDone: 0, selfDamageTaken: 0,
    };

    // 1. BOSS attack per card = base 4 + boss passion
    let hitDmg = SELF_DMG + Math.max(0, this.s.bossPassion);
    if (this.s.bossPassion > 0) {
      result.events.push(`BOSS攻撃: ${SELF_DMG}+${this.s.bossPassion}テンション=${hitDmg}`);
      this.s.bossPassion = Math.max(0, this.s.bossPassion - 1);
    } else {
      result.events.push(`BOSS攻撃 ${hitDmg}`);
    }
        // Apply damage reduction if active
    if (this.s.damageReduce > 0) {
      const reduced = Math.floor(hitDmg * this.s.damageReduce);
      hitDmg -= reduced;
      result.events.push(`被ダメージ軽減${Math.round(this.s.damageReduce*100)}%→${hitDmg}`);
    }
    this.s.playerHp -= hitDmg;
    result.selfDamageTaken += hitDmg;

    // 2. Read passion for damage bonus, THEN decay
    // (decay before card effects so new passion gains aren't eaten this turn)
    const totalPassion = this.s.passion;
    if (this.s.passion > 0) {
      this.s.passion--;
      result.events.push(`テンション-1(→${this.s.passion})`);
    }

    // 3. Player weakness trigger: take weakness layers as damage
    if (this.s.playerWeakness > 0) {
      const wDmg = this.s.playerWeakness;
      this.s.playerHp -= wDmg;
      result.selfDamageTaken += wDmg;
      result.events.push(`弱点反動${wDmg}(${this.s.playerWeakness}層)`);
    }

    // 4. Boss weakness trigger: boss takes weakness layers as damage
    if (this.s.bossWeakness > 0) {
      let wDmg = this.s.bossWeakness;
      if (this.s.bossMods.includes('2以下ダメージ無効') && wDmg <= 2 && this.s.bossPassiveActive) {
        result.events.push(`弱点${wDmg}→BOSS無効(≤2)`);
        wDmg = 0;
      }
      if (wDmg > 0) {
        this.s.bossHp -= wDmg;
        result.damageDealt += wDmg;
        result.events.push(`弱点ダメージ${wDmg}→BOSS`);
      }
    }

    // 5. RPS result display
    const rpsText = isCounter ? '有利✓' : (rpsResult === 'draw' ? '引き分け' : '不利✗');
    result.events.push(`${G_ICON[chosenGesture]}${G_NAME[chosenGesture]} vs ${G_ICON[bossG]}${G_NAME[bossG]} → ${rpsText}`);
    if (this.gestureModifiers) {
      const mk = isCounter ? 'win' : (rpsResult === 'draw' ? 'draw' : 'lose');
      this.applyGestureMod(this.gestureModifiers[mk], result);
    }

    // 6. Apply card effects
    const baseFx = card.fx || {};
    const counterFx = isCounter ? (card.cfx || {}) : {};

    let dmg = 0;
    let heal = 0;

    const applyEffect = (fx, label = '') => {
      if (!fx) return;

      const prefix = label ? `${label}` : '';

      // Base damage
      if (fx.dmg) {
        let addDmg = fx.dmg;
        if (addDmg > 0 && totalPassion > 0) {
          const orig = addDmg;
          addDmg += totalPassion;
          result.events.push(`${prefix}テンション加算: ${orig}+${totalPassion}=${addDmg}`);
        }
        dmg += addDmg;
      }

      // Healing
      if (fx.heal) {
        heal += fx.heal;
      }

      // Self damage from card
      if (fx.selfDmg) {
        this.s.playerHp -= fx.selfDmg;
        result.selfDamageTaken += fx.selfDmg;
        result.events.push(`${prefix}カード自傷${fx.selfDmg}`);
      }

      // Damage reduction
      if (fx.reduce) {
        this.s.damageReduce = Math.max(this.s.damageReduce, fx.reduce);
        result.events.push(`${prefix}このターン受けるダメージ-${Math.round(fx.reduce * 100)}%`);
      }

      // Passion gain
      if (fx.passion) {
        this.s.passion += fx.passion;
        result.events.push(`${prefix}テンション+${fx.passion}(→${this.s.passion})`);
      }

      // Weakness give (to boss)
      if (fx.weakness) {
        this.s.bossWeakness += fx.weakness;
        result.events.push(`${prefix}BOSSに弱点+${fx.weakness}(→${this.s.bossWeakness})`);
      }

      // Lock (on boss)
      if (fx.lock) {
        for (let i = 0; i < fx.lock; i++) {
          if (this.s.bossLocks.size >= MAX_LOCKS) {
            result.events.push(`${prefix}封印失敗: BOSSは既に封印上限${MAX_LOCKS}`);
            break;
          }
          const unlocked = GESTURES.filter(g => !this.s.bossLocks.has(g));
          if (unlocked.length <= 0) break;
          const g = unlocked[Math.floor(Math.random() * unlocked.length)];
          this.s.bossLocks.add(g);
          result.events.push(`${prefix}BOSS封印 ${G_NAME[g]}${G_ICON[g]}`);
        }
      }

      // Swap
      if (fx.swap) {
        const canUseThisRound = this.s.cardsPlayedThisRound < MAX_CARDS;
        if (!canUseThisRound) {
          result.events.push(`${prefix}カード交換失敗：このターン最後の1枚です`);
        } else {
          const availRemain = this.deck.filter(c => !this.hand.includes(c));
          const swapCount = Math.min(
            fx.swap,
            availRemain.length,
            this.hand.filter(c => c.id !== card.id).length
          );
          if (swapCount > 0) {
            this.pendingSwaps = Math.max(this.pendingSwaps, swapCount);
            result.events.push(`${prefix}🔁 ${swapCount}枚のカードを交換`);
          }
        }
      }

      // --- SPECIAL EFFECTS ---
      if (fx.special) {
        switch (fx.special) {
          case 'tuixiao': {
            const lockBonus = this.s.bossLocks.size * 2;
            dmg += lockBonus;
            if (lockBonus > 0) result.events.push(`${prefix}販促・封印ボーナス+${lockBonus}`);
            break;
          }
          case 'tuixiao_re': {
            const lockBonus2 = this.s.bossLocks.size * 2;
            const singleHit = 4 + totalPassion + lockBonus2;
            dmg += singleHit;
            result.events.push(`${prefix}販促の有利効果が再発動! 追加${singleHit}ダメージ`);
            break;
          }
          case 'qingsuan': {
            if (this.s.bossLocks.size > 0) {
              const lockCount = this.s.bossLocks.size;
              dmg += 18;
              result.events.push(`${prefix}清算! ${lockCount}個の封印を解除し、18ダメージ`);
              this.s.bossLocks.clear();
            } else {
              result.events.push(`${prefix}清算: 封印なし、効果なし`);
            }
            break;
          }
          case 'qingsuan_c': {
            heal += 8;
            result.events.push(`${prefix}清算・有利効果: HPを12回復`);
            break;
          }
          case 'persist': {
            this.s.persistLocks = true;
            result.events.push(`${prefix}封印効果は次のターンまで持続`);
            break;
          }
          case 'tupo': {
            if (totalPassion >= 3) {
              this.s.passion = Math.max(0, this.s.passion - 3);
              dmg += 8;
              result.events.push(`${prefix}突破! テンションを3消費し、+8ダメージ(→${this.s.passion}テンション)`);
            } else {
              result.events.push(`${prefix}突破: テンション不足(${totalPassion}<3)`);
            }
            break;
          }
          case 'linian': {
            const bonus = totalPassion * 3;
            dmg += bonus;
            result.events.push(`${prefix}理念! ${totalPassion}テンション×3=${bonus}ダメージ`);
            this.s.passion = 0;
            break;
          }
          case 'linian_c': {
            const currentTotal = dmg;
            const extraHeal = Math.floor(currentTotal / 2);
            heal += extraHeal;
            result.events.push(`${prefix}理念・有利効果! HPを${extraHeal}回復`);
            break;
          }
          case 'guozai': {
            this.s.nextRoundPassion += 8;
            result.events.push(`${prefix}オーバーロード: 次のターン テンション+8`);
            break;
          }
          case 'tuidiao': {
            const wBonus = this.s.bossWeakness;
            dmg += wBonus;
            result.events.push(`${prefix}推論: 弱点ダメージ+${wBonus}`);
            break;
          }
          case 'tuidiao_c': {
            const singleHit = 3 + totalPassion + this.s.bossWeakness;
            dmg += singleHit;
            result.events.push(`${prefix}推論の有利効果が再発動! 追加${singleHit}ダメージ`);
            break;
          }
          case 'hegui': {
            const consumed = this.s.bossWeakness;
            const extra = consumed * 2;
            dmg += extra;
            result.events.push(`${prefix}コンプライアンス! ${consumed}層×2=${extra}ダメージ`);
            this.s.bossWeakness = 0;
            break;
          }
          case 'hegui_c': {
            this.s.noWeaknessDecay = true;
            result.events.push(`${prefix}コンプライアンス・有利効果! 次のターン弱点が減衰しない`);
            break;
          }
          case 'fushen': {
            this.s.nextRoundWeakness += 3;
            result.events.push(`${prefix}再審: 次のターンBOSSに弱点+3`);
            break;
          }
        }
      }
    };

    applyEffect(baseFx, '');
    if (isCounter) {
      applyEffect(counterFx, '有利追加: ');
    }
    if (this.s.bossMods.includes('2以下ダメージ無効') && dmg > 0 && dmg <= 2 && this.s.bossPassiveActive) {
      result.events.push(`${dmg}ダメージ→BOSS無効(≤2)`);
      dmg = 0;
    }

    // Apply damage and healing
    if (dmg > 0) {
      this.s.bossHp -= dmg;
      result.damageDealt += dmg;
      result.events.push(`→ ${dmg}ダメージを与える(BOSS: ${this.s.bossHp}/${this.s.bossMaxHp})`);
    }
    if (heal > 0) {
      this.s.playerHp = Math.min(this.s.playerMaxHp, this.s.playerHp + heal);
      result.healDone += heal;
      result.events.push(`→ HPを${heal}回復(${this.s.playerHp}/${this.s.playerMaxHp})`);
    }

    // 7. Boss per-card modifiers
    this.applyBossPerCardMods(cardIndex, chosenGesture, bossG, rpsResult, result);

    // Remove card from hand
    this.hand = this.hand.filter(c => c.id !== card.id);

    // Log
    const logEntry = `[${card.name}] ${result.events.join(' | ')}`;
    this.addLog(logEntry);
    this.roundLog.push(result);

    // Check game over
    this.checkGameOver();

    // Roll NEW boss gesture for next card (skip if swap pending - UI handles after swap)
    if (!this.s.gameOver && this.s.cardsPlayedThisRound < MAX_CARDS && this.hand.length > 0 && this.pendingSwaps <= 0) {
      this.currentBossGesture = this.rollBossGesture();
      this.addLog(`BOSSの次の手: ${G_NAME[this.currentBossGesture]}${G_ICON[this.currentBossGesture]}`);
      this.rollGestureModifiers(); // re-assign to 3 slots for next card
    }

    return result;
  }

  applyBossPerCardMods(cardIndex, playerG, bossG, rpsResult, result) {
    if (!this.bossModsEnabled || !this.s.bossPassiveActive) return;
    const isWin = rpsResult === 'counter'; // player wins
    const isLose = rpsResult === 'lose';

    for (const mod of this.s.bossMods) {
      switch(mod) {
        case '胜利伤害2':
          if (isLose) { // boss wins (player loses)
            this.s.playerHp -= 2;
            result.events.push('BOSS効果: ジャンケン勝利で+2ダメージ');
          }
          break;
        case '平负伤害1':
          if (!isLose) { // boss doesn't win
            this.s.playerHp -= 1;
            result.events.push('BOSS効果: 引き分け/不利で+1ダメージ');
          }
          break;
        case '第三张6伤害':
          if (cardIndex === 2) {
            this.s.playerHp -= 6;
            result.events.push('BOSS効果: 3枚目に+6ダメージ');
          }
          break;
        case '封锁伤害加成':
          if (this.s.playerLocks.size > 0) {
            const bonus = this.s.playerLocks.size * 2;
            this.s.playerHp -= bonus;
            result.events.push(`BOSS効果: 封印${this.s.playerLocks.size}つで+${bonus}ダメージ`);
          }
          break;
        case '解锁反击':
          if (this.s.playerLocks.has(playerG)) {
            this.s.playerLocks.delete(playerG);
            this.s.playerHp -= 4;
            result.events.push(`BOSS効果: 封印解除反撃 ${G_NAME[playerG]}, 4ダメージ`);
          }
          break;
        case '胜利热情3':
          if (isLose) { // boss wins (player loses)
            this.s.bossPassion += 3 + this.modBonus;
            result.events.push(`BOSS効果: ジャンケン勝利でテンション+3(→${this.s.bossPassion})`);
          }
          break;
        case '平局热情2':
          if (!isWin && !isLose) { // draw only
            this.s.bossPassion += 2 + this.modBonus;
            result.events.push(`BOSS効果: 引き分けでテンション+2(→${this.s.bossPassion})`);
          }
          break;
        case '被克热情2':
          if (isWin) { // player wins = boss loses
            this.s.bossPassion += 2 + this.modBonus;
            result.events.push(`BOSS効果: 不利でテンション+2(→${this.s.bossPassion})`);
          }
          break;
        case '猜拳胜利造成2伤':
          if (isLose) {  // boss wins
            this.s.playerHp -= 2;
            result.events.push('BOSS効果: ジャンケン勝利で+2ダメージ');
          }
          break;
        case '打出第三张6伤':
          if (cardIndex === 2) {
            this.s.playerHp -= 6;
            result.events.push('BOSS効果: 3枚目に+6ダメージ');
          }
          break;
        case '猜拳减热情1':
          // 克共情：每次猜拳玩家损失1热情
          if (this.s.passion > 0) {
            this.s.passion = Math.max(0, this.s.passion - 1);
            result.events.push(`BOSS効果: ジャンケンであなたのテンション-1(→${this.s.passion})`);
          }
          break;
        case '猜拳减弱点2':
          // 克逻辑：每次猜拳BOSS弱点-2（抵抗积累）
          if (this.s.bossWeakness > 0) {
            const shed = Math.min(2, this.s.bossWeakness);
            this.s.bossWeakness = Math.max(0, this.s.bossWeakness - shed);
            result.events.push(`BOSS効果: ジャンケンで弱点耐性-${shed}(→${this.s.bossWeakness})`);
          }
          break;
        case '解锁反击4':
          // 克商业：与被封锁手势战斗→解锁+4伤
          if (this.s.bossLocks.has(bossG)) {
            this.s.bossLocks.delete(bossG);
            this.s.playerHp -= 4;
            result.events.push(`BOSS効果: 封印反撃! ${G_NAME[bossG]}を解除し+4ダメージ`);
          }
          break;

        case '胜利封锁':
          if (isLose) {
            if (this.s.playerLocks.size < MAX_LOCKS) {
              const unlocked = GESTURES.filter(g => !this.s.playerLocks.has(g));
              if (unlocked.length > 0) {
                const g = unlocked[Math.floor(Math.random() * unlocked.length)];
                this.s.playerLocks.add(g);
                result.events.push(`BOSS効果: 勝利封印 ${G_NAME[g]}`);
              }
            } else {
              result.events.push(`BOSS効果: 勝利封印失敗(既に封印上限${MAX_LOCKS})`);
            }
          }
          break;

        case '第一张封锁':
          if (cardIndex === 0) {
            if (this.s.playerLocks.size < MAX_LOCKS) {
              const unlocked = GESTURES.filter(g => !this.s.playerLocks.has(g));
              if (unlocked.length > 0) {
                const g = unlocked[Math.floor(Math.random() * unlocked.length)];
                this.s.playerLocks.add(g);
                result.events.push(`BOSS効果: 1枚目封印 ${G_NAME[g]}`);
              }
            } else {
              result.events.push(`BOSS効果: 1枚目封印失敗(既に封印上限${MAX_LOCKS})`);
            }
          }
          break;
        case '胜利弱点4':
          if (isLose) {
            this.s.playerWeakness += 4 + this.modBonus;
            result.events.push(`BOSS効果: ジャンケン勝利で弱点+4(あなた:${this.s.playerWeakness}層)`);
          }
          break;
        case '胜利解锁':
          if (isLose && this.s.bossLocks.size > 0) {
            const removed = [...this.s.bossLocks][0];
            this.s.bossLocks.delete(removed);
            result.events.push(`BOSS効果: ジャンケン勝利→封印解除 ${G_NAME[removed]}`);
          }
          break;
        case '每锁回血3':
          if (this.s.bossLocks.size > 0) {
            const heal = this.s.bossLocks.size * (3 + this.modBonus);
            this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + heal);
            result.events.push(`BOSS効果: 封印${this.s.bossLocks.size}つ→HP${heal}回復`);
          }
          break;
        case '负失热情2':
          if (isLose && this.s.passion > 0) {
            const lost = Math.min(this.s.passion, 2 + this.modBonus);
            this.s.passion -= lost;
            result.events.push(`BOSS効果: ジャンケン勝利→あなたのテンション${lost}失う(→${this.s.passion})`);
          }
          break;
        case '热情反噬':
          if (this.s.passion >= 5) {
            const extra = 2 + this.modBonus;
            this.s.playerHp -= extra;
            result.events.push(`BOSS効果: あなたのテンションが5以上、追加+${extra}ダメージ`);
          }
          break;
        case '弱点上限4': {
          const cap = 4 + this.modBonus;
          if (this.s.bossWeakness > cap) {
            const healBack = 10;
            this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + healBack);
            this.s.bossWeakness = 0;
            result.events.push(`BOSS効果: 弱点が${cap}超過→リセット、BOSSが${healBack}回復`);
          }
          break;
        }
        case '平负弱点2':
          if (!isLose) {
            this.s.playerWeakness += 2;
            result.events.push(`BOSS効果: 引き分け/不利で弱点+2(あなた:${this.s.playerWeakness}層)`);
          }
          break;
        case '第三张弱点5':
          if (cardIndex === 2) {
            this.s.playerWeakness += 5;
            result.events.push(`BOSS効果: 3枚目に弱点+5(あなた:${this.s.playerWeakness}層)`);
          }
          break;
      }
    }
  }

  // --- End of round: boss damage + cleanup ---
  endRound() {
    const result = { events: [], bossDamage: 0 };
    const cards = this.s.cardsPlayedThisRound;

    // Boss base damage removed - already applied per card as "self damage"
    // (BOSS attack = 4 + passion per card, during card play phase)
    if (!this.s.bossPassiveActive) {
      result.events.push('BOSSパッシブ無効');
    }

    // End-of-round boss mods
    if (this.bossModsEnabled && this.s.bossPassiveActive) {
      for (const mod of this.s.bossMods) {
        switch(mod) {
          case '回合结束伤害2':
            this.s.playerHp -= 2 + this.modBonus;
            result.events.push(`BOSS効果: ターン終了時+${2+this.modBonus}ダメージ`);
            break;
          case '回合结束回复3':
            this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + 3 + this.modBonus);
            result.events.push(`BOSS効果: ターン終了時HPを3回復(→${this.s.bossHp})`);
            break;
          case '回合结束弱点1':
            this.s.playerWeakness += 1 + this.modBonus;
            result.events.push(`BOSS効果: ターン終了時弱点+1(あなた:${this.s.playerWeakness}層)`);
            break;
        }
      }
    }

    // Boss passion decay at end of round (50% like player weakness)
    if (this.s.bossPassion > 0) {
      const bpBefore = this.s.bossPassion;
      this.s.bossPassion = Math.floor(this.s.bossPassion / 2);
      result.events.push(`BOSSテンション減衰: ${bpBefore}→${this.s.bossPassion}`);
    }

    // Weakness decay (boss weakness, 50% end of round)
    if (this.s.bossWeakness > 0) {
      if (this.s.noWeaknessDecay) {
        result.events.push(`BOSS弱点${this.s.bossWeakness}層(このターンは減衰しない)`);
        this.s.noWeaknessDecay = false;
      } else {
        const before = this.s.bossWeakness;
        this.s.bossWeakness = Math.floor(this.s.bossWeakness / 2);
        result.events.push(`BOSS弱点減衰: ${before}→${this.s.bossWeakness}`);
      }
    }

    // Player weakness decay (50%)
    if (this.s.playerWeakness > 0) {
      const before = this.s.playerWeakness;
      this.s.playerWeakness = Math.floor(this.s.playerWeakness / 2);
      result.events.push(`あなたの弱点減衰: ${before}→${this.s.playerWeakness}`);
    }

    // Check 50HP threshold
    if (this.enableProtection && this.s.playerHp <= 50 && !this.s.threshold50Triggered) {
      this.s.threshold50Triggered = true;
      this.s.bossPassiveActive = false;
      this.s.bossPassiveRoundsLeft = 1; // 1 full round of protection
      this.s.bossLocks = new Set([ROCK, SCISSORS, PAPER]);
      result.events.push('⚡ HP50到達! 次のターンBOSSパッシブ無効、全手封印');
    }

    // Decrement protection rounds
    if (this.s.bossPassiveRoundsLeft > 0) {
      this.s.bossPassiveRoundsLeft--;
    }

    this.addLog('--- ターン終了処理 ---');
    for (const e of result.events) this.addLog(e);

    this.checkGameOver();
    return result;
  }

  checkGameOver() {
    if (this.s.bossHp <= 0) {
      this.s.gameOver = true;
      this.s.winner = 'player';
      this.addLog('🎉 BOSSを撃破!');
    } else if (this.s.playerHp <= 0) {
      this.s.gameOver = true;
      this.s.winner = 'boss';
      this.addLog('💀 あなたは敗北した...');
    } else if (this.s.round >= MAX_ROUNDS) {
      this.s.gameOver = true;
      this.s.winner = 'boss';
      this.addLog('⏰ タイムアップ、BOSSの勝利');
    }
  }

  // --- Execute player-chosen swap ---
  executeSwap(cardToReplace) {
    const availRemain = this.deck.filter(c => !this.hand.includes(c));
    if (availRemain.length === 0) return null;
    const newCard = availRemain[Math.floor(Math.random() * availRemain.length)];
    newCard._isNew = true;
    const idx = this.hand.indexOf(cardToReplace);
    if (idx >= 0) {
      this.hand[idx] = newCard;
      this.pendingSwaps--;
      this.addLog(`\\u{1f501} ${cardToReplace.name}(${G_ICON[cardToReplace.gesture]}) \\u2192 ${newCard.name}(${G_ICON[newCard.gesture]})`);
      return newCard;
    }
    return null;
  }

  addLog(msg) {
    this.log.push(msg);
  }
}

// ============================================================
// UI MANAGER
// ============================================================
class GameUI {
  constructor() {
    this.engine = null;
    this.phase = 'title';
    this.selectedSystem = null;
    this.selectedBossHp = 80; // match the default active HP button
    this.selectedBossMods = true;
    this.selectedGestureMods = false;
    this.selectedGestureModTier = 'basic';
  }

  init() {
    this.render();
  }

  render() {
    const app = document.getElementById('app');
    switch(this.phase) {
      case 'title': app.innerHTML = this.renderTitle(); this.bindTitle(); break;
      case 'battle':
      case 'selecting': this.renderBattle(); break;
      case 'gameOver': this.renderGameOver(); break;
    }
  }

  // --- TITLE SCREEN ---
  renderTitle() {
    return `
      <div class="title-screen">
        <div class="title-logo">
          <div class="title-icon">🃏</div>
          <h1>アイドルカードバトル</h1>
          <p class="subtitle">バトルシステム Demo</p>
        </div>
        <div class="system-select">
          <h2>システムを選択</h2>
          <div class="system-cards">
            ${['commercial','empathy','logic'].map(s => `
              <button class="system-btn" data-system="${s}" style="--sys-color:${SYS_COLOR[s]}">
                <div class="sys-name">${SYS_NAME[s]}システム</div>
                <div class="sys-boss">対戦相手: ランダムBOSS</div>
                <div class="sys-desc">${{
                  commercial:'BOSSの手を封印し、封印された手に対して自動的に有利を取る。最大2つまで封印可能。清算は全封印を解除し、大ダメージを与える',
                  empathy:'テンションを溜めて攻撃ダメージを上げる。カードを出すたびテンション-1。理念でテンションを全消費し、×3の大ダメージ',
                  logic:'BOSSに弱点を蓄積する。カードを出すたび弱点層数分のダメージが発動。ターン終了時に弱点は50%減衰'
                }[s]}</div>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="rules-summary">
          <h3>基本ルール</h3>
          <div class="rules-cols">
            <div class="rules-col">
              <b>基本フロー</b>
              <ul>
                <li>毎ターン12枚のデッキから5枚引き、最大3枚まで使用可能</li>
                <li>各カードには固定の手(グー/チョキ/パー)があり、デッキ構築時に決定される</li>
                <li>カードを1枚出すごとにBOSSが4HP攻撃してくる(使用コスト)</li>
                <li>BOSSは毎回ランダムな手を出し、事前に公開される</li>
                <li>自分の手がBOSSに有利なら、カードの⭐有利効果が発動</li>
                <li>1枚出すごとにBOSSは次の手へ切り替わる</li>
                <li>HPが50以下で保護発動(BOSSパッシブが1ターン無効)</li>
              </ul>
            </div>
            <div class="rules-col">
              <b style="color:#d4a843">💰 ビジネス · 封印</b>
              <ul>
                <li>BOSSの手を封印し、封印された手に自動で有利を取る</li>
                <li>同時に最大2つまで封印可能、対象はランダム</li>
                <li>エンドゲーム: 全封印解除+封印1つごとに6ダメージ</li>
                <li>乗じる: 封印1つごとに追加+2ダメージ</li>
              </ul>
              <b style="color:#e85d75">🔥 エモーション · テンション</b>
              <ul>
                <li>テンションが高いほどカードの攻撃ダメージが上がる</li>
                <li>カードを1枚出すごとにテンション-1</li>
                <li>注ぎ込む: 全テンションを消費し、×3の大ダメージ</li>
                <li>爆発: テンション3以上で3消費し、追加+8ダメージ</li>
              </ul>
              <b style="color:#4db8ff">💢 ロジック · 弱点</b>
              <ul>
                <li>BOSSに弱点層を蓄積する</li>
                <li>カードを出すたび、BOSSは弱点層数分のダメージを受ける</li>
                <li>ターン終了時に弱点は50%減衰する</li>
                <li>推論: 追加で弱点層ダメージを与える</li>
                <li>リセット: 全弱点を消費し、層数×2ダメージ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
  }

  bindTitle() {
    document.querySelectorAll('.system-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedSystem = btn.dataset.system;
        this.phase = 'difficulty';
        this.renderDifficulty();
      };
    });
  }

  renderDifficulty() {
    const app = document.getElementById('app');
    const sysName = SYS_NAME[this.selectedSystem];
    const sysColor = SYS_COLOR[this.selectedSystem];
    app.innerHTML = `
      <div class="title-screen">
        <div class="title-logo">
          <div class="title-icon">\\u{1f3af}</div>
          <h1 style="background:${sysColor};-webkit-background-clip:text;-webkit-text-fill-color:transparent">${sysName}システム</h1>
          <p class="subtitle">BOSS難易度を選択 (ランダムBOSS + N個の特性)</p>
        </div>
        <div class="system-cards">
          <button class="system-btn diff-btn" data-mods="1" style="--sys-color:#4ade80">
            <div class="sys-name">1特性</div>
            <div class="sys-desc">入門難易度。BOSSは特性を1つだけ持つ</div>
          </button>
          <button class="system-btn diff-btn" data-mods="2" style="--sys-color:#f59e0b">
            <div class="sys-name">2特性</div>
            <div class="sys-desc">標準難易度。2つのパッシブ特性が重なる</div>
          </button>
          <button class="system-btn diff-btn" data-mods="3" style="--sys-color:#ef4444">
            <div class="sys-name">3特性</div>
            <div class="sys-desc">高難易度。特性による圧力が一気に高まる</div>
          </button>
          <button class="system-btn diff-btn" data-mods="4" style="--sys-color:#a855f7">
            <div class="sys-name">3特性+1</div>
            <div class="sys-desc">超高難易度。全特性の数値がさらに+1</div>
          </button>
        </div>
        <div class="hp-select-label">BOSS HP</div>
        <div class="hp-btns">
          <button class="hp-btn active" data-hp="80">80HP<br><small>初心者</small></button>
          <button class="hp-btn" data-hp="100">100HP<br><small>標準</small></button>
          <button class="hp-btn" data-hp="120">120HP<br><small>挑戦</small></button>
          <button class="hp-btn" data-hp="150">150HP<br><small>極限</small></button>
        </div>
        <div class="protect-toggle">
          <label class="toggle-label"><input type="checkbox" id="protectToggle"><span>HP50保護を有効化</span></label>
          <label class="toggle-label"><input type="checkbox" id="bossModsToggle" checked><span>BOSSパッシブ特性（OFF=テスト用）</span></label>
          <label class="toggle-label"><input type="checkbox" id="gestureModsToggle"><span>ジャンケン結果特性（勝ち/引き分け/負けのランダム効果）</span></label>
          <div id="gTierRow" style="display:none;margin-top:4px;padding-left:24px;">
            <label class="toggle-label" style="display:inline-flex"><input type="radio" name="gTier" value="basic" checked><span>2特性（中立+体系、2枠のみ有効）</span></label>
            <label class="toggle-label" style="display:inline-flex;margin-left:10px"><input type="radio" name="gTier" value="mixed"><span>混合（全タイプ、3枠すべて有効）</span></label>
          </div>
        </div>
        <button class="btn-back" id="btnBack">\\u2190 システム選択に戻る</button>
      </div>`;
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.onclick = () => {
        const prot = document.getElementById('protectToggle').checked;
        this.selectedBossMods = document.getElementById('bossModsToggle').checked;
        this.selectedGestureMods = document.getElementById('gestureModsToggle').checked;
        const tr = document.querySelector('input[name="gTier"]:checked');
        this.selectedGestureModTier = tr ? tr.value : 'basic';
        this.startGame(this.selectedSystem, parseInt(btn.dataset.mods), prot);
      };
    });
    const gToggle = document.getElementById('gestureModsToggle');
    if (gToggle) gToggle.onchange = () => { document.getElementById('gTierRow').style.display = gToggle.checked ? 'block' : 'none'; };
    document.querySelectorAll('.hp-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.hp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedBossHp = parseInt(btn.dataset.hp);
      };
    });
    document.getElementById('btnBack').onclick = () => {
      this.phase = 'title';
      this.render();
    };
  }

  startGame(systemKey, modCount, enableProtection) {
    this.engine = new BattleEngine(systemKey, modCount, enableProtection, this.selectedBossHp, {bossModsEnabled: this.selectedBossMods, gestureModsEnabled: this.selectedGestureMods, gestureModTier: this.selectedGestureModTier});
    this.phase = 'selecting';
    this.engine.startRound();
    // Show tutorial for first game
    if (!GameUI._tutorialShown) {
      GameUI._tutorialShown = true;
      this.showTutorial();
    } else {
      this.renderBattle();
    }
  }

  showTutorial() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="tutorial-screen">
        <h2>3つ覚えればすぐ戦える</h2>
        <div class="tut-cards">
          <div class="tut-card">
            <div class="tut-icon" style="color:#ef4444">💔</div>
            <div class="tut-title">カードを出す = HP消費</div>
            <div class="tut-desc">カードを1枚出すごとに4HP失う。多く出すほど火力は伸びるが、その分リスクも高い。毎ターン3枚使い切る必要はない。</div>
          </div>
          <div class="tut-card">
            <div class="tut-icon" style="color:#4ade80">✊✌️🖐️</div>
            <div class="tut-title">ジャンケンで勝負</div>
            <div class="tut-desc">BOSSは手を先に見せる。自分のカードの手がBOSSに有利なら強力な効果が発動する(緑=有利、赤=不利)。1枚使うごとにBOSSは次の手に切り替わる。</div>
          </div>
          <div class="tut-card">
            <div class="tut-icon" style="color:#f59e0b">⚡</div>
            <div class="tut-title">システムが武器になる</div>
            <div class="tut-desc">ビジネスは手を封印して有利を固定し、エモーションはテンションで火力を伸ばし、ロジックは弱点を積み重ねて継続ダメージを与える。カード説明を見ながら組み合わせを掴もう。</div>
          </div>
        </div>
        <button class="btn-start-battle" id="btnStartBattle">バトル開始</button>
      </div>`;
    document.getElementById('btnStartBattle').onclick = () => this.renderBattle();
  }

   // --- BATTLE SCREEN ---
  renderBattle() {
    const app = document.getElementById('app');
    const s = this.engine.s;
    const bossG = this.engine.currentBossGesture;
    const bossGLocked = s.bossLocks.has(bossG);

    app.innerHTML = `
      <div class="battle-screen">
        <div class="boss-area">
          <div class="boss-header">
            <div class="boss-name">${s.bossName}</div>
            <div class="hp-bar-wrap">
              <div class="hp-bar boss-hp" style="width:${Math.max(0, s.bossHp / s.bossMaxHp * 100)}%"></div>
              <span class="hp-text">${Math.max(0, s.bossHp)} / ${s.bossMaxHp}</span>
            </div>
          </div>

          <div class="boss-info">
            <div class="boss-gesture ${bossGLocked ? 'locked' : ''}">
              <span class="gesture-big">${G_ICON[bossG]}</span>
              <span>
                ${G_NAME[bossG]}
                ${bossGLocked ? ' 🔒封印済み' : ''}
                ${!s.bossPassiveActive ? ' ⚡パッシブ無効' : ''}
              </span>
            </div>

            ${this.engine.gestureModifiers ? (() => {
              const gm = this.engine.gestureModifiers;
              const fmt = (m) => m ? (m.revealed ? '<b>' + m.text + '</b>' : '<b>' + m.range + '</b>') : '';
              return `
                <div class="gesture-mods">
                  <div class="gmod gmod-win">勝ち → ${gm.win ? gm.win.label + ' ' + fmt(gm.win) : '—'}</div>
                  <div class="gmod gmod-draw">引き分け → ${gm.draw ? gm.draw.label + ' ' + fmt(gm.draw) : '—'}</div>
                  <div class="gmod gmod-lose">負け → ${gm.lose ? gm.lose.label + ' ' + fmt(gm.lose) : '—'}</div>
                </div>
              `;
            })() : ''}

            <div class="boss-resources">
              ${s.bossPassion > 0 ? `<span class="res-tag passion">🔥テンション ${s.bossPassion}</span>` : ''}
              ${s.bossWeakness > 0 ? `<span class="res-tag weakness">💢弱点 ${s.bossWeakness}</span>` : ''}
              ${s.bossLocks.size > 0 ? `<span class="res-tag lock">🔒封印:${[...s.bossLocks].map(g => G_ICON[g]).join('')}</span>` : ''}
            </div>
          </div>

          <div class="boss-mods">${s.bossDesc}</div>
        </div>

        <div class="battle-log" id="battleLog">
          ${this.engine.log.slice(-14).map(l => {
            let cls = 'log-info';
            if (l.startsWith('===')) cls = 'log-round';
            else if (l.includes('BOSS攻撃') || l.includes('反動') || l.includes('自傷') || l.includes('ダメージ→')) cls = 'log-dmg';
            else if (l.includes('回復') || (l.includes('与える') && l.includes('BOSS'))) cls = 'log-heal';
            else if (l.includes('テンション') || l.includes('弱点') || l.includes('封印') || l.includes('🔁')) cls = 'log-res';
            return '<div class="log-line ' + cls + '">' + l + '</div>';
          }).join('')}
        </div>

        <div class="player-area">
          <div class="player-header">
            <div class="player-resources">
              <span class="res-tag round">第${s.round}ターン</span>
              <span class="res-tag cards-played">${s.cardsPlayedThisRound}/${MAX_CARDS}枚</span>
              ${s.passion > 0 ? `<span class="res-tag passion">🔥テンション ${s.passion}</span>` : ''}
              ${s.playerWeakness > 0 ? `<span class="res-tag weakness">💢弱点 ${s.playerWeakness}</span>` : ''}
              ${s.playerLocks.size > 0 ? `<span class="res-tag lock-bad">🔒封印:${[...s.playerLocks].map(g => G_ICON[g]).join('')}</span>` : ''}
            </div>
            <div class="hp-bar-wrap">
              <div class="hp-bar player-hp ${s.playerHp <= 50 ? 'low' : ''}" style="width:${Math.max(0, s.playerHp / s.playerMaxHp * 100)}%"></div>
              <span class="hp-text">${Math.max(0, s.playerHp)} / ${s.playerMaxHp}</span>
            </div>
          </div>

          <div class="hand" id="hand">
            ${this.engine.hand.map((card, i) => this.renderCard(card, i)).join('')}
          </div>

          <div class="action-bar">
            ${this.engine.pendingSwaps > 0
              ? `<div class="swap-prompt">🔁 入れ替えたいカードをクリックしてください (残り${this.engine.pendingSwaps}回)</div>`
              : ''}

            <button class="btn-end-round" id="btnEndRound" ${s.cardsPlayedThisRound === 0 || this.engine.pendingSwaps > 0 ? 'disabled' : ''}>
              ターン終了 (使用 ${s.cardsPlayedThisRound}枚)
            </button>

            ${s.gameOver ? `<button class="btn-restart" id="btnRestart">選択画面に戻る</button>` : ''}

            <button class="btn-help" id="btnHelp">?</button>
          </div>
        </div>

        <!-- HELP OVERLAY -->
        <div class="help-overlay" id="helpOverlay">
          <div class="help-content">
            <h3>ルール説明</h3>

            <div class="help-section">
              <b>基本フロー</b>
              <p>
                毎ターン5枚引き、最大3枚まで使えます。カードを1枚使うたびにBOSSから4HP攻撃を受けます。
                BOSSは毎回ランダムな手を事前公開します。自分の手が有利なら⭐有利効果が発動します。
                1枚使うごとにBOSSは次の手に切り替わります。HPが50以下になると保護が発動します。
              </p>
            </div>

            <div class="help-section">
              <b style="color:#d4a843">💰 ビジネス · 封印</b>
              <p>
                相手の手を封印します(最大2つ)。封印された手には自動で有利になります。
                終局: すべて解除して封印ごとに6ダメージ。乗勢: 封印1つごとに+2ダメージ。
              </p>
            </div>

            <div class="help-section">
              <b style="color:#e85d75">🔥 エモーション · テンション</b>
              <p>
                テンションを溜めて攻撃力を上げます。カードを出すたびテンション-1。
                傾注: 全テンションを消費して×3の一撃。爆発: テンション3以上で3消費し、+8ダメージ。
              </p>
            </div>

            <div class="help-section">
              <b style="color:#4db8ff">💢 ロジック · 弱点</b>
              <p>
                BOSSに弱点を蓄積し、カードを出すたび弱点層ダメージを与えます。
                ターン終了時に弱点は半減します。推演: 追加の弱点ダメージ。清零: 弱点×2の爆発ダメージ。
              </p>
            </div>

            <button class="btn-close-help" id="btnCloseHelp">閉じる</button>
          </div>
        </div>
      </div>`;

    this.bindBattle();
    const log = document.getElementById('battleLog');
    if (log) log.scrollTop = log.scrollHeight;
  }

  renderCard(card, index) {
    const sysColor = SYS_COLOR[card.system];
    const isPlayable = this.phase === 'selecting' && this.engine.s.cardsPlayedThisRound < MAX_CARDS && !this.engine.s.gameOver;
    const bossG = this.engine.currentBossGesture;
    const rps = this.engine.resolveRPS(card.gesture, bossG);
    const rpsText = rps === 'counter' ? '有利✓' : (rps === 'draw' ? '引き分け' : '不利✗');
    const rpsClass = rps === 'counter' ? 'rps-win' : (rps === 'lose' ? 'rps-lose' : 'rps-draw');
    const isLocked = this.engine.s.playerLocks.has(card.gesture);
    const isNew = card._isNew ? 'card-new' : '';
    if (card._isNew) card._isNew = false;

    return `
      <div class="card ${isPlayable ? 'playable' : ''} ${rpsClass} ${isNew}" data-index="${index}" style="--card-color:${sysColor}">
        <div class="card-header">
          <span class="card-sys">${SYS_NAME[card.system]}</span>
          <span class="card-name">${card.name}</span>
          <span class="card-gesture-fixed" style="color:${G_COLOR[card.gesture]}">${G_ICON[card.gesture]}</span>
        </div>

        <div class="card-rps ${rpsClass}">
          ${G_ICON[card.gesture]} vs ${G_ICON[bossG]} → ${rpsText}
          ${isLocked ? ' 🔒封印中' : ''}
        </div>

        <div class="card-effects">
          <div class="card-fx normal">📋 ${card.desc}</div>
          <div class="card-fx counter">⭐ ${card.cDesc}</div>
        </div>
      </div>`;
  }

  bindBattle() {
    const isSwapping = this.engine.pendingSwaps > 0;

    document.querySelectorAll('.card.playable').forEach(el => {
      el.onclick = () => {
        const idx = parseInt(el.dataset.index);
        const card = this.engine.hand[idx];
        if (isSwapping) {
          this.engine.executeSwap(card);
          if (this.engine.pendingSwaps <= 0) {
            // Swap done, roll new boss gesture
            this.engine.currentBossGesture = this.engine.rollBossGesture();
            this.engine.addLog(`BOSSの次の手: ${G_NAME[this.engine.currentBossGesture]}${G_ICON[this.engine.currentBossGesture]}`);
            this.engine.rollGestureModifiers();
          }
          this.renderBattle();
        } else {
          this.playCardDirect(card);
        }
      };
    });

    const helpBtn = document.getElementById('btnHelp');
    if (helpBtn) helpBtn.onclick = () => {
      document.getElementById('helpOverlay').classList.toggle('active');
    };
    const closeHelp = document.getElementById('btnCloseHelp');
    if (closeHelp) closeHelp.onclick = () => {
      document.getElementById('helpOverlay').classList.remove('active');
    };

    const endBtn = document.getElementById('btnEndRound');
    if (endBtn) endBtn.onclick = () => this.endCurrentRound();

    const restartBtn = document.getElementById('btnRestart');
    if (restartBtn) restartBtn.onclick = () => {
      this.phase = 'title';
      this.render();
    };
  }

  playCardDirect(card) {
    const result = this.engine.playCard(card);
    if (!result) return;

    if (this.engine.s.gameOver) {
      this.phase = 'gameOver';
      this.renderBattle();
      return;
    }

    if (this.engine.s.cardsPlayedThisRound >= MAX_CARDS || this.engine.hand.length === 0) {
      // Wait for any pending swap selection before ending
      if (this.engine.pendingSwaps > 0) {
        this.renderBattle(); // show swap prompt
        return;
      }
      setTimeout(() => this.endCurrentRound(), 300);
      return;
    }

    this.renderBattle();
  }

  endCurrentRound() {
    this.engine.endRound();
    if (this.engine.s.gameOver) {
      this.renderBattle();
      return;
    }
    this.engine.startRound();
    this.renderBattle();
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const ui = new GameUI();
  ui.init();
});
