# World Clock Globe - Current Logic

## 1. 프로젝트 개요

3D 지구본을 활용하여 전 세계 도시의 현재 시간과 날씨 정보를 확인하는 웹 애플리케이션

---

## 2. 파일 구조

```
world-clock-globe/
├── index.html      # 메인 HTML
├── app.js         # 메인 로직 (509 lines)
├── api.js         # API 호출 함수 (137 lines)
├── style.css      # 스타일 (260 lines)
├── manifest.json  # PWA 매니페스트
└── PROJECT_SPEC.md
```

---

## 3. 핵심 기능

### 3.1 자동 회전 (Auto Rotate)

| 항목 | 내용 |
|------|------|
| 업데이트 간격 | 1초 |
| 슬라이더 속도 | 1~10 단계 |
| 기본 속도 | 5 (globe speed: 0.25) |

**관련 함수:**
- `toggleAutoRotate()` - ON/OFF 토글
- `startAutoRotateUpdatesV2(intervalMs)` - 업데이트 시작
- `setAutoRotateSpeed(speed)` - 속도 설정

### 3.2 드래그 앤 드롭

| 항목 | 내용 |
|------|------|
| 동작 | 지구본을 드래그 후 놓는 순간 |
| 반응 | 즉시 정보 업데이트 (debounce 없음) |
| 이벤트 | mouseup, touchend |

**관련 함수:**
- `setupDragEndDetection()` - 드래그 종료 감지

### 3.3 국가 경계 및 라벨 (Feature A)

| 항목 | 내용 |
|------|------|
| 데이터 소스 | GeoJSON (datasets/geo-boundaries-world-110m) |
| 경계선 색상 | `rgba(100, 200, 255, 0.4)` (파란색) |
| 라벨 표시 | 국가 중심 좌표에 텍스트 표시 |

**관련 함수:**
- `initCountryLayer()` - 국가 경계 및 라벨 초기화

### 3.4 줌 레벨별 라벨 (Feature B)

| 줌 레벨 | 고도 (altitude) | 설명 |
|---------|-----------------|------|
| country | ≤ 0.8 | 국가명만 표시 |
| region | 0.8 ~ 1.5 | 중간 라벨 |
| city | > 1.5 | 상세 라벨 |

**관련 함수:**
- `setupZoomBasedLabels()` - 줌 이벤트 설정
- `updateLabelsByZoom()` - 줌 레벨별 라벨 업데이트

---

## 4. API 연동

### 4.1 날씨 정보 (Open-Meteo)

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lng}
  &current_weather=true
```

**응답:**
```javascript
{
  temperature: number,
  weatherCode: number,
  weatherDescription: string,
  windSpeed: number,
  isDay: boolean
}
```

### 4.2 역지오코딩 (BigDataCloud)

```
GET https://api.bigdatacloud.net/data/reverse-geocode-client
  ?latitude={lat}
  &longitude={lng}
  &localityLanguage={ko|en}
```

**응답:**
```javascript
{
  city: string,
  country: string,
  countryCode: string,
  subdivision: string
}
```

---

## 5. 주요 함수 매핑

### app.js

| 함수 | 라인 | 설명 |
|------|------|------|
| `initGlobe()` | 26 | 지구본 초기화 |
| `initCountryLayer()` | 57 | 국가 경계 + 라벨 |
| `handleGlobeChange()` | 139 | 드래그/줌 이벤트 처리 |
| `updateLocationInfo()` | 164 | 위치 정보 업데이트 (API 호출) |
| `updateCardData()` | 196 | 카드 UI 업데이트 |
| `startTimeUpdates()` | 218 | 시간 업데이트 시작 |
| `toggleAutoRotate()` | 307 | 자동 회전 토글 |
| `setAutoRotateSpeed()` | 336 | 속도 설정 (1-10) |
| `setupSpeedControl()` | 353 | 슬라이더 이벤트 설정 |
| `setupDragEndDetection()` | 394 | 드래그 종료 감지 |
| `setupZoomBasedLabels()` | 138 | 줌 레벨별 라벨 |
| `updateLabelsByZoom()` | 156 | 라벨 업데이트 |

### api.js

| 함수 | 라인 | 설명 |
|------|------|------|
| `getWeather()` | 44 | 날씨 정보 조회 |
| `getLocationInfo()` | 74 | 역지오코딩 |
| `getTimeForTimezone()` | 108 | 타임존별 시간 |

---

## 6. 상태 변수 (State)

```javascript
let globe = null;
let autoRotate = false;
let autoRotateSpeed = 5;  // 1-10
let debounceTimer = null;
let autoRotateUpdateTimer = null;
let currentLocation = { lat: 37.5, lng: 127.0, timezone: 'Asia/Seoul' };
let timeUpdateInterval = null;
let countriesGeoJSON = null;
let currentZoomLevel = 'country';  // country, region, city
let isDragging = false;
```

---

## 7. 사용자 인터랙션

| 동작 | 결과 |
|------|------|
| 마우스 드래그 | 지구본 회전 |
| 마우스휠 | 줌 인/아웃 |
| 드래그 후 놓음 | 즉시 위치 정보 업데이트 |
| Auto Rotate 클릭 | 자동 회전 시작/중지 |
| 속도 슬라이더 | 회전 속도 조절 (1-10) |

---

## 8. 데이터 흐름

```
1. init()
   ├── initGlobe()
   ├── attachGlobeEvents()
   ├── setupEventListeners()
   ├── initCountryLayer()
   ├── setupSpeedControl()
   ├── setupDragEndDetection()
   └── updateLocationInfo(37.5, 127.0)  // 초기 서울

2. 사용자 드래그
   └── handleGlobeChange()
       ├── 실시간 좌표 업데이트
       └── debounce 후 API 호출

3. 드래그 종료
   └── setupDragEndDetection()
       └── mouseup/touchend → 즉시 updateLocationInfo()

4. 자동 회전
   └── toggleAutoRotate()
       └── startAutoRotateUpdatesV2(1000)  // 1초 간격
```

---

## 9. 외부 의존성

| 라이브러리 | 용도 | CDN |
|------------|------|-----|
| globe.gl | 3D 지구본 | jsdelivr.net |
| Three.js | WebGL 렌더링 | globe.gl에 포함 |
| Open-Meteo | 날씨 API | 무료 |
| BigDataCloud | 역지오코딩 | 무료 |

---

## 10. 향후 확장 가능성

- [ ] 행정구역 세분화 (시/도/구 라벨)
- [ ] 실시간 날씨 업데이트
- [ ] Favorites 기능 (즐겨찾기 도시 저장)
- [ ] Dark/Light 모드 토글

---

*Last Updated: 2026-03-18*
