# 데이터·보안

## Realtime Database 주요 노드

`users`, `boardPosts`, `boardComments`, `boardCommentsByPost`, `travelComments`, `travelCommentsByContent`, `apiCache`를 사용합니다.

사용자 하위 데이터에는 프로필, 찜, 폴더, 메모, 알림, 활동 내역이 저장됩니다. 댓글 조회용 역색인 노드는 게시글·여행지별 조회를 지원합니다.

프로필 이미지와 게시글 첨부 이미지는 Realtime Database에 원본 이미지 또는 data URL을 저장하지 않고, Firebase Storage `users/{uid}/profile` 또는 `users/{uid}/board` 경로에 업로드한 뒤 다운로드 URL만 참조합니다.

## 권한 기준

- 사용자 개인정보: 인증된 동일 UID만 읽기·쓰기
- 게시글·댓글: 공개 읽기, 작성자 중심 수정·삭제
- 좋아요: 해당 UID만 자신의 반응을 변경
- API 캐시: 인증 사용자 읽기, 클라이언트 직접 쓰기 금지
- Storage 이미지: 공개 표시를 위해 읽기는 허용하되, 쓰기는 인증된 동일 UID의 `profile`, `board` 이미지 경로로 제한
- 데이터 변경 시 UID·필수 필드·식별자 일치 여부 검증

## 점검 항목

- `.env`와 배포 로그에 비밀키가 포함되지 않았는지 확인
- Firebase Rules Emulator 또는 테스트 프로젝트에서 타 사용자 접근을 거부하는지 확인
- 게시글·댓글 수정 시 작성자 위조가 불가능한지 확인
- Storage Rules에서 이미지 파일 타입과 크기 제한이 적용되는지 확인
- AI 입력에 개인정보·불필요한 비밀정보를 포함하지 않기
- 외부 API 응답을 그대로 HTML로 렌더링하지 않기

현재 규칙은 `database.rules.json`이 기준이며, 운영 전 규칙 변경은 결정 로그와 검증 결과를 함께 남깁니다.
