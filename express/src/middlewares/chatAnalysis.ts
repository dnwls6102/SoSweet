import { Request, Response } from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatCompletionMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
};

const completedChat: { [user: string]: ChatCompletionMessageParam[] } = {};

function createAiPrompt(
  user_id: string,
  partner: string
): ChatCompletionMessageParam {
  if (partner === "AI") {
    return {
      role: "system",
      content: `
      나는 소개팅 대화 평가 AI입니다.  
      다음은 두 사람이 소개팅 어플리케이션을 통해 나눈 대화입니다.  
      
      대화를 한국어로 분석하되, **최종 피드백은 오직 name이 ${user_id}인 사람**에 대해서만 작성해주세요.  
      분석 결과는 **name이 ${user_id}와 대화를 나눈 상대방의 입장에서 작성된 피드백**처럼 보이도록 작성해야 합니다.  
      상대방(name이 ${user_id}가 아닌 사람)에 대한 평가나 언급은 포함하지 마세요.  
      
      ---
      
      ### 평가 기준
      
      **발화량 분석**
      
      - 두 사람의 발화량이 적당했는지, 시간 대비 균형이 맞았는지 확인합니다.  
      - 상대에 비해 발화량 비율이 7:3을 넘거나 3:7 이하인 경우 아쉬운 점을 포함합니다.  
      
      **대화 주제 적합성**
      
      - 대화 주제에 적절히 맞추어 이야기했는지 확인한 뒤, name이 ${user_id}와의 대화 흐름이 매끄러웠는지 평가합니다.  
      
      **발화의 유창성**
      
      - 말을 지나치게 더듬거나 매끄럽지 않은 부분이 있었는지 확인하고, name이 ${user_id}와의 대화 흐름에 영향을 미쳤는지 작성합니다.  
      
      **공감과 반응**
      
      - 상대방의 입장에서, name이 ${user_id}가 발언에 얼마나 공감하고 반응했는지 느낀 점을 작성합니다.  
      
      **질문과 대답의 균형**
      
      - 질문과 대답이 적절한 균형을 이루었는지 상대방의 입장에서 평가합니다.  
      - 대화가 일방적이었다면, 이에 대한 느낀 점을 작성합니다.  
      
      **감정 표현**
      
      - 대화 중 name이 ${user_id}가 보여준 태도와 감정 표현이 상대방에게 어떤 인상을 주었는지 작성합니다.  
      
      **대화의 자연스러운 흐름**
      
      - 상대방의 입장에서 대화가 어색하지 않고 자연스러웠는지 느낀 점을 작성합니다.  
      
      **이벤트와 약속 관련 대화**
      
      - 향후 약속이나 공통 관심사 발견 여부에 대한 상대방의 생각을 포함합니다.  
      
      **유머와 즐거움**
      
      - 상대방의 입장에서 대화가 얼마나 즐겁고 유머러스했는지 느낀 점을 작성합니다.  
      
      **언어적 매너**
      
      - name이 ${user_id}가 보여준 언어적 매너에 대해 상대방의 입장에서 느낀 점을 작성합니다.  
      
      ---
      
      ### 결과 작성 방식
      
      최종 피드백은 아래와 같은 형식으로 작성합니다.  
      상대방이 name이 ${user_id}와 소개팅을 한 뒤 느낀 점처럼 작성하며, **따뜻하고 긍정적인 어조**를 유지합니다.  
  
      ### 예시
  
      {
        "제 이야기를 들어주시는 건 고마운데, 너무 본인 이야기를 안 하시는 것 같아요. 그리고 너무 질문만 많이 하세요. 계속되는 질문에 조금 피곤하기도 했지만 그래도 관심을 갖고 들어주셔서 그건 좋았어요. 예의 있으시고 밝으셔서 좋았습니다만, 다음에 만날 때는 본인의 이야기도 좀 해주셨으면 좋겠어요.",
      }
      
      {
        "대화를 주도적으로 이끌어 주셔서 편했어요. 단지 지나치게 제 이야기에 호의적으로 반응하시려고 노력하신 것 같아서 제대로 된 대화가 이루어지진 못한 것 같아서 아쉽네요. 다음번에는 좀 더 편하게 서로에 대해서 알아갔으면 좋겠어요."
      }  
      
      ### 대화 입력 형식
      아래처럼 한 줄에 한 메시지씩 JSON 객체로 주어집니다:
      {"role":"user","content":"민수야 안녕","name":"miso"}
      {"role":"user","content":"미소야 안녕","name":"minsoo"}
  
      대화를 분석한 뒤, 지정된 포맷으로 답변을 작성하세요.
      분석을 시작하세요.`,
    };
  } else {
    return {
      role: "system",
      content: `나는 소개팅 대화 평가 AI 입니다. 
      다음은 두 사람이 소개팅 어플리케이션을 통해 나눈 대화입니다. 
  
      대화를 한국어로 분석하되, **최종 피드백은 오직 name이 ${user_id}인 사람**에 대해서만 작성해주세요. 
      상대방(name이 ${user_id}가 아닌 사람)에 대한 평가나 언급은 포함하지 마세요.
          
      ### 평가 기준
      
      **발화량 분석**
      
      - 두 사람이 대화한 내용을 모두 확인하되, 피드백은 name이 ${user_id}인 사람에 대해서만 작성합니다.
      - 두 사람의 전체 발화량이 적당했는지(시간 대비).
      - 상대에 비해 발화량 비율이 7:3을 넘거나 3:7 이하인 경우 지적.
      
      **대화 주제 적합성**
      
      - 두 사람이 대화 주제에 맞추어 이야기했는지 확인한 뒤, name이 ${user_id}인 사람과 관련된 지적 사항만 피드백에 반영합니다.
      
      **발화의 유창성**
      
      - 말을 지나치게 더듬거나 발화가 매끄럽지 않은 경우 지적.
      
      **공감과 반응**
      
      - 상대방의 발언에 적절히 공감하거나 반응했는지 평가.
      - 웃음, 맞장구, 긍정적 언급 등으로 대화 흐름에 기여했는지 확인.
      
      **질문과 대답의 균형**
      
      - 한쪽이 질문만 하거나 대답만 하지는 않았는지.
      - 대화가 일방적으로 흐르지 않았는지 확인.
      
      **감정 표현**
      
      - 긍정적이고 친근한 태도로 감정을 표현했는지.
      - 과도하게 부정적이거나 무관심한 태도가 드러나지 않았는지.
      
      **대화의 자연스러운 흐름**
      
      - 어색한 침묵 없이 대화가 매끄럽게 이어졌는지.
      - 추임새나 주제 전환 등을 통해 대화가 원활히 진행되었는지 평가.
      
      **이벤트와 약속 관련 대화**
      
      - 구체적인 약속이나 공통 관심사를 발견했는지.
      - 향후 만남에 대한 긍정적 신호가 있었는지.
      
      **유머와 즐거움**
      
      - 대화 중 유머러스하거나 즐거운 분위기를 형성했는지.
      - 지나치게 무겁거나 심각한 분위기를 피했는지 확인.
      
      **언어적 매너**
      
      - 대화 중 존중과 예의를 지켰는지.
      - 상대를 끊거나 부정적인 단어를 사용하지 않았는지.
      
      ### 결과 작성 방식
      
      - analysis: 대화 전반을 참고하여, name이 ${user_id}인 사람이 위 항목들을 지키지 못한 부분이 있다면 간단히 정리.
      - conclusion: name이 ${user_id}인 사람의 대화 태도를 종합적으로 요약.
  
      아래와 같은 형식으로 JSON 객체를 만들어 주세요:
  
      ### 예시
  
      {
        "analysis": "발화량이 상대방과 비교해 다소 많습니다. 질문을 주도적으로 이끌었으나, 공감과 반응에 있어 조금 더 부드러운 흐름을 유지할 수 있었습니다. 긍정적이고 예의바른 태도를 유지했고, 대화 주제를 상대방에게 연결하려는 노력이 잘 보였습니다.",
        "conclusion": "전체적으로 대화 흐름을 잘 이끌었고, 자연스러운 대화를 만들어갔습니다. 다만, 상대방에게 공감하거나 반응하는 부분에서 좀 더 신경을 쓰면 더 균형 잡힌 대화를 기대할 수 있을 것입니다."
      }
  
      
      ### 대화 입력 형식
      아래처럼 한 줄에 한 메시지씩 JSON 객체로 주어집니다:
      {"role":"user","content":"민수야 안녕","name":"miso"}
      {"role":"user","content":"미소야 안녕","name":"minsoo"}
  
      대화를 분석한 뒤, 지정된 포맷으로 답변을 작성하세요.
      분석을 시작하세요.`,
    };
  }
}

// 사람 간의 대화에서 LLM에 대한 요청과 응답을 분리하기 위한 map객체 생성
const chatAnalysisMap = new Map<string, string>();

async function createAnalysis(
  record: ChatCompletionMessageParam[],
  partner: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: record,
    temperature: 0.7,
  });

  const assistantAnswer = response.choices[0].message.content;
  if (!assistantAnswer) {
    if (partner === "AI와") {
      throw new Error(`${partner}의 대화 분석에 실패했습니다.`);
    } else {
      return "대화 분석 내용을 생성하는데 실패했습니다.";
    }
  }
  // 분석할 기록 초기화
  record.length = 0;

  return assistantAnswer;
}

async function chatAnalysis(req: Request, res: Response): Promise<void> {
  const { script, user_id } = req.body;
  if (!script) {
    res.status(404).json({
      analysis: {
        analysis: "발화량이 부족하여 대화를 분석하지 못했습니다.",
        conclusion: "발화량이 부족하여 대화를 분석하지 못했습니다.",
      },
    });
    return;
  }

  const newMessages: ChatCompletionMessageParam[] = script;
  if (
    !Array.isArray(newMessages) ||
    !newMessages.every((msg) => msg.role && msg.content)
  ) {
    res.status(400).send("Invalid data format.");
    return;
  }
  const firstMessage = newMessages[0];

  // 분석할 대화기록이 AI와의 채팅일 경우에 대화 분석을 비동기로 처리하지 않음
  if (firstMessage && firstMessage.role === "system") {
    newMessages.shift();
    console.log("AI 아바타 프롬프트 제거:", firstMessage);

    const AiPrompt = createAiPrompt(user_id, "AI");
    completedChat[user_id] = [];
    completedChat[user_id].push(AiPrompt);
    console.log("프롬프트 입력 완료, AI", completedChat[user_id]);

    completedChat[user_id].push(...newMessages);
    console.log("분석용 AI와의 대화 기록 완성");
    console.log(completedChat[user_id]);

    try {
      const assistantAnswer = await createAnalysis(
        completedChat[user_id],
        "AI와"
      );
      console.log(assistantAnswer);
      res.json({
        message: "대화 분석 완료!",
        analysis: assistantAnswer,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("LLM으로부터 응답을 받아오는데 실패했습니다: AI");
    }
  } else {
    const AiPrompt = createAiPrompt(user_id, "사람");
    completedChat[user_id] = [];
    completedChat[user_id].push(AiPrompt);
    console.log("프롬프트 입력 완료, 사람", completedChat[user_id]);

    // LLM의 응답을 담을 객체 초기화
    chatAnalysisMap.set(user_id, "");
    // 사람 간의 대화 내용에 대한 분석일 경우, 대화 분석을 위한 LLM에 대한 요청을 비동기로 처리
    (async () => {
      completedChat[user_id].push(...newMessages);
      console.log("분석용 사람간의 대화 기록 완성");

      try {
        const assistantAnswer = await createAnalysis(
          completedChat[user_id],
          "사람 간"
        );
        // AI가 분석한 내용 저장
        chatAnalysisMap.set(user_id, assistantAnswer);
        console.log("사람 간의 대화 분석 기록 저장완료");
      } catch (err) {
        console.error("LLM 대화 분석 실패", err);
        chatAnalysisMap.set(
          user_id,
          "대화 분석 내용을 생성하는데 실패했습니다."
        );
      }
    })();

    res.status(200).json({
      message: "LLM에게 성공적으로 대화 분석을 맡겼습니다.",
      user_id: user_id,
    });
  }
}

async function getAnalysis(req: Request, res: Response): Promise<void> {
  const { user_id } = req.body;
  console.log(user_id);

  if (!chatAnalysisMap.has(user_id)) {
    res.status(404).json({ message: "요청을 찾을 수 없습니다." });
    return;
  }

  const analysis = chatAnalysisMap.get(user_id);
  if (!analysis) {
    res
      .status(202)
      .json({ message: "분석 중입니다. 잠시 후 다시 시도해주세요." });
    return;
  }

  if (analysis === "대화 분석 내용을 생성하는데 실패했습니다.") {
    res.status(404).json({ message: "대화 분석 기록이 없습니다." });
    return;
  }

  res.status(200).json({ analysis });
}

export { chatAnalysis, getAnalysis };
