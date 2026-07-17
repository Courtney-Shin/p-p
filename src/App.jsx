import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import PhotoCanvas from './PhotoCanvas'
import { MOODS, MOOD_KEYS } from './moods'
import { SCENES, SCENE_KEYS, randomSceneQuote } from './scenes'
import { FRAME_STYLES, suggestTexture } from './frames'
import { PHOTO_OVERLAYS } from './photoOverlay'
import { STICKER_SHAPES, drawSticker } from './stickers'
import { analyzeImage } from './analyzeImage'
import { extractPalette, frameColorsFromPalette, complementaryHex } from './palette'
import ColorWheel from './ColorWheel'
import { selectStickers, placeSticker, guessPhotoType, STICKER_COUNT_RANGES, enforceCoverageLimit } from './stickerRules'
import { DECORATION_MODES, DECORATION_MODE_KEYS, applyStickerCountBias } from './decorationModes'
import { randomFont } from './fonts'
import { getSubjectMask, applyMaskToImage, preloadSegmenter } from './backgroundRemoval'
import { traceContour } from './stitchOutline'
import { detectReal } from './detection'
import './App.css'

const CANVAS_SIZE = { width: 640, height: 760 }
let stickerIdCounter = 0

const UI_TEXT = {
  en: {
    title: '✨ Photo Decorator',
    subtitle: "Upload a photo — get a matching frame, stickers, and a deadpan caption based on what's in it.",
    dropHint: 'Drag & drop a photo here, or click to choose one',
    download: 'Download',
    startOver: 'Start over',
    mood: 'Mood',
    moodHint: "Changes the quick-add sticker palette below — frame and auto-placed stickers follow Scene instead.",
    frameStyle: 'Frame style',
    stickers: 'Stickers',
    moreStickers: 'More stickers',
    bigger: 'Bigger',
    smaller: 'Smaller',
    rotate: 'Rotate',
    remove: 'Remove',
    dragHint: 'Drag stickers on the photo to move them.',
    scene: 'Scene',
    shuffleQuote: 'Shuffle quote',
    mode: 'Decoration mode',
    color: 'Color',
    pickColor: 'Pick color',
    photoOverlay: 'Photo effect',
    overlayNone: 'None',
    overlayGlossy: 'Glossy',
    overlayGrain: 'Grain',
    background: 'Background',
    removeBackground: 'Remove background (person only)',
    removingBackground: 'Removing background…',
    undoBackground: 'Restore background',
    stitchOutline: 'Stitch outline',
    stitchHint: 'Remove the background first to add a stitched edge.',
    bgError: "Couldn't detect a person to cut out. Try a different photo.",
    aiAnalysis: 'AI photo analysis',
    aiAnalyzeButton: 'Analyze with AI (~45MB download, one-time)',
    aiAnalyzing: 'Analyzing…',
    aiDownloading: 'Downloading model… {pct}%',
    aiError: 'AI analysis failed. Your current color-based guess is still active.',
    aiDetected: 'Detected:',
    aiHint: "Free, runs fully in your browser — nothing is uploaded anywhere. First use downloads a ~45MB model; after that it's instant.",
  },
  ko: {
    title: '✨ 포토 데코레이터',
    subtitle: '사진을 올리면 어울리는 프레임, 스티커, 그리고 시크한 한마디를 만들어드려요.',
    dropHint: '사진을 드래그하거나 클릭해서 선택하세요',
    download: '다운로드',
    startOver: '처음부터',
    mood: '무드',
    moodHint: '아래 스티커 팔레트 색상만 바뀌어요 — 프레임과 자동 스티커는 장면(Scene)을 따라가요.',
    frameStyle: '프레임 스타일',
    stickers: '스티커',
    moreStickers: '스티커 더보기',
    bigger: '크게',
    smaller: '작게',
    rotate: '회전',
    remove: '삭제',
    dragHint: '스티커를 드래그해서 위치를 옮기세요.',
    scene: '장면',
    shuffleQuote: '문구 바꾸기',
    mode: '데코 모드',
    color: '색상',
    pickColor: '색상 선택',
    photoOverlay: '사진 효과',
    overlayNone: '없음',
    overlayGlossy: '광택',
    overlayGrain: '그레인',
    background: '배경',
    removeBackground: '배경 제거 (인물 전용)',
    removingBackground: '배경 제거 중…',
    undoBackground: '배경 복원',
    stitchOutline: '스티치 아웃라인',
    stitchHint: '먼저 배경을 제거하면 바느질 테두리를 추가할 수 있어요.',
    bgError: '사진에서 인물을 찾지 못했어요. 다른 사진으로 시도해보세요.',
    aiAnalysis: 'AI 사진 분석',
    aiAnalyzeButton: 'AI로 분석하기 (최초 1회 약 45MB 다운로드)',
    aiAnalyzing: '분석 중…',
    aiDownloading: '모델 다운로드 중… {pct}%',
    aiError: 'AI 분석에 실패했어요. 기존 색상 기반 추측은 그대로 유지됩니다.',
    aiDetected: '감지된 항목:',
    aiHint: '무료이고 브라우저 안에서만 실행돼요 — 어디에도 업로드되지 않습니다. 처음 한 번만 약 45MB 모델을 받고, 이후엔 바로 실행돼요.',
  },
}

// Quick-pick swatches shown alongside the custom color input — a mix of
// warm/cool/neutral tones so there's always something usable regardless of
// the current photo palette.
const STICKER_SWATCHES = [
  '#F4A261', '#E76F51', '#2A9D8F', '#264653', '#E9C46A',
  '#B5567A', '#457B9D', '#F1FAEE', '#2B2B2B', '#FFFFFF',
]

function App() {
  const [image, setImage] = useState(null)
  const [displayImage, setDisplayImage] = useState(null)
  const [subjectMask, setSubjectMask] = useState(null)
  const [bgRemoving, setBgRemoving] = useState(false)
  const [bgRemoveError, setBgRemoveError] = useState(null)
  const [stitchEnabled, setStitchEnabled] = useState(false)
  const [stitchColor, setStitchColor] = useState('#ffffff')
  const [stitchWheelOpen, setStitchWheelOpen] = useState(false)
  const [stickerWheelOpen, setStickerWheelOpen] = useState(false)
  const [moodKey, setMoodKey] = useState(null)
  const [sceneKey, setSceneKey] = useState(null)
  const [frameStyle, setFrameStyle] = useState('solid')
  const [frameColors, setFrameColors] = useState(null)
  const [photoOverlay, setPhotoOverlay] = useState('none')
  const [modeKey, setModeKey] = useState('scrapbook')
  const [lang, setLang] = useState('en')
  const [quote, setQuote] = useState('')
  const [lastCategory, setLastCategory] = useState(null)
  const [captionFont, setCaptionFont] = useState(null)
  const [stickers, setStickers] = useState([])
  const [selectedStickerId, setSelectedStickerId] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [detection, setDetection] = useState(null)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const [aiError, setAiError] = useState(null)
  const [aiObjects, setAiObjects] = useState(null)
  const fileInputRef = useRef(null)
  const canvasApiRef = useRef(null)
  const objectUrlRef = useRef(null)

  const mood = moodKey ? MOODS[moodKey] : null
  const scene = sceneKey ? SCENES[sceneKey] : null
  const mode = DECORATION_MODES[modeKey]
  const t = UI_TEXT[lang]
  const selectedSticker = stickers.find((s) => s.id === selectedStickerId) || null

  const regenerateStickers = (analysis, palette, modePreset, subjectZoneOverride) => {
    const photoType = guessPhotoType({ scene: analysis.scene, variance: analysis.variance })
    const baseRange = STICKER_COUNT_RANGES[photoType] || STICKER_COUNT_RANGES.group
    const biasedRange = applyStickerCountBias(baseRange, modePreset.stickerCountBias)
    const picks = selectStickers({ scene: analysis.scene, photoType, palette }).slice(0, biasedRange[1])

    // Real detection gives an actual person bounding box; without it, fall
    // back to the center-frame proxy used throughout the color-heuristic path.
    const subjectZone = subjectZoneOverride || { x: 0.2, y: 0.15, w: 0.6, h: 0.65 }
    const candidateStickers = picks.map((pick, i) => {
      const radius = 0.045 + (i % 2 === 0 ? 0.01 : 0)
      const { x, y } = placeSticker({ index: i, radius, subjectZone })
      return {
        id: ++stickerIdCounter,
        name: pick.name,
        x,
        y,
        radius,
        color: pick.color,
        rotation: (Math.random() - 0.5) * 0.4,
      }
    })
    // Drop stickers once total coverage would exceed the photo-type's
    // area cap, so a "high" sticker-count bias mode can't visually bury
    // the photo under decoration.
    const newStickers = enforceCoverageLimit(candidateStickers, photoType, {
      w: CANVAS_SIZE.width,
      h: CANVAS_SIZE.height,
    })
    setStickers(newStickers)
  }

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    // Revoke any previous photo's object URL before creating a new one —
    // nothing about an uploaded photo should outlive the session, and each
    // stale URL otherwise keeps that blob reachable in memory indefinitely.
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    const img = new Image()
    img.onload = () => {
      // The image's pixels are now decoded into the Image/canvas; the blob
      // URL itself is no longer needed, so release it immediately rather
      // than waiting for the next upload or a page reload.
      URL.revokeObjectURL(url)
      objectUrlRef.current = null
      setImage(img)
      setDisplayImage(img)
      setSubjectMask(null)
      setStitchEnabled(false)
      setBgRemoveError(null)
      preloadSegmenter() // warm the model in the background so the first click is fast
      const analysis = analyzeImage(img)
      const palette = extractPalette(analysis.imageData)
      const colors = frameColorsFromPalette(palette, { bright: analysis.avgL > 0.5 })

      setMoodKey(analysis.mood)
      setSceneKey(analysis.scene)
      setFrameColors(colors)
      setDetection(analysis)

      const suggested = suggestTexture(analysis)
      const modePreset = DECORATION_MODES[modeKey]
      setFrameStyle(modePreset.frameTexture === 'solid' ? suggested : modePreset.frameTexture)
      setPhotoOverlay(modePreset.photoOverlay)

      const { text, category } = randomSceneQuote(analysis.scene, lang, null, modePreset.captionWeights)
      setQuote(text)
      setLastCategory(category)
      setCaptionFont(randomFont(lang))

      regenerateStickers(analysis, palette, modePreset)
    }
    img.src = url
  }, [lang, modeKey])

  const onFileInputChange = (e) => {
    handleFile(e.target.files?.[0])
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  const changeMood = (key) => {
    setMoodKey(key)
  }

  const changeScene = (key) => {
    setSceneKey(key)
    const { text, category } = randomSceneQuote(key, lang, lastCategory, mode.captionWeights)
    setQuote(text)
    setLastCategory(category)
    // Scene drives the auto-placed sticker pool (SCENE_CONTEXTUAL), so an
    // override needs to regenerate stickers too, not just the caption —
    // otherwise the sticker set stays tied to the old, now-stale scene.
    if (detection) {
      const palette = extractPalette(detection.imageData)
      regenerateStickers({ ...detection, scene: key }, palette, mode)
    }
  }

  const shuffleQuote = () => {
    if (!sceneKey) return
    const { text, category } = randomSceneQuote(sceneKey, lang, lastCategory, mode.captionWeights)
    setQuote(text)
    setLastCategory(category)
    setCaptionFont(randomFont(lang))
  }

  const changeLang = (newLang) => {
    setLang(newLang)
    if (sceneKey) {
      const { text, category } = randomSceneQuote(sceneKey, newLang, null, mode.captionWeights)
      setQuote(text)
      setLastCategory(category)
      setCaptionFont(randomFont(newLang))
    }
  }

  const changeMode = (key) => {
    setModeKey(key)
    if (detection) {
      const modePreset = DECORATION_MODES[key]
      const palette = extractPalette(detection.imageData)
      setFrameStyle(modePreset.frameTexture)
      setPhotoOverlay(modePreset.photoOverlay)
      regenerateStickers(detection, palette, modePreset)
      const { text, category } = randomSceneQuote(sceneKey, lang, null, modePreset.captionWeights)
      setQuote(text)
      setLastCategory(category)
      setCaptionFont(randomFont(lang))
    }
  }

  const addSticker = (name) => {
    if (!mood) return
    const color = mood.palette[Math.floor(Math.random() * mood.palette.length)]
    const newSticker = {
      id: ++stickerIdCounter,
      name,
      x: 0.5,
      y: 0.5,
      radius: 0.05,
      color,
      rotation: (Math.random() - 0.5) * 0.5,
    }
    setStickers((s) => [...s, newSticker])
    setSelectedStickerId(newSticker.id)
  }

  const removeSelectedSticker = () => {
    if (selectedStickerId == null) return
    setStickers((s) => s.filter((st) => st.id !== selectedStickerId))
    setSelectedStickerId(null)
  }

  const canvasPointFromEvent = (e) => {
    const canvas = canvasApiRef.current?.getCanvas()
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    }
  }

  const onCanvasPointerDown = (e) => {
    const pt = canvasPointFromEvent(e)
    if (!pt) return
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i]
      const dxPx = (pt.x - s.x) * CANVAS_SIZE.width
      const dyPx = (pt.y - s.y) * CANVAS_SIZE.height
      const rPx = s.radius * Math.min(CANVAS_SIZE.width, CANVAS_SIZE.height)
      const dist = Math.hypot(dxPx, dyPx)
      if (dist < Math.max(rPx, 22)) {
        setSelectedStickerId(s.id)
        setDragging({ id: s.id, offsetX: pt.x - s.x, offsetY: pt.y - s.y })
        return
      }
    }
    setSelectedStickerId(null)
  }

  const onCanvasPointerMove = (e) => {
    if (!dragging) return
    const pt = canvasPointFromEvent(e)
    if (!pt) return
    setStickers((list) =>
      list.map((s) =>
        s.id === dragging.id
          ? { ...s, x: clamp01(pt.x - dragging.offsetX), y: clamp01(pt.y - dragging.offsetY) }
          : s
      )
    )
  }

  const endDrag = () => setDragging(null)

  const resizeSelected = (delta) => {
    setStickers((list) =>
      list.map((s) =>
        s.id === selectedStickerId ? { ...s, radius: clamp(s.radius + delta, 0.02, 0.16) } : s
      )
    )
  }

  const rotateSelected = (delta) => {
    setStickers((list) =>
      list.map((s) => (s.id === selectedStickerId ? { ...s, rotation: s.rotation + delta } : s))
    )
  }

  const recolorSelected = (color) => {
    setStickers((list) =>
      list.map((s) => (s.id === selectedStickerId ? { ...s, color } : s))
    )
  }

  const analyzeWithAI = async () => {
    if (!image || aiAnalyzing) return
    setAiAnalyzing(true)
    setAiError(null)
    setAiProgress(0)
    try {
      const result = await detectReal(image, {
        onProgress: (p) => {
          // transformers.js progress events report per-file download
          // progress; only 'progress' events carry a usable percentage.
          if (p?.status === 'progress' && typeof p.progress === 'number') {
            setAiProgress(Math.round(p.progress))
          }
        },
      })
      setDetection(result)
      setAiObjects(result.objects)
      setSceneKey(result.scene)

      const palette = extractPalette(result.analysis.imageData)
      regenerateStickers(result, palette, mode, result.subjectZone)

      const { text, category } = randomSceneQuote(result.scene, lang, lastCategory, mode.captionWeights)
      setQuote(text)
      setLastCategory(category)
    } catch (err) {
      console.error('AI analysis failed:', err)
      setAiError(err.message || 'AI analysis failed')
    } finally {
      setAiAnalyzing(false)
    }
  }

  const removeBackground = async () => {
    if (!image || bgRemoving) return
    setBgRemoving(true)
    setBgRemoveError(null)
    try {
      const mask = await getSubjectMask(image)
      const cutout = applyMaskToImage(image, mask)
      setDisplayImage(cutout)
      setSubjectMask(mask)
      // Default the stitch color to the complement of the photo's dominant
      // hue, so the stitching contrasts with the subject/background instead
      // of blending in — same color-wheel logic the frame accent uses.
      if (frameColors?.border) {
        setStitchColor(complementaryHex(frameColors.border))
      }
    } catch (err) {
      console.error('Background removal failed:', err)
      setBgRemoveError(err.message || 'Background removal failed')
    } finally {
      setBgRemoving(false)
    }
  }

  const undoBackgroundRemoval = () => {
    setDisplayImage(image)
    setSubjectMask(null)
    setStitchEnabled(false)
  }

  const toggleStitch = () => {
    setStitchEnabled((v) => !v)
  }

  // Contour is only recomputed when the mask changes, not on every render —
  // tracing walks the whole mask boundary and isn't cheap enough to redo
  // per frame.
  const stitchContour = useMemo(
    () => (subjectMask ? traceContour(subjectMask, 128) : null),
    [subjectMask]
  )

  const downloadImage = () => {
    const url = canvasApiRef.current?.exportDataURL()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'decorated-photo.png'
    a.click()
  }

  const reset = () => {
    setImage(null)
    setDisplayImage(null)
    setSubjectMask(null)
    setBgRemoving(false)
    setBgRemoveError(null)
    setStitchEnabled(false)
    setStickers([])
    setMoodKey(null)
    setSceneKey(null)
    setQuote('')
    setSelectedStickerId(null)
    setDetection(null)
    setFrameColors(null)
    setPhotoOverlay('none')
    setCaptionFont(null)
    setAiAnalyzing(false)
    setAiProgress(0)
    setAiError(null)
    setAiObjects(null)
  }

  useEffect(() => {
    const up = () => endDrag()
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchend', up)
    }
  }, [])

  // Belt-and-suspenders: release any not-yet-revoked object URL if the app
  // unmounts mid-upload, so a closed tab never leaves one dangling.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="lang-toggle">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => changeLang('en')}>
            EN
          </button>
          <button className={lang === 'ko' ? 'active' : ''} onClick={() => changeLang('ko')}>
            한국어
          </button>
        </div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      {!image ? (
        <div
          className="dropzone"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <p>{t.dropHint}</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileInputChange} hidden />
        </div>
      ) : (
        <div className="editor">
          <div className="editor-main">
            <div
              className="canvas-wrap"
              onMouseDown={onCanvasPointerDown}
              onMouseMove={onCanvasPointerMove}
              onTouchStart={onCanvasPointerDown}
              onTouchMove={onCanvasPointerMove}
            >
              <PhotoCanvas
                ref={canvasApiRef}
                image={displayImage}
                mask={subjectMask}
                stitchOutline={stitchEnabled && stitchContour ? { contour: stitchContour, color: stitchColor } : null}
                frameColors={frameColors || { base: '#eee', border: '#ccc', smallAccent: '#999', quoteBackground: '#faf7f2', quoteText: '#222' }}
                frameStyle={frameStyle}
                photoOverlay={photoOverlay}
                stickers={stickers}
                quote={quote}
                captionFont={captionFont}
                canvasSize={CANVAS_SIZE}
              />
            </div>
            <div className="canvas-actions">
              <button onClick={downloadImage} className="primary">
                {t.download}
              </button>
              <button onClick={reset} className="ghost">
                {t.startOver}
              </button>
            </div>
          </div>

          <aside className="editor-panel">
            <section>
              <h3>{t.mode}</h3>
              <div className="mood-row">
                {DECORATION_MODE_KEYS.map((key) => (
                  <button
                    key={key}
                    className={`chip text-chip ${key === modeKey ? 'active' : ''}`}
                    onClick={() => changeMode(key)}
                    title={DECORATION_MODES[key].description}
                  >
                    {DECORATION_MODES[key].label}
                  </button>
                ))}
              </div>
            </section>

            {mood && (
              <section>
                <h3>
                  {t.mood}: {mood.emoji} {mood.label}
                </h3>
                <div className="mood-row">
                  {MOOD_KEYS.map((key) => (
                    <button
                      key={key}
                      className={`chip ${key === moodKey ? 'active' : ''}`}
                      onClick={() => changeMood(key)}
                      title={MOODS[key].label}
                    >
                      {MOODS[key].emoji}
                    </button>
                  ))}
                </div>
                <p className="hint">{t.moodHint}</p>
              </section>
            )}

            <section>
              <h3>{t.frameStyle}</h3>
              <div className="mood-row">
                {FRAME_STYLES.map((style) => (
                  <button
                    key={style}
                    className={`chip text-chip ${style === frameStyle ? 'active' : ''}`}
                    onClick={() => setFrameStyle(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>{t.photoOverlay}</h3>
              <div className="mood-row">
                {PHOTO_OVERLAYS.map((ov) => (
                  <button
                    key={ov}
                    className={`chip text-chip ${ov === photoOverlay ? 'active' : ''}`}
                    onClick={() => setPhotoOverlay(ov)}
                  >
                    {ov === 'none' ? t.overlayNone : ov === 'glossy' ? t.overlayGlossy : t.overlayGrain}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>{t.aiAnalysis}</h3>
              <button onClick={analyzeWithAI} className="ghost" disabled={aiAnalyzing}>
                {aiAnalyzing
                  ? aiProgress > 0
                    ? t.aiDownloading.replace('{pct}', aiProgress)
                    : t.aiAnalyzing
                  : t.aiAnalyzeButton}
              </button>
              {aiError && <p className="hint bg-error">{t.aiError}</p>}
              {aiObjects && aiObjects.length > 0 && (
                <p className="hint">
                  {t.aiDetected} {aiObjects.map((o) => o.name).join(', ')}
                </p>
              )}
              <p className="hint">{t.aiHint}</p>
            </section>

            <section>
              <h3>{t.background}</h3>
              {!subjectMask ? (
                <button onClick={removeBackground} className="ghost" disabled={bgRemoving}>
                  {bgRemoving ? t.removingBackground : t.removeBackground}
                </button>
              ) : (
                <button onClick={undoBackgroundRemoval} className="ghost">
                  {t.undoBackground}
                </button>
              )}
              {bgRemoveError && <p className="hint bg-error">{t.bgError}</p>}

              <div className="stitch-row">
                <label className="stitch-toggle">
                  <input
                    type="checkbox"
                    checked={stitchEnabled}
                    onChange={toggleStitch}
                    disabled={!subjectMask}
                  />
                  {t.stitchOutline}
                </label>
                {stitchEnabled && subjectMask && (
                  <>
                    <span className="swatch active" style={{ background: stitchColor }} title={stitchColor} />
                    <button
                      type="button"
                      className="color-picker-toggle"
                      onClick={() => setStitchWheelOpen((v) => !v)}
                    >
                      {t.pickColor}
                    </button>
                  </>
                )}
              </div>
              {stitchEnabled && subjectMask && stitchWheelOpen && (
                <ColorWheel value={stitchColor} onChange={setStitchColor} />
              )}
              {!subjectMask && <p className="hint">{t.stitchHint}</p>}
            </section>

            <section>
              <h3>{t.stickers}</h3>
              <div className="sticker-grid">
                {mood?.stickers.map((name) => (
                  <button key={name} className="sticker-btn" onClick={() => addSticker(name)} title={`Add ${name}`}>
                    <MiniSticker name={name} color={mood.palette[0]} />
                  </button>
                ))}
              </div>
              <details className="more-stickers">
                <summary>{t.moreStickers}</summary>
                <div className="sticker-grid">
                  {Object.keys(STICKER_SHAPES)
                    .filter((n) => !mood?.stickers.includes(n))
                    .map((name) => (
                      <button key={name} className="sticker-btn" onClick={() => addSticker(name)} title={`Add ${name}`}>
                        <MiniSticker name={name} color={mood?.palette[0] || '#888'} />
                      </button>
                    ))}
                </div>
              </details>
              {selectedStickerId != null && (
                <div className="sticker-controls">
                  <button onClick={() => resizeSelected(0.015)}>{t.bigger}</button>
                  <button onClick={() => resizeSelected(-0.015)}>{t.smaller}</button>
                  <button onClick={() => rotateSelected(0.2)}>{t.rotate}</button>
                  <button onClick={removeSelectedSticker} className="danger">
                    {t.remove}
                  </button>
                </div>
              )}
              {selectedSticker && (
                <div className="color-picker">
                  <span className="color-picker-label">{t.color}</span>
                  <div className="swatch-row">
                    {STICKER_SWATCHES.map((c) => (
                      <button
                        key={c}
                        className={`swatch ${selectedSticker.color === c ? 'active' : ''}`}
                        style={{ background: c }}
                        onClick={() => recolorSelected(c)}
                        title={c}
                      />
                    ))}
                    <button
                      type="button"
                      className="color-picker-toggle"
                      onClick={() => setStickerWheelOpen((v) => !v)}
                    >
                      {t.pickColor}
                    </button>
                  </div>
                  {stickerWheelOpen && (
                    <ColorWheel value={selectedSticker.color} onChange={recolorSelected} />
                  )}
                </div>
              )}
              <p className="hint">{t.dragHint}</p>
            </section>

            <section>
              <h3>
                {t.scene}: {scene?.emoji} {scene?.label[lang]}
              </h3>
              <div className="mood-row">
                {SCENE_KEYS.map((key) => (
                  <button
                    key={key}
                    className={`chip text-chip ${key === sceneKey ? 'active' : ''}`}
                    onClick={() => changeScene(key)}
                    title={SCENES[key].label[lang]}
                  >
                    {SCENES[key].emoji} {SCENES[key].label[lang]}
                  </button>
                ))}
              </div>
              <p
                className={`quote-preview ${lang === 'ko' ? 'quote-ko' : 'quote-en'}`}
                style={captionFont ? { fontFamily: `"${captionFont.family}", ${captionFont.fallback}` } : undefined}
              >
                "{quote}"
              </p>
              <button onClick={shuffleQuote} className="ghost">
                {t.shuffleQuote}
              </button>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

function MiniSticker({ name, color }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 32, 32)
    drawSticker(ctx, name, 16, 16, 13, color)
  }, [name, color])
  return <canvas ref={canvasRef} width={32} height={32} />
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}
function clamp01(v) {
  return clamp(v, 0, 1)
}

export default App
