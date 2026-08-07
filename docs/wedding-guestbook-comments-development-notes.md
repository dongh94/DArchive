# Wedding Guestbook Comments Development Notes

이 문서는 DArchive 웨딩 방명록 댓글/대댓글 기능을 개발한 순서와 판단 근거를 기록한다. 목적은 단순 변경 내역 요약이 아니라, 비슷한 풀스택 기능을 직접 개발할 때 어떤 순서로 생각하고 구현하면 좋은지 재사용 가능한 사고 과정을 남기는 것이다.

## 1. 요구사항 해석

사용자 요구사항은 다음 기능으로 정리했다.

- 방명록 하나마다 댓글을 달 수 있다.
- 댓글에는 대댓글을 달 수 있다.
- 방명록 리스트에는 댓글 내용을 펼치지 않고 댓글 숫자만 보여준다.
- 방명록을 클릭하면 상세 모달이 열리고, 원문 방명록과 댓글/대댓글을 본다.
- 상세 모달에서 댓글/대댓글을 작성하고, 작성자 이름 확인 후 수정할 수 있다.
- 관리자 페이지에서도 댓글/대댓글을 확인할 수 있다.
- 관리자 페이지에서는 댓글/대댓글을 숨김, 복원, 삭제할 수 있다.

여기서 중요한 해석은 “댓글의 댓글” 범위다. 무한 depth 댓글은 데이터 모델, UI, moderation이 급격히 복잡해지므로 이 기능에서는 1단 대댓글만 허용하는 구조로 잡았다.

```text
방명록
  댓글
    대댓글
```

대댓글의 대댓글은 허용하지 않는다. 이 제한은 public API에서 `parentId`가 있는 댓글을 다시 부모로 삼지 못하게 검사한다.

## 2. 개발 순서

이번 기능은 아래 순서로 진행했다.

1. 기존 방명록/관리자 구조 파악
2. DB 모델 추가
3. Public API 추가
4. 사용자 UI 추가
5. Admin API와 UI 추가
6. 검증과 문서화

이 순서가 중요한 이유는 데이터 계약이 먼저 안정되어야 FE가 의존할 수 있기 때문이다. 특히 tRPC/Prisma 기반 프로젝트에서는 DB schema와 API response shape이 프론트 타입에 직접 영향을 준다. UI부터 만들면 중간에 payload 구조가 바뀌면서 반복 수정이 커진다.

## 3. DB 설계

새 모델은 `WeddingGuestbookComment`로 설계했다.

핵심 필드는 다음과 같다.

- `id`: 댓글 id
- `guestbookEntryId`: 댓글이 달린 원문 방명록 id
- `parentId`: 대댓글인 경우 부모 댓글 id, 원댓글이면 null
- `name`: 작성자 성함
- `message`: 댓글 내용
- `isVisible`: 사용자 화면 노출 여부
- `createdAt`, `updatedAt`: 정렬과 관리자 확인용 시간

관계는 다음과 같다.

```text
WeddingGuestbookEntry 1 ─ N WeddingGuestbookComment
WeddingGuestbookComment 1 ─ N WeddingGuestbookComment(replies)
```

Prisma에서는 self relation에 이름이 필요하므로 `GuestbookCommentReplies` relation name을 명시했다.

삭제 정책은 `onDelete: Cascade`를 사용했다.

- 방명록이 삭제되면 댓글도 같이 삭제된다.
- 부모 댓글이 삭제되면 대댓글도 같이 삭제된다.

이 판단은 관리자 삭제가 hard delete인 기존 UX와 맞춘 것이다. 사용자가 직접 삭제하는 기능은 제거되어 있고, 관리자는 되돌릴 수 없는 삭제를 확인 후 실행한다.

### 인덱스

두 개의 인덱스를 둔다.

```prisma
@@index([guestbookEntryId, isVisible, createdAt])
@@index([parentId, createdAt])
```

첫 번째는 사용자 상세 모달에서 “이 방명록에 달린 visible 댓글”을 시간순으로 가져오는 데 유리하다. 두 번째는 대댓글을 parent 기준으로 묶을 때 유리하다.

## 4. API 설계

Public API는 세 가지를 추가했다.

### `guestbookCommentList`

입력:

```ts
{ guestbookEntryId: string }
```

출력:

```ts
{
  entry: {
    id: string;
    name: string;
    message: string;
    commentCount: number;
    createdAt: string;
  };
  comments: Array<{
    id: string;
    name: string;
    message: string;
    parentId: null;
    createdAt: string;
    replies: Array<{
      id: string;
      name: string;
      message: string;
      parentId: string;
      createdAt: string;
    }>;
  }>;
}
```

리스트 API가 댓글 전체를 항상 싣지 않도록, 방명록 목록과 댓글 상세를 분리했다. 방명록 영역은 댓글 숫자만 필요하므로 payload를 작게 유지한다.

### `guestbookCommentCreate`

입력:

```ts
{
  guestbookEntryId: string;
  parentId?: string | null;
  name: string;
  message: string;
  website: string;
}
```

`website`는 기존 방명록과 같은 honeypot 필드다.

생성 전 검사:

- 대상 방명록이 visible인지 확인
- 대댓글이면 parent 댓글이 같은 방명록에 속하고, parentId가 null인 원댓글인지 확인
- parent가 대댓글이면 거절해서 무한 nesting을 막음

### `guestbookCommentUpdate`

입력:

```ts
{
  id: string;
  name: string;
  nextName: string;
  message: string;
  website: string;
}
```

기존 방명록 수정 UX와 같은 편의성 우선 방식이다. 토큰 기반 인증이 아니라 작성자 성함 재입력으로 확인한다.

- `name`: 기존 작성자 확인용
- `nextName`: 수정 후 저장할 성함
- `message`: 수정 후 저장할 댓글 내용

보안은 강하지 않지만, 사용자 요구사항이 “편의성 우선, 보조적으로 보안”이므로 현재 프로젝트 맥락에는 맞는다.

## 5. 방명록 목록 payload 변경

기존 `guestbookList`는 다음 필드만 내려줬다.

```ts
id, name, message, createdAt
```

댓글 숫자 표기를 위해 `commentCount`를 추가했다.

Prisma select에서 `_count.comments`를 사용해 visible 댓글 수만 계산한다.

```ts
_count: {
  select: {
    comments: { where: { isVisible: true } },
  },
}
```

이렇게 하면 리스트 UI는 댓글 본문을 모르고도 숫자만 표시할 수 있다.

## 6. 사용자 UI 설계

사용자 UI는 세 컴포넌트 중심으로 나눴다.

### `GuestbookEntryCard`

역할:

- 방명록 작성자, 날짜, 메시지 표시
- 댓글 수 표시
- 상세 모달을 열 수 있는 클릭 영역 제공
- 전체보기 모달에서 기존 방명록 수정 버튼을 넣을 수 있는 `actionSlot` 유지

주의한 점은 버튼 중첩이다. 전체보기에는 방명록 수정 버튼이 이미 존재한다. 카드 전체를 버튼으로 만들면 `button` 안에 `button`이 들어가 HTML과 접근성 문제가 생긴다.

그래서 헤더 액션 영역은 별도로 두고, 메시지/댓글 수 영역만 상세 열기 버튼이 되게 분리했다.

### `GuestbookCommentsDialog`

역할:

- 원문 방명록 상세 표시
- 댓글 목록 표시
- 대댓글 표시
- 댓글 작성
- 대댓글 작성
- 댓글/대댓글 수정

이 컴포넌트는 `guestbookEntryId`만 props로 받고, 상세 데이터는 내부에서 `trpc.wedding.guestbookCommentList.useQuery`로 가져온다.

이렇게 설계한 이유는 미리보기 화면과 전체보기 화면 둘 다 같은 상세 모달을 재사용해야 하기 때문이다. 부모 화면이 원문/댓글 데이터를 직접 들고 있으면 두 화면에서 같은 로직이 반복된다.

### 작성자 이름 저장

댓글 작성자 이름은 기존 사진/영상 업로드에서 쓰던 `readStoredUploaderName`, `storeUploaderName`을 재사용했다. 결혼식 게스트 입장에서는 같은 이름을 반복 입력하지 않는 것이 편하다.

## 7. 댓글 수정 UX

수정은 두 단계다.

1. 작성자 성함 재입력
2. 성함과 메시지 수정

상태는 다음처럼 분리했다.

```ts
type EditTarget = {
  id: string;
  name: string;
  message: string;
  confirmNameInput: string;
  nextName: string;
  isConfirmed: boolean;
};
```

`confirmNameInput`과 `nextName`을 분리한 이유는 중요하다. 이전 방명록 수정 작업에서 한글 IME Enter 처리나 상태 전환 시 확인용 이름이 다음 단계에 남는 문제가 있었다. 확인용 입력과 실제 수정할 이름을 같은 state로 쓰면 이런 UX 버그가 생긴다.

한글 입력 중 Enter도 고려했다.

```ts
if (event.nativeEvent.isComposing || event.keyCode === 229) return;
```

이 guard는 한글 조합 확정 Enter가 “확인” 액션으로 동시에 처리되는 문제를 막는다.

## 8. Admin 설계

관리자 요구사항은 “확인, 숨김, 복원, 삭제”다.

Admin API는 두 가지 mutation을 추가했다.

- `weddingGuestbookCommentSetVisibility`
- `weddingGuestbookCommentDelete`

관리자 overview 쿼리는 현재 페이지의 방명록 entry에 달린 댓글 전체를 같이 가져온다.

```ts
comments: {
  orderBy: { createdAt: "asc" },
  select: {
    id,
    name,
    message,
    parentId,
    isVisible,
    createdAt,
    updatedAt,
  },
}
```

관리자 화면에서는 댓글을 원댓글/대댓글 구조로 그룹핑해 보여준다.

```ts
const rootComments = comments.filter((comment) => comment.parentId === null);
const repliesByParentId = new Map();
```

관리자는 사용자 화면과 달리 hidden 댓글도 모두 봐야 하므로 `isVisible`로 필터하지 않는다.

## 9. Admin UX

관리자 페이지의 기존 패턴과 맞췄다.

- Visible/Hidden badge
- Hide/Restore form
- Delete confirm button

삭제는 기존 RSVP/사진/방명록 삭제와 같은 `ConfirmSubmitButton`을 사용했다. 이 프로젝트의 admin 영역에서는 일관성이 중요하므로 새 modal을 만들지 않았다.

## 10. 검증 전략

이 기능의 핵심 검증 포인트는 다음이다.

### DB

- migration이 적용되는지
- `WeddingGuestbookComment` 관계가 generated client에 반영되는지
- 방명록 삭제 시 댓글 cascade 삭제가 되는지
- 부모 댓글 삭제 시 대댓글 cascade 삭제가 되는지

### API

- 방명록 목록에 `commentCount`가 포함되는지
- hidden 댓글은 public `commentCount`에서 제외되는지
- hidden 댓글은 public 상세 목록에서 제외되는지
- 대댓글의 대댓글 생성이 막히는지
- 댓글 수정 시 이름 확인이 필요한지
- honeypot 값이 있으면 reject 되는지

### UI

- 메인 3개 미리보기에서 댓글 수만 보이는지
- 전체보기에서도 댓글 수만 보이는지
- 카드 클릭 시 상세 모달이 뜨는지
- 댓글 작성 후 댓글 수가 갱신되는지
- 대댓글 작성 후 트리에 반영되는지
- 댓글 수정에서 한글 Enter 조합 문제가 없는지
- 관리자에서 hidden 댓글도 보이는지
- 관리자 Hide/Restore/Delete가 동작하는지

## 11. 왜 optimistic update를 최소화했는가

댓글 작성 후 즉시 UI에 끼워 넣는 optimistic update도 가능하다. 하지만 이 기능은 아직 복잡도가 커지고 있고, 댓글 count가 여러 화면에 걸쳐 표시된다.

그래서 이번 구현에서는 mutation 성공 후 query invalidate를 선택했다.

```ts
utils.wedding.guestbookCommentList.invalidate({ guestbookEntryId })
utils.wedding.guestbookList.invalidate()
```

장점:

- count 불일치 가능성이 낮다.
- 상세 모달과 목록 간 상태 동기화가 단순하다.
- hidden 처리나 admin 변경 후에도 다음 fetch에서 자연스럽게 맞춰진다.

단점:

- optimistic update보다 반응이 약간 느릴 수 있다.

현재 서비스 규모와 UX에서는 이 tradeoff가 더 안전하다.

## 12. 추후 개선점

가능한 후속 개선은 다음과 같다.

- 댓글별 edit token 도입
- 댓글 작성 후 해당 댓글 위치로 scroll/focus
- 관리자 댓글 전용 필터 또는 검색
- 댓글 수 캐시 컬럼 추가
- 신고 기능
- 댓글 알림
- public 댓글 삭제 기능

지금은 결혼식 당일 사용성과 운영 단순성을 우선해 scope를 좁혔다.

## 13. 전체 개발 흐름 요약

풀스택 기능을 만들 때는 아래 순서가 안정적이다.

```text
요구사항 해석
  -> 데이터 모델 설계
  -> API contract 설계
  -> public UI 구현
  -> admin UI 구현
  -> 검증
  -> 문서화
```

이 순서의 핵심은 “아래 레이어가 위 레이어의 계약을 만든다”는 점이다.

- DB 모델이 API의 가능한 동작을 제한한다.
- API 응답이 UI의 상태 구조를 제한한다.
- UI 요구사항이 다시 API payload 크기와 query 분리를 결정한다.
- Admin 요구사항은 public 모델을 재사용하되 hidden 데이터까지 볼 수 있어야 하므로 별도 query shape이 필요하다.

이번 기능에서 가장 중요한 설계 결정은 세 가지였다.

1. 대댓글은 1단까지만 허용한다.
2. 목록에는 댓글 숫자만 싣고 상세는 별도 query로 가져온다.
3. public 수정은 편의성 우선의 이름 확인 방식으로 맞춘다.

이 세 결정 덕분에 구현 범위를 통제하면서도 요구사항을 충족할 수 있었다.

## 14. 추가 개발: 댓글 작성 폼 지연 노출과 답글 접기/펼치기

### 추가 요구사항

기존 구현은 댓글 모달을 열면 바로 댓글 작성 폼이 보이고, 각 댓글의 대댓글도 항상 펼쳐져 있었다.

추가 요구사항은 다음과 같다.

- 댓글 작성 폼은 바로 노출하지 않는다.
- 사용자가 `댓글 남기기` 버튼을 눌렀을 때만 입력 폼을 보여준다.
- 대댓글도 기본으로 펼쳐두지 않는다.
- 댓글 카드 영역을 눌렀을 때 답글을 접고 펼칠 수 있게 한다.
- 답글 수는 접힌 상태에서도 확인할 수 있어야 한다.

### 이번 추가 개발에서 건드린 파일

```text
apps/web/src/features/wedding/components/guestbook-comments-dialog.tsx
docs/wedding-guestbook-comments-development-notes.md
```

이번 변경은 public 댓글 모달의 표시 방식만 바꾸는 작업이다. 그래서 DB, Prisma migration, API router, admin router는 건드리지 않았다. 이미 서버는 원댓글과 대댓글을 모두 내려주고 있었기 때문에, 추가 요구사항은 데이터 구조 문제가 아니라 UI state 문제로 보는 것이 맞았다.

### 개발 순서

이번 추가 개발은 아래 순서로 진행했다.

```text
현재 댓글 모달 구조 확인
  -> 댓글 작성 폼의 기본 노출 제거
  -> 댓글 작성 버튼 추가
  -> 댓글별 답글 펼침 상태 추가
  -> 답글 수 표시 추가
  -> 답글 등록 후 자동 펼침 방지
  -> 문서화
  -> 타입체크/린트 검증
```

이 순서를 잡은 이유는 “데이터 저장 동작”과 “화면 노출 동작”을 분리해서 보기 위해서다. 댓글 저장 API를 먼저 건드리면 원래 잘 되던 작성/수정 흐름까지 흔들 수 있다. 반대로 UI state만 먼저 바꾸면 기존 mutation, invalidate, schema가 그대로 동작하는지 확인하기 쉽다.

### 댓글 작성 폼을 숨긴 이유

댓글 모달의 첫 화면에서 가장 중요한 정보는 원문과 기존 댓글이다. 작성 폼이 항상 보이면 모바일 화면에서 원문, 댓글 목록, 대댓글 흐름이 밀리고, 사용자는 “읽으러 들어온 상태”와 “작성하려는 상태”를 구분하기 어렵다.

그래서 `isCommentFormOpen` 상태를 추가했다.

```ts
const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
```

기본값은 `false`다. 처음에는 버튼만 보여주고, 버튼을 눌렀을 때만 `CommentWriteForm`을 렌더링한다.

```tsx
{isCommentFormOpen ? (
  <CommentWriteForm />
) : (
  <button type="button">댓글 남기기</button>
)}
```

이 방식의 장점은 다음과 같다.

- 모달 첫 화면이 읽기 중심으로 정리된다.
- 댓글을 작성하지 않는 사용자에게 입력 UI가 부담스럽지 않다.
- 작성 의도가 생긴 사용자만 폼을 열기 때문에 모바일 공간을 덜 쓴다.
- 기존 `CommentWriteForm` 컴포넌트를 재사용하므로 새 폼 로직을 만들 필요가 없다.

댓글 작성 버튼을 누를 때는 다른 편집 상태를 닫는다.

```ts
setEditTarget(null);
setReplyTarget(null);
setIsCommentFormOpen(true);
```

댓글 작성, 답글 작성, 댓글 수정이 동시에 열리면 모달 안에서 사용자의 현재 작업이 애매해진다. 그래서 하나의 작성 흐름만 열리도록 상태를 정리했다.

### 댓글 등록 후 폼을 닫는 이유

댓글 등록 성공 후에는 작성 폼을 닫도록 했다.

```ts
setIsCommentFormOpen(false);
```

이유는 댓글을 남긴 직후 사용자가 보고 싶은 것은 다시 댓글 목록이기 때문이다. 폼이 그대로 열려 있으면 성공했는지 실패했는지 시각적으로 덜 명확하고, 같은 내용을 반복 작성하는 화면처럼 보일 수 있다.

단, 이름은 기존 방식대로 local storage의 작성자 이름을 재사용한다. 그래서 다음에 다시 `댓글 남기기`를 누르면 이전 이름이 기본값으로 들어갈 수 있다. 이 프로젝트는 결혼식 하객 사용성이 우선이므로, 반복 입력 부담을 줄이는 쪽이 맞다.

### 답글 펼침 상태를 별도 Set으로 둔 이유

대댓글은 댓글마다 독립적으로 펼쳐지고 접혀야 한다. 하나만 열리게 할 수도 있지만, 사용자가 여러 댓글의 답글을 비교해서 보고 싶을 수 있다.

그래서 단일 `expandedCommentId`가 아니라 `Set<string>`을 사용했다.

```ts
const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(
  () => new Set(),
);
```

토글은 functional update로 처리했다.

```ts
setExpandedCommentIds((current) => {
  const next = new Set(current);
  if (next.has(commentId)) {
    next.delete(commentId);
  } else {
    next.add(commentId);
  }
  return next;
});
```

React state에서 `Set`을 직접 mutate하면 참조가 그대로라 렌더링이 누락될 수 있다. 그래서 항상 새 `Set`을 만들어 반환한다. 이 패턴은 배열 상태를 다룰 때 새 배열을 반환하는 것과 같은 이유다.

### 답글 수는 펼침 여부와 분리했다

답글 목록은 접혀 있어도 답글 수는 보여야 한다.

```tsx
답글 {replyCount.toLocaleString("ko-KR")}개 {isExpanded ? "접기" : "보기"}
```

사용자 입장에서 답글 수는 “열어볼 가치가 있는지” 판단하는 정보다. 목록 자체는 숨기더라도 숫자는 숨기면 안 된다.

이번 구조에서는 서버에 별도 `replyCount` 필드를 추가하지 않았다. 상세 모달 API가 이미 `comment.replies` 배열을 내려주기 때문에, 화면에서는 `comment.replies.length`를 쓰면 충분하다.

```tsx
replyCount={comment.replies.length}
```

만약 나중에 댓글 수가 매우 많아져서 상세 모달에서도 대댓글을 페이지네이션해야 한다면, 그때는 서버 응답에 `replyCount`를 별도 필드로 추가하는 편이 낫다. 지금 규모에서는 API를 키우지 않는 쪽이 더 단순하다.

### 댓글 카드 영역을 누르면 답글을 접고 펼치게 한 이유

사용자는 보통 “답글 보기”라는 작은 글자만 누르기보다 댓글 본문 영역을 자연스럽게 누른다. 그래서 답글이 있는 댓글에서는 본문 영역 전체를 버튼처럼 동작하게 했다.

다만 수정 버튼과 답글 버튼은 별도 버튼으로 유지했다. 전체 카드 전체를 하나의 버튼으로 만들면 그 안에 수정/답글 버튼이 중첩되어 HTML 구조가 나빠진다.

따라서 구조는 이렇게 나눴다.

```text
댓글 카드
  작성자/시간 영역
  수정/답글 아이콘 버튼 영역
  본문 클릭 영역 -> 답글 접기/펼치기
```

접근성을 위해 본문 클릭 버튼에는 `aria-expanded`와 `aria-label`도 붙였다.

```tsx
aria-expanded={isExpanded}
aria-label={`${comment.name}님 댓글 답글 ${replyCount}개 ${isExpanded ? "접기" : "보기"}`}
```

이렇게 하면 시각적으로는 간단한 카드지만, 보조 기술에서도 펼침 상태를 알 수 있다.

### 답글 등록 후 자동으로 펼치지 않은 이유

추가 요구사항에서 중요한 포인트는 “답글도 바로 보여지는게 아니어야 한다”는 점이다. 그래서 답글 등록 성공 후에는 해당 부모 댓글의 펼침 상태를 제거한다.

```ts
if (variables.parentId) {
  setExpandedCommentIds((current) => {
    const next = new Set(current);
    next.delete(variables.parentId);
    return next;
  });
}
```

이 결정은 일반적인 댓글 UX와는 약간 다를 수 있다. 보통은 답글을 남기면 방금 쓴 답글을 바로 보여준다. 하지만 이번 요구사항은 “답글 목록은 사용자가 명시적으로 펼쳤을 때만 본다”는 방향이므로, 작성 성공 후에도 접힌 상태를 유지하는 편이 요구사항에 더 정확하다.

대신 댓글 카드에는 답글 수가 증가해서 보인다. 사용자는 필요하면 해당 댓글을 눌러 방금 등록한 답글까지 확인할 수 있다.

### 왜 API를 바꾸지 않았는가

이번 작업에서 API를 바꾸지 않은 이유는 명확하다.

- 원댓글 목록은 이미 `guestbookCommentList`로 가져온다.
- 대댓글도 이미 `replies` 배열로 함께 내려온다.
- 댓글 작성과 답글 작성은 이미 같은 mutation을 사용한다.
- 댓글 수 갱신도 이미 `guestbookList.invalidate()`로 맞춰진다.

즉, 부족한 것은 “데이터”가 아니라 “표시 상태”였다. 이런 경우에는 API를 건드리지 않는 것이 낫다. 서버 contract를 바꾸지 않으면 테스트 범위도 줄고, 기존 admin 기능이나 public 목록 기능에 영향을 줄 가능성도 낮아진다.

### 이번 추가 개발의 핵심 판단

이번 변경의 핵심은 progressive disclosure다. 화면에 가능한 모든 입력창과 모든 답글을 즉시 펼쳐놓는 대신, 사용자가 의도를 보였을 때만 다음 UI를 보여준다.

```text
읽기 모드
  -> 댓글 남기기 버튼 클릭
  -> 댓글 작성 모드

댓글 카드 접힘
  -> 댓글 본문 영역 클릭
  -> 답글 목록 펼침
```

이 방식은 모바일에서 특히 중요하다. 결혼식 방명록은 긴 시간을 들여 조작하는 업무 도구가 아니라, 하객이 짧게 보고 짧게 남기는 화면이다. 그래서 기본 화면은 가볍고, 필요한 기능은 한 번의 명시적 행동 뒤에 나오는 구조가 더 적합하다.
