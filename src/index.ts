#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ASSET_TYPES,
  DEPRECIATION_METHODS,
  BUILDING_STRUCTURES,
  type AssetType,
  type BuildingStructure,
  type DepreciationMethod,
  type KsicCode,
} from "./types/index.js";
import { isKsicCode, listKsicCodes } from "./data/ksicMapping.js";
import { resolveUsefulLife } from "./utils/resolveUsefulLife.js";
import { calcDepreciationSchedule } from "./utils/schedule.js";
import { calcTaxAdjustmentCore } from "./utils/taxAdjustment.js";
import { listAssetCategoriesCore } from "./utils/listCategoriesCore.js";
import { calcBulkDepreciationCore } from "./utils/bulk.js";
import { compareIndustryLifeCore } from "./utils/compareIndustry.js";

const ASSET_ENUM = ASSET_TYPES as unknown as [string, ...string[]];
const METHOD_ENUM = DEPRECIATION_METHODS as unknown as [string, ...string[]];
const STRUCT_ENUM = BUILDING_STRUCTURES as unknown as [string, ...string[]];

const DISCLAIMER =
  "본 도구의 계산 결과는 법인세 신고 및 회계 검토를 위한 참고자료입니다. 실제 신고 및 회계처리는 적용 시점의 법령, 사실관계, 회사의 회계정책 및 세무전문가 판단에 따라 달라질 수 있습니다.";

function jsonText(obj: unknown) {
  return JSON.stringify({ ...((obj as object) ?? {}), disclaimer: DISCLAIMER }, null, 2);
}

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message, disclaimer: DISCLAIMER }) }],
    isError: true,
  };
}

const server = new McpServer(
  {
    name: "depreciation-mcp",
    version: "1.0.0",
    title: "시설·고정자산 감가상각 MCP",
  },
  {
    instructions: `법인세법 기준 내용연수 조회, 감가상각 스케줄, 세무조정 참고값, 일괄 처리, 업종 비교를 제공합니다. ${DISCLAIMER}`,
  },
);

server.registerTool(
  "get_useful_life",
  {
    title: "내용연수 조회",
    description: "자산 유형·업종·건물구조 기준 기준내용연수·허용범위·기본 상각방식·법적근거",
    inputSchema: {
      asset_type: z.enum(ASSET_ENUM).describe("자산 유형"),
      industry_code: z.string().optional().describe("KSIC 스타일 코드 (예: Q86, J62). 미입력 시 별표5 공통"),
      structure: z.enum(STRUCT_ENUM).optional().describe("건물(asset_type=building)일 때 구조"),
    },
  },
  async ({ asset_type, industry_code, structure }) => {
    try {
      const at = asset_type as AssetType;
      const st = structure as BuildingStructure | undefined;
      if (at === "building" && !st) {
        return {
          content: [
            {
              type: "text",
              text: jsonText({
                ...resolveUsefulLife({
                  asset_type: at,
                  industry_code: industry_code && isKsicCode(industry_code) ? industry_code : undefined,
                }),
                note: "건물은 structure 미지정 시 철근콘크리트조를 기본으로 합니다.",
              }),
            },
          ],
        };
      }
      if (industry_code && !isKsicCode(industry_code)) {
        return toolError(
          `지원하지 않는 industry_code입니다. 사용 가능: ${listKsicCodes().join(", ")}`,
        );
      }
      const out = resolveUsefulLife({
        asset_type: at,
        industry_code: industry_code && isKsicCode(industry_code) ? industry_code : undefined,
        structure: st,
      });
      return { content: [{ type: "text", text: jsonText(out) }] };
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "calc_depreciation_schedule",
  {
    title: "감가상각 스케줄",
    description: "단일 자산의 정액법·정률법·생산량비례법 스케줄(연도별)",
    inputSchema: {
      asset_name: z.string().describe("자산명"),
      asset_type: z.enum(ASSET_ENUM).describe("자산 유형(내용연수 자동참조 시 사용)"),
      industry_code: z.string().optional(),
      cost: z.number().describe("취득가액"),
      acquired_date: z.string().describe("취득일 YYYY-MM-DD"),
      method: z.enum(METHOD_ENUM).optional().describe("미입력 시 내용연수 조회 결과의 기본 상각방식"),
      useful_life_years: z.number().optional().describe("미입력 시 업종·자산 기준 표준 내용연수"),
      total_units: z.number().optional(),
      current_units: z.number().optional(),
    },
  },
  async (input) => {
    try {
      const industry =
        input.industry_code && isKsicCode(input.industry_code) ? input.industry_code : undefined;
      const resolved = resolveUsefulLife({
        asset_type: input.asset_type as AssetType,
        industry_code: industry,
      });
      const life = input.useful_life_years ?? resolved.standard_life;
      const method = (input.method ?? resolved.default_method) as DepreciationMethod;
      if (method === "units_of_production" && (input.total_units == null || input.current_units == null)) {
        return toolError("생산량비례법은 total_units와 current_units가 필요합니다.");
      }
      const out = calcDepreciationSchedule({
        asset_name: input.asset_name,
        cost: input.cost,
        acquired_date: input.acquired_date,
        method,
        useful_life_years: life,
        total_units: input.total_units,
        current_units: input.current_units,
      });
      return { content: [{ type: "text", text: jsonText(out) }] };
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "calc_tax_adjustment",
  {
    title: "세무조정 참고",
    description: "회계 감가상각비 vs 세무 상각범위액 → 손금부인·시인부족·추인(단순모형)",
    inputSchema: {
      book_depreciation: z.number(),
      tax_limit: z.number(),
      carried_over_denial: z.number().optional().describe("전기 이월 손금부인액"),
    },
  },
  async (input) => {
    try {
      const out = calcTaxAdjustmentCore(input);
      return { content: [{ type: "text", text: jsonText(out) }] };
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "list_asset_categories",
  {
    title: "자산 분류 목록",
    description: "업종별(또는 공통) 자산 분류·내용연수·상각률 요약",
    inputSchema: {
      industry_code: z.string().optional(),
      asset_filter: z
        .enum(["machinery", "vehicle", "building", "it", "medical", "all"])
        .optional(),
      show_rates: z.boolean().optional(),
    },
  },
  async (input) => {
    try {
      const ind = input.industry_code;
      if (ind && !isKsicCode(ind)) {
        return toolError(`지원하지 않는 industry_code. 사용 가능: ${listKsicCodes().join(", ")}`);
      }
      const items = listAssetCategoriesCore({
        industry_code: ind && isKsicCode(ind) ? ind : undefined,
        asset_filter: input.asset_filter,
        show_rates: input.show_rates,
      });
      return { content: [{ type: "text", text: jsonText({ categories: items }) }] };
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "calc_bulk_depreciation",
  {
    title: "일괄 감가상각",
    description: "최대 100건, 회계 스케줄 vs 세무 기본 스케줄로 당기 손금부인 등 요약",
    inputSchema: {
      assets: z
        .array(
          z.object({
            asset_name: z.string(),
            asset_type: z.enum(ASSET_ENUM),
            industry_code: z.string().optional(),
            cost: z.number(),
            acquired_date: z.string(),
            method: z.enum(METHOD_ENUM).optional(),
            useful_life_years: z.number().optional(),
          }),
        )
        .describe("자산 목록"),
      fiscal_year: z.number(),
      output_format: z.enum(["summary", "detailed", "tax_adjustment"]).optional(),
    },
  },
  async (input) => {
    try {
      for (const a of input.assets) {
        if (a.industry_code && !isKsicCode(a.industry_code)) {
          return toolError(`자산 ${a.asset_name}: industry_code 오류. 사용 가능: ${listKsicCodes().join(", ")}`);
        }
      }
      const out = calcBulkDepreciationCore({
        assets: input.assets.map((a) => ({
          ...a,
          asset_type: a.asset_type as AssetType,
          method: a.method as DepreciationMethod | undefined,
          industry_code:
            a.industry_code && isKsicCode(a.industry_code) ? (a.industry_code as KsicCode) : undefined,
        })),
        fiscal_year: input.fiscal_year,
        output_format: input.output_format,
      });
      return { content: [{ type: "text", text: jsonText(out) }] };
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
);

server.registerTool(
  "compare_industry_life",
  {
    title: "업종 간 내용연수·상각 비교",
    description: "동일 자산·취득가에 대해 업종별 표준 내용연수 및 1년차·5년 누적 상각(비교용)",
    inputSchema: {
      asset_type: z.enum(ASSET_ENUM),
      cost: z.number(),
      industry_codes: z.array(z.string()).min(1),
      method: z.enum(METHOD_ENUM).optional(),
    },
  },
  async (input) => {
    try {
      const codes = input.industry_codes.filter(isKsicCode);
      if (codes.length !== input.industry_codes.length) {
        return toolError(`industry_codes 검증 실패. 사용 가능: ${listKsicCodes().join(", ")}`);
      }
      const out = compareIndustryLifeCore({
        asset_type: input.asset_type as AssetType,
        cost: input.cost,
        industry_codes: codes,
        method: input.method as DepreciationMethod | undefined,
      });
      return { content: [{ type: "text", text: jsonText(out) }] };
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
