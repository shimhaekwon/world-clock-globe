# World Clock Globe - 프로젝트 기획서

## 1. 프로젝트 개요

### 프로젝트명
- **World Clock Globe** (세계 시계 지구본)

### 프로젝트 설명
- 3D 지구본을 활용하여 전 세계 도시의 현재 시간과 날씨 정보를 확인하는 웹 애플리케이션

### 주요 특징
- 3D 지구본을 마우스로 드래그하여 회전 가능
- 회전 완료 후 해당 지역의 시간, 날씨, 위치 정보 표시
- 자동 회전 기능 (ON/OFF 토글)
- 확대/축소 지원 (마우스 휠, 터치)
- 자동 회전하면서 1초마다 현재 지구본의 중심지역에 대한 정보 출력(지역명/년월일/시분초/온도/날씨/위경도)
- 자동 회전 속도를 제어 1~10 단계까지
- 자동 회전을 off 한 상태에서, 지구본을 움직이고 놓는 순간의 중심지역 정보를 출력함.

---

## 2. 기술 스택

| 구분 | 기술 | 비고 |
|------|------|------|
| 3D Globe | globe.gl | CDN으로 바로 사용 |
| 날씨 API | Open-Meteo | 무료, API Key 불필요 |
| 역지오코딩 | BigDataCloud | 무료, API Key 불필요 |
| 시간 처리 | JavaScript 내장 | Intl.DateTimeFormat |
| 파일 구조 | HTML + CSS + JS | 분리해서 관리 |

---

## 3. UI/UX 설계

### 메인 화면

```
+-------------------------------------------------------+
|                                                       |
|                     EARTH GLOBE                       |
|                                                       |
|         (User drags and releases the globe)           |
|                                                       |
|         +------------------------+                   |
|         | Seoul                 |                   |
|         | 2026.03.17           |                   |
|         | 14:35:22             |                   |
|         | 23 degrees            |                   |
|         | Clear                 |                   |
|         | Lat: 37.5665         |                   |
|         | Lng: 126.9780        |                   |
|         +------------------------+                   |
|                                                       |
+-------------------------------------------------------+

[AUTO ROTATE ON/OFF]   [Zoom: Mouse Wheel]
```

### 하단 컨트롤 바
- 자동 회전 버튼 (ON/OFF 토글)
- 확대/축소 안내 (마우스휠 또는 터치)

---

## 4. 기능 상세

### 4.1 지구본 표시
- 3D 지구본 렌더링 (globe.gl)
- 낮/밤 시각화 (선택적)
- 초기 위치: 한국 기준

### 4.2 사용자 상호작용
| 동작 | 결과 |
|------|------|
| 마우스 드래그 | 지구본 회전 |
| 마우스휠 | 확대/축소 |
| 터치 드래그 | 지구본 회전 |
| 터치 핀치 | 확대/축소 |

### 4.3 자동 회전
- 기본: 꺼짐 (OFF)
- 토글 버튼으로 ON/OFF 전환
- ON 시 지구본이 자동 회전

### 4.4 정보 표시 (회전 완료 후)
회전 완료 후 화면 중앙에 표시되는 정보:

| 항목 | 내용 | 출처 |
|------|------|------|
| 도시명 | Seoul, Tokyo 등 | BigDataCloud API |
| 날짜 | YYYY.MM.DD | JavaScript |
| 시간 | HH:MM:SS | JavaScript |
| 날씨 | 온도, 날씨 상태 | Open-Meteo API |
| 위도/경도 | lat, lng | globe.gl |

### 4.5 API 연동

#### Open-Meteo (날씨)
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=37.5
  &longitude=127.0
  &current_weather=true
```

#### BigDataCloud (역지오코딩)
```
GET https://api.bigdatacloud.net/data/reverse-geocode-client
  ?lat=37.5&lng=127.0&localityLanguage=ko
```

---

## 5. 파일 구조

```
e:/workspace/worldview/
├── index.html      # 메인 HTML
├── style.css       # 스타일
├── app.js          # 메인 로직
├── api.js          # API 호출 함수
└── README.md       # 프로젝트 설명
```

### index.html
- globe.gl CDN 로드
- UI 구조 (헤더, 지구본 영역, 정보 카드, 컨트롤 버튼)

### style.css
- 전체 화면 레이아웃
- 카드 스타일
- 버튼 스타일
- 반응형 디자인

### app.js
- globe.gl 초기화
- 이벤트 처리 (회전, 확대/축소)
- 시간 업데이트 로직

### api.js
- Open-Meteo API 호출
- BigDataCloud API 호출

---

## 6. 구현 우선순위

| 순서 | 기능 | 설명 |
|------|------|------|
| 1 | 기본 지구본 표시 | globe.gl로 지구본 렌더링 |
| 2 | 드래그/확대/축소 | 기본 상호작용 |
| 3 | 자동 회전 토글 | On/Off 버튼 |
| 4 | 회전 완료 감지 | Debounced onZoom |
| 5 | 역지오코딩 | BigDataCloud |
| 6 | 날씨 표시 | Open-Meteo |
| 7 | 정보 카드 표시 | UI 구현 |

---

## 7. 예상 결과물

- 웹 브라우저에서 바로 실행 가능한 HTML 파일
- 별도의 서버 구축 불필요 (정적 파일)
- 반응형 웹 디자인 (모바일/데스크톱 지원)

---

## 8. 참고 사항

- globe.gl는 MIT 라이선스 (무료 사용 가능)
- Open-Meteo, BigDataCloud는 비상업적 용도 무료

---

*최종 수정일: 2026.03.17*
