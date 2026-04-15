import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    if (retries > 0 && isRateLimit) {
      console.log(`检测到频率限制，正在重试... 剩余次数: ${retries}`);
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * 核心逻辑说明：
 * 为了确保 100% 基于用户上传的原素材生成，我们需要将图像数据直接发送给 AI。
 * 由于浏览器端存在 CORS 限制，无法直接 fetch 外部 URL，
 * 我们在 App.tsx 中通过用户点击类型时，将预置的 Base64 数据传递进来。
 */

export async function generateMBTIAvatar(mbtiType: string, userPrompt: string, base64Image: string, userPhotoBase64?: string) {
  return withRetry(async () => {
    const styleInstruction = userPhotoBase64 
      ? `
你是一个顶尖的插画专家，专门负责将真实人物转化为 16personalities (MBTI) 风格的插画。
我为你提供了两张图片：
1. **图 A (风格与角色基准)**：这是 ${mbtiType} 的官方形象，定义了最终作品的画风（极简几何、纸片感、扁平化）。
2. **图 B (内容与特征来源)**：这是一张真实的人物照片，包含你必须提取的特征。

任务要求（极其严格，不容有失）：
1. **特征提取与保留**：
   - **从【图 B】提取**：**人物动作与姿势（必须严格还原照片中的站姿、坐姿或手势）**、发型（长短、卷直）、发色、胡须、眼镜、帽子、耳环、项链等饰品，以及服装款式（如西装、卫衣、旗袍）和核心道具。
   - **从【图 A】保留（关键）**：**五官（眼睛、嘴巴）必须严格保持【图 A】中原汁原味的 MBTI 风格（即简单的黑点或线条）**，严禁根据照片修改五官形状或表情。
   - **动作还原**：小人的身体动态必须与【图 B】中的人物动作高度一致（例如：招手、叉腰、拿着道具的姿势等）。
2. **风格化重塑**：将提取的特征与动作按照【图 A】的 16personalities 官方画风进行重塑。
3. **画风铁律**：结果必须 100% 保持极简几何、纸片感、扁平化。严禁写实、严禁渐变、严禁 3D。
4. **背景与纯净度**：背景必须是绝对的纯白色 (#FFFFFF)。严禁出现任何文字或标签。
5. **角色神韵**：最终角色必须依然保留 ${mbtiType} 的标志性神韵，五官必须是原版的，但动作必须是来自【图 B】的。

用户额外要求：${userPrompt}

请基于以上指令，创作出一张完美还原用户特征、且画风极其纯正的 MBTI 风格插画。
`
      : `
你是一个专业的插画专家，擅长创作极简主义、几何风格的角色插画。
我为你提供了一张角色原图作为【唯一视觉参考】。

创作要求：
1. **视觉一致性**：必须严格保持参考图中角色的几何形状、比例、五官特征和简约的“纸片感”画风。
2. **背景要求**：背景必须是纯白色 (#FFFFFF)，严禁任何背景装饰、阴影或渐变。
3. **内容纯净**：严禁在图片中出现任何文字、字母、数字或标签。
4. **个性化修改**：根据用户的描述修改角色的服装、道具或姿势。
5. **角色识别度**：修改后的角色必须一眼认出是参考图中的那个特定角色。

用户描述：${userPrompt}

请基于提供的参考图像，生成一张画风完全统一、纯白背景的新图像。
`;

    const parts: any[] = [
      {
        inlineData: {
          mimeType: "image/webp",
          data: base64Image,
        },
      },
    ];

    if (userPhotoBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: userPhotoBase64,
        },
      });
    }

    parts.push({ text: styleInstruction });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("AI 未返回任何结果");
    }

    let textResponse = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
        textResponse += part.text;
      }
    }
    
    if (textResponse) {
      throw new Error(`AI 拒绝生成图像，原因：${textResponse}`);
    }

    throw new Error("AI 未能生成图像部分，且未返回说明信息。");
  });
}
