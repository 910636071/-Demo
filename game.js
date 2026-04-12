// ============================================================
// 偶像卡牌对战 Demo - 完整战斗引擎 + UI
// ============================================================

// --- CONSTANTS ---
const ROCK = 'rock', SCISSORS = 'scissors', PAPER = 'paper';
const GESTURES = [ROCK, SCISSORS, PAPER];
const G_NAME = { rock: '石头', scissors: '剪刀', paper: '布' };
const G_ICON = { rock: '✊', scissors: '✌️', paper: '🖐️' };
const G_COLOR = { rock: '#e67e22', scissors: '#e74c3c', paper: '#3498db' };
const COUNTER = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
const SELF_DMG = 6;
const MAX_CARDS = 3;
const HAND_SIZE = 5;
const MAX_ROUNDS = 15;
const MAX_LOCKS = 2;

const SYS_NAME = {
  commercial: '商业', empathy: '共情', logic: '逻辑', neutral: '中立'
};
const SYS_COLOR = {
  commercial: '#d4a843', empathy: '#e85d75', logic: '#4db8ff', neutral: '#a0a8b8'
};

// --- CARD LIBRARY ---
// Each card: { id, name, system, gestures:[g1,g2], desc, counterDesc, special? }
// Effects are resolved in applyCardEffect()

const CARD_LIB = {
  // === NEUTRAL ===
  n_qicheng:   { name:'启程', system:'neutral', gestures:[ROCK,SCISSORS],
    desc:'造成6伤害', cDesc:'造成4伤害', fx:{dmg:6}, cfx:{dmg:4} },
  n_ganji_heal:{ name:'干劲·恢', system:'neutral', gestures:[PAPER,ROCK],
    desc:'回复7生命', cDesc:'回复3生命', fx:{heal:7}, cfx:{heal:3} },
  n_youyu:     { name:'犹豫', system:'neutral', gestures:[SCISSORS,PAPER],
    desc:'3伤害,本回合受伤-50%', cDesc:'造成4伤害', fx:{dmg:3,reduce:0.5}, cfx:{dmg:4} },
  n_wuchang:   { name:'无常', system:'neutral', gestures:[ROCK,PAPER],
    desc:'3伤害,随机锁定1', cDesc:'造成5伤害', fx:{dmg:3,lock:1}, cfx:{dmg:5} },
  n_ganji_pas: { name:'干劲·热', system:'neutral', gestures:[SCISSORS,ROCK],
    desc:'2伤害,+2热情', cDesc:'造成6伤害', fx:{dmg:2,passion:2}, cfx:{dmg:6} },
  n_shouze:    { name:'守则', system:'neutral', gestures:[PAPER,SCISSORS],
    desc:'2伤害,+2弱点', cDesc:'造成6伤害', fx:{dmg:2,weakness:2}, cfx:{dmg:6} },
  n_genghuan:  { name:'更换', system:'neutral', gestures:[ROCK,PAPER],
    desc:'4伤害,换1牌', cDesc:'造成4伤害', fx:{dmg:4,swap:1}, cfx:{dmg:4} },
  n_xushi:     { name:'蓄势', system:'neutral', gestures:[SCISSORS,ROCK],
    desc:'自伤2,+5热情', cDesc:'造成3伤害', fx:{selfDmg:2,passion:5}, cfx:{dmg:3} },

  // === COMMERCIAL ===
  c_daji:      { name:'施压', system:'commercial', gestures:[ROCK,SCISSORS],
    desc:'4点伤害+封住1手势', cDesc:'4点伤害+封住1手势', fx:{dmg:4,lock:1}, cfx:{dmg:4} },
  c_huanhe:    { name:'缓和', system:'commercial', gestures:[PAPER,ROCK],
    desc:'回复6+封住1手势', cDesc:'回复4+封住1手势', fx:{heal:6,lock:1}, cfx:{heal:4} },
  c_duichong: {
  name:'应对', system:'commercial', gestures:[SCISSORS,PAPER],
  desc:'3点伤害+受伤减半',
  cDesc:'封住1手势',
  fx:{dmg:3,reduce:0.5},
  cfx:{lock:1}
},
  c_zhuanli: {
  name:'占位', system:'commercial', gestures:[ROCK,PAPER],
  desc:'3点伤害+封住1手势',
  cDesc:'再封住1手势',
  fx:{dmg:3,lock:1},
  cfx:{lock:1}
},
  c_tuixiao:   { name:'乘胜', system:'commercial', gestures:[SCISSORS,ROCK],
    desc:'4点伤害,每封住+2', cDesc:'效果触发两次', fx:{dmg:4,special:'tuixiao'}, cfx:{special:'tuixiao_re'} },
  c_qingsuan:  { name:'终局', system:'commercial', gestures:[PAPER,SCISSORS],
    desc:'解封全部+每封住6伤', cDesc:'回复12生命', fx:{special:'qingsuan'}, cfx:{special:'qingsuan_c'} },
 c_zhihuan: {
  name:'重组', system:'commercial', gestures:[ROCK,PAPER],
  desc:'6点伤害+换1张牌',
  cDesc:'再更换1张牌',
  fx:{dmg:6,swap:1},
  cfx:{swap:1}
},
  c_daijia: {
  name:'押注', system:'commercial', gestures:[SCISSORS,ROCK],
  desc:'自伤2+封住2手势',
  cDesc:'封住效果延续到下回合',
  fx:{selfDmg:2,lock:2},
  cfx:{special:'persist'}
},

  // === EMPATHY ===
 e_reqing: {
  name:'共鸣', system:'empathy', gestures:[ROCK,SCISSORS],
  desc:'3点伤害+积累2热情',
  cDesc:'造成4点伤害',
  fx:{dmg:3,passion:2},
  cfx:{dmg:4}
},
e_fusu: {
  name:'治愈', system:'empathy', gestures:[PAPER,ROCK],
  desc:'回复5+积累2热情',
  cDesc:'回复2',
  fx:{heal:5,passion:2},
  cfx:{heal:2}
},
  e_kunjing: {
  name:'低谷', system:'empathy', gestures:[SCISSORS,PAPER],
  desc:'2点伤害+受伤减半',
  cDesc:'积累4热情',
  fx:{dmg:2,reduce:0.5},
  cfx:{passion:4}
},
 e_yayi: {
  name:'积压', system:'empathy', gestures:[ROCK,PAPER],
  desc:'自伤3+积累5热情',
  cDesc:'造成4点伤害',
  fx:{selfDmg:3,passion:5},
  cfx:{dmg:4}
},
e_tupo: {
  name:'爆发', system:'empathy', gestures:[SCISSORS,ROCK],
  desc:'5点伤害;热情≥3消耗3额外+8',
  cDesc:'+1热情',
  fx:{dmg:5,special:'tupo'},
  cfx:{passion:1}
},
  e_linian:    { name:'倾注', system:'empathy', gestures:[PAPER,SCISSORS],
    desc:'6伤害+清空全部热情×3', cDesc:'回复伤害的50%', fx:{dmg:6,special:'linian'}, cfx:{special:'linian_c'} },
  e_zhuanhuan: {
  name:'转机', system:'empathy', gestures:[ROCK,PAPER],
  desc:'4点伤害+换1张牌',
  cDesc:'再更换1张牌',
  fx:{dmg:4,swap:1},
  cfx:{swap:1}
},
 e_guozai: {
  name:'透支', system:'empathy', gestures:[SCISSORS,ROCK],
  desc:'自伤2+下回合积累8热情',
  cDesc:'回复4生命',
  fx:{selfDmg:2,special:'guozai'},
  cfx:{heal:4}
},

  // === LOGIC ===
  l_guancha:   { name:'洞察', system:'logic', gestures:[ROCK,SCISSORS],
    desc:'2点伤害+给BOSS积2弱点', cDesc:'3点伤害', fx:{dmg:2,weakness:2}, cfx:{dmg:3} },
  l_jiesuan:   { name:'核算', system:'logic', gestures:[PAPER,ROCK],
    desc:'回复4+给BOSS积2弱点', cDesc:'回复2', fx:{heal:4,weakness:2}, cfx:{heal:2} },
  l_baogao: {
  name:'分析', system:'logic', gestures:[SCISSORS,PAPER],
  desc:'3点伤害+受伤减半',
  cDesc:'给BOSS积2弱点',
  fx:{dmg:3,reduce:0.5},
  cfx:{weakness:2}
},
  l_shencha: {
  name:'叠加', system:'logic', gestures:[ROCK,PAPER],
  desc:'给BOSS积3弱点',
  cDesc:'再给予3层弱点',
  fx:{weakness:3},
  cfx:{weakness:3}
},
  l_tuidiao:   { name:'推演', system:'logic', gestures:[SCISSORS,ROCK],
    desc:'3点伤害+弱点层数伤害', cDesc:'效果触发两次', fx:{dmg:3,special:'tuidiao'}, cfx:{special:'tuidiao_c'} },
  l_hegui:     { name:'清零', system:'logic', gestures:[PAPER,SCISSORS],
    desc:'消耗全部弱点,层数×2伤', cDesc:'下回合弱点不衰减', fx:{special:'hegui'}, cfx:{special:'hegui_c'} },
  l_zhihuan: {
  name:'重配', system:'logic', gestures:[ROCK,PAPER],
  desc:'5点伤害+换1张牌',
  cDesc:'再更换1张牌',
  fx:{dmg:5,swap:1},
  cfx:{swap:1}
},
  l_fushen: {
  name:'蓄势', system:'logic', gestures:[SCISSORS,ROCK],
  desc:'自伤4+下回合给BOSS积3弱点',
  cDesc:'回复4点生命',
  fx:{selfDmg:4,special:'fushen'},
  cfx:{heal:4}
}
};

// --- DECK CONFIGS (12 cards, each with ONE fixed gesture assigned at deck-build time) ---
// 组卡时每张卡指定一个手势，进战斗后不能改
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
    name: '商业审查官',
    hp: 80,
    mods: ['随机封锁','封锁伤害加成','回合结束回复3'],
    desc: '每回合随机锁你一个手势 | 每个锁+2伤害 | 回合末回复3'
  },
  empathy: {
    name: '共情吞噬者',
    hp: 80,
    mods: ['胜利热情3','平局热情2','被克热情2','回合结束伤害2'],
    desc: 'BOSS猜拳赢+3热情 | 平局+2热情 | 被克+2热情 | 回合末2伤害'
  },
  logic: {
    name: '逻辑裁定者',
    hp: 80,
    mods: ['胜利弱点4','回合结束弱点1','免疫2点以下'],
    desc: 'BOSS猜拳赢给你4弱点 | 回合末+1弱点 | 免疫≤2伤害'
  },
};

// ============================================================
// BATTLE ENGINE
// ============================================================
class BattleEngine {
  constructor(systemKey, modCount, enableProtection, bossHp) {
    this.systemKey = systemKey;
    // Modifier pool from design document, with system-appropriate counter mods
    const ALL_MODS = [
      // 通用中立词条
      '回合结束伤害2',
      '回合结束回复3',
      '猜拳胜利造成2伤',
      '打出第三张6伤',
      '免疫2点以下',
      // 共情词条
      '胜利热情3', '平局热情2', '被克热情2',
      // 逻辑词条
      '胜利弱点4', '回合结束弱点1',
      // 商业词条（商业体系时加入）
      ...(systemKey === 'commercial' ? ['随机封锁', '封锁伤害加成', '解锁反击4'] : []),
      // 克制词条（设计文档里的平衡词条）
      '猜拳减热情1',     // 每次猜拳玩家-1热情（克共情）
      '猜拳减弱点2',     // 每次猜拳BOSS弱点-2（克逻辑）
    ];
    const BOSS_NAMES = [
      '审判者', '混沌裁决者', '深渊监察官', '无形裁判',
      '境界掌控者', '命运操纵者', '异变守门人', '规则破坏者',
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
      gesture: entry.g  // 固定手势，组卡时已指定
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
      this.addLog(`延迟效果: +${this.s.nextRoundPassion}热情`);
      this.s.nextRoundPassion = 0;
    }
    if (this.s.nextRoundWeakness > 0) {
      this.s.bossWeakness += this.s.nextRoundWeakness;
      this.addLog(`延迟效果: BOSS+${this.s.nextRoundWeakness}弱点`);
      this.s.nextRoundWeakness = 0;
    }

    // Check 50HP threshold recovery
    if (!this.s.bossPassiveActive && this.s.threshold50Triggered) {
      if (this.s.bossPassiveRoundsLeft <= 0) {
        this.s.bossPassiveActive = true;
        this.s.bossLocks = new Set();
        this.addLog('BOSS被动恢复');
      }
    }

    // Clear non-persistent locks on player
    if (!this.s.persistLocks) {
      this.s.playerLocks.clear();
    }
    this.s.persistLocks = false;

    // Boss mod: 随机封锁 (lock one of player's gestures at round start)
   if (this.s.bossMods.includes('随机封锁') && this.s.bossPassiveActive) {
  if (this.s.playerLocks.size < MAX_LOCKS) {
    const unlocked = GESTURES.filter(g => !this.s.playerLocks.has(g));
    if (unlocked.length > 0) {
      const g = unlocked[Math.floor(Math.random() * unlocked.length)];
      this.s.playerLocks.add(g);
      this.addLog(`BOSS随机封锁: ${G_NAME[g]}${G_ICON[g]}`);
    }
  } else {
    this.addLog(`BOSS随机封锁失败: 已达${MAX_LOCKS}锁上限`);
  }
}

    this.drawHand();
    this.currentBossGesture = this.rollBossGesture();
    this.addLog(`=== 第${this.s.round}回合 ===`);
    this.addLog(`BOSS出: ${G_NAME[this.currentBossGesture]}${G_ICON[this.currentBossGesture]}`);
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
    const chosenGesture = card.gesture; // 固定手势
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
      result.events.push(`BOSS攻击: ${SELF_DMG}+${this.s.bossPassion}热情=${hitDmg}`);
      this.s.bossPassion = Math.max(0, this.s.bossPassion - 1);
    } else {
      result.events.push(`BOSS攻击${hitDmg}`);
    }
    // Apply damage reduction if active
    if (this.s.damageReduce > 0) {
      const reduced = Math.floor(hitDmg * this.s.damageReduce);
      hitDmg -= reduced;
      result.events.push(`减伤${Math.round(this.s.damageReduce*100)}%→${hitDmg}`);
    }
    this.s.playerHp -= hitDmg;
    result.selfDamageTaken += hitDmg;

    // 2. Read passion for damage bonus, THEN decay
    // (decay before card effects so new passion gains aren't eaten this turn)
    const totalPassion = this.s.passion;
    if (this.s.passion > 0) {
      this.s.passion--;
      result.events.push(`热情-1(→${this.s.passion})`);
    }

    // 3. Player weakness trigger: take weakness layers as damage
    if (this.s.playerWeakness > 0) {
      const wDmg = this.s.playerWeakness;
      this.s.playerHp -= wDmg;
      result.selfDamageTaken += wDmg;
      result.events.push(`弱点反噬${wDmg}(${this.s.playerWeakness}层)`);
    }

    // 4. Boss weakness trigger: boss takes weakness layers as damage
    if (this.s.bossWeakness > 0) {
      let wDmg = this.s.bossWeakness;
      if (this.s.bossMods.includes('免疫2点以下') && wDmg <= 2 && this.s.bossPassiveActive) {
        result.events.push(`弱点${wDmg}→BOSS免疫(≤2)`);
        wDmg = 0;
      }
      if (wDmg > 0) {
        this.s.bossHp -= wDmg;
        result.damageDealt += wDmg;
        result.events.push(`弱点伤害${wDmg}→BOSS`);
      }
    }

    // 5. RPS result display
    const rpsText = isCounter ? '克制✓' : (rpsResult === 'draw' ? '平局' : '被克制✗');
    result.events.push(`${G_ICON[chosenGesture]}${G_NAME[chosenGesture]} vs ${G_ICON[bossG]}${G_NAME[bossG]} → ${rpsText}`);

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
          result.events.push(`${prefix}热情加成: ${orig}+${totalPassion}=${addDmg}`);
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
        result.events.push(`${prefix}卡牌自伤${fx.selfDmg}`);
      }

      // Damage reduction
      if (fx.reduce) {
        this.s.damageReduce = Math.max(this.s.damageReduce, fx.reduce);
        result.events.push(`${prefix}本回合受伤减少${Math.round(fx.reduce * 100)}%`);
      }

      // Passion gain
      if (fx.passion) {
        this.s.passion += fx.passion;
        result.events.push(`${prefix}+${fx.passion}热情(→${this.s.passion})`);
      }

      // Weakness give (to boss)
      if (fx.weakness) {
        this.s.bossWeakness += fx.weakness;
        result.events.push(`${prefix}BOSS积${fx.weakness}弱点(→${this.s.bossWeakness})`);
      }

      // Lock (on boss)
      if (fx.lock) {
        for (let i = 0; i < fx.lock; i++) {
          if (this.s.bossLocks.size >= MAX_LOCKS) {
            result.events.push(`${prefix}锁定失败: BOSS已达${MAX_LOCKS}锁上限`);
            break;
          }
          const unlocked = GESTURES.filter(g => !this.s.bossLocks.has(g));
          if (unlocked.length <= 0) break;
          const g = unlocked[Math.floor(Math.random() * unlocked.length)];
          this.s.bossLocks.add(g);
          result.events.push(`${prefix}BOSS锁定 ${G_NAME[g]}${G_ICON[g]}`);
        }
      }

      // Swap
      if (fx.swap) {
        const availRemain = this.deck.filter(c => !this.hand.includes(c));
        const swapCount = Math.min(
          fx.swap,
          availRemain.length,
          this.hand.filter(c => c.id !== card.id).length
        );
        if (swapCount > 0) {
          this.pendingSwaps = Math.max(this.pendingSwaps, swapCount);
          result.events.push(`${prefix}🔁 选择${swapCount}张牌替换`);
        }
      }

      // --- SPECIAL EFFECTS ---
      if (fx.special) {
        switch (fx.special) {
          case 'tuixiao': {
            const lockBonus = this.s.bossLocks.size * 2;
            dmg += lockBonus;
            if (lockBonus > 0) result.events.push(`${prefix}推销锁定加成+${lockBonus}`);
            break;
          }
          case 'tuixiao_re': {
            const lockBonus2 = this.s.bossLocks.size * 2;
            const singleHit = 4 + totalPassion + lockBonus2;
            dmg += singleHit;
            result.events.push(`${prefix}推销克制再触发! 追加${singleHit}伤害`);
            break;
          }
          case 'qingsuan': {
            if (this.s.bossLocks.size > 0) {
              const lockCount = this.s.bossLocks.size;
              dmg += 18;
              result.events.push(`${prefix}清算! 解除${lockCount}锁,造成18伤害`);
              this.s.bossLocks.clear();
            } else {
              result.events.push(`${prefix}清算: 无锁定,无效果`);
            }
            break;
          }
          case 'qingsuan_c': {
            heal += 12;
            result.events.push(`${prefix}清算克制: 回复12`);
            break;
          }
          case 'persist': {
            this.s.persistLocks = true;
            result.events.push(`${prefix}锁定持续到下回合`);
            break;
          }
          case 'tupo': {
            if (totalPassion >= 3) {
              this.s.passion = Math.max(0, this.s.passion - 3);
              dmg += 8;
              result.events.push(`${prefix}突破! 消耗3热情,+8伤害(→${this.s.passion}热情)`);
            } else {
              result.events.push(`${prefix}突破: 热情不足(${totalPassion}<3)`);
            }
            break;
          }
          case 'linian': {
            const bonus = totalPassion * 3;
            dmg += bonus;
            result.events.push(`${prefix}理念! ${totalPassion}热情×3=${bonus}伤害`);
            this.s.passion = 0;
            break;
          }
          case 'linian_c': {
            const currentTotal = dmg;
            const extraHeal = Math.floor(currentTotal / 2);
            heal += extraHeal;
            result.events.push(`${prefix}理念克制! 回复${extraHeal}`);
            break;
          }
          case 'guozai': {
            this.s.nextRoundPassion += 8;
            result.events.push(`${prefix}过载: 下回合+8热情`);
            break;
          }
          case 'tuidiao': {
            const wBonus = this.s.bossWeakness;
            dmg += wBonus;
            result.events.push(`${prefix}推敲: +${wBonus}弱点伤害`);
            break;
          }
          case 'tuidiao_c': {
            const singleHit = 3 + totalPassion + this.s.bossWeakness;
            dmg += singleHit;
            result.events.push(`${prefix}推敲克制再触发! 追加${singleHit}伤害`);
            break;
          }
          case 'hegui': {
            const consumed = this.s.bossWeakness;
            const extra = consumed * 2;
            dmg += extra;
            result.events.push(`${prefix}合规! ${consumed}层×2=${extra}伤害`);
            this.s.bossWeakness = 0;
            break;
          }
          case 'hegui_c': {
            this.s.noWeaknessDecay = true;
            result.events.push(`${prefix}合规克制! 下回合弱点不衰减`);
            break;
          }
          case 'fushen': {
            this.s.nextRoundWeakness += 3;
            result.events.push(`${prefix}复审: 下回合BOSS+3弱点`);
            break;
          }
        }
      }
    };

    applyEffect(baseFx, '');
    if (isCounter) {
      applyEffect(counterFx, '克制追加: ');
    }
    if (this.s.bossMods.includes('免疫2点以下') && dmg > 0 && dmg <= 2 && this.s.bossPassiveActive) {
      result.events.push(`${dmg}伤害→BOSS免疫(≤2)`);
      dmg = 0;
    }

    // Apply damage and healing
    if (dmg > 0) {
      this.s.bossHp -= dmg;
      result.damageDealt += dmg;
      result.events.push(`→ 造成${dmg}伤害(BOSS: ${this.s.bossHp}/${this.s.bossMaxHp})`);
    }
    if (heal > 0) {
      this.s.playerHp = Math.min(this.s.playerMaxHp, this.s.playerHp + heal);
      result.healDone += heal;
      result.events.push(`→ 回复${heal}生命(${this.s.playerHp}/${this.s.playerMaxHp})`);
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
        case '胜利伤害2':
          if (isLose) { // boss wins (player loses)
            this.s.playerHp -= 2;
            result.events.push('BOSS词条: 猜拳赢+2伤害');
          }
          break;
        case '平负伤害1':
          if (!isLose) { // boss doesn't win
            this.s.playerHp -= 1;
            result.events.push('BOSS词条: 平/负+1伤害');
          }
          break;
        case '第三张6伤害':
          if (cardIndex === 2) {
            this.s.playerHp -= 6;
            result.events.push('BOSS词条: 第三张+6伤害');
          }
          break;
        case '封锁伤害加成':
          if (this.s.playerLocks.size > 0) {
            const bonus = this.s.playerLocks.size * 2;
            this.s.playerHp -= bonus;
            result.events.push(`BOSS词条: ${this.s.playerLocks.size}锁+${bonus}伤害`);
          }
          break;
        case '解锁反击':
          if (this.s.playerLocks.has(playerG)) {
            this.s.playerLocks.delete(playerG);
            this.s.playerHp -= 4;
            result.events.push(`BOSS词条: 解锁反击${G_NAME[playerG]},4伤害`);
          }
          break;
        case '胜利热情3':
          if (isLose) { // boss wins (player loses)
            this.s.bossPassion += 3 + this.modBonus;
            result.events.push(`BOSS词条: 猜拳赢+3热情(→${this.s.bossPassion})`);
          }
          break;
        case '平局热情2':
          if (!isWin && !isLose) { // draw only
            this.s.bossPassion += 2 + this.modBonus;
            result.events.push(`BOSS词条: 平局+2热情(→${this.s.bossPassion})`);
          }
          break;
        case '被克热情2':
          if (isWin) { // player wins = boss loses
            this.s.bossPassion += 2 + this.modBonus;
            result.events.push(`BOSS词条: 被克+2热情(→${this.s.bossPassion})`);
          }
          break;
        case '猜拳胜利造成2伤':
          if (isLose) {  // boss wins
            this.s.playerHp -= 2;
            result.events.push('BOSS词条: 猜拳赢+2伤');
          }
          break;
        case '打出第三张6伤':
          if (cardIndex === 2) {
            this.s.playerHp -= 6;
            result.events.push('BOSS词条: 第三张+6伤');
          }
          break;
        case '猜拳减热情1':
          // 克共情：每次猜拳玩家损失1热情
          if (this.s.passion > 0) {
            this.s.passion = Math.max(0, this.s.passion - 1);
            result.events.push(`BOSS词条: 猜拳消耗你1热情(→${this.s.passion})`);
          }
          break;
        case '猜拳减弱点2':
          // 克逻辑：每次猜拳BOSS弱点-2（抵抗积累）
          if (this.s.bossWeakness > 0) {
            const shed = Math.min(2, this.s.bossWeakness);
            this.s.bossWeakness = Math.max(0, this.s.bossWeakness - shed);
            result.events.push(`BOSS词条: 猜拳抵抗弱点-${shed}(→${this.s.bossWeakness})`);
          }
          break;
        case '解锁反击4':
  // 克商业：与被封锁手势战斗→解锁+4伤
  if (this.s.bossLocks.has(bossG)) {
    this.s.bossLocks.delete(bossG);
    this.s.playerHp -= 4;
    result.events.push(`BOSS词条: 封锁反击! 解除${G_NAME[bossG]}+4伤`);
  }
  break;

case '胜利封锁':
  if (isLose) {
    if (this.s.playerLocks.size < MAX_LOCKS) {
      const unlocked = GESTURES.filter(g => !this.s.playerLocks.has(g));
      if (unlocked.length > 0) {
        const g = unlocked[Math.floor(Math.random() * unlocked.length)];
        this.s.playerLocks.add(g);
        result.events.push(`BOSS词条: 胜利封锁 ${G_NAME[g]}`);
      }
    } else {
      result.events.push(`BOSS词条: 胜利封锁失败(已达${MAX_LOCKS}锁上限)`);
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
        result.events.push(`BOSS词条: 第一张封锁 ${G_NAME[g]}`);
      }
    } else {
      result.events.push(`BOSS词条: 第一张封锁失败(已达${MAX_LOCKS}锁上限)`);
    }
  }
  break;
        case '胜利弱点4':
          if (isLose) {
            this.s.playerWeakness += 4 + this.modBonus;
            result.events.push(`BOSS词条: 猜拳赢+4弱点(你:${this.s.playerWeakness}层)`);
          }
          break;
        case '胜利解锁':
          if (isLose && this.s.bossLocks.size > 0) {
            const removed = [...this.s.bossLocks][0];
            this.s.bossLocks.delete(removed);
            result.events.push(`BOSS词条: 猜拳赢→解除封住${G_NAME[removed]}`);
          }
          break;
        case '每锁回血3':
          if (this.s.bossLocks.size > 0) {
            const heal = this.s.bossLocks.size * (3 + this.modBonus);
            this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + heal);
            result.events.push(`BOSS词条: ${this.s.bossLocks.size}封住→回血${heal}`);
          }
          break;
        case '负失热情2':
          if (isLose && this.s.passion > 0) {
            const lost = Math.min(this.s.passion, 2 + this.modBonus);
            this.s.passion -= lost;
            result.events.push(`BOSS词条: 猜拳赢→你损失${lost}热情(→${this.s.passion})`);
          }
          break;
        case '热情反噬':
          if (this.s.passion >= 5) {
            const extra = 2 + this.modBonus;
            this.s.playerHp -= extra;
            result.events.push(`BOSS词条: 你热情≥5，额外+${extra}伤害`);
          }
          break;
        case '弱点上限4': {
          const cap = 4 + this.modBonus;
          if (this.s.bossWeakness > cap) {
            const healBack = 10;
            this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + healBack);
            this.s.bossWeakness = 0;
            result.events.push(`BOSS词条: 弱点超${cap}→归零，BOSS回血${healBack}`);
          }
          break;
        }
        case '平负弱点2':
          if (!isLose) {
            this.s.playerWeakness += 2;
            result.events.push(`BOSS词条: 平/负+2弱点(你:${this.s.playerWeakness}层)`);
          }
          break;
        case '第三张弱点5':
          if (cardIndex === 2) {
            this.s.playerWeakness += 5;
            result.events.push(`BOSS词条: 第三张+5弱点(你:${this.s.playerWeakness}层)`);
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
      result.events.push('BOSS被动失效');
    }

    // End-of-round boss mods
    if (this.s.bossPassiveActive) {
      for (const mod of this.s.bossMods) {
        switch(mod) {
          case '回合结束伤害2':
            this.s.playerHp -= 2 + this.modBonus;
            result.events.push(`BOSS词条: 回合末+${2+this.modBonus}伤害`);
            break;
          case '回合结束回复3':
            this.s.bossHp = Math.min(this.s.bossMaxHp, this.s.bossHp + 3 + this.modBonus);
            result.events.push(`BOSS词条: 回合末回复3(→${this.s.bossHp})`);
            break;
          case '回合结束弱点1':
            this.s.playerWeakness += 1 + this.modBonus;
            result.events.push(`BOSS词条: 回合末+1弱点(你:${this.s.playerWeakness}层)`);
            break;
        }
      }
    }

    // Boss passion decay at end of round (50% like player weakness)
    if (this.s.bossPassion > 0) {
      const bpBefore = this.s.bossPassion;
      this.s.bossPassion = Math.floor(this.s.bossPassion / 2);
      result.events.push(`BOSS热情衰减: ${bpBefore}→${this.s.bossPassion}`);
    }

    // Weakness decay (boss weakness, 50% end of round)
    if (this.s.bossWeakness > 0) {
      if (this.s.noWeaknessDecay) {
        result.events.push(`BOSS弱点${this.s.bossWeakness}层(本回合不衰减)`);
        this.s.noWeaknessDecay = false;
      } else {
        const before = this.s.bossWeakness;
        this.s.bossWeakness = Math.floor(this.s.bossWeakness / 2);
        result.events.push(`BOSS弱点衰减: ${before}→${this.s.bossWeakness}`);
      }
    }

    // Player weakness decay (50%)
    if (this.s.playerWeakness > 0) {
      const before = this.s.playerWeakness;
      this.s.playerWeakness = Math.floor(this.s.playerWeakness / 2);
      result.events.push(`你的弱点衰减: ${before}→${this.s.playerWeakness}`);
    }

    // Check 50HP threshold
    if (this.enableProtection && this.s.playerHp <= 50 && !this.s.threshold50Triggered) {
      this.s.threshold50Triggered = true;
      this.s.bossPassiveActive = false;
      this.s.bossPassiveRoundsLeft = 1; // 1 full round of protection
      this.s.bossLocks = new Set([ROCK, SCISSORS, PAPER]);
      result.events.push('⚡ 50血线触发! 下回合BOSS被动失效,全手势锁定');
    }

    // Decrement protection rounds
    if (this.s.bossPassiveRoundsLeft > 0) {
      this.s.bossPassiveRoundsLeft--;
    }

    this.addLog('--- 回合结算 ---');
    for (const e of result.events) this.addLog(e);

    this.checkGameOver();
    return result;
  }

  checkGameOver() {
    if (this.s.bossHp <= 0) {
      this.s.gameOver = true;
      this.s.winner = 'player';
      this.addLog('🎉 BOSS被击败!');
    } else if (this.s.playerHp <= 0) {
      this.s.gameOver = true;
      this.s.winner = 'boss';
      this.addLog('💀 你被击败...');
    } else if (this.s.round >= MAX_ROUNDS) {
      this.s.gameOver = true;
      this.s.winner = 'boss';
      this.addLog('⏰ 超时,BOSS获胜');
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
    this.selectedBossHp = 100;
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
          <h1>偶像卡牌对战</h1>
          <p class="subtitle">战斗系统 Demo</p>
        </div>
        <div class="system-select">
          <h2>选择你的体系</h2>
          <div class="system-cards">
            ${['commercial','empathy','logic'].map(s => `
              <button class="system-btn" data-system="${s}" style="--sys-color:${SYS_COLOR[s]}">
                <div class="sys-name">${SYS_NAME[s]}体系</div>
                <div class="sys-boss">对战: 随机BOSS</div>
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
          <h3>核心规则</h3>
          <div class="rules-cols">
            <div class="rules-col">
              <b>基本流程</b>
              <ul>
                <li>每回合从12张牌抽5张，最多出3张</li>
                <li>每张牌有固定手势(石头/剪刀/布)，组卡时已定</li>
                <li>每出1张牌 = BOSS攻击你4HP(出牌代价)</li>
                <li>BOSS每张牌随机出手势，提前显示(明牌)</li>
                <li>你的手势克制BOSS → 触发卡牌⭐克制效果</li>
                <li>出完一张BOSS换新手势，你再决定下一张</li>
                <li>血量≤50触发保护(BOSS被动失效1回合)</li>
              </ul>
            </div>
            <div class="rules-col">
              <b style="color:#d4a843">💰 商业体系 · 封锁</b>
              <ul>
                <li>封锁BOSS手势，被锁手势出现时自动克制</li>
                <li>最多同时2个锁定，随机指定手势</li>
                <li>终局：解封全部+每封住造成6伤</li>
                <li>乘胜：每封住手势额外+2伤害</li>
              </ul>
              <b style="color:#e85d75">🔥 共情体系 · 热情</b>
              <ul>
                <li>热情增加卡牌攻击伤害(+热情层数)</li>
                <li>每出1张牌，热情-1</li>
                <li>倾注：清空全部热情，热情×3爆发</li>
                <li>爆发：热情≥3时消耗3，额外+8伤害</li>
              </ul>
              <b style="color:#4db8ff">💢 逻辑体系 · 弱点</b>
              <ul>
                <li>给BOSS堆弱点层数</li>
                <li>每出1张牌，BOSS受到弱点层数的伤害</li>
                <li>回合末弱点衰减50%</li>
                <li>推演：额外造成弱点层伤害</li>
                <li>清零：消耗全部弱点，层数×2伤害</li>
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
        <div class="hp-select-label">BOSS\u8840\u91cf</div>
        <div class="hp-btns">
          <button class="hp-btn active" data-hp="80">80\u8840<br><small>\u65b0\u624b</small></button>
          <button class="hp-btn" data-hp="100">100\u8840<br><small>\u6807\u51c6</small></button>
          <button class="hp-btn" data-hp="120">120\u8840<br><small>\u6311\u6218</small></button>
          <button class="hp-btn" data-hp="150">150\u8840<br><small>\u6781\u9650</small></button>
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
    this.engine = new BattleEngine(systemKey, modCount, enableProtection, this.selectedBossHp);
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
        <h2>3件事就能开打</h2>
        <div class="tut-cards">
          <div class="tut-card">
            <div class="tut-icon" style="color:#ef4444">💔</div>
            <div class="tut-title">出牌 = 扣血</div>
            <div class="tut-desc">每出1张牌你掉4HP。出得越多伤害越高，但你也越危险。不是每回合都要出满3张。</div>
          </div>
          <div class="tut-card">
            <div class="tut-icon" style="color:#4ade80">✊✌️🖐️</div>
            <div class="tut-title">猜拳定胜负</div>
            <div class="tut-desc">BOSS会提前亮手势。你的卡牌手势克制BOSS就触发强力效果(绿色=克制，红色=被克)。出完一张BOSS换新手势。</div>
          </div>
          <div class="tut-card">
            <div class="tut-icon" style="color:#f59e0b">⚡</div>
            <div class="tut-title">体系是你的武器</div>
            <div class="tut-desc">商业封住手势保证克制，共情积累热情加大输出，逻辑给BOSS堆弱点持续掉血。看牌面描述摸索组合。</div>
          </div>
        </div>
        <button class="btn-start-battle" id="btnStartBattle">开始战斗</button>
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
            else if (l.includes('BOSS攻击') || l.includes('反噬') || l.includes('自伤') || l.includes('伤害→')) cls = 'log-dmg';
            else if (l.includes('回复') || l.includes('造成') && l.includes('BOSS')) cls = 'log-heal';
            else if (l.includes('热情') || l.includes('弱点') || l.includes('锁定') || l.includes('🔁')) cls = 'log-res';
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
            <h3>机制说明</h3>
            <div class="help-section">
              <b>基本流程</b>
              <p>每回合抽5张牌，最多出3张。每出1张牌BOSS攻击你4HP。BOSS每张牌随机出手势并提前显示。你的手势克制BOSS则触发⭐克制效果。出完一张BOSS换新手势。血量≤50触发保护。</p>
            </div>
            <div class="help-section">
              <b style="color:#d4a843">💰 商业 · 封锁</b>
              <p>封住对方手势(最多2个)，被封手势自动克制。终局：解封全部+每封住6伤。乘胜：每封住+2伤害。</p>
            </div>
            <div class="help-section">
              <b style="color:#e85d75">🔥 共情 · 热情</b>
              <p>积累热情增加攻击力，每出牌热情-1。倾注：清空热情×3一次爆发。爆发：消耗3热情+8伤害。</p>
            </div>
            <div class="help-section">
              <b style="color:#4db8ff">💢 逻辑 · 弱点</b>
              <p>给BOSS积累弱点，每出牌触发弱点层伤害，回合末弱点减半。推演：额外弱点层伤害。清零：弱点×2爆发。</p>
            </div>
            <button class="btn-close-help" id="btnCloseHelp">关闭</button>
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
