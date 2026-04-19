/**
 * stdio MCP 연결 스모크 테스트: initialize → listTools → get_useful_life 1회 호출
 * 사용: 프로젝트 루트에서 `node scripts/smoke-test.mjs`
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const entry = join(root, "dist", "index.js");

const transport = new StdioClientTransport({
  command: "node",
  args: [entry],
  cwd: root,
  stderr: "pipe",
});

const stderr = transport.stderr;
if (stderr) {
  stderr.on("data", (chunk) => {
    process.stderr.write(`[server stderr] ${chunk}`);
  });
}

const client = new Client({ name: "depreciation-smoke", version: "1.0.0" });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  const expected = [
    "calc_bulk_depreciation",
    "calc_depreciation_schedule",
    "calc_tax_adjustment",
    "compare_industry_life",
    "get_useful_life",
    "list_asset_categories",
  ];
  const missing = expected.filter((n) => !names.includes(n));
  if (missing.length) {
    console.error("FAIL: 누락된 도구:", missing);
    process.exitCode = 1;
  } else {
    console.log("OK: listTools — 6개 도구 확인");
  }

  const toolResult = await client.callTool({
    name: "get_useful_life",
    arguments: { asset_type: "medical_device", industry_code: "Q86" },
  });
  const text = toolResult.content?.find((c) => c.type === "text")?.text;
  if (!text || toolResult.isError) {
    console.error("FAIL: get_useful_life 응답 없음 또는 isError", toolResult);
    process.exitCode = 1;
  } else {
    const parsed = JSON.parse(text);
    if (parsed.error) {
      console.error("FAIL:", parsed.error);
      process.exitCode = 1;
    } else {
      console.log("OK: get_useful_life — standard_life=", parsed.standard_life, "table=", parsed.applicable_table);
    }
  }
} catch (e) {
  console.error("FAIL:", e);
  process.exitCode = 1;
} finally {
  await transport.close();
}
