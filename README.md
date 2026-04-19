# depreciation-mcp

법인세법 기준 **고정자산 내용연수·감가상각·세무조정 참고값**을 [Model Context Protocol(MCP)](https://modelcontextprotocol.io)로 제공하는 서버입니다.

> 계산 결과는 **참고용**입니다. 신고·회계처리는 적용 법령·사실관계·전문가 검토가 필요합니다.

---

## PRD 배경 (MCP-DEP-001-v1)

아래 **프로젝트 개요**, **문제 정의**, **목표 사용자**는 PRD *시설 감가상각 계산 MCP v1.0(수정판)* 의 1·2·3장을 README용으로 옮긴 것입니다.

### 1. 프로젝트 개요

고정자산 감가상각은 결산 및 법인세 신고에서 반복적으로 수행되는 핵심 실무다.  
하지만 실제 현장에서는 다음 문제가 반복된다.

- 자산 유형별 내용연수 확인을 위해 시행규칙 [별표 5·6]를 직접 찾아야 한다.
- 회계팀 또는 총무팀이 스프레드시트 수식에 의존하여 계산한다.
- 정액법/정률법 선택, 내용연수 범위 검토, 세무조정 계산이 분리되어 있어 작업이 번거롭다.
- 담당자 변경 시 판단 기준이 남지 않아 일관성이 떨어진다.

본 MCP는 이 과정을 표준화하여, 사용자가 자산 정보를 입력하면  
**법인세법 기준의 내용연수 조회 → 감가상각 계산 → 세무조정 참고값 → 일괄 처리 및 비교 분석**까지 일관되게 제공하는 것을 목표로 한다.

### 2. 문제 정의

#### 2.1 현재 실무의 불편

1. **법령 조회의 반복성**  
   자산 분류와 업종별 기준연수를 매번 수동 확인해야 한다.

2. **계산의 비일관성**  
   같은 자산도 담당자에 따라 다른 내용연수 또는 다른 계산식이 적용될 수 있다.

3. **세무조정의 분리 관리**  
   회계상 감가상각비와 세무상 상각범위액 비교를 별도로 계산해야 한다.

4. **다수 자산 처리의 비효율**  
   결산 시즌에는 수십 건 자산을 반복 계산해야 한다.

5. **업종별 비교 검토의 어려움**  
   동일 자산을 서로 다른 업종 기준으로 검토하려면 수작업이 많다.

### 3. 목표 사용자

| 사용자 그룹 | 주요 자산 | 주요 니즈 |
|-------------|-----------|-----------|
| 병원·의료기관 총무팀 | 의료장비, 건물부속설비, 차량 | 고가 자산 내용연수 및 상각방법 검토 |
| 제조업 회계팀 | 기계장치, 공장설비, 차량 | 정률법 기준 계산과 세무조정 |
| IT·서비스 기업 총무팀 | 서버, 네트워크 장비, 소프트웨어, 가구 | 자산 분류 및 내용연수 표준화 |
| 중소기업 대표/경리 | 차량, 비품, 사무설비 | 빠르고 실수 없는 기준 계산 |
| 결산 담당자 | 다수 자산 포트폴리오 | 일괄 계산 및 요약표 확인 |

---

## 요구 사항

- **Node.js** 20 이상  
- **pnpm** 9 이상 (또는 `npm`/`corepack`으로 `pnpm` 활성화)

---

## 설치 (공통)

저장소를 클론한 뒤 의존성 설치와 빌드까지 진행합니다.

```bash
git clone https://github.com/boam79/depreciation-mcp.git
cd depreciation-mcp
pnpm install
pnpm run build
```

빌드가 끝나면 실행 파일은 **`dist/index.js`** 입니다. (`dist/`는 저장소에 포함되지 않으므로 **반드시 로컬에서 `pnpm run build` 필요**)

### 개발 모드 (빌드 없이 실행)

```bash
pnpm exec tsx src/index.ts
```

---

## Cursor AI에 연결하는 방법

### 1) 전역 MCP 설정 파일

1. Cursor에서 **Settings → MCP** 로 이동하거나, 설정 JSON을 직접 엽니다.  
2. macOS에서 사용자 MCP 설정은 보통 다음 경로입니다.  
   `~/.cursor/mcp.json`
3. `mcpServers` 안에 아래 블록을 **추가**합니다.  
   **`args`의 경로는 본인 PC에서 클론·빌드한 폴더의 절대 경로**로 바꿉니다.

```json
{
  "mcpServers": {
    "depreciation-mcp": {
      "command": "node",
      "args": ["/절대경로/depreciation-mcp/dist/index.js"]
    }
  }
}
```

예 (다운로드 폴더에 둔 경우):

```json
"depreciation-mcp": {
  "command": "node",
  "args": ["/Users/본인계정/Downloads/depreciation-mcp/dist/index.js"]
}
```

4. Cursor를 **완전히 종료 후 다시 실행**합니다.  
5. 채팅에서 MCP 도구 목록에 `get_useful_life`, `calc_depreciation_schedule` 등이 보이면 연결된 것입니다.

### 2) 프로젝트 전용 (선택)

프로젝트 루트의 `.cursor/mcp.json`을 쓰는 워크스페이스라면, 동일한 JSON을 그 파일에 넣을 수 있습니다. (Cursor 버전에 따라 UI 경로가 다를 수 있습니다.)

### 3) 빌드 없이 `tsx`로 연결 (선택)

```json
"depreciation-mcp": {
  "command": "pnpm",
  "args": ["exec", "tsx", "/절대경로/depreciation-mcp/src/index.ts"],
  "cwd": "/절대경로/depreciation-mcp"
}
```

---

## Claude Desktop에 연결하는 방법 (macOS)

1. Claude Desktop을 **종료**합니다.  
2. 설정 파일을 엽니다.  
   `~/Library/Application Support/Claude/claude_desktop_config.json`  
3. 최상위에 `mcpServers`가 없으면 만들고, 다음을 추가합니다.

```json
{
  "mcpServers": {
    "depreciation-mcp": {
      "command": "node",
      "args": ["/절대경로/depreciation-mcp/dist/index.js"]
    }
  }
}
```

4. 파일을 저장하고 Claude Desktop을 다시 실행합니다.  
5. 새 대화에서 MCP 도구가 노출되는지 확인합니다.

Windows 사용자는 Claude 공식 문서의 **설정 파일 경로**를 확인한 뒤, 동일하게 `command` / `args`만 맞추면 됩니다.

---

## 제공 도구 (6개)

| 도구 | 설명 |
|------|------|
| `get_useful_life` | 자산 유형·업종·건물구조 기준 내용연수·허용 범위·기본 상각방식 |
| `calc_depreciation_schedule` | 정액·정률·생산량비례 스케줄 |
| `calc_tax_adjustment` | 회계 vs 세무 한도 차이(손금부인·시인부족·추인 단순모형) |
| `list_asset_categories` | 자산 분류 목록 |
| `calc_bulk_depreciation` | 최대 100건 일괄·요약 |
| `compare_industry_life` | 업종별 내용연수·상각 비교 |

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm run build` | TypeScript → `dist/` |
| `pnpm start` | `node dist/index.js` (stdio MCP) |
| `pnpm run dev` | `tsx src/index.ts` |
| `pnpm test` | Vitest |
| `pnpm smoke` | stdio 연결·도구 6개·`get_useful_life` 샘플 호출 검증 |

---

## 연결 테스트 (로컬)

빌드 후 프로젝트 루트에서:

```bash
pnpm smoke
```

`OK: listTools` 및 `OK: get_useful_life`가 나오면 MCP 서버 프로세스와 프로토콜이 정상입니다.

---

## 데이터에 관해

`src/data/annex5.ts`, `annex6.ts` 등은 **실무 보조용 요약 데이터**입니다. 법령 개정 시 내용을 갱신하고 `pnpm test`로 검증하세요.

---

## 저장소

https://github.com/boam79/depreciation-mcp
