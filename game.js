// ============================================================
// アイドルカードバトル Demo - 完整战斗引擎 + UI
// ============================================================

// --- CONSTANTS ---
const ROCK = 'rock', SCISSORS = 'scissors', PAPER = 'paper';
const GESTURES = [ROCK, SCISSORS, PAPER];
const G_NAME = { rock: 'グー', scissors: 'チョキ', paper: 'パー' };
const G_ICON = { rock: '✊', scissors: '✌️', paper: '🖐️' };
const G_COLOR = { rock: '#e67e22', scissors: '#e74c3c', paper: '#3498db' };
const COUNTER = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
const SELF_DMG = 4;
const MAX_CARDS = 3;
const HAND_SIZE = 5;
const MAX_ROUNDS = 15;

const SYS_NAME = {
  commercial: 'ビジネス', empathy: '共感', logic: 'ロジック', neutral: 'ニュートラル'
};
const SYS_COLOR = {
  commercial: '#d4a843', empathy: '#e85d75', logic: '#4db8ff', neutral: '#a0a8b8'
};

// --- CARD LIBRARY ---
// Each card: { id, name, system, gestures:[g1,g2], desc, counterDesc, special? }
// Effects are resolved in applyCardEffect()

const CARD_LIB = {
  // === NEUTRAL ===
  n_qicheng:   { name:'出発', system:'neutral', gestures:[ROCK,SCISSORS],
    desc:'6ダメージ', cDesc:'4ダメージ', fx:{dmg:6}, cfx:{dmg:4} },
  n_ganji_heal:{ name:'気力·回', system:'neutral', gestures:[PAPER,ROCK],
    desc:'回復7', cDesc:'回復3', fx:{heal:7}, cfx:{heal:3} },
  n_youyu:     { name:'躊躇', system:'neutral', gestures:[SCISSORS,PAPER],
    desc:'3ダメ,被ダメ½', cDesc:'4ダメージ', fx:{dmg:3,reduce:0.5}, cfx:{dmg:4} },
  n_wuchang:   { name:'無常', system:'neutral', gestures:[ROCK,PAPER],
    desc:'3ダメ,ランダムロック', cDesc:'5ダメージ', fx:{dmg:3,lock:1}, cfx:{dmg:5} },
  n_ganji_pas: { name:'気力·熱', system:'neutral', gestures:[SCISSORS,ROCK],
    desc:'2ダメ,情熱+2', cDesc:'6ダメージ', fx:{dmg:2,passion:2}, cfx:{dmg:6} },
  n_shouze:    { name:'規則', system:'neutral', gestures:[PAPER,SCISSORS],
    desc:'2ダメ,弱点+2', cDesc:'6ダメージ', fx:{dmg:2,weakness:2}, cfx:{dmg:6} },
  n_genghuan:  { name:'交替', system:'neutral', gestures:[ROCK,PAPER],
    desc:'4ダメ,1枚交換', cDesc:'4ダメージ', fx:{dmg:4,swap:1}, cfx:{dmg:4} },
  n_xushi:     { name:'蓄勢', system:'neutral', gestures:[SCISSORS,ROCK],
    desc:'自傷2,情熱+5', cDesc:'3ダメージ', fx:{selfDmg:2,passion:5}, cfx:{dmg:3} },

  // === COMMERCIAL ===
  c_daji:      { name:'打撃', system:'commercial', gestures:[ROCK,SCISSORS],
    desc:'4ダメージ,ロック1', cDesc:'4ダメージ', fx:{dmg:4,lock:1}, cfx:{dmg:4} },
  c_huanhe:    { name:'緩和', system:'commercial', gestures:[PAPER,ROCK],
    desc:'回復6,ロック1', cDesc:'回復4', fx:{heal:6,lock:1}, cfx:{heal:4} },
  c_duichong:  { name:'ヘッジ', system:'commercial', gestures:[SCISSORS,PAPER],
    desc:'3ダメージ,被ダメ-50%', cDesc:'3ダメ+減ダメ+ロック1', fx:{dmg:3,reduce:0.5}, cfx:{dmg:3,reduce:0.5,lock:1} },
  c_zhuanli:   { name:'特許', system:'commercial', gestures:[ROCK,PAPER],
    desc:'3ダメージ,ロック1', cDesc:'3ダメージ+ロック2', fx:{dmg:3,lock:1}, cfx:{dmg:3,lock:2} },
  c_tuixiao:   { name:'セールス', system:'commercial', gestures:[SCISSORS,ROCK],
    desc:'4ダメ,ロック毎+2', cDesc:'再発動', fx:{dmg:4,special:'tuixiao'}, cfx:{special:'tuixiao_re'} },
  c_qingsuan:  { name:'清算', system:'commercial', gestures:[PAPER,SCISSORS],
    desc:'全ロック解除,18ダメ', cDesc:'回復12', fx:{special:'qingsuan'}, cfx:{special:'qingsuan_c'} },
  c_zhihuan:   { name:'交換', system:'commercial', gestures:[ROCK,PAPER],
    desc:'6ダメ,1枚交換', cDesc:'6ダメ+再交換', fx:{dmg:6,swap:1}, cfx:{dmg:6,swap:2} },
  c_daijia:    { name:'代償', system:'commercial', gestures:[SCISSORS,ROCK],
    desc:'自傷2,ロック2', cDesc:'次ターン持続', fx:{selfDmg:2,lock:2}, cfx:{selfDmg:2,lock:2,special:'persist'} },

  // === EMPATHY ===
  e_reqing:    { name:'情熱', system:'empathy', gestures:[ROCK,SCISSORS],
    desc:'3ダメ,情熱+2', cDesc:'4ダメージ', fx:{dmg:3,passion:2}, cfx:{dmg:4} },
  e_fusu:      { name:'回復', system:'empathy', gestures:[PAPER,ROCK],
    desc:'回復5,情熱+2', cDesc:'回復2', fx:{heal:5,passion:2}, cfx:{heal:2} },
  e_kunjing:   { name:'苦境', system:'empathy', gestures:[SCISSORS,PAPER],
    desc:'2ダメ,被ダメ-50%', cDesc:'情熱+4', fx:{dmg:2,reduce:0.5}, cfx:{passion:4} },
  e_yayi:      { name:'抑圧', system:'empathy', gestures:[ROCK,PAPER],
    desc:'自傷3,情熱+5', cDesc:'4ダメージ', fx:{selfDmg:3,passion:5}, cfx:{dmg:4} },
  e_tupo:      { name:'突破', system:'empathy', gestures:[SCISSORS,ROCK],
    desc:'5ダメ;情熱≥3:消費3,+8ダメ', cDesc:'情熱+1', fx:{dmg:5,special:'tupo'}, cfx:{passion:1} },
  e_linian:    { name:'理念', system:'empathy', gestures:[PAPER,SCISSORS],
    desc:'6ダメ+情熱全消費×3', cDesc:'ダメの50%回復', fx:{dmg:6,special:'linian'}, cfx:{special:'linian_c'} },
  e_zhuanhuan: { name:'転換', system:'empathy', gestures:[ROCK,PAPER],
    desc:'4ダメ,1枚交換', cDesc:'4ダメ+再交換', fx:{dmg:4,swap:1}, cfx:{dmg:4,swap:2} },
  e_guozai:    { name:'過負荷', system:'empathy', gestures:[SCISSORS,ROCK],
    desc:'自傷2,次ターン情熱+8', cDesc:'回復4', fx:{selfDmg:2,special:'guozai'}, cfx:{heal:4} },

  // === LOGIC ===
  l_guancha:   { name:'観察', system:'logic', gestures:[ROCK,SCISSORS],
    desc:'2ダメ,弱点+2', cDesc:'3ダメージ', fx:{dmg:2,weakness:2}, cfx:{dmg:3} },
  l_jiesuan:   { name:'決算', system:'logic', gestures:[PAPER,ROCK],
    desc:'回復4,弱点+2', cDesc:'回復2', fx:{heal:4,weakness:2}, cfx:{heal:2} },
  l_baogao:    { name:'報告', system:'logic', gestures:[SCISSORS,PAPER],
    desc:'3ダメージ,被ダメ-50%', cDesc:'3ダメ+減ダメ+弱点2', fx:{dmg:3,reduce:0.5}, cfx:{dmg:3,reduce:0.5,weakness:2} },
  l_shencha:   { name:'審査', system:'logic', gestures:[ROCK,PAPER],
    desc:'弱点+3', cDesc:'弱点+6', fx:{weakness:3}, cfx:{weakness:6} },
  l_tuidiao:   { name:'推敲', system:'logic', gestures:[SCISSORS,ROCK],
    desc:'3ダメ+弱点層ダメ', cDesc:'再発動', fx:{dmg:3,special:'tuidiao'}, cfx:{special:'tuidiao_c'} },
  l_hegui:     { name:'合規', system:'logic', gestures:[PAPER,SCISSORS],
    desc:'弱点消費,層×2ダメ', cDesc:'次ターン減衰なし', fx:{special:'hegui'}, cfx:{special:'hegui_c'} },
  l_zhihuan:   { name:'置换', system:'logic', gestures:[ROCK,PAPER],
    desc:'5ダメ,1枚交換', cDesc:'5ダメ+再交換', fx:{dmg:5,swap:1}, cfx:{dmg:5,swap:2} },
  l_fushen:    { name:'再審', system:'logic', gestures:[SCISSORS,ROCK],
    desc:'自傷4,次ターン弱点+3', cDesc:'回復4', fx:{selfDmg:4,special:'fushen'}, cfx:{heal:4} },
};

// --- DECK CONFIGS (12 cards, each with ONE fixed gesture assigned at deck-build time) ---
// 组卡时每枚卡指定一个手势，进战斗后不能改
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

// --- BOSS CONFIGS ---
const BOSSES = {
  commercial: {
    name: 'ビジネス審査官',
    hp: 80,
    mods: ['ランダムロック','封印ダメボーナス','ターン末回復3'],
    desc: '毎ターンランダムロック | ロック毎+2ダメ | ターン末回復3'
  },
  empathy: {
    name: '共感の捕食者',
    hp: 80,
    mods: ['勝利情熱3','引分情熱2','敗北情熱2','ターン末ダメージ2'],
    desc: 'BOSSじゃんけん勝利+3情熱 | 引分+2情熱 | 敗北+2情熱 | ターン末2ダメージ'
  },
  logic: {
    name: 'ロジック裁定者',
    hp: 80,
    mods: ['勝利弱点4','ターン末弱点1','2以下免疫'],
    desc: 'BOSSじゃんけん勝利→弱点+4 | ターン末弱点+1 | 2以下免疫'
  },
};

// ============================================================
// BATTLE ENGINE
// ============================================================
class BattleEngine {
  static lastBossKey = null;

  constructor(systemKey, modCount, enableProtection) {
    this.systemKey = systemKey;
    // Random boss, avoid repeat
    const bossKeys = Object.keys(BOSSES);
    const pool = bossKeys.filter(k => k !== BattleEngine.lastBossKey);
    const actualBossKey = pool[Math.floor(Math.random() * pool.length)];
    BattleEngine.lastBossKey = actualBossKey;
    const bossConf = { ...BOSSES[actualBossKey] };
    // Difficulty: limit number of mods
    const mc = Math.min(modCount || 3, bossConf.mods.length);
    const shuffledMods = [...bossConf.mods].sort(() => Math.random() - 0.5);
    bossConf.mods = shuffledMods.slice(0, mc);
    bossConf.desc = bossConf.mods.join(' | ') + (mc < 3 ? '' : '');
    this.modBonus = (modCount >= 4) ? 1 : 0;
    this.enableProtection = !!enableProtection; // super hard: all mod values +1
    // Build deck (card objects with unique instance ids)
    this.deck = DECKS[systemKey].map((entry, i) => ({
      ...CARD_LIB[entry.id],
      id: entry.id + '_' + i,
      cardId: entry.id,
      gesture: entry.g  // 手はデッキ構築時に固定
    }));

    // State
    this.s = {
      playerHp: 100, playerMaxHp: 100,
      bossHp: bossConf.hp, bossMaxHp: bossConf.hp,
      // Resources
      passion: 0,          // player passion
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
      this.addLog(`遅延効果: +${this.s.nextRoundPassion}情熱`);
      this.s.nextRoundPassion = 0;
    }
    if (this.s.nextRoundWeakness > 0) {
      this.s.bossWeakness += this.s.nextRoundWeakness;
      this.addLog(`遅延効果: BOSS弱点+${this.s.nextRoundWeakness}弱点`);
      this.s.nextRoundWeakness = 0;
    }

    // Check 50HP threshold recovery
    if (!this.s.bossPassiveActive && this.s.threshold50Triggered) {
      if (this.s.bossPassiveRoundsLeft <= 0) {
        this.s.bossPassiveActive = true;
        this.s.bossLocks = new Set();
        this.addLog('BOSSパッシブ回復');
      }
    }

    // Clear non-persistent locks on player
    if (!this.s.persistLocks) {
      this.s.playerLocks.clear();
    }
    this.s.persistLocks = false;

    // Boss mod: ランダムロック (lock one of player's gestures at round start)
    if (this.s.bossMods.includes('ランダムロック') && this.s.bossPassiveActive) {
      const g = GESTURES[Math.floor(Math.random() * 3)];
      this.s.playerLocks.add(g);
      this.addLog(`BOSSパッシブ: ランダムロックあなたの ${G_NAME[g]}${G_ICON[g]}`);
    }

    this.drawHand();
    this.currentBossGesture = this.rollBossGesture();
    this.addLog(`=== 第${this.s.round}ターン ===`);
    this.addLog(`BOSSの手: ${G_NAME[this.currentBossGesture]}${G_ICON[this.currentBossGesture]}`);
    return this.currentBossGesture;
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
    const chosenGesture = card.gesture; // 固定の手
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
      result.events.push(`BOSS攻撃: ${SELF_DMG}+${this.s.bossPassion}情熱=${hitDmg}`);
      this.s.bossPassion = Math.max(0, this.s.bossPassion - 1);
    } else {
      result.events.push(`BOSS攻撃${hitDmg}`);
    }
    // Apply damage reduction if active
    if (this.s.damageReduce > 0) {
      const reduced = Math.floor(hitDmg * this.s.damageReduce);
      hitDmg -= reduced;
      result.events.push(`減ダメ${Math.round(this.s.damageReduce*100)}%→${hitDmg}`);
    }
    this.s.playerHp -= hitDmg;
    result.selfDamageTaken += hitDmg;

    // 2. Read passion for damage bonus, THEN decay
    // (decay before card effects so new passion gains aren't eaten this turn)
    const totalPassion = this.s.passion;
    if (this.s.passion > 0) {
      this.s.passion--;
      result.events.push(`情熱-1(→${this.s.passion})`);
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
      if (this.s.bossMods.includes('2以下免疫') && wDmg <= 2 && this.s.bossPassiveActive) {
        result.events.push(`弱点${wDmg}→BOSS免疫(≤2)`);
        wDmg = 0;
      }
      if (wDmg > 0) {
        this.s.bossHp -= wDmg;
        result.damageDealt += wDmg;
        result.events.push(`弱点ダメ${wDmg}→BOSS`);
      }
    }

    // 5. RPS result display
    const rpsText = isCounter ? '勝ち✓' : (rpsResult === 'draw' ? '引分' : '被勝ち✗');
    result.events.push(`${G_ICON[chosenGesture]}${G_NAME[chosenGesture]} vs ${G_ICON[bossG]}${G_NAME[bossG]} → ${rpsText}`);

    // 6. Apply card effects
    const fx = isCounter ? (card.cfx || {}) : (card.fx || {});

    // Base damage
    let dmg = fx.dmg || 0;
    if (dmg > 0 && totalPassion > 0) {
      const orig = dmg;
      dmg += totalPassion;
      result.events.push(`情熱ボーナス: ${orig}+${totalPassion}=${dmg}`);
    }

    // Healing
    let heal = fx.heal || 0;

    // Self damage from card
    if (fx.selfDmg) {
      this.s.playerHp -= fx.selfDmg;
      result.selfDamageTaken += fx.selfDmg;
      result.events.push(`卡牌自傷${fx.selfDmg}`);
    }

    // Damage reduction
    if (fx.reduce) {
      this.s.damageReduce = Math.max(this.s.damageReduce, fx.reduce);
      result.events.push(`被ダメ減少${Math.round(fx.reduce*100)}%`);
    }

    // Passion gain
    if (fx.passion) {
      this.s.passion += fx.passion;
      result.events.push(`+${fx.passion}情熱(→${this.s.passion})`);
    }

    // Weakness give (to boss)
    if (fx.weakness) {
      this.s.bossWeakness += fx.weakness;
      result.events.push(`BOSS+${fx.weakness}弱点(→${this.s.bossWeakness})`);
    }

    // Lock (on boss)
    if (fx.lock) {
      for (let i = 0; i < fx.lock; i++) {
        const g = GESTURES[Math.floor(Math.random() * 3)];
        if (this.s.bossLocks.size < 2 && !this.s.bossLocks.has(g)) {
          this.s.bossLocks.add(g);
          result.events.push(`BOSSロック ${G_NAME[g]}${G_ICON[g]}`);
        } else {
          result.events.push(`ロック失敗(${G_NAME[g]}ロック済/满)`);
        }
      }
    }

    // Swap: store pending count, player chooses which card to replace
    if (fx.swap) {
      const availRemain = this.deck.filter(c => !this.hand.includes(c));
      const swapCount = Math.min(fx.swap, availRemain.length, this.hand.filter(c => c.id !== card.id).length);
      if (swapCount > 0) {
        this.pendingSwaps = swapCount;
        result.events.push(`\u{1f501} \u9009\u62e9${swapCount}\u5f20\u724c\u66ff\u6362`);
      }
    }

    // --- SPECIAL EFFECTS ---
    if (fx.special) {
      switch(fx.special) {
        case 'tuixiao': {
          // セールス: each lock on boss +2 damage
          const lockBonus = this.s.bossLocks.size * 2;
          dmg += lockBonus;
          if (lockBonus > 0) result.events.push(`セールスロック加成+${lockBonus}`);
          break;
        }
        case 'tuixiao_re': {
          // セールス counter: retrigger (double the base effect)
          const lockBonus2 = this.s.bossLocks.size * 2;
          const extraDmg = (fx.dmg || 4) + totalPassion + lockBonus2;
          dmg = extraDmg * 2;
          result.events.push(`セールス勝ち再発動! 总伤${dmg}`);
          break;
        }
        case 'qingsuan': {
          // 清算: release all locks, deal 18 if had locks
          if (this.s.bossLocks.size > 0) {
            dmg = 18;
            result.events.push(`清算! 解除${this.s.bossLocks.size}锁,18ダメージ`);
            this.s.bossLocks.clear();
          } else {
            dmg = 0;
            result.events.push('清算: 无ロック,无效果');
          }
          break;
        }
        case 'qingsuan_c': {
          // 清算 counter: heal 12
          heal = 12;
          if (this.s.bossLocks.size > 0) {
            dmg = 18;
            this.s.bossLocks.clear();
            result.events.push(`清算勝ち! 18ダメージ+回復12`);
          } else {
            result.events.push('清算勝ち: 回復12');
          }
          break;
        }
        case 'persist': {
          this.s.persistLocks = true;
          result.events.push('ロック持续到下ターン');
          break;
        }
        case 'tupo': {
          // 突破: if passion >= 3 (pre-decay), consume 3, +8 damage
          if (totalPassion >= 3) {
            this.s.passion = Math.max(0, this.s.passion - 3);
            dmg += 8;
            result.events.push(`突破! 消費3情熱,+8ダメージ(→${this.s.passion}情熱)`);
          } else {
            result.events.push(`突破: 情熱不足(${totalPassion}<3)`);
          }
          break;
        }
        case 'linian': {
          // 理念: clear passion (pre-decay value), deal passion*3
          const bonus = totalPassion * 3;
          dmg += bonus;
          result.events.push(`理念! ${totalPassion}情熱×3=${bonus}ダメージ`);
          this.s.passion = 0;
          break;
        }
        case 'linian_c': {
          // 理念 counter: 6 base + passion*3 + heal 50%
          dmg = 6;
          const bonus2 = totalPassion * 3;
          dmg += bonus2;
          heal = Math.floor(dmg / 2);
          result.events.push(`理念勝ち! ${dmg}ダメージ,回復${heal}`);
          this.s.passion = 0;
          break;
        }
        case 'guozai': {
          // 過負荷: next round +8 passion
          this.s.nextRoundPassion += 8;
          result.events.push('過負荷: 下ターン+8情熱');
          break;
        }
        case 'tuidiao': {
          // 推敲: +weakness layers damage
          const wBonus = this.s.bossWeakness;
          dmg += wBonus;
          result.events.push(`推敲: +${wBonus}弱点ダメ`);
          break;
        }
        case 'tuidiao_c': {
          // 推敲 counter: retrigger
          const wBonus2 = this.s.bossWeakness;
          const singleHit = 3 + wBonus2 + totalPassion;
          dmg = singleHit * 2;
          result.events.push(`推敲勝ち再発動! ${singleHit}×2=${dmg}`);
          break;
        }
        case 'hegui': {
          // 合規: consume all weakness, layers*2 damage
          dmg = this.s.bossWeakness * 2;
          result.events.push(`合規! ${this.s.bossWeakness}層×2=${dmg}ダメ`);
          this.s.bossWeakness = 0;
          break;
        }
        case 'hegui_c': {
          // 合規 counter: + no decay next round
          dmg = this.s.bossWeakness * 2;
          this.s.noWeaknessDecay = true;
          result.events.push(`合規勝ち! ${this.s.bossWeakness}層×2=${dmg},次ターン減衰なし`);
          this.s.bossWeakness = 0;
          break;
        }
        case 'baogao_c': {
          // 报告 counter: on being attacked, give 2 weakness
          this.s.bossWeakness += 2;
          result.events.push(`報告カード勝ち: BOSS+2弱点(→${this.s.bossWeakness})`);
          break;
        }
        case 'fushen': {
          // 再審: next round +3 weakness on boss
          this.s.nextRoundWeakness += 3;
          result.events.push('再審: 次ターンBOSS+3弱点');
          break;
        }
      }
    }

    // Apply boss immune to <=2
    if (this.s.bossMods.includes('2以下免疫') && dmg > 0 && dmg <= 2 && this.s.bossPassiveActive) {
      result.events.push(`${dmg}ダメージ→BOSS免疫(≤2)`);
      dmg = 0;
    }

    // Apply damage and healing
    if (dmg > 0) {
      this.s.bossHp -= dmg;
      result.damageDealt += dmg;
      result.events.push(`→ ${dmg}ダメージ(BOSS: ${this.s.bossHp}/${this.s.bossMaxHp})`);
    }
    if (heal > 0) {
      this.s.playerHp = Math.min(this.s.playerMaxHp, this.s.playerHp + heal);
      result.healDone += heal;
      result.events.push(`→ 回復${heal}HP(${this.s.playerHp}/${this.s.playerMaxHp})`);
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
      this.addLog(`BOSS\u4e0b\u4e00\u624b: ${G_NAME[this.currentBossGesture]}${G_ICON[this.currentBossGesture]}`);
    }

    return result;
  }

  applyBossPerCardMods(cardIndex, playerG, bossG, rpsResult, result) {
    if (!this.s.bossPassiveActive) return;
    const isWin = rpsResult === 'counter'; // player wins
    const isLose = rpsResult === 'lose';

    for (const mod of this.s.bossMods) {
      switch(mod) {
        case '勝利ダメ2':
          if (isLose) { // boss wins (player loses)
            this.s.playerHp -= 2;
            result.events.push('BOSSパッシブ: じゃんけん勝利+2ダメージ');
          }
          break;
        case '平负ダメージ1':
          if (!isLose) { // boss doesn't win
            this.s.playerHp -= 1;
            result.events.push('BOSSパッシブ: 平/负+1ダメージ');
          }
          break;
        case '第三枚6ダメージ':
          if (cardIndex === 2) {
            this.s.playerHp -= 6;
            result.events.push('BOSSパッシブ: 第三枚+6ダメージ');
          }
          break;
        case '封印ダメボーナス':
          if (this.s.playerLocks.size > 0) {
            const bonus = this.s.playerLocks.size * 2;
            this.s.playerHp -= bonus;
            result.events.push(`BOSSパッシブ: ${this.s.playerLocks.size}锁+${bonus}ダメージ`);
          }
          break;
        case '解锁反击':
          if (this.s.playerLocks.has(playerG)) {
            this.s.playerLocks.delete(playerG);
            this.s.playerHp -= 4;
            result.events.push(`BOSSパッシブ: 解锁反击${G_NAME[playerG]},4ダメージ`);
          }
          break;
        case '勝利情熱3':
          if (isLose) { // boss wins (player loses)
            this.s.bossPassion += 3 + this.modBonus;
            result.events.push(`BOSSパッシブ: じゃんけん勝利+3情熱(→${this.s.bossPassion})`);
          }
          break;
        case '引分情熱2':
          if (!isWin && !isLose) { // draw only
            this.s.bossPassion += 2 + this.modBonus;
            result.events.push(`BOSSパッシブ: 引分+2情熱(→${this.s.bossPassion})`);
          }
          break;
        case '敗北情熱2':
          if (isWin) { // player wins = boss loses
            this.s.bossPassion += 2 + this.modBonus;
            result.events.push(`BOSSパッシブ: 敗北+2情熱(→${this.s.bossPassion})`);
          }
          break;
        case '勝利封印':
          if (isLose) { // boss wins
            const g = GESTURES[Math.floor(Math.random() * 3)];
            this.s.playerLocks.add(g);
            result.events.push(`BOSSパッシブ: 勝利封印 ${G_NAME[g]}`);
          }
          break;
        case '1枚目封印':
          if (cardIndex === 0) {
            const g = GESTURES[Math.floor(Math.random() * 3)];
            this.s.playerLocks.add(g);
            result.events.push(`BOSSパッシブ: 1枚目封印 ${G_NAME[g]}`);
          }
          break;
        case '勝利弱点4':
          if (isLose) {
            this.s.playerWeakness += 4 + this.modBonus;
            result.events.push(`BOSSパッシブ: じゃんけん勝利+4弱点(あなた:${this.s.playerWeakness}層)`);
          }
          break;
        case '引分弱点2':
          if (!isLose) {
            this.s.playerWeakness += 2;
            result.events.push(`BOSSパッシブ: 平/负+2弱点(あなた:${this.s.playerWeakness}層)`);
          }
          break;
        case '3枚目弱点5':
          if (cardIndex === 2) {
            this.s.playerWeakness += 5;
            result.events.push(`BOSSパッシブ: 第三枚+5弱点(あなた:${this.s.playerWeakness}層)`);
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
    if (this.s.bossPassiveActive) {
      for (const mod of this.s.bossMods) {
        switch(mod) {
          case 'ターン末ダメージ2':
            this.s.playerHp -= 2 - this.modBonus;
            result.events.push(`BOSSパッシブ: ターン末+${2+this.modBonus}ダメージ`);
            break;
          case 'ターン末回復3':
            this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + 3 + this.modBonus);
            result.events.push(`BOSSパッシブ: ターン末回復3(→${this.s.bossHp})`);
            break;
          case 'ターン末弱点1':
            this.s.playerWeakness += 1 + this.modBonus;
            result.events.push(`BOSSパッシブ: ターン末+1弱点(あなた:${this.s.playerWeakness}層)`);
            break;
        }
      }
    }

    // Boss passion decay at end of round (50%)
    if (this.s.bossPassion > 0) {
      const bpBefore = this.s.bossPassion;
      this.s.bossPassion = Math.floor(this.s.bossPassion / 2);
      result.events.push(`BOSS情熱減衰: ${bpBefore}→${this.s.bossPassion}`);
    }

    // Weakness decay (boss weakness, 50% end of round)
    if (this.s.bossWeakness > 0) {
      if (this.s.noWeaknessDecay) {
        result.events.push(`BOSS弱点${this.s.bossWeakness}層(今ターン減衰なし}`);
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
      result.events.push('⚡ 50血线発動! 次ターンBOSSパッシブ無効,全手ロック');
    }

    // Decrement protection rounds
    if (this.s.bossPassiveRoundsLeft > 0) {
      this.s.bossPassiveRoundsLeft--;
    }

    this.addLog('--- ターン精算 ---');
    for (const e of result.events) this.addLog(e);

    this.checkGameOver();
    return result;
  }

  checkGameOver() {
    if (this.s.bossHp <= 0) {
      this.s.gameOver = true;
      this.s.winner = 'player';
      this.addLog('🎉 BOSS撃破!!');
    } else if (this.s.playerHp <= 0) {
      this.s.gameOver = true;
      this.s.winner = 'boss';
      this.addLog('💀 你撃破!...');
    } else if (this.s.round >= MAX_ROUNDS) {
      this.s.gameOver = true;
      this.s.winner = 'boss';
      this.addLog('⏰ タイムアウト,BOSS勝利');
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
      this.addLog(`\u{1f501} ${cardToReplace.name}(${G_ICON[cardToReplace.gesture]}) \u2192 ${newCard.name}(${G_ICON[newCard.gesture]})`);
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
                <div class="sys-boss">VS: ランダムBOSS</div>
                <div class="sys-desc">${{
                  commercial:'\u5c01\u9501\u654c\u65b9\u624b\u52bf\uff0c\u88ab\u9501\u624b\u52bf\u81ea\u52a8\u514b\u5236\u3002\u6700\u591a2\u4e2a\u9501\u5b9a\u3002\u6e05\u7b97\u89e3\u9664\u5168\u90e8\u9501\u5b9a+\u7206\u53d1\u4f24\u5bb3',
                  empathy:'\u5806\u53e0\u70ed\u60c5\u589e\u52a0\u653b\u51fb\u4f24\u5bb3\uff0c\u6bcf\u51fa\u724c\u70ed\u60c5-1\u3002\u7406\u5ff5\u6e05\u7a7a\u70ed\u60c5\u00d73\u7206\u53d1',
                  logic:'\u7ed9BOSS\u5806\u7834\u7efd\uff0c\u6bcf\u51fa\u724c\u89e6\u53d1\u7834\u7efd\u5c42\u4f24\u5bb3\u3002\u56de\u5408\u672b\u7834\u7efd\u8870\u51cf50%'
                }[s]}</div>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="rules-summary">
          <h3>コアルール</h3>
          <div class="rules-cols">
            <div class="rules-col">
              <b>基本ルール</b>
              <ul>
                <li>每ターン从12枚牌抽5枚，最多出3枚</li>
                <li>各カードの手は固定(デッキ構築時に決定)</li>
                <li>每出1枚牌 = BOSS攻撃你4HP(カードコスト)</li>
                <li>BOSSは毎カードランダムに手を事前表示</li>
                <li>あなたの手がBOSSに勝つ → カード⭐勝ち効果発動</li>
                <li>1枚出すとBOSSが手を変え、次を決める</li>
                <li>HP≤50で保護発動(BOSSパッシブ無効1ターン)</li>
              </ul>
            </div>
            <div class="rules-col">
              <b style="color:#d4a843">💰 ビジネス · 封鎖</b>
              <ul>
                <li>BOSSの手を封印、封印手が出たら自動勝利</li>
                <li>最大2つロック、ランダム指定</li>
                <li>清算：解除全部ロック，18ダメージ</li>
                <li>セールス:ロック毎+2ダメ</li>
              </ul>
              <b style="color:#e85d75">🔥 共情システム · 情熱</b>
              <ul>
                <li>情熱增加卡牌攻击ダメージ(+情熱層数)</li>
                <li>每出1枚牌，情熱-1</li>
                <li>理念：清空情熱，情熱×3ダメージ</li>
                <li>突破：消費3情熱，额外+8ダメージ</li>
              </ul>
              <b style="color:#4db8ff">💢 ロジックシステム · 弱点</b>
              <ul>
                <li>BOSSに弱点を積み重ねる</li>
                <li>1枚出す毎にBOSSが弱点層ダメージを受ける</li>
                <li>ターン末弱点減衰50%</li>
                <li>推演：追加弱点層ダメージ</li>
                <li>リセット：弱点全消費、層×2ダメージ</li>
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
          <div class="title-icon">\u{1f3af}</div>
          <h1 style="background:${sysColor};-webkit-background-clip:text;-webkit-text-fill-color:transparent">${sysName}\u4f53\u7cfb</h1>
          <p class="subtitle">\u9009\u62e9BOSS\u96be\u5ea6 (\u968f\u673cBOSS + N\u4e2a\u8bcd\u6761)</p>
        </div>
        <div class="system-cards">
          <button class="system-btn diff-btn" data-mods="1" style="--sys-color:#4ade80">
            <div class="sys-name">1\u8bcd\u6761</div>
            <div class="sys-desc">\u5165\u95e8\u96be\u5ea6\u3002BOSS\u53ea\u6709\u4e00\u4e2a\u88ab\u52a8\u6548\u679c</div>
          </button>
          <button class="system-btn diff-btn" data-mods="2" style="--sys-color:#f59e0b">
            <div class="sys-name">2\u8bcd\u6761</div>
            <div class="sys-desc">\u6807\u51c6\u96be\u5ea6\u3002\u4e24\u4e2a\u88ab\u52a8\u8bcd\u6761\u53e0\u52a0</div>
          </button>
          <button class="system-btn diff-btn" data-mods="3" style="--sys-color:#ef4444">
            <div class="sys-name">3\u8bcd\u6761</div>
            <div class="sys-desc">\u56f0\u96be\u96be\u5ea6\u3002\u5168\u8bcd\u6761\u538b\u529b\u62c9\u6ee1</div>
          </button>
          <button class="system-btn diff-btn" data-mods="4" style="--sys-color:#a855f7">
            <div class="sys-name">3\u8bcd\u6761+1</div>
            <div class="sys-desc">\u8d85\u9ad8\u96be\u5ea6\u3002\u5168\u8bcd\u6761+\u6570\u503c\u5168\u90e8+1</div>
          </button>
        </div>
        <div class="protect-toggle">
          <label class="toggle-label">
            <input type="checkbox" id="protectToggle"> 
            <span>\u542f\u752850\u8840\u7ebf\u4fdd\u62a4 (\u6253\u4e0d\u8fc7\u53ef\u4ee5\u5f00)</span>
          </label>
        </div>
        <button class="btn-back" id="btnBack">\u2190 \u8fd4\u56de\u9009\u62e9\u4f53\u7cfb</button>
      </div>`;
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.onclick = () => { const prot = document.getElementById('protectToggle').checked; this.startGame(this.selectedSystem, parseInt(btn.dataset.mods), prot); };
    });
    document.getElementById('btnBack').onclick = () => {
      this.phase = 'title';
      this.render();
    };
  }

  startGame(systemKey, modCount, enableProtection) {
    this.engine = new BattleEngine(systemKey, modCount, enableProtection);
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
        <h2>3つだけ覚えればOK</h2>
        <div class="tut-cards">
          <div class="tut-card">
            <div class="tut-icon" style="color:#ef4444">💔</div>
            <div class="tut-title">カードを出す = HP減少</div>
            <div class="tut-desc">1枚出すごとにHP4減少。出すほど攻撃力UP、でもリスクも増加。毎ターン3枚出す必要はない。</div>
          </div>
          <div class="tut-card">
            <div class="tut-icon" style="color:#4ade80">✊✌️🖐️</div>
            <div class="tut-title">じゃんけんで勝負</div>
            <div class="tut-desc">BOSSは手を先に見せる。あなたの手がBOSSに勝てば⭐効果発動(緑=勝ち、赤=負け)。1枚出すとBOSSは手を変える。</div>
          </div>
          <div class="tut-card">
            <div class="tut-icon" style="color:#f59e0b">⚡</div>
            <div class="tut-title">システムが武器</div>
            <div class="tut-desc">ビジネスは封鎖で確定勝利、共感は情熱で火力UP、ロジックは弱点で持続ダメージ。カード説明を読んで組合せを探ろう。</div>
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
              <div class="hp-bar boss-hp" style="width:${Math.max(0,s.bossHp/s.bossMaxHp*100)}%"></div>
              <span class="hp-text">${Math.max(0,s.bossHp)} / ${s.bossMaxHp}</span>
            </div>
          </div>
          <div class="boss-info">
            <div class="boss-gesture ${bossGLocked?'locked':''}">
              <span class="gesture-big">${G_ICON[bossG]}</span>
              <span>${G_NAME[bossG]}${bossGLocked?' \u{1f512}\u5df2\u9501':''}${!s.bossPassiveActive?' \u26a1\u88ab\u52a8\u5931\u6548':''}</span>
            </div>
            <div class="boss-resources">
              ${s.bossPassion>0?`<span class="res-tag passion">\u{1f525}\u70ed\u60c5 ${s.bossPassion}</span>`:''}
              ${s.bossWeakness>0?`<span class="res-tag weakness">\u{1f4a2}\u7834\u7efd ${s.bossWeakness}</span>`:''}
              ${s.bossLocks.size>0?`<span class="res-tag lock">\u{1f512}\u9501:${[...s.bossLocks].map(g=>G_ICON[g]).join('')}</span>`:''}
            </div>
          </div>
          <div class="boss-mods">${s.bossDesc}</div>
        </div>

        <div class="battle-log" id="battleLog">
          ${this.engine.log.slice(-14).map(l => {
            let cls = 'log-info';
            if (l.startsWith('===')) cls = 'log-round';
            else if (l.includes('BOSS攻撃') || l.includes('反噬') || l.includes('自傷') || l.includes('ダメージ→')) cls = 'log-dmg';
            else if (l.includes('回復') || l.includes('') && l.includes('BOSS')) cls = 'log-heal';
            else if (l.includes('情熱') || l.includes('弱点') || l.includes('ロック') || l.includes('🔁')) cls = 'log-res';
            return '<div class="log-line ' + cls + '">' + l + '</div>';
          }).join('')}
        </div>

        <div class="player-area">
          <div class="player-header">
            <div class="player-resources">
              <span class="res-tag round">\u7b2c${s.round}\u56de\u5408</span>
              <span class="res-tag cards-played">${s.cardsPlayedThisRound}/${MAX_CARDS}\u5f20</span>
              ${s.passion>0?`<span class="res-tag passion">\u{1f525}\u70ed\u60c5 ${s.passion}</span>`:''}
              ${s.playerWeakness>0?`<span class="res-tag weakness">\u{1f4a2}\u7834\u7efd ${s.playerWeakness}</span>`:''}
              ${s.playerLocks.size>0?`<span class="res-tag lock-bad">\u{1f512}\u9501:${[...s.playerLocks].map(g=>G_ICON[g]).join('')}</span>`:''}
            </div>
            <div class="hp-bar-wrap">
              <div class="hp-bar player-hp ${s.playerHp<=50?'low':''}" style="width:${Math.max(0,s.playerHp/s.playerMaxHp*100)}%"></div>
              <span class="hp-text">${Math.max(0,s.playerHp)} / ${s.playerMaxHp}</span>
            </div>
          </div>

          <div class="hand" id="hand">
            ${this.engine.hand.map((card, i) => this.renderCard(card, i)).join('')}
          </div>

          <div class="action-bar">
            ${this.engine.pendingSwaps > 0 ? `<div class="swap-prompt">\u{1f501} \u70b9\u51fb\u624b\u724c\u9009\u62e9\u8981\u66ff\u6362\u7684\u724c (\u5269${this.engine.pendingSwaps}\u6b21)</div>` : ''}
            <button class="btn-end-round" id="btnEndRound" ${s.cardsPlayedThisRound===0 || this.engine.pendingSwaps > 0?'disabled':''}>
              \u7ed3\u675f\u56de\u5408 (\u5df2\u51fa${s.cardsPlayedThisRound}\u5f20)
            </button>
            ${s.gameOver ? `<button class="btn-restart" id="btnRestart">\u8fd4\u56de\u9009\u62e9</button>` : ''}
            <button class="btn-help" id="btnHelp">?</button>
          </div>
        </div>

        <!-- HELP OVERLAY -->
        <div class="help-overlay" id="helpOverlay">
          <div class="help-content">
            <h3>ルール説明</h3>
            <div class="help-section">
              <b>基本ルール</b>
              <p>毎ターン5枚引き、最大3枚出す。1枚出す毎にBOSS攻撃4HP。BOSSは毎回ランダムに手を事前表示。あなたの手がBOSSに勝てば⭐効果発動。1枚出すとBOSSS换新手势。HP≤50で保護発動。</p>
            </div>
            <div class="help-section">
              <b style="color:#d4a843">💰 ビジネス · 封印</b>
              <p>BOSSの手を封印(最大2つ)、封印手は自動勝利。終局:全解除+封印毎6ダメ。追撃:封印毎+2ダメ。</p>
            </div>
            <div class="help-section">
              <b style="color:#e85d75">🔥 共情 · 情熱</b>
              <p>情熱が攻撃力UP(+層数)。1枚出す毎に情熱-1。傾注:情熱全消費×3バースト。爆発:情熱3消費+8ダメ。</p>
            </div>
            <div class="help-section">
              <b style="color:#4db8ff">💢 ロジック · 弱点</b>
              <p>BOSSに弱点を付与。1枚出す毎に弱点層ダメージ。ターン末50%減衰。推演：追加弱点ダメ。リセット：弱点消費×2バースト。</p>
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
    const rpsText = rps === 'counter' ? '\u514b\u5236\u2713' : (rps === 'draw' ? '\u5e73\u5c40' : '\u88ab\u514b\u5236\u2717');
    const rpsClass = rps === 'counter' ? 'rps-win' : (rps === 'lose' ? 'rps-lose' : 'rps-draw');
    const isLocked = this.engine.s.playerLocks.has(card.gesture);
    const isNew = card._isNew ? 'card-new' : '';
    if (card._isNew) card._isNew = false;
    return `
      <div class="card ${isPlayable?'playable':''} ${rpsClass} ${isNew}" data-index="${index}" style="--card-color:${sysColor}">
        <div class="card-header">
          <span class="card-sys">${SYS_NAME[card.system]}</span>
          <span class="card-name">${card.name}</span>
          <span class="card-gesture-fixed" style="color:${G_COLOR[card.gesture]}">${G_ICON[card.gesture]}</span>
        </div>
        <div class="card-rps ${rpsClass}">
          ${G_ICON[card.gesture]} vs ${G_ICON[bossG]} \u2192 ${rpsText}
          ${isLocked ? ' \u{1f512}\u88ab\u9501' : ''}
        </div>
        <div class="card-effects">
          <div class="card-fx normal">\u{1f4cb} ${card.desc}</div>
          <div class="card-fx counter">\u2b50 ${card.cDesc}</div>
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
            this.engine.addLog(`BOSS\u4e0b\u4e00\u624b: ${G_NAME[this.engine.currentBossGesture]}${G_ICON[this.engine.currentBossGesture]}`);
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
