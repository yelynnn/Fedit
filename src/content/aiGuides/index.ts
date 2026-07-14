import type { GuideCategory, GuideTopic } from "@/types/guide";
import { GUIDE_CATEGORIES } from "@/types/guide";
import screenLayout from "./screenLayout";
import brandSetup from "./brandSetup";
import liveItems from "./liveItems";
import productAnalysis from "./productAnalysis";
import colorAnalysis from "./colorAnalysis";
import typeAnalysis from "./typeAnalysis";
import fashionShowAnalysis from "./fashionShowAnalysis";
import glossary from "./glossary";
import emptyValues from "./emptyValues";
import askFedi from "./askFedi";
import usageScenario from "./usageScenario";
import boardSave from "./boardSave";
import accountManage from "./accountManage";

export const AI_GUIDE_TOPICS: GuideTopic[] = [
  screenLayout,
  brandSetup,
  liveItems,
  productAnalysis,
  colorAnalysis,
  typeAnalysis,
  fashionShowAnalysis,
  glossary,
  emptyValues,
  askFedi,
  usageScenario,
  boardSave,
  accountManage,
];

export const getGuideTopic = (id: string) =>
  AI_GUIDE_TOPICS.find((t) => t.id === id);

// 카테고리 표시 순서(GUIDE_CATEGORIES)를 기준으로 주제를 그룹핑
export const getGuideTopicsByCategory = (
  topics: GuideTopic[] = AI_GUIDE_TOPICS,
): { category: GuideCategory; topics: GuideTopic[] }[] =>
  GUIDE_CATEGORIES.map((category) => ({
    category,
    topics: topics.filter((t) => t.category === category),
  })).filter((group) => group.topics.length > 0);
