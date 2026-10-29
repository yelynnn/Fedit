import { useEffect } from "react";
import { useRouteError } from "react-router-dom";

// 화면을 그리다 오류가 나면 react-router 기본(영어 개발자용) 화면 대신 보여준다.
// 번역·글쓰기 확장이 화면 글자를 바꿔 끼워 React가 깨지는 경우(NotFoundError)가 대부분이라
// 새로고침이면 대개 풀린다.
export default function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-surface-base">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-6 rounded-2xl bg-white p-8 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-2">
          <h1 className="type-title-xlarge text-tx-strong">
            화면을 불러오지 못했어요
          </h1>
          <p className="type-body-small break-keep text-tx-alt">
            일시적인 문제일 수 있어요. 새로고침해 주세요.
            <br />
            번역 확장 프로그램을 쓰고 있다면 이 사이트에서는 꺼 주세요.
          </p>
        </div>
        <div className="flex flex-col w-full gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center justify-center w-full h-12 rounded-lg bg-fill-primary type-title-small text-tx-inverse hover:bg-fill-primary-hover"
          >
            새로고침
          </button>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            className="flex items-center justify-center w-full h-12 bg-white border rounded-lg border-line-alt type-title-small text-tx-neutral hover:bg-surface-base"
          >
            처음 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}
