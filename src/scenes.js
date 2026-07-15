// Scene-tagged, bilingual quote banks. Voice: "visible fact +
// disproportionately serious interpretation," dry and self-aware, rarely
// sincere. Korean lines are transcreated for Korean rhythm/humor (short noun
// phrases, flat report endings, fake-report language) — not translated from
// the English lines.
//
// Categories per language: deadpan, selfAware, supportingCast, online

export const SCENES = {
  nature: {
    label: { en: 'Nature', ko: '자연' },
    emoji: '🌳',
    quotes: {
      en: {
        deadpan: [
          'There are four of us and at least six trees.',
          'Four people, several trees, adequate sunlight.',
          'We stood among the local vegetation.',
          'Nature was present and accounted for.',
        ],
        selfAware: ['A beautiful moment, according to the available data.'],
        supportingCast: [
          'The trees contributed quietly.',
          'The forest allowed us to use the premises.',
          'Everyone brought something. The trees brought shade.',
        ],
        online: ['The squad briefly entered its outdoor era.', 'The squad is absolutely serving in the forest.'],
      },
      ko: {
        deadpan: [
          '사람 넷, 나무 최소 여섯.',
          '나무가 꽤 많았다.',
          '모두 무사히 프레임 안에 들어왔다.',
        ],
        selfAware: ['데이터상 아름다운 순간으로 확인됨.'],
        supportingCast: ['나무는 친구다. 아마도.', '숲이 배경으로 협조적이었다.'],
        online: ['숲에서도 단체사진은 못 참지.'],
      },
    },
  },
  wall: {
    label: { en: 'Wall / Building', ko: '벽 / 건물' },
    emoji: '🧱',
    quotes: {
      en: {
        deadpan: [
          'We found a wall and stood near it.',
          'We arrived. The building was already there.',
          'The wall provided structure.',
        ],
        selfAware: ['A group portrait featuring excellent masonry.'],
        supportingCast: [
          'The architecture agreed to be in the background.',
          'Strong performance from the bricks.',
        ],
        online: ['The wall is doing numbers right now.'],
      },
      ko: {
        deadpan: ['벽을 발견했고, 일단 섰다.', '벽 앞에서, 일단 섰다.'],
        selfAware: ['벽돌 활용도 조사 결과 양호.'],
        supportingCast: ['벽돌의 활약이 돋보였다.'],
        online: ['배경이 오늘 제대로 일했다.'],
      },
    },
  },
  cafe: {
    label: { en: 'Café / Restaurant', ko: '카페 / 식당' },
    emoji: '☕',
    quotes: {
      en: {
        deadpan: [
          'A meeting with no recorded minutes.',
          'We ordered first and developed personalities later.',
          'The table supported the entire operation.',
        ],
        selfAware: ['Coffee was present for legal reasons.'],
        supportingCast: [
          'The drinks were mostly visual aids.',
          'The glasses carried the composition.',
        ],
        online: ['The table is absolutely serving right now.'],
      },
      ko: {
        deadpan: ['사람 셋, 커피 넷.', '일단 앉았고, 주문은 나중이었다.'],
        selfAware: ['우정 지표가 일시적으로 상승했습니다.'],
        supportingCast: ['컵이 전체 분위기를 잡았다.'],
        online: ['여기서도 일단 한 장.'],
      },
    },
  },
  birthday: {
    label: { en: 'Birthday', ko: '생일' },
    emoji: '🎂',
    quotes: {
      en: {
        deadpan: [
          'Another successful meeting around a cake.',
          'The birthday person also appeared.',
          "Everyone attended the cake's annual performance.",
        ],
        selfAware: ['A beautiful moment, according to the available data.'],
        supportingCast: [
          'The cake did most of the work.',
          'The candles created temporary urgency.',
          'The frosting maintained team morale.',
        ],
        online: ['The cake is absolutely serving tonight.'],
      },
      ko: {
        deadpan: ['단체사진 촬영이 정상적으로 완료되었습니다.', '올해도 케이크 앞에 모였다.'],
        selfAware: ['좋은 추억으로 분류해두겠습니다.'],
        supportingCast: ['케이크가 거의 다 했다.', '촛불이 잠깐 분위기를 잡았다.'],
        online: ['오늘 케이크 좀 되네.'],
      },
    },
  },
  landscape: {
    label: { en: 'Sunset / Landscape', ko: '노을 / 풍경' },
    emoji: '🌅',
    quotes: {
      en: {
        deadpan: [
          'The horizon was doing a lot.',
          'We followed the light. It was the parking lot.',
        ],
        selfAware: ['A beautiful moment, according to the available lighting.'],
        supportingCast: [
          'The sky handled post-production.',
          'The sun exited with unnecessary confidence.',
          'That cloud carried the composition.',
          'The atmosphere provided complimentary lighting.',
          'The sky selected a warmer color palette.',
        ],
        online: ['The sky is absolutely serving tonight.'],
      },
      ko: {
        deadpan: ['빛을 따라갔다. 주차장이었다.', '하늘은 넓었다. 할 말은 여기까지다.'],
        selfAware: ['데이터상 아름다운 노을로 확인됨.'],
        supportingCast: ['저 구름이 구도를 살렸다.', '하늘이 조명을 대신 맡았다.'],
        online: ['오늘 하늘 좀 된다.'],
      },
    },
  },
  pet: {
    label: { en: 'Pet', ko: '반려동물' },
    emoji: '🐾',
    quotes: {
      en: {
        deadpan: [
          'One of us was paid in snacks.',
          'The animal remained professionally unavailable.',
        ],
        selfAware: ['A beautiful moment, according to the available data.'],
        supportingCast: [
          'The cat approved limited distribution.',
          'The dog handled creative direction.',
          'A brief appearance by local management.',
          'The pet did most of the casting.',
        ],
        online: ['The pet is absolutely serving right now.'],
      },
      ko: {
        deadpan: ['참여는 간식으로 협상됐다.', '한 명은 촬영에 비협조적이었다.'],
        selfAware: ['데이터상 사랑스러운 존재로 확인됨.'],
        supportingCast: ['이번 캐스팅은 반려동물이 다 했다.'],
        online: ['오늘 반려동물이 다 했다.'],
      },
    },
  },
  blurry: {
    label: { en: 'Blurry / Imperfect', ko: '흔들림 / 저화질' },
    emoji: '🌫️',
    quotes: {
      en: {
        deadpan: [
          'Everyone was technically captured.',
          'Clarity was not part of the brief.',
          'Evidence exists.',
        ],
        selfAware: [
          'A beautiful moment, according to the available pixels.',
          'The camera remembers it differently.',
        ],
        supportingCast: ['The blur contributed atmosphere.'],
        online: [],
      },
      ko: {
        deadpan: ['일단 찍혔다.', '초점은 다음 기회에.'],
        selfAware: ['픽셀상 아름다운 순간으로 확인됨.'],
        supportingCast: ['흔들림이 분위기를 살렸다.'],
        online: [],
      },
    },
  },
  selfie: {
    label: { en: 'Selfie', ko: '셀카' },
    emoji: '🤳',
    quotes: {
      en: {
        deadpan: [
          'The arm was fully extended. That was the whole plan.',
          'One angle was tested. It was approved.',
          'The camera was held by the person in the photo.',
        ],
        selfAware: ['A beautiful moment, according to the front-facing camera.'],
        supportingCast: [
          'The good lighting did most of the work here.',
          'That one eyebrow carried the whole expression.',
          'The mirror, if present, stayed neutral.',
        ],
        online: ['This angle is absolutely serving.'],
      },
      ko: {
        deadpan: ['팔을 최대한 뻗었다. 그게 계획의 전부였다.', '각도 한 번에 승인이 났다.'],
        selfAware: ['전면 카메라 기준 아름다운 순간으로 확인됨.'],
        supportingCast: ['조명이 이 사진을 거의 다 했다.', '각도가 표정보다 열심히 일했다.'],
        online: ['이 각도 오늘 좀 되는데.'],
      },
    },
  },
  instaBack: {
    label: { en: 'Candid / Aesthetic', ko: '뒷모습 인스타감성' },
    emoji: '📸',
    quotes: {
      en: {
        deadpan: [
          'The face was omitted on purpose.',
          'A person, viewed from behind, near something scenic.',
          'The outfit was doing the talking.',
        ],
        selfAware: ['A beautiful moment, according to the algorithm.'],
        supportingCast: [
          'The scenery agreed to be relevant.',
          'That bag strap held the composition together.',
          'The wind contributed, unpaid.',
        ],
        online: ['The back of this fit is absolutely serving.'],
      },
      ko: {
        deadpan: ['얼굴은 의도적으로 생략됐다.', '뒷모습과 풍경, 그게 전부였다.'],
        selfAware: ['알고리즘 기준 감성적인 순간으로 확인됨.'],
        supportingCast: ['옷이 표정을 대신 맡았다.', '바람이 무급으로 협조했다.'],
        online: ['뒷모습 오늘 각 나온다.'],
      },
    },
  },
  park: {
    label: { en: 'Park / Picnic', ko: '공원 / 피크닉' },
    emoji: '🧺',
    quotes: {
      en: {
        deadpan: [
          'We brought a blanket and called it a plan.',
          'The grass was available, so we used it.',
          'Snacks were distributed evenly. Mostly.',
        ],
        selfAware: ['A beautiful moment, according to the available data.'],
        supportingCast: [
          'The picnic basket did the heavy lifting.',
          'That one ant was also present.',
          'The blanket held the whole operation together.',
        ],
        online: ['The picnic is absolutely serving today.'],
      },
      ko: {
        deadpan: ['돗자리 하나로 계획은 끝이었다.', '잔디가 비어 있길래 앉았다.'],
        selfAware: ['데이터상 평화로운 오후로 확인됨.'],
        supportingCast: ['돗자리가 이 모든 걸 버텼다.', '간식이 분위기를 대신 책임졌다.'],
        online: ['오늘 피크닉 좀 되네.'],
      },
    },
  },
  street: {
    label: { en: 'Street / Shopping', ko: '거리 / 쇼핑' },
    emoji: '🛍️',
    quotes: {
      en: {
        deadpan: [
          'We walked past several stores with purpose.',
          'A bag was acquired. Priorities were set.',
          'The sidewalk cooperated fully.',
        ],
        selfAware: ['A beautiful moment, according to the available receipts.'],
        supportingCast: [
          'The shopping bags carried real weight, physically and otherwise.',
          'That storefront window did some unpaid work.',
          'The crosswalk timed it perfectly.',
        ],
        online: ['The fit is absolutely serving on this block.'],
      },
      ko: {
        deadpan: ['일단 걸었고, 목적은 나중에 생겼다.', '쇼핑백 하나로 하루가 정리됐다.'],
        selfAware: ['영수증상 알찬 하루로 확인됨.'],
        supportingCast: ['쇼핑백이 무게감을 담당했다.', '쇼윈도가 배경을 대신 채웠다.'],
        online: ['오늘 거리 패션 좀 되는데.'],
      },
    },
  },
  party: {
    label: { en: 'Concert / Party', ko: '콘서트 / 파티' },
    emoji: '🎉',
    quotes: {
      en: {
        deadpan: [
          'The volume was high. So were we, figuratively.',
          'Everyone moved at roughly the same time.',
          'The night had a schedule and ignored it.',
        ],
        selfAware: ['A beautiful moment, according to the available lighting.'],
        supportingCast: [
          'The speaker did most of the emotional labor.',
          'That one string light held the whole mood together.',
          'The disco ball contributed more than anyone else.',
        ],
        online: ['The whole crowd is absolutely serving tonight.'],
      },
      ko: {
        deadpan: ['음악은 컸고, 우리도 그랬다.', '다 같이 비슷한 타이밍에 움직였다.'],
        selfAware: ['조명상 화려한 순간으로 확인됨.'],
        supportingCast: ['스피커가 분위기를 거의 다 맡았다.', '미러볼이 제일 열심히 일했다.'],
        online: ['오늘 분위기 미쳤다.'],
      },
    },
  },
  generic: {
    label: { en: 'Generic', ko: '일반' },
    emoji: '📷',
    quotes: {
      en: {
        deadpan: [
          'We stood in a location and it worked out.',
          'Everyone showed up. That was the plan.',
          'A moment occurred and was documented.',
        ],
        selfAware: [
          'A beautiful moment, according to the available data.',
          'Insert meaningful sentence about friendship here.',
        ],
        supportingCast: [
          'Something in the background carried the composition.',
          'The lighting did its best.',
        ],
        online: ['The squad is absolutely serving right now.'],
      },
      ko: {
        deadpan: ['다 같이 나왔고, 사진도 남았다.', '전반적으로 외출에 성공한 모습입니다.'],
        selfAware: ['우정에 관한 의미 있는 문장 삽입.', '적절한 감성 문구를 찾지 못했습니다.'],
        supportingCast: ['조명이 많은 일을 했다.'],
        online: ['의외로 단체사진에 진심인 편.'],
      },
    },
  },
}

export const SCENE_KEYS = Object.keys(SCENES)

// Deadpan and Supporting Cast are the workhorses; Self-aware is occasional;
// A-little-online is a rare variation, not a default.
const CATEGORY_WEIGHTS = {
  deadpan: 40,
  supportingCast: 35,
  selfAware: 15,
  online: 10,
}

function weightedCategory(available, exclude, weights) {
  const entries = Object.entries(weights).filter(
    ([cat]) => available[cat] && available[cat].length > 0 && cat !== exclude
  )
  const pool = entries.length > 0
    ? entries
    : Object.entries(weights).filter(([cat]) => available[cat] && available[cat].length > 0)
  const total = pool.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [cat, w] of pool) {
    if (r < w) return cat
    r -= w
  }
  return pool[0]?.[0]
}

// lastCategory lets callers rotate humor structure instead of repeating the
// same category (e.g. deadpan twice in a row) on consecutive shuffles.
// weights optionally overrides the default category mix (used by decoration
// mode presets, e.g. Deadpan mode leans harder into deadpan/self-aware).
export function randomSceneQuote(sceneKey, lang = 'en', lastCategory = null, weights = CATEGORY_WEIGHTS) {
  const scene = SCENES[sceneKey] || SCENES.generic
  const bank = scene.quotes[lang] || scene.quotes.en
  const category = weightedCategory(bank, lastCategory, weights)
  const list = bank[category]
  const text = list[Math.floor(Math.random() * list.length)]
  return { text, category }
}
