# F1 Replay API Specification

F1 Global Tour의 리플레이 모드에서 필요한 백엔드 API 명세서입니다. 현재는 Mock 데이터로 구현되어 있지만, 실제 백엔드 구현 시 이 명세를 참고하여 API를 개발해주세요.

## 목차
- [개요](#개요)
- [인증](#인증)
- [공통 응답 형식](#공통-응답-형식)
- [세션 관리 API](#세션-관리-api)
- [드라이버 타이밍 API](#드라이버-타이밍-api)
- [텔레메트리 데이터 API](#텔레메트리-데이터-api)
- [플래그 상태 API](#플래그-상태-api)
- [랩 데이터 API](#랩-데이터-api)
- [실시간 업데이트 API](#실시간-업데이트-api)
- [에러 처리](#에러-처리)
- [데이터 모델](#데이터-모델)

## 개요

F1 리플레이 시스템은 실제 F1 레이스의 역사적 데이터를 시간 순서대로 재생하는 기능입니다. OpenF1 API 형식을 기반으로 하되, 추가적인 UI 요구사항을 충족하는 확장된 데이터 구조를 사용합니다.

### 기술 요구사항
- RESTful API 설계
- WebSocket을 통한 실시간 데이터 스트리밍
- CORS 지원 (개발환경: localhost:3000)
- JSON 데이터 형식
- 초당 4회 업데이트 (250ms 간격)

## 인증

현재 구현에서는 별도 인증이 없으나, 실제 서비스에서는 API 키 기반 인증을 권장합니다.

```http
Authorization: Bearer {api_key}
```

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": {},
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

## 세션 관리 API

### 1. 사용 가능한 세션 목록 조회

**Endpoint**: `GET /api/replay/sessions`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "sessionKey": 9161,
      "sessionName": "Monaco GP 2024",
      "circuitKey": 6,
      "circuitName": "Monaco",
      "sessionType": "Race",
      "dateStart": "2024-05-26T13:00:00.000Z",
      "dateEnd": "2024-05-26T15:30:00.000Z",
      "totalLaps": 78,
      "status": "completed"
    }
  ]
}
```

### 2. 특정 세션 정보 조회

**Endpoint**: `GET /api/replay/sessions/{sessionKey}`

**응답**:
```json
{
  "success": true,
  "data": {
    "sessionKey": 9161,
    "sessionName": "Monaco GP 2024",
    "circuitKey": 6,
    "circuitName": "Monaco",
    "sessionType": "Race",
    "dateStart": "2024-05-26T13:00:00.000Z",
    "dateEnd": "2024-05-26T15:30:00.000Z",
    "totalLaps": 78,
    "drivers": [
      {
        "driverNumber": 1,
        "nameAcronym": "VER",
        "fullName": "Max Verstappen",
        "teamName": "Red Bull Racing",
        "teamColor": "3671C6"
      }
    ],
    "status": "completed"
  }
}
```

## 드라이버 타이밍 API

### 1. 현재 랩의 드라이버 타이밍 정보

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/timings?lap={lapNumber}`

**매개변수**:
- `sessionKey` (required): 세션 식별자
- `lap` (required): 조회할 랩 번호 (1-78)

**응답**:
```json
{
  "success": true,
  "data": {
    "currentLap": 1,
    "totalLaps": 78,
    "timings": [
      {
        "position": 1,
        "driverCode": "VER",
        "driverNumber": 1,
        "teamColor": "#3671C6",
        "interval": "--",
        "intervalToAhead": "",
        "gapToLeader": 0,
        "currentLapTime": "1:12.456",
        "bestLapTime": "1:12.456",
        "lastLapTime": "1:12.456",
        "miniSector": {
          "sector1": "fastest",
          "sector2": "personal_best", 
          "sector3": "normal"
        },
        "sectorTimes": {
          "sector1": 14.123,
          "sector2": 37.789,
          "sector3": 20.544
        },
        "tireInfo": {
          "compound": "SOFT",
          "age": 1,
          "pitStops": 0
        },
        "speeds": {
          "i1Speed": 185.5,
          "i2Speed": 190.2,
          "stSpeed": 195.8
        },
        "isRetired": false,
        "retiredReason": null
      }
    ]
  }
}
```

### 2. 드라이버별 상세 정보

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/drivers/{driverNumber}?lap={lapNumber}`

**응답**:
```json
{
  "success": true,
  "data": {
    "driverNumber": 1,
    "nameAcronym": "VER",
    "fullName": "Max Verstappen",
    "teamName": "Red Bull Racing",
    "teamColor": "#3671C6",
    "currentLap": 1,
    "position": 1,
    "lapHistory": [
      {
        "lapNumber": 1,
        "lapTime": 72.456,
        "sectorTimes": [14.123, 37.789, 20.544],
        "position": 1,
        "tireCompound": "SOFT",
        "isPitLap": false
      }
    ],
    "bestLap": {
      "lapNumber": 1,
      "lapTime": 72.456,
      "sectorTimes": [14.123, 37.789, 20.544]
    },
    "pitStops": [],
    "penalties": [],
    "isRetired": false,
    "retiredLap": null,
    "retiredReason": null
  }
}
```

## 텔레메트리 데이터 API

### 1. 실시간 텔레메트리 데이터

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/telemetry?lap={lapNumber}&driver={driverNumber}`

**매개변수**:
- `sessionKey` (required): 세션 식별자
- `lap` (required): 조회할 랩 번호
- `driver` (optional): 특정 드라이버 번호 (미지정시 1위 드라이버)

**응답**:
```json
{
  "success": true,
  "data": {
    "driverNumber": 1,
    "nameAcronym": "VER",
    "teamColor": "#3671C6",
    "telemetry": {
      "speed": 285.5,
      "gear": 7,
      "throttle": 85.2,
      "brake": 0.0,
      "drs": {
        "enabled": true,
        "available": true
      },
      "engine": {
        "rpm": 11500,
        "temperature": 105.2
      },
      "position": {
        "x": 1234.56,
        "y": 2345.67,
        "z": 15.23
      }
    },
    "timestamp": "2024-03-15T10:30:00.250Z"
  }
}
```

### 2. 드라이버별 텔레메트리 히스토리

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/telemetry/history/{driverNumber}?fromLap={start}&toLap={end}`

**응답**:
```json
{
  "success": true,
  "data": {
    "driverNumber": 1,
    "telemetryHistory": [
      {
        "lapNumber": 1,
        "timestamp": "2024-03-15T10:30:00.000Z",
        "speed": 285.5,
        "gear": 7,
        "throttle": 85.2,
        "brake": 0.0,
        "drsEnabled": true,
        "drsAvailable": true
      }
    ]
  }
}
```

## 플래그 상태 API

### 1. 현재 플래그 상태

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/flags?lap={lapNumber}`

**매개변수**:
- `sessionKey` (required): 세션 식별자  
- `lap` (required): 조회할 랩 번호

**응답**:
```json
{
  "success": true,
  "data": {
    "currentLap": 1,
    "totalLaps": 78,
    "sessionType": "RACE",
    "currentFlag": "GREEN",
    "flagHistory": {
      "lapFlags": ["GREEN", "GREEN", "SC", "SC", "GREEN"],
      "timeFlags": [
        {
          "lapNumber": 3,
          "flagType": "SC",
          "startTime": "2024-03-15T10:35:00.000Z",
          "endTime": "2024-03-15T10:38:00.000Z",
          "reason": "Debris on track"
        }
      ]
    },
    "upcomingFlags": [
      {
        "lapNumber": 5,
        "flagType": "VSC",
        "reason": "Car recovery"
      }
    ]
  }
}
```

### 2. 세션별 플래그 히스토리

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/flags/history`

**응답**:
```json
{
  "success": true,
  "data": {
    "sessionType": "RACE",
    "totalLaps": 78,
    "flagEvents": [
      {
        "eventId": "flag_001",
        "flagType": "SC",
        "startLap": 3,
        "endLap": 4,
        "startTime": "2024-03-15T10:35:00.000Z",
        "endTime": "2024-03-15T10:38:00.000Z",
        "reason": "Debris on track",
        "sector": 2
      },
      {
        "eventId": "flag_002", 
        "flagType": "RED",
        "startLap": 15,
        "endLap": 18,
        "startTime": "2024-03-15T10:55:00.000Z",
        "endTime": "2024-03-15T11:05:00.000Z",
        "reason": "Heavy rain conditions",
        "sector": null
      }
    ],
    "statistics": {
      "totalSafetyCarLaps": 2,
      "totalVSCLaps": 0,
      "totalRedFlagTime": 600,
      "greenFlagPercentage": 85.4
    }
  }
}
```

## 랩 데이터 API

### 1. 특정 랩의 상세 데이터

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/laps/{lapNumber}`

**응답**:
```json
{
  "success": true,
  "data": {
    "lapNumber": 1,
    "lapData": [
      {
        "driverNumber": 1,
        "lapDuration": 72.456,
        "sectorTimes": {
          "sector1": 14.123,
          "sector2": 37.789,
          "sector3": 20.544
        },
        "segments": {
          "sector1": [2048, 2048, 0, 2048, 2048, 0, 2048, 2048],
          "sector2": [2051, 2051, 2048, 2048, 0, 2048, 2048, 2049],
          "sector3": [2048, 0, 2048, 2048, 2048, 2048, 2049, 2048]
        },
        "speeds": {
          "i1Speed": 185.5,
          "i2Speed": 190.2,
          "stSpeed": 195.8
        },
        "isPitOutLap": false,
        "isPitInLap": false,
        "tireCompound": "SOFT",
        "tireAge": 1
      }
    ]
  }
}
```

### 2. 랩별 인터벌 데이터

**Endpoint**: `GET /api/replay/sessions/{sessionKey}/intervals/{lapNumber}`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "driverNumber": 1,
      "position": 1,
      "gapToLeader": null,
      "intervalToAhead": null,
      "totalTime": 72.456,
      "isRetired": false
    },
    {
      "driverNumber": 16,
      "position": 2,
      "gapToLeader": 0.123,
      "intervalToAhead": 0.123,
      "totalTime": 72.579,
      "isRetired": false
    },
    {
      "driverNumber": 20,
      "position": 20,
      "gapToLeader": null,
      "intervalToAhead": null,
      "totalTime": 17.456,
      "isRetired": true,
      "retiredLap": 1,
      "retiredReason": "Engine failure"
    }
  ]
}
```

## 실시간 업데이트 API

### WebSocket 연결

**Endpoint**: `ws://localhost:4000/ws/replay/{sessionKey}`

**연결 메시지**:
```json
{
  "type": "subscribe",
  "sessionKey": 9161,
  "startLap": 1
}
```

**실시간 데이터 스트림**:
```json
{
  "type": "timing_update",
  "sessionKey": 9161,
  "currentLap": 1,
  "timestamp": "2024-03-15T10:30:00.000Z",
  "timings": [
    // 드라이버 타이밍 배열 (위와 동일한 구조)
  ]
}
```

**텔레메트리 업데이트**:
```json
{
  "type": "telemetry_update", 
  "sessionKey": 9161,
  "currentLap": 1,
  "timestamp": "2024-03-15T10:30:00.000Z",
  "telemetryData": [
    {
      "driverNumber": 1,
      "speed": 285.5,
      "gear": 7,
      "throttle": 85.2,
      "brake": 0.0,
      "drsEnabled": true,
      "drsAvailable": true
    }
  ]
}
```

**플래그 상태 변경**:
```json
{
  "type": "flag_update",
  "sessionKey": 9161, 
  "currentLap": 3,
  "timestamp": "2024-03-15T10:35:00.000Z",
  "flagData": {
    "currentFlag": "SC",
    "previousFlag": "GREEN",
    "reason": "Debris on track",
    "sector": 2
  }
}
```

**랩 변경 알림**:
```json
{
  "type": "lap_change",
  "sessionKey": 9161,
  "newLap": 2,
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

**세션 완료 알림**:
```json
{
  "type": "session_complete",
  "sessionKey": 9161,
  "finalResults": [
    // 최종 순위 데이터
  ]
}
```

## 에러 처리

### 일반적인 에러 코드

| 코드 | 설명 |
|------|------|
| `SESSION_NOT_FOUND` | 존재하지 않는 세션 |
| `INVALID_LAP_NUMBER` | 잘못된 랩 번호 |
| `DRIVER_NOT_FOUND` | 존재하지 않는 드라이버 |
| `DATA_NOT_AVAILABLE` | 데이터를 사용할 수 없음 |
| `RATE_LIMIT_EXCEEDED` | 요청 한도 초과 |

### 예시 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with key 9999 was not found",
    "details": {
      "sessionKey": 9999,
      "availableSessions": [9161, 9162, 9163]
    }
  },
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

## 데이터 모델

### DriverTiming 모델
```typescript
interface DriverTiming {
  position: number;
  driverCode: string;
  driverNumber: number;
  teamColor: string;
  interval: string;
  intervalToAhead: string;
  gapToLeader: number;
  currentLapTime: string;
  bestLapTime: string;
  lastLapTime: string;
  miniSector: {
    sector1: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
    sector2: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
    sector3: 'fastest' | 'personal_best' | 'normal' | 'slow' | 'none';
  };
  sectorTimes: {
    sector1: number | null;
    sector2: number | null;
    sector3: number | null;
  };
  tireInfo: {
    compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
    age: number;
    pitStops: number;
  };
  speeds: {
    i1Speed: number | null;
    i2Speed: number | null;
    stSpeed: number | null;
  };
  isRetired: boolean;
  retiredReason?: string;
}
```

### 세그먼트 성능 코드
미니 섹터 성능 표시를 위한 세그먼트 코드:

| 코드 | 의미 | UI 색상 |
|------|------|---------|
| `2051` | Fastest overall | Purple |
| `0` | Personal best | Green |
| `2048` | Normal | Yellow |
| `2049` | Slow | Red |
| `[]` (empty) | No data/Retired | Gray |

### 타이어 컴파운드
```typescript
type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
```

## 구현 우선순위

### Phase 1 (필수)
1. 세션 관리 API
2. 드라이버 타이밍 API (기본)
3. 랩 데이터 API (기본)

### Phase 2 (중요)
1. 실시간 WebSocket 구현
2. 에러 처리 강화
3. 성능 최적화

### Phase 3 (추가 기능)
1. 캐싱 시스템
2. 데이터 압축
3. 모니터링 및 로깅

## 성능 고려사항

1. **캐싱**: 세션 데이터는 메모리에 캐싱하여 빠른 응답 제공
2. **데이터 압축**: gzip 압축으로 네트워크 트래픽 최소화
3. **Connection Pool**: 데이터베이스 연결 풀 관리
4. **Rate Limiting**: API 호출 제한으로 서버 보호

## 테스트 시나리오

### 정상 시나리오
1. 모나코 GP 2랩 시나리오 (sessionKey: 9999)
2. 마그누센 리타이어 시나리오 (랩 1)
3. 르클레어 피트스톱 시나리오 (랩 2)

### 에러 시나리오
1. 존재하지 않는 세션 조회
2. 범위를 벗어난 랩 번호
3. 네트워크 연결 실패

이 명세서를 기반으로 백엔드 API를 구현하면, 현재 Mock 서비스와 완전히 호환되는 실제 API 서버를 구축할 수 있습니다.