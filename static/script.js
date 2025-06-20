// Force refresh - script.js
const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
// API 요청은 이제 동일한 출처(origin)의 /api 접두사를 사용합니다.
const API_PREFIX = "/api";

document.addEventListener('DOMContentLoaded', function() {
  // console.log("DOM fully loaded and parsed");

  // "생성하기" 버튼 및 내부 요소 가져오기
  var generateButtonElement = document.getElementById("generateButton");
  // console.log("Generate button element:", generateButtonElement);
  var buttonText = generateButtonElement ? generateButtonElement.querySelector(".button-text") : null;
  var spinner = generateButtonElement ? generateButtonElement.querySelector(".spinner") : null;
  
  // Get the job_url textarea
  var job_url_textarea = document.getElementById("job_url");
  // console.log("Job URL textarea element:", job_url_textarea);
  // Get the prompt textarea
  var userStoryTextarea = document.getElementById("prompt");
  // console.log("User Story textarea element:", userStoryTextarea);

  // 기본 프롬프트 내용 설정
  const defaultPromptText = `자기소개서를 아래의 조건에 맞추어 써주세요.
회사가 자주 마주할 만한 문제가 뭔지 제시해주시고,
저의 역량과 경험이 뭔지, 저의 역량을 통해서
회사의 문제들을 어떻게 해결해줄 수 있는지 
저의 성과를 수치를 근거로
두괄식으로 기재해주세요.`;

  if (userStoryTextarea) {
    userStoryTextarea.value = defaultPromptText;
    // console.log("Default prompt text set to textarea.");
  } else {
    console.error("Prompt textarea not found, could not set default text.");
  }

  var generatedResumeTextarea = document.getElementById("generated_resume");
  var statusMessageElement = document.getElementById("statusMessage"); // 상태 메시지 요소 가져오기

  let eventSource = null; // SSE EventSource 객체

  // 요소 존재 여부 확인
  if (!generateButtonElement || !buttonText || !spinner || !job_url_textarea || !userStoryTextarea || !generatedResumeTextarea || !statusMessageElement) {
    console.error("One or more essential UI elements are missing!");
    return;
  }

  showLoadingState(false); // 페이지 로드 시 스피너 숨김 및 버튼 텍스트 표시
  statusMessageElement.textContent = ""; // 초기 상태 메시지 없음

  function showLoadingState(isLoading) {
    // console.log(`Setting loading state to: ${isLoading}`);
    if (isLoading) {
      buttonText.style.display = 'none';
      spinner.style.display = 'inline-block';
      generateButtonElement.disabled = true;
    } else {
      buttonText.style.display = 'inline-block';
      spinner.style.display = 'none';
      generateButtonElement.disabled = false;
    }
    // console.log(`Generate button disabled: ${generateButtonElement.disabled}, Spinner display: ${spinner.style.display}`);
  }

  function requestNotificationPermission() {
    return new Promise((resolve) => {
      if (!('Notification' in window)) {
        // console.log("This browser does not support desktop notification");
        return resolve(false);
      }
      if (Notification.permission === "granted") {
        return resolve(true);
      }
      if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          resolve(permission === "granted");
        });
      } else {
        resolve(false);
      }
    });
  }

  function showBrowserNotification(title, body, onClickCallback) {
    requestNotificationPermission().then(granted => {
      if (granted) {
        const notification = new Notification(title, { body });
        notification.onclick = () => {
          window.focus(); // 브라우저 창 포커스
          if (onClickCallback) {
            onClickCallback();
          }
          notification.close();
        };
      }
    });
  }

  function startTaskStreaming(taskId) {
    // console.log("Starting SSE connection for task ID:", taskId);
    showLoadingState(true);
    
    let initialMessage = "자기소개서 생성을 시작합니다... 잠시만 기다려 주세요.";
    if (('Notification' in window) && Notification.permission !== 'granted') {
      initialMessage += " 브라우저 알림을 허용하시면 작업 완료 시 알려드립니다.";
    }
    statusMessageElement.textContent = initialMessage;
    generatedResumeTextarea.value = ""; // 이전 결과 비우기

    if (eventSource) {
        eventSource.close(); // 이전 EventSource가 있다면 닫기
    }

    // EventSource URL에서 API_BASE_URL 대신 API_PREFIX를 사용하도록 수정
    eventSource = new EventSource(API_PREFIX + "/stream-task-status/" + taskId);

    eventSource.onopen = function() {
        // console.log("SSE connection opened for task " + taskId + ".");
        statusMessageElement.textContent = "서버와 연결되었습니다. 작업 진행 상황을 곧 받아옵니다...";
    };

    eventSource.onmessage = function(event) {
      // console.log("[DEBUG] Raw SSE event.data:", event.data); // 원시 데이터 로깅
      try {
        const data = JSON.parse(event.data);
        // console.log("[DEBUG] Parsed SSE data object:", JSON.stringify(data, null, 2)); // 파싱된 객체 전체 로깅

        let statusText = "";
        // 사용자 친화적 메시지 매핑
        const friendlyMessages = {
          PENDING: "작업 대기 중입니다...",
          STARTED: "자기소개서 생성을 시작합니다...",
          RETRY: "일시적인 오류로 재시도 중입니다...",
          PROGRESS: "자기소개서를 생성 중입니다...", // PROGRESS 상태의 기본 메시지
        };

        if (data.status === "SUCCESS") {
          // console.log("SSE Task SUCCESS:", data);
          showLoadingState(false);
          let coverLetterText = '';
          if (typeof data.result === 'string') {
            coverLetterText = data.result;
            // console.log('SSE SUCCESS but result is a string:', coverLetterText);
          } else if (data.result && typeof data.result === 'object' && data.result.cover_letter_text) {
            coverLetterText = data.result.cover_letter_text;
            // console.log('SSE SUCCESS with result.cover_letter_text:', coverLetterText);
          } else if (data.result && typeof data.result === 'object') {
            console.warn('SSE SUCCESS but result object structure is unexpected:', data.result);
            updateErrorInfo('예상치 못한 결과 데이터 형식입니다.', data.result);
          } else {
            console.error('SSE SUCCESS but result is in an unknown format or missing:', data.result);
            updateErrorInfo('자기소개서 내용을 가져올 수 없습니다.', data.result);
          }
          
          if (coverLetterText) {
            generatedResumeTextarea.value = coverLetterText;
            statusText = "자기소개서 생성이 완료되었습니다!"; // 성공 메시지
            logDisplayedCvToBackend(coverLetterText);

            let notificationMessage = "자기소개서가 성공적으로 생성되었습니다!";
            showBrowserNotification("자기소개서 생성 완료!", notificationMessage, () => {
                generatedResumeTextarea.focus();
            });
            eventSource.close(); // 성공 시 연결 종료
            // console.log("SSE connection closed on SUCCESS.");
          } else {
            if (!document.getElementById('error_info_container').textContent.includes('오류')){
                updateErrorInfo('생성된 자기소개서 내용이 비어있습니다.');
                statusText = "생성된 자기소개서 내용이 비어있습니다."; // 사용자에게도 알림
            }
          }
        } else if (data.status === "FAILURE" || data.status === "ERROR_INTERNAL" || data.status === "ERROR_SETUP" || data.status === "ERROR_STREAM" || data.status === "ERROR_SERIALIZATION" || data.status === "ERROR_UNEXPECTED_STREAM") {
          console.error("SSE Task FAILURE or ERROR:", data);
          showLoadingState(false);
          if (data.result && data.result.error_message) { // 백엔드에서 get_detailed_error_info 사용 시
              statusText = "오류: " + data.result.error_message;
          } else if (data.result && data.result.error) { // 기존 오류 형식
              statusText = "오류: " + data.result.error;
          } else if (data.result && typeof data.result === 'string') {
              statusText = "오류: " + data.result;
          } else if (data.message) { // FastAPI HTTP 예외 메시지
              statusText = data.message;
          } else {
            statusText = "자기소개서 생성 중 알 수 없는 오류가 발생했습니다.";
          }
          
          let currentStepInfo = data.current_step ? " (진행 단계: " + data.current_step + ")" : "";
          statusText += currentStepInfo;
          updateErrorInfo(statusText, data); // 상세 오류 정보 표시 함수 호출
          eventSource.close(); // 실패 또는 오류 시 연결 종료
          // console.log("SSE connection closed on FAILURE or ERROR.");
        } else { // PENDING, STARTED, PROGRESS, RETRY 등
          if (data.current_step) { // current_step이 있으면 최우선 사용
            statusText = data.current_step;
          } else if (friendlyMessages[data.status]) { // current_step이 없을 때 status 기반 메시지
            statusText = friendlyMessages[data.status];
          } else {
            statusText = data.status || "상태를 받아오는 중..."; // 모든 매핑에 실패하면 원래 상태값 또는 기본 메시지
          }
        }
        
        // console.log(`[DEBUG] 최종 statusText 결정: ${statusText}, 현재 상태: ${data.status}, 현재 단계: ${data.current_step || 'N/A'}`);
        statusMessageElement.textContent = statusText;
        // console.log(`SSE Task ${data.task_id} status: ${data.status}, step: ${data.current_step || 'N/A'}, message: ${statusText}`);

        // 진행률 바 업데이트 (필요한 경우)
        // ... existing code ...
      } catch (e) {
        console.error("Error parsing SSE message or updating UI:", e, "Raw data:", event.data);
        statusMessageElement.textContent = "데이터 처리 중 오류가 발생했습니다.";
        // 파싱 오류 시에는 연결을 유지할 수도, 닫을 수도 있음. 여기서는 일단 유지.
      }
    };

    eventSource.onerror = function(err) {
      console.error("EventSource failed:", err);
      showLoadingState(false);
      statusMessageElement.textContent = "서버와 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      eventSource.close(); // 에러 발생 시 명시적으로 연결 종료
      // console.log("SSE connection closed on ERROR.");
    };
  }

  function logDisplayedCvToBackend(textToLog) {
    // console.log(`Logging displayed CV to backend. Length: ${textToLog ? textToLog.length : 0}`);
    const payload = {
      displayed_text: textToLog || ""
    };
  
    // fetch URL에서 API_BASE_URL 대신 API_PREFIX를 사용하도록 수정
    fetch(API_PREFIX + "/log-displayed-cv", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(response => {
      if (!response.ok) {
        console.warn("Backend logging failed with status: " + response.status);
        return response.json().then(errData => { throw new Error(errData.detail || 'Unknown error'); });
      }
      return response.json();
    })
    .then(data => {
      // console.log('Backend logging successful:', data.message);
    })
    .catch(error => {
      console.error('Error logging displayed CV to backend:', error);
    });
  }
  
  generateButtonElement.addEventListener('click', function() {
    console.log("Generate button clicked.");
    const jobUrl = job_url_textarea.value.trim();
    const userStory = userStoryTextarea.value.trim();

    if (!jobUrl) {
      console.error("Job URL is empty.");
      statusMessageElement.textContent = "공고 URL을 입력해주세요.";
      job_url_textarea.focus();
      return;
    }

    if (!userStory) {
      console.error("User story is empty.");
      statusMessageElement.textContent = "자기소개서 내용을 입력해주세요.";
      userStoryTextarea.focus();
      return;
    }

    console.log("Starting cover letter generation process...");
    showLoadingState(true);
    statusMessageElement.textContent = "자기소개서 생성 작업을 시작합니다...";

    const payload = {
      job_url: jobUrl,
      user_story: userStory
    };

    console.log("Sending POST request to /api/create-cover-letter/ with payload:", payload);
    fetch(API_PREFIX + "/create-cover-letter/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(response => {
      console.log("Received response from /api/create-cover-letter/");
      if (!response.ok) {
        return response.json().then(errData => {
          console.error("Error response from server:", errData);
          throw new Error(errData.detail || `서버 오류: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Successfully received task ID:", data.task_id);
      if (data.task_id) {
        startTaskStreaming(data.task_id);
      } else {
        console.error("Task ID not found in response data:", data);
        throw new Error("작업 ID를 받지 못했습니다.");
      }
    })
    .catch(error => {
      console.error('Error starting cover letter generation:', error);
      showLoadingState(false);
      statusMessageElement.textContent = `오류가 발생했습니다: ${error.message}`;
    });
  });
});

function updateErrorInfo(message, details) {
  // ... existing code ...
} 