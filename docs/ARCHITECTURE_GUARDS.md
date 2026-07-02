# ARCHITECTURE_GUARDS.md

Ten dokument obowiązuje przy każdym tasku dotyczącym:
- API,
- fetchowania,
- parserów,
- workerów,
- kolejek,
- cache,
- providerów,
- UI statusu,
- runtime state,
- danych zewnętrznych.

## Guard Scope

Nie wdrażaj wszystkich guardów naraz.

Najpierw wskaż:

REQUIRED:
- guardy konieczne do naprawy aktualnego błędu.

NICE_TO_HAVE:
- dobre, ale niepotrzebne teraz.

OVERBUILD:
- nie robić w tym tasku.

Implementuj tylko REQUIRED.
Resztę zapisz do ParkingLot.md.

## 1. State machine

Każdy flow musi mieć jawne statusy i legalne przejścia.

Przykład:
QUEUED -> FETCHING
FETCHING -> RETRYING
FETCHING -> VERIFIED
FETCHING -> PARSE_FAILED
FETCHING -> FAILED_TEMPORARY
FETCHING -> FAILED_PERMANENT
RETRYING -> FETCHING
RETRYING -> FAILED_PERMANENT

Zakazane:
PARSE_FAILED -> VERIFIED bez nowego fetch/validation
FAILED_PERMANENT -> FETCHING bez manual reset albo jawnego retry policy
any -> SUCCESS bez walidacji
any -> VERIFIED bez źródła/dowodu

Status zmienia tylko warstwa state transition.

## 2. Error classification

Każdy błąd musi mieć typ.

Retryable:
- TIMEOUT
- NETWORK
- RATE_LIMIT
- PROVIDER_5XX
- TEMPORARY_OVERLOAD
- LOCK_TIMEOUT

Non-retryable:
- PARSE_ERROR
- SCHEMA_CHANGED
- VALIDATION_ERROR
- DATA_MISSING
- INVALID_INPUT
- BUSINESS_RULE_VIOLATION
- AUTH_DENIED
- PERMISSION_DENIED

Retry wolno stosować tylko dla retryable errors.

Nie wolno robić retry dla:
- błędu parsowania,
- zmiany schemy,
- braku wymaganych danych,
- błędu walidacji,
- naruszenia reguły biznesowej.

## 3. Idempotency

Każda operacja, którą można powtórzyć, musi mieć idempotency key.

Dotyczy:
- create,
- analyze,
- open,
- close,
- review,
- payment,
- order,
- fetch job,
- worker job,
- AI/tool execution.

Jeśli ten sam idempotency key już istnieje:
- nie wykonuj operacji drugi raz,
- zwróć poprzedni wynik,
- nie twórz duplikatu side-effectu.

## 4. Atomiczność

Jeśli operacja zapisuje kilka rzeczy, np. rekord, event, status, wynik, to nie może zostawić połowicznego stanu.

Wymagane:
- transakcja,
- albo kompensacja,
- albo jawny status PARTIAL_FAILED.

Nie wolno udawać success, jeśli zapis eventu albo statusu się nie udał.

## 5. Single source of truth

Dla każdego statusu/stanu wskaż jedno miejsce prawdy.

Zasady:
- UI czyta status z jednego źródła.
- Worker zapisuje status przez jedną warstwę.
- Log jest dowodem przejścia, ale nie drugim stanem systemu.
- Nie wolno trzymać statusu równolegle w DB, UI, workerze i cache bez jasnej hierarchii.

## 6. Single-flight / stampede guard

Jeśli wiele requestów dotyczy tego samego key, nie wolno odpalać wielu fetchy naraz.

Wymagane:
- lock,
- albo single-flight,
- albo reuse istniejącego pending job.

Jeśli fetch dla key już trwa:
- zwróć istniejący status PENDING/FETCHING,
- albo podepnij się do istniejącego joba,
- ale nie odpalaj drugiego fetch.

## 7. Worker lock

Worker musi mieć lock z expiresAt.

Wymagane pola:
- lockedBy
- lockedAt
- lockExpiresAt
- attemptCount
- lastError
- nextRetryAt

Jeśli worker padnie, lock musi wygasnąć.

Nie wolno zostawiać wiecznego:
- FETCHING,
- PROCESSING,
- LOCKED,
- RUNNING.

## 8. Circuit breaker

Dla zewnętrznych providerów wymagany jest circuit breaker, jeśli provider może blokować runtime.

Statusy:
- CLOSED - provider działa
- OPEN - provider zablokowany po serii błędów
- HALF_OPEN - jedna próbna operacja

Po N błędach provider przechodzi w OPEN.
W OPEN nie robimy nowych fetchy.
Po czasie nextProbeAt przechodzimy w HALF_OPEN.
Tylko jedna próbna operacja może zamknąć circuit.

## 9. Backpressure

Jeśli flow używa kolejki, musi mierzyć:
- queueDepth
- activeWorkers
- activeFetches
- oldestQueuedAge
- rejectedCount
- delayedCount

Jeśli system jest przeciążony:
- nie przyjmuj nieskończonej pracy,
- nie twórz nieskończonych jobów,
- zwróć QUEUED_DELAYED albo BLOCKED_TEMPORARY.

## 10. Timeout policy

Każda operacja zewnętrzna ma mieć timeout.

Dotyczy:
- API,
- DB,
- providerów,
- LLM,
- workerów,
- webhooków,
- parserów,
- pollingów.

Timeout musi kończyć się jawnym statusem:
- TIMEOUT,
- FAILED_TEMPORARY,
- FAILED_PERMANENT,
- MANUAL_REVIEW_REQUIRED.

## 11. Retry policy

Retry musi mieć:
- maxAttempts,
- delay,
- backoff,
- retryable error types,
- terminal status po wyczerpaniu prób.

Nie wolno robić infinite retry.
Retry nie może zmieniać danych, jeśli operacja nie jest idempotentna.

## 12. UI truth

UI nie może pokazywać niezweryfikowanych danych jako faktu.

Zakaz:
- pustych danych jako success,
- pending jako final result,
- stale data bez oznaczenia,
- wyniku bez statusu,
- danych z fallbacka jako verified.

Każdy wynik widoczny dla użytkownika ma mieć:
- status,
- verified / unverified,
- source,
- updatedAt,
- lastError, jeśli istnieje,
- nextStep, jeśli istnieje.

Brak danych to status, nie wynik.

## 13. Observability

Każde przejście statusu musi mieć log/event:
- entityKey
- previousStatus
- nextStatus
- eventType
- attemptCount
- durationMs
- errorType
- errorMessage
- nextRetryAt
- provider
- idempotencyKey

Log ma dawać dowód, co system zrobił.
Nie wolno maskować błędu silent fallbackiem.

## 14. Provider/API response contract

Każdy provider ma mieć kontrakt:
- request shape,
- response shape,
- timeout,
- retry policy,
- error mapping,
- validation,
- fallback,
- circuit breaker.

Nie wolno ufać providerowi bez walidacji schemy.

## 15. Parser contract

Parser nie może zwracać pustego success.

Parser zwraca:
- PARSED
- PARSE_FAILED
- SCHEMA_CHANGED
- DATA_MISSING
- MANUAL_REVIEW_REQUIRED

Jeśli schema się zmieni, to nie jest retryable network error.

## 16. Done dla runtime/API/worker taska

DONE wymaga:
- happy path PASS,
- timeout path PASS,
- invalid data PASS,
- duplicate/idempotency PASS,
- fail-closed PASS,
- log/status transitions PASS,
- UI truth PASS, jeśli dotyczy,
- brak silent fallbacków,
- brak empty success,
- brak infinite retry.
