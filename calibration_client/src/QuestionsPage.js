import React from "react";
import axios from "axios";
import styled from "styled-components";
import { Link } from "react-router-dom";

const StyledButton = styled.button`
  background: transparent;
  border: 1px solid #171212;
  padding: 5px;
  cursor: pointer;
  transition: all 0.1s ease-in;

  &:hover {
    background: #171212;
    color: #ffffff;
  }
`;

const StyledButtonSmall = styled(StyledButton)`
  padding: 10px;
`;

const StyledButtonLarge = styled(StyledButton)`
  padding: 20px;
`;

const getBlankAnswer = () => ({
  ynq_id: -1,
  user_id: -1,
  answer: null,
  probability: -1,
  confirmed: false,
});

// ---

const Answer = {
  INVALID: -1,
  NO: 0,
  YES: 1,
  DONTKNOW: 2,
};
Object.freeze(Answer);

const questionReducer = (state, action) => {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        loading: false,
        error: false,
        questions: state.questions.concat(action.payload.questions),
        has_more: action.payload.has_more,
      };
    case "NEXT":
      return {
        ...state,
        questions: state.questions.slice(0, -1),
        answered_questions: state.answered_questions.concat([
          state.answered_questions[state.answered_questions.length - 1],
        ]),
      };
    case "ERROR":
      return {
        ...state,
        loading: false,
        error: true,
      };
    default:
      throw new Error();
  }
};

const answerReducer = (state, action) => {
  switch (action.type) {
    case "RESET":
      return getBlankAnswer();
    case "SET_YN":
      return {
        ...state,
        answer: action.payload,
      };
    case "SET_PROBABILITY":
      return {
        ...state,
        probability: action.payload,
      };
    case "CONFIRM":
      return {
        ...state,
        confirmed: true,
      };
    default:
      throw new Error();
  }
};

// ---

const NDYButtonArray = ({ onAnswer }) => (
  <div>
    <StyledButtonLarge onClick={() => onAnswer(Answer.NO)}>
      Нет
    </StyledButtonLarge>
    <StyledButtonLarge onClick={() => onAnswer(Answer.DONTKNOW)}>
      Я не знаю
    </StyledButtonLarge>
    <StyledButtonLarge onClick={() => onAnswer(Answer.YES)}>
      Да
    </StyledButtonLarge>
  </div>
);

const ProbabilityButtonArray = ({ onProbabilitySelected }) => (
  <>
    <div>
      <h3>Насколько вы уверены?</h3>
    </div>
    <div>
      {[55, 60, 65, 70, 75, 80, 85, 90, 95, 99].map((prob) => (
        <StyledButtonSmall
          key={Math.round(prob)}
          onClick={() => onProbabilitySelected(prob)}
        >
          {String(Math.round(prob)) + "%"}
        </StyledButtonSmall>
      ))}
    </div>
  </>
);

function DontKnowConfirmButton({ confirmDontKnow }) {
  return (
    <>
      <div>
        <h3>Точно не знаете? Хотя бы примерно?</h3>
        <p>
          Цель этого упражнения как раз в том чтобы развить способность
          склоняться к правильному ответу даже когда нет точной уверенности
        </p>
      </div>
      <div>
        <StyledButtonSmall onClick={confirmDontKnow}>
          Совсем-совсем не знаю
        </StyledButtonSmall>
      </div>
    </>
  );
}

// ---

export function QuestionsPage({ topic }) {
  const [showProbs, setShowProbs] = React.useState(false);
  const [showDontKnowConfirm, setShowDontKnowConfirm] = React.useState(false);

  const [questionsData, dispatchQuestionsData] = React.useReducer(
    questionReducer,
    {
      loading: true,
      error: false,
      questions: [],
      answered_questions: [],
      has_more: true,
    }
  );

  const requestQuestions = React.useCallback(async () => {
    try {
      const result = await axios.get("/get_questions");
      dispatchQuestionsData({
        type: "ADD",
        payload: {
          questions: result.data.questions,
          has_more: result.data.has_more,
        },
      });
    } catch (error) {
      dispatchQuestionsData({ type: "ERROR" });
    }
  }, []);
  React.useEffect(() => {
    requestQuestions();
  }, [requestQuestions]);

  const [currentAnswer, dispatchAnswer] = React.useReducer(
    answerReducer,
    getBlankAnswer()
  );

  React.useEffect(() => {
    if (currentAnswer.confirmed) {
      let { confirmed, ...postData } = currentAnswer;
      axios.post("/answer_question", postData); // ignore promise for now
      dispatchQuestionsData({ type: "NEXT" });
      dispatchAnswer({ type: "RESET" });
      setShowProbs(false);
      setShowDontKnowConfirm(false);
    }
  }, [currentAnswer]);

  return (
    <>
      <main>
        <h3>Тема: {topic}</h3>
        {questionsData.questions.length !== 0 && (
          <h1>
            {
              questionsData.questions[questionsData.questions.length - 1]
                .question
            }
          </h1>
        )}
        {questionsData.loading && <p>Загрузка...</p>}
        {questionsData.error && <p>Ошибка при загрузке вопросов</p>}
        <NDYButtonArray
          onAnswer={(answer) => {
            switch (answer) {
              case Answer.NO:
                dispatchAnswer({ type: "SET_YN", payload: Answer.NO });
                setShowProbs(true);
                break;
              case Answer.YES:
                dispatchAnswer({ type: "SET_YN", payload: Answer.YES });
                setShowProbs(true);
                break;
              case Answer.DONTKNOW:
                dispatchAnswer({ type: "SET_YN", payload: Answer.DONTKNOW });
                setShowDontKnowConfirm(true);
                break;
              default:
                throw new Error();
            }
          }}
        />
        {showProbs && (
          <ProbabilityButtonArray
            onProbabilitySelected={(prob) => {
              dispatchAnswer({ type: "SET_PROBABILITY", payload: prob });
              dispatchAnswer({ type: "CONFIRM" });
            }}
          />
        )}
        {showDontKnowConfirm && (
          <DontKnowConfirmButton
            confirmDontKnow={() => dispatchAnswer({ type: "CONFIRM" })}
          />
        )}
      </main>
      <nav>
        <Link to="/">Назад</Link>
      </nav>
    </>
  );
}
