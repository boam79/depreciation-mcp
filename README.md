# depreciation-mcp

법인세법 기준 **고정자산 내용연수·감가상각·세무조정 참고값**을 [Model Context Protocol(MCP)](https://modelcontextprotocol.io)로 제공하는 서버입니다. (PRD MCP-DEP-001-v1 대응)

> 계산 결과는 **참고용**입니다. 신고·회계처리는 적용 법령·사실관계·전문가 검토가 필요합니다.

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

---

## 데이터에 관해

`src/data/annex5.ts`, `annex6.ts` 등은 **실무 보조용 요약 데이터**입니다. 법령 개정 시 내용을 갱신하고 `pnpm test`로 검증하세요.

---

## 저장소

https://github.com/boam79/depreciation-mcp
