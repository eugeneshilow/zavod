# raw-montage.md
**сырьё без редактуры, угол: монтаж и DSP, дата проверки 2026-09-21**

Задача-контекст: 164 wpm, ноль пауз >0.15 с, последнее слово фразы тянется (медиана 0.6 с vs 0.28 с).
Отвергнуто заказчиком: `ffmpeg atempo` ×2–3 на куске 80 мс → артефакты.

---

## 0. ЛОКАЛЬНАЯ ПРОВЕРКА ОКРУЖЕНИЯ (факт, не доки) — 2026-09-21

Команда: `ffmpeg -version` →
```
ffmpeg version 9.0.1 Copyright (c) 2000-2026 the FFmpeg developers
configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/9.0.1_1 --enable-shared --enable-pthreads
 --enable-version3 --cc=clang --enable-ffplay --enable-gpl --enable-libsvtav1 --enable-libopus
 --enable-libx264 --enable-libmp3lame --enable-libdav1d --enable-libvmaf --enable-libvpx
 --enable-libx265 --enable-openssl --enable-videotoolbox --enable-audiotoolbox --enable-neon
```
**КРИТИЧНО: в сборке НЕТ `--enable-librubberband`.** Проверка:
`ffmpeg -filters | grep -iE "rubberband|atempo|silenceremove|acrossfade|afade|asetrate"` →
```
 .. acrossfade        N->A       Cross fade two input audio streams.
 T. afade             A->A       Fade in/out input audio.
 TS arnndn            A->A       Reduce noise from speech using Recurrent Neural Networks.
 .. asetrate          A->A       Change the sample rate without altering the data.
 .. atempo            A->A       Adjust audio tempo.
 T. silenceremove     A->A       Remove silence.
```
→ фильтра `rubberband` НЕТ. Значит `ffmpeg -af rubberband=...` на этой машине НЕ РАБОТАЕТ.
Обходные пути (проверить отдельно): `brew install ffmpeg --HEAD` не помогает; нужен tap
`homebrew-ffmpeg/ffmpeg` с `--with-rubberband`, ЛИБО использовать standalone CLI (он уже есть).

`sox` — НЕ УСТАНОВЛЕН (`which sox` → not found).
`praat` — НЕ УСТАНОВЛЕН.
`auto-editor` — НЕ УСТАНОВЛЕН.
`rubberband` CLI — **ЕСТЬ, версия 4.0.0** (`/opt/homebrew/bin/rubberband`, `brew list --versions rubberband` → `rubberband 4.0.0`).

---

## 1. RUBBER BAND CLI 4.0.0 — дословный вывод `rubberband --help` / `--full-help`
Источник: локальный бинарь 4.0.0, проверено 2026-09-21. Доки онлайн: https://breakfastquay.com/rubberband/

Шапка: "Rubber Band / An audio time-stretching and pitch-shifting library and utility program. / Copyright 2007-2024 Particular Programs Ltd."

Usage: `rubberband [options] <infile.wav> <outfile.wav>`

Время/питч (дословно):
```
  -t<X>, --time <X>       Stretch to X times original duration, or
  -T<X>, --tempo <X>      Change tempo by multiple X (same as --time 1/X), or
  -T<X>, --tempo <X>:<Y>  Change tempo from X to Y (same as --time X/Y), or
  -D<X>, --duration <X>   Stretch or squash to make output file X seconds long
  -p<X>, --pitch <X>      Raise pitch by X semitones, or
  -f<X>, --frequency <X>  Change frequency by multiple X
```
→ **`rubberband -t 3 in.wav out.wav` = в 3 раза ДЛИННЕЕ.** (`-t` = time ratio, а не tempo!)

**ВАРЬИРУЮЩИЙСЯ СТРЕТЧ — ключевая находка для «тянущегося последнего слова»:**
```
  -M<F>, --timemap <F>    Use file F as the source for time map

  A time map (or key-frame map) file contains a series of lines, each with two
  sample frame numbers separated by a single space. These are source and
  target frames for fixed time points within the audio data, defining a varying
  stretch factor through the audio. When supplying a time map you must specify
  an overall stretch factor using -t, -T, or -D as well, to determine the
  total output duration.
```
→ Это позволяет ОДНИМ проходом по всей фразе растянуть ТОЛЬКО хвост, без резки/склейки
   и без стыков → нет щелчков в принципе. Это главный аргумент против «резать кусок 80 мс».

Движки (дословно):
```
  -2,    --fast           Use the R2 (faster) engine
  This is the default (for backward compatibility) when this tool is invoked
  as "rubberband". It was the only engine available in versions prior to v3.0.

  -3,    --fine           Use the R3 (finer) engine
  This is the default when this tool is invoked as "rubberband-r3". It almost
  always produces better results than the R2 engine, but with significantly
  higher CPU load.
```
→ **ВАЖНО: по умолчанию `rubberband` = R2 (старый). Надо явно `-3`.** Вероятная причина
  «помех» у владельца, если он вообще пробовал rubberband без флага.

Форманты:
```
  -F,    --formant        Enable formant preservation when pitch shifting
  This option attempts to keep the formant envelope unchanged when changing
  the pitch, retaining the original timbre of vocals and instruments in a
  recognisable way.
```
→ NB: дословно сказано "when pitch shifting". При ЧИСТОМ time-stretch (без -p) форманты
  и так не двигаются — `-F` тут не обязателен. Не верить советам «включи -F для стретча».

Прочее:
```
  -c<N>, --crisp <N>      Crispness (N = 0,1,2,3,4,5,6); default 5
  This option only has an effect when using the R2 (faster) engine.
         --centre-focus   Preserve focus of centre material in stereo
```
Тонкая настройка (пометка (2) = только R2):
```
  -R,    --realtime       Select realtime mode (implies --no-threads).
(2)      --no-transients  Disable phase resynchronisation at transients
(2)      --bl-transients  Band-limit phase resync to extreme frequencies
(2)      --no-lamination  Disable phase lamination
(2)      --smoothing      Apply window presum and time-domain smoothing
(2)      --detector-perc  Use percussive transient detector (as in pre-1.5)
(2)      --detector-soft  Use soft transient detector
(2)      --window-long    Use longer processing window (actual size may vary)
         --window-short   Use shorter processing window (with the R3 engine
                          this is effectively a quick "draft mode")
         --pitch-hq       In RT mode, use a slower, higher quality pitch shift
         --ignore-clipping Ignore clipping at output; the default is to restart
                          with reduced gain if clipping occurs
  -L,    --loose          [Accepted for compatibility but ignored; always off]
  -P,    --precise        [Accepted for compatibility but ignored; always on]
```
Уровни crispness (дословно, все с пометкой (2) = R2-only):
```
  -c 0   equivalent to --no-transients --no-lamination --window-long
  -c 1   equivalent to --detector-soft --no-lamination --window-long (for piano)
  -c 2   equivalent to --no-transients --no-lamination
  -c 3   equivalent to --no-transients
  -c 4   equivalent to --bl-transients
  -c 5   default processing options
  -c 6   equivalent to --no-lamination --window-short (may be good for drums)
```
→ Для ВОКАЛА / устойчивого гласного на R2 канон — `-c 0` или `-c 1`
  (`--no-transients --no-lamination --window-long`): нет ложных ресинхронизаций фазы,
  длинное окно = меньше «фазовости». НО: на R3 эти флаги игнорируются.

**Вывод по п.1 (предварительный): `rubberband -3 -t 3 in.wav out.wav` или
`rubberband -3 -M timemap.txt -D <sec> phrase.wav out.wav`.**

---

## 2. FFMPEG `rubberband` ФИЛЬТР — доки

Источники (проверено 2026-09-21):
- https://ffmpeg.org/ffmpeg-filters.html (раздел 8.104 rubberband; при fetch страница обрезается — см. «сомнительно»)
- https://ayosec.github.io/ffmpeg-filters-docs/8.0/Filters/Audio/rubberband.html (зеркало доков FFmpeg 8.0)
- https://ffmpeg.org/pipermail/ffmpeg-cvslog/2015-September/093952.html (коммит, добавивший доку в filters.texi, сентябрь 2015)
- https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/af_rubberband.c (таблица AVOption)

Вводная строка (дословно по доке): **"Apply time-stretching and pitch-shifting with librubberband."**
Флаг сборки (дословно): **"To enable compilation of this filter, you need to configure FFmpeg with `--enable-librubberband`."**

Опции и допустимые значения (из filters.texi + af_rubberband.c):
| опция | тип | дефолт | значения / описание |
|---|---|---|---|
| `tempo` | double | 1 | 0.01–100. "Set tempo scale factor." RUNTIME (командой) |
| `pitch` | double | 1 | 0.01–100. "Set pitch scale factor." RUNTIME (командой) |
| `transients` | int | crisp | `crisp` / `mixed` / `smooth` — "Set transients detector." |
| `detector` | int | compound | `compound` / `percussive` / `soft` |
| `phase` | int | laminar | `laminar` / `independent` |
| `window` | int | standard | `standard` / `short` / `long` — "Set processing window size." |
| `smoothing` | int | off | `off` / `on` |
| `formant` | int | shifted | `shifted` / `preserved` — "Enable formant preservation when shift pitching." |
| `pitchq` | int | quality | `quality` / `speed` / `consistency` — "Set pitch quality." |
| `channels` | int | apart | `apart` / `together` |

Commands (раздел 8.104.1): только `tempo` и `pitch` помечены `AV_OPT_FLAG_RUNTIME_PARAM`,
т.е. меняются на лету через `sendcmd`/`zmq`. → **можно сделать плавно нарастающий стретч
на хвосте фразы прямо в ffmpeg через `sendcmd`** (см. «рецепт»).

ВАЖНО: `ffmpeg -af rubberband=...` использует **R2-движок** через legacy API librubberband
(фильтр написан в 2015, до появления R3 в v3.0, 2022). Выбора движка в опциях фильтра НЕТ.
→ Для качества на ×2–3 CLI `rubberband -3` строго лучше ffmpeg-фильтра. (вывод мой, помечаю как
 инференс, не цитата — см. «Не найдено / сомнительно»)

Соответствие CLI-флагов R2 ↔ опций фильтра (по crispness-таблице из --full-help):
`-c 0` = `--no-transients --no-lamination --window-long` ≈ `rubberband=transients=smooth:phase=independent:window=long`
`-c 1` = `--detector-soft --no-lamination --window-long` ≈ `rubberband=detector=soft:phase=independent:window=long`
→ Для **ВОКАЛА / сильного стретча** каноничный набор в ffmpeg-фильтре:
   `rubberband=tempo=0.33:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality`
   (это прямая калька `-c 0/-c 1` + smoothing; дословной рекомендации «для вокала» в доках FFmpeg НЕТ)

Официальная формулировка про R3 vs R2 (Rubber Band docs / GitHub README, проверено 2026-09-21,
https://github.com/breakfastquay/rubberband , https://breakfastquay.com/rubberband/):
> R3 "almost always produces better results than the R2 engine, but with significantly higher CPU load."
> R3 лучше "especially complex mixes, vocals and other sounds that have soft onsets and smooth
> pitch changes, and music with substantial bass content"
> R2 примерно втрое быстрее R3 по sustained throughput
> (источник для последнего: https://thebreakfastpost.com/2022/09/30/performance-improvements-in-rubber-band-library/)
→ **Вокал прямо назван как материал, на котором R3 выигрывает. Это точный ответ на «помехи».**

---

## 3. FFMPEG `atempo` и `silenceremove` — локальный `ffmpeg -h filter=` (9.0.1, 2026-09-21)

### atempo
```
atempo AVOptions:
   tempo             <double>     ..F.A....T. set tempo scale factor (from 0.5 to 100) (default 1)
```
→ **В ffmpeg 9.0.1 диапазон 0.5–100, а не исторический 0.5–2.0.** Цепочка `atempo=2,atempo=1.5`
  нужна только на старых сборках (лимит 2.0 сняли в 2021, commit «avfilter/af_atempo: extend
  tempo range»). НО: качество atempo = WSOLA, на >2× и на коротких кусках даёт метал/эхо.
  Это ровно тот артефакт, который забраковал владелец.
  Флаг `T` = timeline support + runtime command.

### silenceremove (полный список опций, дословный вывод)
```
   start_periods     <int>        set periods of silence parts to skip from start (from 0 to 9000) (default 0)
   start_duration    <duration>   set start duration of non-silence part (default 0)
   start_threshold   <double>     set threshold for start silence detection (from 0 to DBL_MAX) (default 0)
   start_silence     <duration>   set start duration of silence part to keep (default 0)
   start_mode        <int>        set which channel will trigger trimming from start (default any)  [any|all]
   stop_periods      <int>        set periods of silence parts to skip from end (from -9000 to 9000) (default 0)
   stop_duration     <duration>   set stop duration of silence part (default 0)
   stop_threshold    <double>     set threshold for stop silence detection (from 0 to DBL_MAX) (default 0)
   stop_silence      <duration>   set stop duration of silence part to keep (default 0)
   stop_mode         <int>        set which channel will trigger trimming from end (default all)  [any|all]
   detection         <int>        set how silence is detected (default rms)
     avg  0   use mean absolute values of samples
     rms  1   use root mean squared values of samples
     peak 2   use max absolute values of samples
     median 3 use median of absolute values of samples
     ptp  4   use absolute of max peak to min peak difference
     dev  5   use standard deviation from values of samples
   window            <duration>   set duration of window for silence detection (default 0.02)
   timestamp         <int>        set how every output frame timestamp is processed (default write)
     write 0  full timestamps rewrite, keep only the start time
     copy  1  non-dropped frames are left with same timestamp
```
NB: `stop_mode` дефолт = `all` (в старых версиях был `any`), `detection` дефолт = `rms`
(в старых был `rms`? — в 4.x дефолт был `rms`, в 5.x добавили avg/median/ptp/dev). Проверять на своей сборке.

**РЕЦЕПТ «убрать все паузы длиннее 150 мс, оставив 80 мс»:**
```
ffmpeg -i in.wav -af \
"silenceremove=stop_periods=-1:stop_duration=0.15:stop_threshold=-38dB:stop_silence=0.08:detection=rms:window=0.02" \
out.wav
```
Разбор: `stop_periods=-1` = «убирать ВСЕ периоды тишины по всему файлу» (отрицательное значение —
ключ к пакетной обработке, а не только к концу файла); `stop_duration=0.15` = тишина считается
тишиной только после 150 мс → паузы ≤150 мс не трогаются вообще; `stop_silence=0.08` = из каждой
вырезанной паузы ОСТАВИТЬ 80 мс — именно это спасает от щелчков и от «слипшейся» речи.
`stop_threshold` в dB (можно и в линейных 0..1). Для шумного закадра начинать с -35…-45 dB.

### acrossfade (локальный -h, 9.0.1)
```
   nb_samples / ns   <int64>   set number of samples for cross fade duration (default 44100)
   duration / d      <duration> set cross fade duration (default 0)
   overlap / o       <boolean> overlap 1st stream end with 2nd stream start (default true)
   curve1 / curve2   <int>     set fade curve type ... (default tri)
     nofade -1, tri 0, qsin 1, esin 2, hsin 3, log 4, ipar 5, qua 6, cub 7, squ 8, cbr 9,
     par 10, exp 11, iqsin 12, ihsin 13, dese 14, desi 15, losi 16, sinc 17, isinc 18,
     quat 19, quatr 20, qsin2 21, hsin2 22
```
→ Для склейки речи каноничная кривая — `tri` (линейная) или `qsin`/`hsin` (равномощная,
  equal-power: не проваливает громкость в середине кроссфейда). Для стыка кусков ОДНОГО
  непрерывного сигнала правильнее equal-power = `qsin`. Длительность 5–20 мс.

---

## 4. SOX: `tempo` vs `stretch`
Источник: man sox, https://linux.die.net/man/1/sox (проверено 2026-09-21). sox НЕ установлен локально.

Синтаксис (дословно из man):
```
tempo [-q] [-m | -s | -l] factor [segment [search [overlap]]]
stretch factor [window fade shift fading]
```
Дефолты `tempo`: **segment = 0.082 с, search = 0.020 с, overlap = 0.020 с.**
→ Заметь: дефолтный сегмент WSOLA у sox = 82 мс. Кусок в 80 мс, который резал владелец,
  МЕНЬШЕ одного окна анализа. Любой WSOLA/OLA на таком куске физически не может работать —
  отсюда «помехи». Это, похоже, и есть корень проблемы.

`stretch`: window по умолчанию 20 мс. Дословная оценка из man:
> "This effect is broadly equivalent to the tempo effect with (factor inverted and)
> search set to zero, so in general, its results are comparatively poor; it is retained
> as it can sometimes out-perform tempo for small factors."
→ **`stretch` официально признан хуже `tempo`.** Использовать не стоит, кроме мелких коэффициентов.

Флаги `-m` / `-s` / `-l` (music / speech / linear) — точные формулировки из man вытащить
не удалось (страница обрезается при fetch). Общеизвестно: `-m` = music, `-s` = speech
(короче сегмент, агрессивнее поиск), `-l` = linear/без WSOLA-поиска. **ПОМЕЧАЮ КАК НЕПОДТВЕРЖДЁННОЕ**,
проверить `sox --help-effect tempo` после установки (`brew install sox`).

Вывод: sox tempo на ×2–3 коротких вокальных кусков — заведомо хуже rubberband R3. Не тратить время.

---

## 5. PRAAT / PSOLA — ПРАВИЛЬНЫЙ ИНСТРУМЕНТ ДЛЯ «ТЯНУЩЕГОСЯ ГЛАСНОГО»
Источники (проверено 2026-09-21):
- https://www.fon.hum.uva.nl/praat/manual/Intro_8_2__Manipulation_of_duration.html
- https://www.fon.hum.uva.nl/praat/manual/Sound__Lengthen__overlap-add____.html
- https://www.fon.hum.uva.nl/praat/manual/TextGrid__To_DurationTier___.html
- https://www.fon.hum.uva.nl/praat/manual/overlap-add.html

### 5.1 `Sound: Lengthen (overlap-add)...` — дословные настройки
> Pitch floor (Hz): "the minimum pitch used in the periodicity analysis. The standard value is 75 Hz."
> Pitch ceiling (Hz): "the maximum pitch used in the periodicity analysis. The standard value is 600 Hz."
> Factor: "the factor with which the sound will be lengthened. The standard value is 1.5."
> **"A value larger than 3 will not work."**
→ **Жёсткий потолок PSOLA в Praat = ×3.** Задача владельца (0.28 → 0.6 с = ×2.14) вписывается.
  Для мужского русского голоса pitch floor выставлять ~60–75 Гц, ceiling ~300 Гц (не 600 —
  иначе детектор периода ловит гармоники и даёт «дребезг»). Это ключевой параметр качества PSOLA.

### 5.2 `TextGrid: To DurationTier...` — ГЛАВНАЯ НАХОДКА ДЛЯ ЗАДАЧИ
Дословно:
> "Creates a DurationTier that could scale the durations of the specified intervals of the
> selected TextGrid with a specified factor."
Настройки (дословно):
> Tier number: "specifies the tier with the intervals"
> Time scale factor: "specifies the scale factor by which the duration of a selected interval
>   has to be multiplied"
> Left transition duration: "specifies how long it takes to go from a time scale factor of 1.0
>   to the specified one"
> Right transition duration: "specifies the time it takes to go from the specified time scale
>   factor to 1.0"
> Scale intervals whose labels: "specifies the interval selection criterion"

→ **`Left/Right transition duration` = ровно тот приём, о котором спрашивал владелец:**
  растягивается только СЕРЕДИНА (steady-state) гласного, а переходы (форманто-переходы в/из
  соседних согласных) остаются в оригинальном темпе, коэффициент нарастает плавно.
  Никаких резких стыков коэффициента → никаких щелчков и «помех».
  Типичные значения transition: 20–40 мс (порядок 2–4 периода основного тона).

### 5.3 Рабочий процесс в Praat (из Intro 8.2, дословные команды меню)
> "First, you select a Sound object and click 'To Manipulation'. A Manipulation object will
> then appear in the list."
> "You can add targets to this tier by choosing 'Add duration point at cursor' from the 'Dur' menu."
> "To put this DurationTier back into a Manipulation object, you select the two objects together
> ... and choose Replace duration tier."
> "To get the modified sound as a separate object, choose Publish resynthesis from the File menu."
> DurationTier "uses linear interpolation, so it can only approximate these precise times,
> but fortunately to any precision you like."
Про overlap-add в целом: > "A method for manipulating the pitch and duration of an acoustic speech signal."

### 5.4 Готовый скрипт Praat (растянуть ОДИН гласный по таймкодам) — мой код, не цитата
```praat
# praat --run stretch_vowel.praat in.wav out.wav 0.812 0.892 2.2
form args
  sentence infile
  sentence outfile
  real t1
  real t2
  real factor
endform
snd = Read from file: infile$
man = To Manipulation: 0.01, 60, 300     ; time step, pitch floor, pitch ceiling (муж. голос)
dur = Create DurationTier: "d", 0, Get total duration
# плавный въезд/выезд по 30 мс вокруг устойчивой части
Add point: t1 - 0.030, 1.0
Add point: t1,         factor
Add point: t2,         factor
Add point: t2 + 0.030, 1.0
selectObject: man, dur
Replace duration tier
selectObject: man
out = Get resynthesis (overlap-add)
Save as WAV file: outfile$
```
NB: команда называется **`Get resynthesis (overlap-add)`** в скриптовом API (в GUI —
`Publish resynthesis`). Проверить точное имя на своей версии: `praat --version`.
Praat локально НЕ установлен → `brew install --cask praat`.

### 5.5 parselmouth (Python-обёртка Praat)
https://parselmouth.readthedocs.io/ (проверено 2026-09-21)
Рецепт: `call(sound, "Lengthen (overlap-add)", 60, 300, 2.2)` — прямой вызов того же PSOLA.
Для DurationTier: `manipulation = call(sound, "To Manipulation", 0.01, 60, 300)`,
`duration_tier = call("Create DurationTier", ...)`, `call([manipulation, duration_tier], "Replace duration tier")`,
`call(manipulation, "Get resynthesis (overlap-add)")`.
**Готовых рецептов именно «растянуть один гласный» в официальных доках parselmouth НЕ НАШЁЛ**
(есть примеры по pitch manipulation). См. «Не найдено».

---

## 6. PyTSMod — TSM-библиотека с ANCHOR POINTS (лучший питон-вариант)
Источники: https://pypi.org/project/pytsmod/ , https://github.com/KAIST-MACLab/PyTSMod (проверено 2026-09-21)

Реализованные алгоритмы (дословно по README): **OLA, WSOLA, TD-PSOLA, PV-TSM (phase vocoder)**.
Есть HPTSM (harmonic-percussive separation + разные TSM на компоненты).

Нелинейный стретч по опорным точкам (дословный пример из README):
```python
s_ap = np.array([[0, x_length / 2, x_length], [0, x_length, x_length * 1.5]])
x_s_ap = tsm.wsola(x, s_ap)
```
Описание параметра (дословно): фактор может быть числом ИЛИ
> "2 x n array of anchor points which contains the sample points of the input signal in the
> first row and the sample points of the output signal in the second row"

→ **Это прямой аналог `--timemap` у rubberband, но в Python и с TD-PSOLA.**
  TD-PSOLA — лучший алгоритм для монофонического голоса: он режет по периодам основного тона,
  поэтому на гласном НЕТ фазовых артефактов вообще (в отличие от phase vocoder / WSOLA).

Рабочий кусок (мой код):
```python
import numpy as np, soundfile as sf, pytsmod as tsm
x, sr = sf.read('phrase.wav'); x = x.T if x.ndim>1 else x
t1, t2 = int(0.812*sr), int(0.892*sr)     # границы устойчивой части гласного
F = 2.2
N = len(x) if x.ndim==1 else x.shape[-1]
src = np.array([0, t1, t2, N])
dst = np.array([0, t1, t1 + int((t2-t1)*F), N + int((t2-t1)*(F-1))])
y = tsm.tdpsola(x, sr, np.vstack([src, dst]))   # TD-PSOLA, монофонический голос
sf.write('out.wav', y.T if y.ndim>1 else y, sr)
```
NB: у `tsm.tdpsola` сигнатура `tdpsola(x, sr, src_f0=None, tgt_f0=None, alpha=1, ...)` —
проверить, принимает ли он anchor-массив в `alpha` на текущей версии. WSOLA/PV точно принимают.

---

## 7. WORLD vocoder / pyworld — «растяжка без помех вообще»
Источники (проверено 2026-09-21):
- https://github.com/JeremyCCHsu/Python-Wrapper-for-World-Vocoder (pyworld, pip install pyworld)
- https://github.com/tuanad121/Python-WORLD (чистый Python, есть `example/prosody.py`)

Пайплайн: `pw.wav2world(x, fs)` → (f0, sp, ap) → модифицировать длительность ПО КАДРАМ →
`pw.synthesize(f0', sp', ap', fs, frame_period)`.
Так как ресинтез идёт из параметров (F0 + спектральная огибающая + апериодичность),
«фазовых помех» не бывает в принципе — фаза генерируется заново.
В Python-WORLD есть прямой метод: `vocoder.scale_duration(dat, 2)` (2 = вдвое длиннее).

Рабочий кусок для ОДНОГО гласного (мой код):
```python
import numpy as np, soundfile as sf, pyworld as pw
x, fs = sf.read('phrase.wav'); x = x.astype(np.float64)
fp = 5.0                                   # frame_period, мс
f0, sp, ap = pw.wav2world(x, fs, frame_period=fp)
i1, i2 = int(812/fp), int(892/fp)          # кадры устойчивой части гласного (мс/fp)
F = 2.2
idx = np.r_[np.arange(0, i1),
            i1 + (np.arange(0, int((i2-i1)*F)) / F),   # дробные индексы = интерполяция кадров
            np.arange(i2, len(f0))]
gi = np.clip(idx, 0, len(f0)-1)
f0n = np.interp(gi, np.arange(len(f0)), f0)
spn = np.array([sp[int(round(j))] for j in gi])
apn = np.array([ap[int(round(j))] for j in gi])
y = pw.synthesize(f0n, spn, apn, fs, frame_period=fp)
sf.write('out.wav', y, fs)
```
→ Плюс: можно ОДНОВРЕМЕННО задать питч-контур хвоста (ровный / чуть падающий), что и делает
  манеру «протяжного дикторского хвоста». Минус: WORLD слегка «пластмассит» тембр на всём файле —
  поэтому применять ТОЛЬКО к вырезанному хвосту фразы и вклеивать через кроссфейд 10 мс,
  либо прогнать весь файл через WORLD (тогда тембр однороден).

---

## 8. AUTO-EDITOR — актуальный синтаксис (проверено 2026-09-21)
Источники:
- https://github.com/WyattBlue/auto-editor (README)
- https://auto-editor.com/docs/cookbook
- https://pypi.org/pypi/auto-editor/json → **последняя версия 29.3.1, дата загрузки 2025-11-04**

Установка: `pip install auto-editor` (локально НЕ установлен).

Дословные примеры из README:
```
auto-editor path/to/your/video.mp4
auto-editor example.mp4 --margin 0.2sec
auto-editor example.mp4 --margin 0.3s,1.5sec
auto-editor example.mp4 --edit motion:threshold=0.02
auto-editor example.mp4 --edit audio:threshold=0.04,stream=all
auto-editor example.mp4 --edit "(or audio:0.03 motion:0.06)"
auto-editor example.mp4 --edit audio:-19dB
auto-editor example.mp4 --edit:2 audio:-12dB --when:2 speed:1.5
auto-editor example.mp4 --export premiere
auto-editor example.mp4 --export resolve
auto-editor example.mp4 --export final-cut-pro
auto-editor example.mp4 --export shotcut
auto-editor example.mp4 --export kdenlive
auto-editor example.mp4 --export clip-sequence
```
Из cookbook (дословно):
```
auto-editor video.mp4 --transition dissolve:0.5sec
auto-editor video.mp4 --transition dissolve:0.5sec:0
auto-editor video.mp4 --edit audio:threshold=6%
auto-editor video.mp4 --edit audio:channel=left
auto-editor video.mp4 -w:0 speed:8
auto-editor video.mp4 --cut-out start,30sec -30sec,end
auto-editor whisper video.mp4 ggml-medium.en.bin --format srt -o video.srt
auto-editor video.mp4 --edit subtitle
auto-editor video.mp4 --preview
auto-editor :mic --export resolve -c:a opus -o interview.fcpxml
```
Дословная цитата про margin: > "By default auto-editor keeps `0.2` seconds of padding around each kept section"

**ВАЖНО ДЛЯ ЗАДАЧИ (изменение синтаксиса в 2x-версиях):**
- Старый `--silent-speed 99999` / `--video-speed` **заменён** на систему `--when` / `-w`:
  `-w:0 speed:8` = «на участках, помеченных как тишина, скорость 8×».
  Для «вырезать тишину целиком» — дефолтное поведение (или `speed:99999`).
- `--transition dissolve:0.5sec` — **встроенный кроссфейд на стыках** (новое). Это и есть
  штатное решение проблемы щелчков: `--transition dissolve:0.02sec` ≈ 20 мс кроссфейд.
- **`--margin` с отрицательным значением обрезает агрессивнее**: `--margin -0.05sec,0.1sec`.
  Для «ноль пауз >0.15 с» нужно `--margin 0.04sec` (оставить ~80 мс дыхания суммарно).

Рецепт под задачу (моя сборка из доков):
```
auto-editor voice.wav --edit audio:threshold=-38dB --margin 0.04sec \
  --transition dissolve:0.015sec --export resolve -o voice.fcpxml
```
и/или рендер напрямую:
```
auto-editor voice.wav --edit audio:threshold=-38dB --margin 0.04sec \
  --transition dissolve:0.015sec -o voice_tight.wav
```
NB: `--transition` может не поддерживаться при `--export` в NLE — проверить на 29.3.1.

### Альтернативы (что реально используют шортс-монтажёры)
- **unsilence** (pip install unsilence, https://github.com/lagmoellertim/unsilence) — CLI+python,
  параметры `-sl` (silence level dB), `-sts` (short time silence threshold), `-ss` (silent speed),
  `-as` (audible speed). Проще auto-editor, но БЕЗ кроссфейдов.
- **jumpcutter** (https://github.com/carykh/jumpcutter) — исходный скрипт 2019 г., архивный,
  использует `--silent_speed`/`--sounded_speed`, качество звука низкое (простая децимация). Не брать.
- **Descript / Adobe Podcast** — «Remove Gaps» / «Shorten Word Gaps» в Descript (ползунок
  «shorten gaps longer than X to Y») — ровно нужная механика «паузы >0.15 → 0.08», с автокроссфейдом.
  ЭТО самый близкий к задаче готовый продукт. Источник: docs.descript.com «Shorten word gaps».
- **Premiere Pro Text-Based Editing** — «Delete gaps» / «Remove filler words» (с 2023 г.),
  работает по транскрипту; кроссфейды надо ставить руками (Constant Power 0.020s дефолт Premiere).
- **DaVinci Resolve 19/20** — «Audio Assistant» + «Cut silence»; дефолтный audio crossfade 0.020 s.

### Почему нужен кроссфейд на стыке (обоснование)
При вырезании куска соседние сэмплы имеют разную мгновенную амплитуду и фазу → скачок
(step discontinuity) → широкополосный щелчок. Кроссфейд/микрофейд «размазывает» скачок.
Индустриальная норма для речи: **5–20 мс**, equal-power (constant power) кривая.
- Pro Tools smoothing/«fades on region boundaries» дефолт: 5 ms.
- Premiere Pro Constant Power audio transition default: **0.020 s** (настраивается в Preferences).
- В ffmpeg: `acrossfade=d=0.015:c1=qsin:c2=qsin` между двумя кусками,
  либо `afade=t=in:st=0:d=0.005` + `afade=t=out:st=<end-0.005>:d=0.005` на каждом куске
  перед `concat` (микрофейды — проще пачкой).

Пачкой в ffmpeg (микрофейды 5 мс на каждый сегмент + конкат) — мой скрипт:
```bash
# segments.txt: "start end" в секундах, по строке на сегмент речи
i=0; : > list.txt
while read -r s e; do
  d=$(python3 -c "print($e-$s)")
  ffmpeg -nostdin -v error -i in.wav -ss "$s" -to "$e" \
    -af "afade=t=in:st=0:d=0.005,afade=t=out:st=$(python3 -c "print(max(0,$d-0.005))"):d=0.005" \
    -c:a pcm_s16le "seg_$i.wav"
  echo "file 'seg_$i.wav'" >> list.txt; i=$((i+1))
done < segments.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy tight.wav
```

---

## 9. ГРАНИЦЫ КАЧЕСТВА АЛГОРИТМОВ (главный вопрос: «за каким коэффициентом слышны помехи»)

### 9.1 Прямые цитаты о границах
- **ESOLA** (arXiv:1801.06492, Epoch-Synchronous Overlap-Add, проверено 2026-09-21):
  > "the ESOLA technique has the capability to do exact time-scaling of speech with high quality
  > to any desired modification factor **within a range of 0.5 to 2**"
  → Даже лучший time-domain алгоритм для речи официально заявлен до ×2. Выше — деградация.
  Заявлено превосходство над PSOLA "regarding perceptual quality and intelligibility" и скорость
  ≥×3 относительно SOLAFS.
- **Praat `Lengthen (overlap-add)`** (https://www.fon.hum.uva.nl/praat/manual/Sound__Lengthen__overlap-add____.html):
  > **"A value larger than 3 will not work."** → жёсткая граница ×3.
- **AudioStretchy** (TDHS, https://pypi.org/project/audiostretchy/, проверено 2026-09-21):
  > "gives very good results with speech recordings, especially with **modest stretching at the
  > ratio between 0.9 (10% slower) and 1.1 (10% faster)**"
  → TDHS для ×2–3 НЕ ГОДИТСЯ. Вычёркиваем.
- **librosa.effects.time_stretch** (https://librosa.org/doc/main/generated/librosa.effects.time_stretch.html)
  — чистый phase vocoder. Доки audiomentations прямо пишут, что phase vocoding
  > "can significantly degrade audio quality by 'smearing' transient sounds, altering the timbre
  > of harmonic sounds, and distorting pitch modulations"
  (https://iver56.github.io/audiomentations/waveform_transforms/time_stretch/)
  → Это ровно «помехи»/«фейзинесс». librosa НЕ брать для голоса.
- **Phasiness** (обзор литературы, arXiv:2202.07382 «Phase Vocoder Done Right»):
  артефакты phase vocoder называются "transient smearing", "echo", "loss of presence",
  собирательно **"phasiness"**; причина — "loss of phase coherence" между гармониками.
- **WSOLA** на больших коэффициентах: "if you stretch too much with WSOLA, repetitions of the
  same frame become noticeable" → «заикание»/"transient doubling or stuttering"
  (https://dev.to/orca_forge/the-problem-of-robotic-voice-when-changing-speech-speed-from-phase-vocoder-to-wsola-4f5i)

### 9.2 Почему конкретно 80 мс + atempo дал «помехи» (разбор кейса владельца)
- `atempo` в ffmpeg = **WSOLA** с внутренним окном/сегментом порядка 30–80 мс.
- `sox tempo` дефолтный **segment = 0.082 с** (82 мс) — man sox.
- Кусок владельца = **80 мс**, т.е. ≈ ОДНО окно анализа или меньше.
  WSOLA нечего «искать» и не с чем коррелировать → он просто дублирует один и тот же фрагмент
  2–3 раза подряд → «помехи»/«робот»/«железо».
- Плюс два жёстких стыка по краям куска (без кроссфейда) → щелчки.
→ **Вывод: проблема не в «растяжке вообще», а в (а) алгоритме, (б) длине куска < окна,
  (в) отсутствии кроссфейда, (г) растягивании переходов вместе с устойчивой частью.**

### 9.3 Итоговый рейтинг для ×2–3 короткого вокального сегмента (мой синтез по фактам выше)
1. **WORLD / pyworld ресинтез** — артефактов фазы нет ПО ПОСТРОЕНИЮ; коэффициент не ограничен.
   Цена: лёгкая «вокодерность» тембра.
2. **TD-PSOLA** (Praat `Lengthen (overlap-add)` / `DurationTier`, pytsmod `tdpsola`) — до ×3,
   лучший «натуральный» вариант, режет по периодам F0.
3. **Rubber Band R3** (`rubberband -3`) — доки прямо хвалят на вокале и "soft onsets".
4. Signalsmith Stretch (`pip install python-stretch`) — быстрее librosa, качество выше, но
   заявлен для "modest time-stretching"; на ×3 не проверен.
5. Rubber Band R2 (`rubberband` без флага, и **весь ffmpeg-фильтр `rubberband`**) — ниже.
6. `sox tempo` / `ffmpeg atempo` (WSOLA) — на ×2–3 плохо.
7. `librosa.effects.time_stretch` (phase vocoder) — плохо на голосе.
8. `sox stretch` — официально "comparatively poor".
9. `audiostretchy` (TDHS) — только 0.9–1.1.
10. `paulstretch` — это НЕ инструмент для речи: он предназначен для ×8…×50 и сознательно
    превращает звук в эмбиент-текстуру. Для «тянущегося слова» НЕ подходит.
    (https://hypermammut.sourceforge.net/paulstretch/ — «extreme sound stretching»)

### 9.4 pyrubberband — как дотянуться до R3 из Python
https://pyrubberband.readthedocs.io/en/latest/generated/pyrubberband.pyrb.time_stretch.html (2026-09-21)
Сигнатура (дословно): `pyrubberband.pyrb.time_stretch(y, sr, rate, rbargs=None)`
> `rbargs`: "key:value pairs supported by rubberband" (str→str);
> "For single valued rbargs, pass empty string for value. See rubberband -h for details."
→ Значит R3 включается так:
```python
import pyrubberband as pyrb
y2 = pyrb.time_stretch(y, sr, rate=1/2.2, rbargs={'-3': '', '--pitch-hq': ''})
# rate — это TEMPO (меньше 1 = длиннее). Проверить направление на своём куске!
```
Явного упоминания `-3`/`--fine` в доках pyrubberband НЕТ — помечаю как непроверенное,
но `rbargs` пробрасывает произвольные флаги в CLI, так что должно сработать.

### 9.5 ЛОКАЛЬНАЯ ПРОВЕРКА rubberband 4.0.0 на коротких кусках (эксперимент, 2026-09-21)
```
ffmpeg -f lavfi -i "sine=f=180:d=0.08:r=48000" t80.wav
ffmpeg -f lavfi -i "sine=f=180:d=0.30:r=48000" t300.wav
rubberband -q -2 -t 3 t80.wav out.wav ; rubberband -q -3 -t 3 t80.wav out.wav   (и то же для t300)
```
Результат (ffprobe duration):
```
t80  -2 -> 0.240000   t80  -3 -> 0.240000
t300 -2 -> 0.900000   t300 -3 -> 0.900000
```
→ **Оба движка дают ТОЧНУЮ длительность ×3 даже на куске 80 мс, без обрезки/паддинга.**
  Т.е. rubberband, в отличие от atempo/sox, корректно обрабатывает сегменты короче окна анализа.
  (Слуховую оценку не делал — только длительность. numpy локально не установлен,
   спектральную чистоту не мерил — см. «Не найдено».)

---

## 10. ПРОСОДИЯ: ТЕМП РУССКОЙ РЕЧИ И «ФИНАЛЬНОЕ УДЛИНЕНИЕ»

### 10.1 Термин для приёма СУЩЕСТВУЕТ: **phrase-final lengthening / final lengthening**
(рус. «финальное удлинение», «предпаузальная долгота»). Это универсальное просодическое явление.
Источники (проверено 2026-09-21):
- https://link.springer.com/chapter/10.1007/978-3-319-11581-8_44 — «Phrase-Final Lengthening in
  Russian: Pre-boundary or Pre-pausal?»
- https://link.springer.com/chapter/10.1007/978-3-319-01931-4_34 — «Phrase-Final Segment
  Lengthening in Russian: Preliminary Results of a Corpus-Based Study»
- https://dl.acm.org/doi/10.1007/978-3-319-25789-1_13 — «The Influence of Boundary Depth on
  Phrase-Final Lengthening in Russian»
- https://www.sciencedirect.com/science/article/pii/S0095447022000547 — «Final Lengthening and
  vowel length in 25 languages»

Ключевые измерения по РУССКОМУ (из аннотаций выше):
- В читаемой речи предфразовые гласные длиннее сопоставимых нефинальных **примерно на 40 мс**.
- Носителями финального удлинения в русском являются прежде всего **ударные гласные**
  (сильнее, чем заударные).
- Глубина границы влияет на удлинение только **абсолютно финальных** гласных.
- Наличие паузы после слова значимо увеличивает его длительность.
→ **ВАЖНО ДЛЯ ЗАДАЧИ: естественная норма ≈ +40 мс. Владелец хочет 0.28 → 0.6 с = +320 мс (×2.14).
  Это в 8 раз больше естественного. Т.е. это СТИЛИЗОВАННАЯ, а не естественная просодия** —
  значит «натуральность» алгоритма менее критична, чем отсутствие цифровых артефактов.

Смежный термин для самой манеры: **drawl** (протяжность) — «slow prolongation of vowels and
syllables». В измерениях по английскому drawl даёт средние длительности гласных ~188 мс против
144–160 мс (≈ +30%). (https://grokipedia.com/page/Drawl — источник вторичный, доверие среднее)

### 10.2 Темп русской речи — норма
- https://ru.wikipedia.org/wiki/Темп_речи и https://old.bigenc.ru/linguistics/text/4186876
  (Большая российская энциклопедия), проверено 2026-09-21:
  средний темп русской речи **80–120 слов/мин**; «нормальный средний» **100–120 сл/мин».
- Для дикторов/радио приводится «оптимальным считается 60–80 слов в 1 мин …, допустимым — до 120».
- Для английского оптимум аудиокниг 150–160 сл/мин; русские слова длиннее на 20–30%,
  поэтому русский темп при той же скорости артикуляции ниже.
→ **164 слова/мин по-русски — это ОЧЕНЬ быстро, примерно +37% к верхней границе нормы (120).**
  Достижимо только при полном отсутствии пауз (что и заявлено: ноль пауз >0.15 с).
  Т.е. цифра 164 wpm — следствие вырезания пауз, а не быстрой артикуляции.
  При 164 wpm и средней длине слова 0.28 с: 164×0.28 = 45.9 с речи из 60 → на паузы
  и хвосты остаётся ~14 с/мин. Сходится только если хвосты (0.6 с) считаются «речью».

### 10.3 Публичных разборов просодии РУССКИХ шортс-дикторов — НЕ НАЙДЕНО
Поиск «манера озвучки новостных шортсов / тянет последнее слово» даёт только рекламу TTS-сервисов.
Академических или блогерских разборов питч-контура русских шортс-начиток не обнаружено.

---

## 11. УСКОРЕНИЕ РЕЧИ БЕЗ «БУРУНДУКА»

### 11.1 Границы atempo
- Исходник https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/af_atempo.c (проверено 2026-09-21):
  `YAE_ATEMPO_MIN` = **0.5**, `YAE_ATEMPO_MAX` = **100.0**.
- Локальная проверка (ffmpeg 9.0.1): `tempo <double> ... (from 0.5 to 100) (default 1)` — совпадает.
- Исторически **каждый инстанс принимал только 0.5–2.0**, отсюда канонический совет цепочки:
  `-af "atempo=2.0,atempo=1.25"` для ×2.5. На 2026 г. на свежем ffmpeg это уже не нужно,
  НО цепочка из двух atempo по ~1.3 часто звучит ЛУЧШЕ, чем один atempo=1.69
  (меньше искажений на инстанс) — это фолклор монтажёров, не из доков. **Непроверено.**
- `atempo` НЕ меняет питч (WSOLA во временной области) → «бурундука» не даёт вообще.
  «Бурундук» бывает только у `asetrate` (`asetrate=48000*1.3,aresample=48000`) и у `-speed` в NLE
  без pitch-correction.

### 11.2 Альтернативы для ускорения
- `rubberband=tempo=1.35` (ffmpeg-фильтр) — R2, качество среднее.
- CLI: `rubberband -3 -T 1.35 in.wav out.wav` — лучше всего.
- `sox tempo -s 1.35` (`-s` = speech-режим) — специально под речь.
- mpv/scaletempo2 — есть и как ffmpeg-фильтр `scaletempo`/`scaletempo2` (проверить наличие:
  `ffmpeg -filters | grep scaletempo`), это стандартный «ускоритель для подкастов».
- Форманты при чистом time-stretch НЕ сдвигаются ни у одного из них — `formant=preserved`
  нужен ТОЛЬКО если одновременно двигаешь pitch.

### 11.3 Предел разборчивости ускоренной речи
Источники (проверено 2026-09-21):
- https://en.wikipedia.org/wiki/Time_compressed_speech :
  разговорная английская речь ≈150 wpm; «the average person is able to comprehend speech
  presented at rates of up to 200-250 wpm without undue difficulty»; у незрячих — до 300–350 wpm.
- https://link.springer.com/article/10.3758/BF03199702 — «A speech-rate intelligibility threshold
  for speeded and time-compressed connected speech» (классика, пороги для compressed выше, чем
  для speeded — т.е. алгоритмическое сжатие разборчивее, чем просто быстрое чтение).
- https://pubs.aip.org/asa/jasa/article/135/3/1541/693975/ — «Intelligibility of time-compressed
  speech: The effect of uniform versus non-uniform time-compression algorithms»
  → **НЕравномерное сжатие (паузы и «лишнее» сжимаются сильнее, ядра гласных — слабее)
  разборчивее равномерного при том же итоговом темпе.** Это прямо подтверждает стратегию:
  резать паузы + тянуть финальные гласные, а не гнать весь файл через atempo.
**Данных именно по РУССКОЙ речи (порог разборчивости при ускорении) НЕ НАЙДЕНО.** Практическая
прикидка по аналогии: 164 wpm по-русски ≈ по информационной плотности английским 200–210 wpm,
т.е. у верхней границы «без труда», но ещё внутри неё.

---

## НЕ НАЙДЕНО / СОМНИТЕЛЬНО

1. **Дословный текст раздела `rubberband` в ffmpeg-filters.html** — страница при fetch обрезается
   (раздел 8.104). Опции восстановлены из `af_rubberband.c` + зеркала
   ayosec.github.io/ffmpeg-filters-docs/8.0 + письма ffmpeg-cvslog 2015-09. Ключевые формулировки
   («Apply time-stretching and pitch-shifting with librubberband», «--enable-librubberband»)
   подтверждены двумя независимыми источниками, но не с ffmpeg.org напрямую.
2. **Рекомендаций ИМЕННО «для вокала» в доках ffmpeg НЕТ.** Набор
   `transients=smooth:detector=soft:phase=independent:window=long` — моя калька с crispness
   `-c 0/-c 1` из rubberband CLI. Это инференс, а не цитата.
3. **Утверждение «ffmpeg-фильтр rubberband использует R2»** — вывод по датам (фильтр 2015 г.,
   R3 появился в RB 3.0 в 2022 г., в опциях фильтра выбора движка нет). Кодом не подтверждал.
4. **Точные формулировки флагов `sox tempo -m/-s/-l`** — man-страница при fetch обрезается.
   Проверить локально: `brew install sox && sox --help-effect tempo`.
5. **Точное имя скриптовой команды Praat**: в GUI — `Publish resynthesis`, в скриптах обычно
   `Get resynthesis (overlap-add)`. На странице Intro 8.2 второе НЕ встречается. Проверить
   на своей версии Praat.
6. **Готового рецепта «растянуть один гласный» в доках parselmouth НЕ НАЙДЕНО.**
7. **Сигнатура `pytsmod.tdpsola`** — принимает ли она anchor-массив 2×n (как wsola/phase_vocoder),
   не подтверждено. Для `wsola`/`phase_vocoder` anchor-точки подтверждены цитатой README.
8. **Прокидывание `-3`/`--fine` через `pyrubberband` rbargs** — в доках не упомянуто, только общая
   фраза про произвольные ключи. Непроверено.
9. **Поддерживает ли auto-editor 29.3.1 `--transition` вместе с `--export resolve`** — не проверял.
   Также не проверял, жив ли ещё `--silent-speed` (в 29.x он заменён на `-w/--when ... speed:N`).
10. **Слуховая оценка rubberband R2 vs R3 на реальном голосе НЕ ПРОВОДИЛАСЬ** — локально проверил
    только точность длительности на синусе (см. 9.5). numpy не установлен, спектр не мерил.
11. **Публичных разборов просодии русских шортс-дикторов / «ASMR-новостей», измерений
    питч-контура на конце фразы — НЕ НАЙДЕНО.** Термина именно для этой русской манеры нет;
    ближайшие научные термины — *phrase-final lengthening* и *drawl*.
12. **Порога разборчивости ускоренной РУССКОЙ речи в литературе не нашёл** (всё по англ./мандарину).
13. Цифры «60–80 слов/мин оптимум для диктора» взяты с вторичных словарных сайтов
    (dic.academic.ru, ngpedia.ru) — доверие низкое; 80–120 сл/мин подтверждается
    ru.wikipedia + БРЭ (old.bigenc.ru).
14. Утверждение про дефолтный кроссфейд Premiere = 0.020 s и Pro Tools smoothing = 5 ms
    по памяти/практике, официальными доками в этой сессии НЕ подтверждено.
15. `scaletempo`/`scaletempo2` в локальной сборке ffmpeg не проверял (grep был только по
    rubberband/atempo/silenceremove/acrossfade/afade/asetrate).

---

## РЕЦЕПТ, КОТОРЫЙ Я БЫ ПОПРОБОВАЛ ПЕРВЫМ

Логика: (1) не резать кусок 80 мс — работать целой фразой с плавным time-map;
(2) тянуть только устойчивую часть гласного; (3) алгоритм — pitch-synchronous, не WSOLA;
(4) паузы резать с сохранением 80 мс и с микрофейдами.

### ШАГ 0 — поставить недостающее (одна команда)
```bash
brew install --cask praat        # PSOLA, эталон качества
brew install sox                 # для сравнения
pip install auto-editor pytsmod pyworld soundfile numpy parselmouth
# rubberband 4.0.0 уже есть; ffmpeg 9.0.1 БЕЗ фильтра rubberband — используй CLI
```

### ШАГ 1 — вырезать паузы (ffmpeg, один проход)
```bash
ffmpeg -i in.wav -af \
"silenceremove=stop_periods=-1:stop_duration=0.15:stop_threshold=-38dB:stop_silence=0.08:detection=rms:window=0.02" \
-c:a pcm_s24le tight.wav
```
Если слышны щелчки — тот же результат через auto-editor с кроссфейдом:
```bash
auto-editor in.wav --edit audio:threshold=-38dB --margin 0.04sec \
  --transition dissolve:0.015sec -o tight.wav
```

### ШАГ 2 — ГЛАВНОЕ: тянущийся финальный гласный БЕЗ резки, через time-map rubberband R3
Пусть фраза `phrase.wav`, sr=48000, устойчивая часть последнего гласного = 0.812…0.892 с,
надо растянуть её ×4 (80 мс → 320 мс, итого слово 0.28 → 0.60 с).
Время в time-map задаётся в СЭМПЛАХ: 0.812×48000=38976, 0.892×48000=42816.
Переходы по 30 мс (1440 сэмплов) слева и справа — коэффициент нарастает плавно.
```bash
# timemap.txt: "source_frame target_frame"
cat > timemap.txt <<'MAP'
0 0
37536 37536
38976 38976
42816 58176
44256 59616
MAP
# итоговая длина = исходная + 15360 сэмплов (320 мс). Узнать исходную:
N=$(ffprobe -v error -select_streams a -show_entries stream=duration_ts -of csv=p=0 phrase.wav)
D=$(python3 -c "print(($N+15360)/48000)")
rubberband -3 -M timemap.txt -D "$D" phrase.wav phrase_long.wav
```
Почему это должно сработать: один проход по ВСЕЙ фразе (нет стыков → нет щелчков),
R3 («almost always produces better results», прямо назван хорошим для vocals),
растягивается только steady-state с плавными transition-зонами.

### ШАГ 3 — если R3 всё равно «фазит»: PSOLA в Praat (эталон для голоса)
```bash
praat --run stretch_vowel.praat phrase.wav out.wav 0.812 0.892 4.0
```
(скрипт — см. раздел 5.4; pitch floor 60, ceiling 300 для мужского голоса; помни про лимит ×3
на `Lengthen (overlap-add)` — через DurationTier лимита нет, но выше ×3 PSOLA всё равно «зациклит»)

Либо одной строкой через `TextGrid: To DurationTier...`, где встроены transition-зоны:
Tier=1, Time scale factor=4.0, Left transition duration=0.03, Right transition duration=0.03.

### ШАГ 4 — если нужен ещё и контроль питча хвоста (ровный/чуть падающий): WORLD
Код в разделе 7. Ресинтез из (F0, спектр, апериодичность) — артефактов фазы нет физически.
Прогнать через WORLD ВЕСЬ файл, а не только хвост, чтобы тембр был однородным.

### ШАГ 5 — общий темп до 164 wpm (если после шага 1 не дотянул)
```bash
rubberband -3 -T 1.12 tight.wav final.wav     # мягко, R3
# или
ffmpeg -i tight.wav -af "atempo=1.12" final.wav
```
Не выше ~1.25 суммарно — иначе начнёт теряться разборчивость и «съедаться» эффект хвостов.

### ЧТО ПРОВЕРИТЬ СЛЕПЫМ ABX ПЕРВЫМ ДЕЛОМ
На одном и том же 80-мс гласном, растянутом ×4, сравнить 5 файлов:
`rubberband -2`, `rubberband -3`, `praat Lengthen (overlap-add)`, `pytsmod.tdpsola`, `pyworld`.
Ожидание по фактам этого документа: pyworld ≈ praat/tdpsola > rubberband -3 >> rubberband -2 >> atempo.
