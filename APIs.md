# API 명세서

FE 개발자가 현재 백엔드 구현을 기준으로 연동할 수 있도록 작성한 문서입니다.

## 공통 사항

- Base URL: 백엔드 애플리케이션 주소
- 로그인 시 발급된 Access Token을 검증하고, 아래 역할별 접근 정책에 따라 API 접근을 제한합니다.
- 사용자 로그인은 `http://localhost:3000`에서 credentials를 포함한 요청을 허용합니다.
- 별도 `consumes`/`produces` 설정은 없으며 JSON 요청/응답을 사용합니다.
- 생성 API도 현재 `201 Created`가 아닌 `200 OK`를 반환합니다.
- 성공 응답은 대부분 `200 OK`, 삭제 및 라운드 종료는 `204 No Content`입니다.
- 전역 에러 응답 포맷과 예외 매핑이 없습니다. 서비스 예외는 일반적으로 `500 Internal Server Error`로 처리될 수 있습니다.
- JSON 형식 오류, 필수 파라미터 누락, 타입 변환 실패는 일반적으로 `400 Bad Request`입니다.
- 요청 DTO에는 Bean Validation이 적용되어 있지 않습니다. 일부 제약 조건은 DB 저장 시점에만 검사됩니다.
- 로그인 이후 보호된 API 호출에는 `Authorization: Bearer {accessToken}` 헤더가 필요합니다.
- 인증되지 않은 요청은 `401 Unauthorized`, 인증은 되었지만 role이 허용되지 않은 요청은 `403 Forbidden`입니다.

## 역할별 접근 정책

사용자 role은 다음 5가지입니다.

```text
super_admin, class_admin, song_admin, teacher, user
```

### 기본 원칙

- 모든 `GET` API는 모든 role이 호출할 수 있습니다.
- `super_admin`은 노래방 변경 기능을 제외한 관리자 기능을 사용할 수 있습니다.
- `song_admin`, `teacher`는 노래방의 모든 기능을 사용할 수 있습니다.
- `user`는 노래방에서 조회와 채팅 작성만 가능하고, 노래 신청·상태 변경·순서 변경·삭제는 할 수 없습니다.
- `user`는 좌석 입찰, 행운뽑기, 좌석 상세 정보 수정만 할 수 있습니다.
- `user`는 본인 계정의 비밀번호만 수정할 수 있습니다.
- `class_admin`은 좌석 라운드와 그룹 관리 권한을 가집니다.

### 변경 API 권한 요약

| 기능                               | 허용 role                                                     |
| ---------------------------------- | ------------------------------------------------------------- |
| 추첨 생성/삭제                     | `super_admin`                                                 |
| 노래 신청/상태 변경/순서 변경/삭제 | `song_admin`, `teacher`                                       |
| 노래방 채팅 작성                   | `song_admin`, `teacher`, `user`                               |
| 링크 생성/수정/삭제                | `super_admin`                                                 |
| 좌석 라운드 생성/종료              | `super_admin`, `class_admin`                                  |
| 좌석 그룹 생성                     | `super_admin`, `class_admin`                                  |
| 좌석 입찰/행운뽑기/상세 정보 수정  | `super_admin`, `class_admin`, `song_admin`, `teacher`, `user` |
| 사용자 등록/일괄 등록              | `super_admin`                                                 |
| 사용자 role/status 수정            | `super_admin`                                                 |
| 본인 비밀번호 수정                 | `user` 본인 및 관리자                                         |

로그인 전에는 `POST /api/users/login`만 공개 API입니다. `POST /api/users/logout`은 로그인 후 사용할 수 있습니다.

> 위 표는 FE가 화면과 버튼을 제어하기 위한 정책 문서입니다. 현재 백엔드에는 Spring Security 기반의 role 검증이 아직 적용되지 않았으므로, 실제 호출을 차단하지는 않습니다.

## 날짜/시간

도메인에 따라 형식이 다릅니다.

- 추첨/링크: Jackson 기본 `LocalDateTime` 형식인 ISO-8601 형태
  - 예: `2026-08-17T12:34:56`
- 노래방/좌석: `yyyy-MM-dd HH:mm:ss`
  - timezone: `Asia/Seoul`

---

## 1. 랜덤 추첨

관련 controller: [RandomDrawController.java](src/main/java/com/example/demo/domain/draw/controller/RandomDrawController.java)

Base path: `/api/draws`

### POST `/api/draws`

랜덤 추첨을 실행하고 결과를 저장합니다.

허용 role: `super_admin`

Request body:

```json
{
	"title": "추첨 제목",
	"description": "추첨 설명",
	"targetUserNames": ["user1", "user2"]
}
```

| 필드              | 타입       |   필수 | 설명                                                         |
| ----------------- | ---------- | -----: | ------------------------------------------------------------ |
| `title`           | `String`   | 아니오 | 추첨 제목                                                    |
| `description`     | `String`   | 아니오 | 추첨 설명                                                    |
| `targetUserNames` | `String[]` | 아니오 | 대상 username 목록. null 또는 빈 배열이면 ACTIVE 사용자 전체 |

Response `200 OK` (`RandomDrawDto.DetailResponse`):

```json
{
	"id": 1,
	"title": "추첨 제목",
	"description": "추첨 설명",
	"createdAt": "2026-08-17T12:34:56",
	"results": [
		{
			"id": 10,
			"userName": "user1",
			"drawOrder": 1
		}
	]
}
```

| 필드                  | 타입            |
| --------------------- | --------------- |
| `id`                  | `Long`          |
| `title`               | `String`        |
| `description`         | `String`        |
| `createdAt`           | `LocalDateTime` |
| `results[].id`        | `Long`          |
| `results[].userName`  | `String`        |
| `results[].drawOrder` | `Integer`       |

주요 오류:

- 대상자가 없으면 `IllegalArgumentException`: `추첨 대상자가 존재하지 않습니다.`
- 존재하지 않는 username이 포함되면 `IllegalArgumentException`: `존재하지 않는 사용자입니다: ...`

### GET `/api/draws`

추첨 이력을 생성일시 내림차순으로 조회합니다.

Response `200 OK` (`RandomDrawDto.SimpleResponse[]`):

```json
[
	{
		"id": 1,
		"title": "추첨 제목",
		"description": "추첨 설명",
		"createdAt": "2026-08-17T12:34:56"
	}
]
```

결과가 없으면 `[]`를 반환합니다.

### GET `/api/draws/{drawId}`

| 위치 | 필드     | 타입   | 필수 |
| ---- | -------- | ------ | ---: |
| Path | `drawId` | `Long` |   예 |

Response `200 OK`: `POST /api/draws`와 같은 `DetailResponse`입니다.

존재하지 않는 추첨이면 `IllegalArgumentException`이 발생합니다.

### DELETE `/api/draws/{drawId}`

| 위치 | 필드     | 타입   | 필수 |
| ---- | -------- | ------ | ---: |
| Path | `drawId` | `Long` |   예 |

추첨 결과를 먼저 삭제한 후 추첨 본체를 삭제합니다.

허용 role: `super_admin`

Response: `204 No Content`, body 없음

---

## 2. 노래 신청 및 채팅

관련 controller: [KaraokeController.java](src/main/java/com/example/demo/domain/karaoke/controller/KaraokeController.java)

Base path: `/api/karaoke`

### 노래 신청 DTO

`SongRecordDto.CreateRequest`:

| 필드         | 타입     |   필수 | 설명            |
| ------------ | -------- | -----: | --------------- |
| `userName`   | `String` |     예 | 신청자 username |
| `reason`     | `String` |     예 | 신청 사유       |
| `songName`   | `String` | 아니오 | 곡명            |
| `youtubeUrl` | `String` | 아니오 | YouTube URL     |

`SongRecordDto.StatusUpdateRequest`:

```json
{ "status": "singing" }
```

허용 값은 `pending`, `singing`, `completed`, `canceled`입니다. 실제로는 입력값을 소문자로 변환한 뒤 enum으로 변환합니다.

`SongRecordDto.OrderUpdateRequest`:

```json
{ "displayOrder": 2 }
```

| 필드           | 타입      |
| -------------- | --------- |
| `displayOrder` | `Integer` |

노래 응답 `SongRecordDto.Response`:

| 필드           | 타입            |
| -------------- | --------------- |
| `id`           | `Long`          |
| `userName`     | `String`        |
| `songName`     | `String`        |
| `youtubeUrl`   | `String`        |
| `reason`       | `String`        |
| `status`       | `String`        |
| `displayOrder` | `Integer`       |
| `createdAt`    | `LocalDateTime` |

`createdAt` 형식은 `yyyy-MM-dd HH:mm:ss`입니다.

### GET `/api/karaoke/songs`

노래 신청 목록을 조회합니다.

Response `200 OK`: `SongRecordDto.Response[]`

정렬 순서:

1. `displayOrder` 오름차순
2. `createdAt` 오름차순

### POST `/api/karaoke/songs`

Request body: `SongRecordDto.CreateRequest`

허용 role: `song_admin`, `teacher`

동작:

- `userName`으로 사용자를 조회합니다.
- `displayOrder`는 현재 최댓값 + 1로 자동 지정됩니다.
- 상태는 `pending`으로 자동 지정됩니다.

Response `200 OK`: `SongRecordDto.Response`

사용자가 없으면 `IllegalArgumentException`이 발생합니다.

### PATCH `/api/karaoke/songs/{id}/status`

| 위치 | 필드 | 타입   | 필수 |
| ---- | ---- | ------ | ---: |
| Path | `id` | `Long` |   예 |

Request body: `StatusUpdateRequest`

허용 role: `song_admin`, `teacher`

응답 `200 OK`: `SongRecordDto.Response`

새 상태가 `singing`이면 기존 `singing` 곡 하나를 `completed`로 변경합니다. 이전 상태에서의 전이 제한은 구현되어 있지 않습니다.

곡이 없거나 status가 enum 값이 아니면 예외가 발생합니다.

### PATCH `/api/karaoke/songs/{id}/order`

Request body: `OrderUpdateRequest`

허용 role: `song_admin`, `teacher`

Response `200 OK`: `SongRecordDto.Response`

곡이 없으면 `IllegalArgumentException`이 발생합니다.

### DELETE `/api/karaoke/songs/{id}`

해당 곡의 채팅을 함께 삭제합니다.

허용 role: `song_admin`, `teacher`

Response: `204 No Content`, body 없음

### 채팅 DTO

`SongChatDto.CreateRequest`:

| 필드       | 타입     | 필수 |
| ---------- | -------- | ---: |
| `userName` | `String` |   예 |
| `nickname` | `String` |   예 |
| `message`  | `String` |   예 |

`SongChatDto.Response`:

| 필드        | 타입            |
| ----------- | --------------- |
| `id`        | `Long`          |
| `songId`    | `Long`          |
| `userName`  | `String`        |
| `nickname`  | `String`        |
| `message`   | `String`        |
| `createdAt` | `LocalDateTime` |

### GET `/api/karaoke/songs/{songId}/chats`

| 위치 | 필드     | 타입   | 필수 |
| ---- | -------- | ------ | ---: |
| Path | `songId` | `Long` |   예 |

Response `200 OK`: `SongChatDto.Response[]`

`createdAt` 오름차순으로 반환합니다. 채팅이 없으면 `[]`입니다.

### POST `/api/karaoke/songs/{songId}/chats`

Request body: `SongChatDto.CreateRequest`

허용 role: `song_admin`, `teacher`, `user`

Response `200 OK`: `SongChatDto.Response`

곡 또는 사용자가 없으면 `IllegalArgumentException`이 발생합니다.

---

## 3. 대시보드 링크

관련 controller: [LinkController.java](src/main/java/com/example/demo/domain/link/controller/LinkController.java)

Base path: `/api/links`

`LinkDto.Request`:

| 필드           | 타입      |   필수 | 설명                          |
| -------------- | --------- | -----: | ----------------------------- |
| `title`        | `String`  |     예 | 링크 제목                     |
| `url`          | `String`  |     예 | 링크 URL                      |
| `description`  | `String`  | 아니오 | 설명                          |
| `displayOrder` | `Integer` |     예 | 노출 순서. 생성 시 null이면 0 |

`LinkDto.Response`:

| 필드           | 타입            |
| -------------- | --------------- |
| `id`           | `Long`          |
| `title`        | `String`        |
| `url`          | `String`        |
| `description`  | `String`        |
| `displayOrder` | `Integer`       |
| `createdAt`    | `LocalDateTime` |

### GET `/api/links`

Response `200 OK`: `LinkDto.Response[]`

`displayOrder` 오름차순으로 반환합니다. 결과가 없으면 `[]`입니다.

### POST `/api/links`

Request body: `LinkDto.Request`

허용 role: `super_admin`

Response `200 OK`: `LinkDto.Response`

`displayOrder`가 null이면 `0`으로 저장합니다.

### PUT `/api/links/{id}`

Request body: `LinkDto.Request`

허용 role: `super_admin`

Response `200 OK`: `LinkDto.Response`

| 위치 | 필드 | 타입   | 필수 |
| ---- | ---- | ------ | ---: |
| Path | `id` | `Long` |   예 |

존재하지 않는 링크면 `IllegalArgumentException`이 발생합니다.

### DELETE `/api/links/{id}`

| 위치 | 필드 | 타입   | 필수 |
| ---- | ---- | ------ | ---: |
| Path | `id` | `Long` |   예 |

Response: `204 No Content`, body 없음

허용 role: `super_admin`

---

## 4. 좌석 라운드, 그룹, 입찰

관련 controller: [SeatController.java](src/main/java/com/example/demo/domain/seat/controller/SeatController.java)

Base path: `/api/seats`

### 라운드

`CreateRoundRequest`:

| 필드              | 타입       |   필수 | 설명                                           |
| ----------------- | ---------- | -----: | ---------------------------------------------- |
| `round`           | `Integer`  |     예 | 라운드 번호                                    |
| `title`           | `String`   |     예 | 라운드 제목                                    |
| `peoplePerGroup`  | `Integer`  |     예 | 그룹당 인원. DB 기준 2 또는 3                  |
| `isGambleEnabled` | `Boolean`  | 아니오 | 행운뽑기 활성화 여부. null이면 false           |
| `seatCodes`       | `String[]` | 아니오 | 좌석 코드. null 또는 빈 배열이면 A~M 자동 생성 |

`RoundResponse`:

| 필드              | 타입            |
| ----------------- | --------------- |
| `id`              | `Long`          |
| `round`           | `Integer`       |
| `title`           | `String`        |
| `peoplePerGroup`  | `Integer`       |
| `isClosed`        | `Boolean`       |
| `isGambleEnabled` | `Boolean`       |
| `createdAt`       | `LocalDateTime` |

`createdAt` 형식은 `yyyy-MM-dd HH:mm:ss`입니다.

### GET `/api/seats/rounds`

Response `200 OK`: `RoundResponse[]`

`round` 오름차순입니다.

### POST `/api/seats/rounds`

Request body: `CreateRoundRequest`

허용 role: `super_admin`, `class_admin`

생성된 좌석은 `bidPrice: 0`, `isLocked: false`로 초기화됩니다.

Response `200 OK`: `RoundResponse`

### PATCH `/api/seats/rounds/{roundId}/close`

라운드를 종료합니다.

허용 role: `super_admin`, `class_admin`

Response: `204 No Content`, body 없음

라운드가 없으면 `IllegalArgumentException`: `존재하지 않는 라운드입니다.`

### 그룹

`GroupRequest`:

| 필드        | 타입     |   필수 |
| ----------- | -------- | -----: |
| `groupName` | `String` |     예 |
| `member1`   | `String` |     예 |
| `member2`   | `String` | 아니오 |
| `member3`   | `String` | 아니오 |

`GroupResponse`:

| 필드        | 타입     |
| ----------- | -------- |
| `id`        | `Long`   |
| `roundId`   | `Long`   |
| `groupName` | `String` |
| `member1`   | `String` |
| `member2`   | `String` |
| `member3`   | `String` |

### GET `/api/seats/rounds/{roundId}/groups`

Response `200 OK`: `GroupResponse[]`

그룹이 없으면 `[]`입니다.

### POST `/api/seats/rounds/{roundId}/groups`

Request body: `GroupRequest`

허용 role: `super_admin`, `class_admin`

Response `200 OK`: `GroupResponse`

### 좌석 배정 및 입찰

`AllocationResponse`:

| 필드           | 타입      |
| -------------- | --------- |
| `id`           | `Long`    |
| `roundId`      | `Long`    |
| `seatCode`     | `String`  |
| `bidPrice`     | `Integer` |
| `isLocked`     | `Boolean` |
| `groupId`      | `Long`    |
| `memberLeft`   | `String`  |
| `memberMiddle` | `String`  |
| `memberRight`  | `String`  |

`BidRequest`:

| 필드          | 타입      |   필수 | 설명                         |
| ------------- | --------- | -----: | ---------------------------- |
| `userName`    | `String`  |     예 | 입찰자                       |
| `nextGroupId` | `Long`    |     예 | 변경할 그룹 ID               |
| `priceChange` | `Integer` | 아니오 | 금액 변화. null이면 기본 500 |

`GambleRequest`:

| 필드          | 타입     | 필수 |
| ------------- | -------- | ---: |
| `userName`    | `String` |   예 |
| `nextGroupId` | `Long`   |   예 |

`DetailAssignRequest`:

| 필드           | 타입     |
| -------------- | -------- |
| `memberLeft`   | `String` |
| `memberMiddle` | `String` |
| `memberRight`  | `String` |

### GET `/api/seats/rounds/{roundId}/allocations`

Response `200 OK`: `AllocationResponse[]`

`seatCode` 오름차순입니다.

### POST `/api/seats/allocations/{allocationId}/bid`

Request body: `BidRequest`

허용 role: `super_admin`, `class_admin`, `song_admin`, `teacher`, `user`

현재 금액에 `priceChange`를 더하고 최소 0으로 보정한 뒤 그룹을 변경합니다. 입찰 이력을 `method: "BID"`로 저장합니다.

Response `200 OK`: `AllocationResponse`

라운드가 닫혔거나 좌석이 잠겨 있으면 입찰할 수 없습니다.

### POST `/api/seats/allocations/{allocationId}/gamble`

Request body: `GambleRequest`

허용 role: `super_admin`, `class_admin`, `song_admin`, `teacher`, `user`

변동액 중 하나를 무작위 적용합니다.

```text
-1000, -500, 0, 500, 1000, 2000
```

최종 금액은 최소 0입니다. 이력의 `method`는 `GAMBLE`입니다.

Response `200 OK`: `AllocationResponse`

행운뽑기가 비활성화된 라운드에서는 사용할 수 없습니다.

### PATCH `/api/seats/allocations/{allocationId}/details`

Request body: `DetailAssignRequest`

허용 role: `super_admin`, `class_admin`, `song_admin`, `teacher`, `user`

좌석의 세 멤버 표시 정보를 변경합니다.

Response `200 OK`: `AllocationResponse`

현재 구현은 잠금/낙찰/라운드 종료 여부와 username 존재 여부를 검사하지 않습니다.

### 입찰 이력

`HistoryResponse`:

| 필드           | 타입                           |
| -------------- | ------------------------------ |
| `id`           | `Long`                         |
| `roundId`      | `Long`                         |
| `allocationId` | `Long`                         |
| `userName`     | `String`                       |
| `prevGroupId`  | `Long`                         |
| `nextGroupId`  | `Long`                         |
| `priceChange`  | `Integer`                      |
| `bidPrice`     | `Integer`                      |
| `method`       | `String` (`BID` 또는 `GAMBLE`) |
| `createdAt`    | `LocalDateTime`                |

### GET `/api/seats/rounds/{roundId}/histories`

Response `200 OK`: `HistoryResponse[]`

`createdAt` 내림차순입니다. 이력이 없으면 `[]`입니다.

---

## 5. 사용자

관련 controller: [UserController.java](src/main/java/com/example/demo/domain/user/controller/UserController.java)

Base path: `/api/users`

`UserResponseDto.UserInfo`:

| 필드       | 타입     |
| ---------- | -------- |
| `id`       | `Long`   |
| `username` | `String` |
| `role`     | `String` |
| `status`   | `String` |

비밀번호는 응답에 포함되지 않습니다.

### POST `/api/users/login`

Request body:

```json
{
	"username": "user1",
	"password": "password"
}
```

| 필드       | 타입     | 필수 |
| ---------- | -------- | ---: |
| `username` | `String` |   예 |
| `password` | `String` |   예 |

Response `200 OK`:

```json
{
	"accessToken": "eyJ...",
	"tokenType": "Bearer",
	"accessTokenExpiresIn": 900000,
	"refreshTokenExpiresIn": 1209600000,
	"user": {
		"id": 1,
		"username": "user1",
		"role": "user",
		"status": "ACTIVE"
	}
}
```

| 필드                    | 타입       | 설명                                                |
| ----------------------- | ---------- | --------------------------------------------------- |
| `accessToken`           | `String`   | API 요청에 사용할 Access JWT                        |
| `tokenType`             | `String`   | 항상 `Bearer`                                       |
| `accessTokenExpiresIn`  | `Long`     | Access Token 유효기간(ms). 기본 900000ms(15분)      |
| `refreshTokenExpiresIn` | `Long`     | Refresh Token 유효기간(ms). 기본 1209600000ms(14일) |
| `user`                  | `UserInfo` | 로그인한 사용자 정보                                |

로그인 성공 시 Access Token은 JSON body로 반환하고, Refresh Token은 `refresh_token`이라는 `HttpOnly` 쿠키로 반환합니다. 쿠키의 path는 `/`입니다. Refresh Token은 서버 DB에 저장됩니다.

현재 구현은 평문 문자열 비교를 사용합니다. 로그인 성공 시 Access JWT를 JSON body로, Refresh JWT를 `HttpOnly` 쿠키로 발급합니다. Access JWT는 이후 API 요청에서 검증되며 role별 접근 제한에 사용됩니다.

오류:

- 사용자 없음: `존재하지 않는 사용자입니다.`
- 비밀번호 불일치: `비밀번호가 일치하지 않습니다.`
- 비활성 계정: `비활성화된 계정입니다.`

### POST `/api/users/logout`

Refresh Token 쿠키를 만료시킵니다.

허용 role: 공개 endpoint

Response `200 OK`, body 없음

Refresh Token 쿠키와 서버에 저장된 해당 Refresh Token을 함께 폐기합니다. 이미 만료되었거나 잘못된 쿠키여도 클라이언트 쿠키는 삭제됩니다.

### POST `/api/users/refresh`

`refresh_token` HttpOnly 쿠키를 검증하고 Access Token을 재발급합니다.

허용 role: 공개 endpoint. 단, 유효한 `refresh_token` 쿠키가 필요합니다.

Request body: 없음

Response `200 OK`: 로그인 응답과 같은 `LoginResponse`

- 기존 Refresh Token은 즉시 폐기됩니다.
- 새 Access Token과 새 Refresh Token을 반환합니다.
- 새 Refresh Token은 `Set-Cookie`로 다시 설정됩니다.
- 만료, 위조, 이미 폐기된 Refresh Token이면 일반적으로 `500 Internal Server Error`가 될 수 있습니다. 전역 예외 응답 규격은 아직 없습니다.

### GET `/api/users/me?username={username}`

| 위치  | 필드       | 타입     | 필수 |
| ----- | ---------- | -------- | ---: |
| Query | `username` | `String` |   예 |

예시:

```http
GET /api/users/me?username=user1
```

Response `200 OK`: `UserInfo`

인증된 모든 role이 조회할 수 있습니다. 현재 인증 주체와 query string의 username이 같은지 별도로 제한하지 않으므로 다른 사용자의 username도 조회할 수 있습니다.

### POST `/api/users/register`

사용자를 단건 등록합니다.

허용 role: `super_admin`

Request body:

```json
{
	"username": "user2",
	"password": "password",
	"role": "user"
}
```

| 필드       | 타입     | 필수 | 설명                                                          |
| ---------- | -------- | ---: | ------------------------------------------------------------- |
| `username` | `String` |   예 | 신규 사용자 ID                                                |
| `password` | `String` |   예 | 초기 비밀번호                                                 |
| `role`     | `String` |   예 | `user`, `song_admin`, `class_admin`, `teacher`, `super_admin` |

Response `200 OK`: `UserInfo`

### POST `/api/users/register_batch`

여러 사용자를 한 번에 등록합니다.

허용 role: `super_admin`

Request body:

```json
{
	"usernames": ["user2", "user3"]
}
```

| 필드        | 타입       | 필수 |
| ----------- | ---------- | ---: |
| `usernames` | `String[]` |   예 |

일괄 등록 사용자는 role이 `user`, 초기 비밀번호가 `ssafy16`으로 설정됩니다.

Response `200 OK`: `UserInfo[]`

### PATCH `/api/users/change_password/{username}`

사용자의 비밀번호를 변경합니다.

허용 role: `super_admin`, `class_admin`, `song_admin`, `teacher`, `user` 본인

`user` role은 본인의 username과 일치하는 경우에만 변경할 수 있습니다. 관리자는 대상 사용자의 비밀번호를 변경할 수 있습니다.

Request body:

```json
{
	"newPassword": "new-password"
}
```

| 필드          | 타입     | 필수 |
| ------------- | -------- | ---: |
| `newPassword` | `String` |   예 |

Response `200 OK`: `UserInfo`

### PATCH `/api/users/change_role_status/{username}`

사용자의 role 또는 활성화 상태를 변경합니다.

허용 role: `super_admin`

Request body:

```json
{
	"role": "teacher",
	"status": "ACTIVE"
}
```

| 필드     | 타입     |   필수 | 설명                                           |
| -------- | -------- | -----: | ---------------------------------------------- |
| `role`   | `String` | 아니오 | `user`, `song_admin`, `class_admin`, `teacher` |
| `status` | `String` | 아니오 | `ACTIVE` 또는 `INACTIVE`                       |

Response `200 OK`: `UserInfo`

### GET `/api/users`

전체 사용자 목록을 반환합니다.

Response `200 OK`: `UserInfo[]`

모든 role이 조회할 수 있습니다. ACTIVE/INACTIVE 필터는 제공하지 않습니다.

---

## FE 연동 시 현재 구현의 주의점

1. Access Token은 `Authorization: Bearer ...` 헤더로 보내야 하며, 만료·서명·token type을 검증합니다.
2. Refresh Token은 `HttpOnly` 쿠키로 발급되며 JSON body에는 포함되지 않습니다.
3. Refresh Token은 DB에 저장되며 재발급 시 rotation됩니다. 로그아웃 시 쿠키와 서버 저장 토큰을 폐기합니다.
4. role별 API 권한 검사가 적용되어 있습니다. 단, `user`의 비밀번호 변경은 JWT subject와 path username이 같을 때만 허용됩니다.
5. `POST` 생성 API의 성공 상태 코드는 `201`이 아니라 `200`입니다.
6. 서비스 예외를 위한 공통 에러 JSON 규격이 없습니다. FE에서 안정적으로 분기하려면 백엔드의 예외 처리 추가가 필요합니다.
7. 일부 삭제 API는 대상 ID를 먼저 확인하지 않아 존재하지 않는 ID의 응답이 일관되지 않을 수 있습니다.
